import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import {
  Currency,
  DepositStatus,
  LedgerAccountType,
  LedgerEntryDirection,
  LedgerTransactionStatus,
  LedgerTransactionType,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeposit(
    authenticatedUser: AuthenticatedUser,
    dto: CreateDepositDto,
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException({
        message: 'Idempotency-Key header is required',
        field: 'idempotencyKey',
      });
    }

    const amountMinor = this.parseAmountToMinor(dto.amount);

    if (amountMinor <= 0n) {
      throw new BadRequestException({
        message: 'Amount must be greater than zero',
        field: 'amount',
      });
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existingDeposit = await tx.deposit.findUnique({
          where: { idempotencyKey },
          include: {
            destinationAccount: {
              select: {
                id: true,
                currency: true,
                code: true,
              },
            },
          },
        });

        if (existingDeposit) {
          if (existingDeposit.userId !== authenticatedUser.sub) {
            throw new ConflictException({
              message: 'Idempotency key already exists for another user',
              field: 'idempotencyKey',
            });
          }

          const balanceMinor = await this.getAccountBalanceMinor(
            tx,
            existingDeposit.destinationAccountId,
          );

          return {
            deposit: existingDeposit,
            balanceMinor,
            idempotentReplay: true,
          };
        }

        const user = await tx.user.findUnique({
          where: { id: authenticatedUser.sub },
          include: {
            wallet: {
              include: {
                accounts: {
                  where: {
                    currency: dto.currency,
                    type: LedgerAccountType.USER_ASSET,
                  },
                  take: 1,
                },
              },
            },
          },
        });

        if (!user?.wallet) {
          throw new UnauthorizedException({
            message: 'Wallet not found for user',
          });
        }

        const destinationAccount = user.wallet.accounts[0];

        if (!destinationAccount) {
          throw new BadRequestException({
            message: 'No wallet account found for the selected currency',
            field: 'currency',
          });
        }

        const clearingAccount = await tx.ledgerAccount.upsert({
          where: {
            code: `system:clearing:${dto.currency}`,
          },
          update: {},
          create: {
            currency: dto.currency,
            type: LedgerAccountType.SYSTEM_CLEARING,
            code: `system:clearing:${dto.currency}`,
            name: `${dto.currency} system clearing`,
          },
        });

        const ledgerTransaction = await tx.ledgerTransaction.create({
          data: {
            userId: user.id,
            type: LedgerTransactionType.DEPOSIT,
            status: LedgerTransactionStatus.POSTED,
            reference: `dep_${randomUUID()}`,
            narration: `${dto.currency} deposit`,
            idempotencyKey,
          },
        });

        await tx.ledgerEntry.createMany({
          data: [
            {
              ledgerTransactionId: ledgerTransaction.id,
              accountId: clearingAccount.id,
              direction: LedgerEntryDirection.DEBIT,
              currency: dto.currency,
              amountMinor,
            },
            {
              ledgerTransactionId: ledgerTransaction.id,
              accountId: destinationAccount.id,
              direction: LedgerEntryDirection.CREDIT,
              currency: dto.currency,
              amountMinor,
            },
          ],
        });

        const deposit = await tx.deposit.create({
          data: {
            userId: user.id,
            walletId: user.wallet.id,
            destinationAccountId: destinationAccount.id,
            currency: dto.currency,
            amountMinor,
            status: DepositStatus.COMPLETED,
            idempotencyKey,
            ledgerTransactionId: ledgerTransaction.id,
          },
          include: {
            destinationAccount: {
              select: {
                id: true,
                currency: true,
                code: true,
              },
            },
          },
        });

        const balanceMinor = await this.getAccountBalanceMinor(
          tx,
          destinationAccount.id,
        );

        return {
          deposit,
          balanceMinor,
          idempotentReplay: false,
        };
      });

      return {
        idempotentReplay: result.idempotentReplay,
        deposit: {
          id: result.deposit.id,
          currency: result.deposit.currency,
          amountMinor: result.deposit.amountMinor.toString(),
          status: result.deposit.status,
          idempotencyKey: result.deposit.idempotencyKey,
          createdAt: result.deposit.createdAt,
        },
        account: result.deposit.destinationAccount,
        balanceMinor: result.balanceMinor.toString(),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Duplicate deposit request detected',
          field: 'idempotencyKey',
        });
      }

      throw error;
    }
  }

  private parseAmountToMinor(amount: string) {
    const [wholePart, fractionalPart = ''] = amount.split('.');
    const normalizedFraction = fractionalPart.padEnd(2, '0').slice(0, 2);

    return BigInt(`${wholePart}${normalizedFraction}`);
  }

  private async getAccountBalanceMinor(
    tx: Prisma.TransactionClient,
    accountId: string,
  ) {
    const entries = await tx.ledgerEntry.findMany({
      where: { accountId },
      select: {
        direction: true,
        amountMinor: true,
      },
    });

    return entries.reduce((balance, entry) => {
      const amount = BigInt(entry.amountMinor.toString());
      return entry.direction === LedgerEntryDirection.CREDIT
        ? balance + amount
        : balance - amount;
    }, 0n);
  }
}
