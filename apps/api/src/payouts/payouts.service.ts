import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import {
  Currency,
  LedgerAccountType,
  LedgerEntryDirection,
  LedgerTransactionStatus,
  LedgerTransactionType,
  PayoutStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePayoutDto } from './dto/create-payout.dto';

const PROCESSING_DELAY_MS = 1_500;
const FINALIZE_DELAY_MS = 2_500;

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayout(
    authenticatedUser: AuthenticatedUser,
    dto: CreatePayoutDto,
  ) {
    const amountMinor = this.parseAmountToMinor(dto.amount);

    if (amountMinor <= 0n) {
      throw new BadRequestException({
        message: 'Amount must be greater than zero',
        field: 'amount',
      });
    }

    if (
      dto.sourceCurrency !== Currency.NGN &&
      dto.sourceCurrency !== Currency.KES
    ) {
      throw new BadRequestException({
        message: 'Only NGN and KES payouts are currently supported',
        field: 'sourceCurrency',
      });
    }

    this.assertBankCodeMatchesCurrency(
      dto.sourceCurrency,
      dto.recipientBankCode,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: authenticatedUser.sub },
        include: {
          wallet: {
            include: {
              accounts: {
                where: {
                  currency: dto.sourceCurrency,
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

      const sourceAccount = user.wallet.accounts[0];

      if (!sourceAccount) {
        throw new BadRequestException({
          message: 'No wallet account found for the selected currency',
          field: 'sourceCurrency',
        });
      }

      const sourceBalanceMinor = await this.getAccountBalanceMinor(
        tx,
        sourceAccount.id,
      );

      if (sourceBalanceMinor < amountMinor) {
        throw new BadRequestException({
          message: 'Insufficient balance for payout',
          field: 'amount',
        });
      }

      const payoutClearingAccount = await tx.ledgerAccount.upsert({
        where: {
          code: `system:payout-clearing:${dto.sourceCurrency}`,
        },
        update: {},
        create: {
          currency: dto.sourceCurrency,
          type: LedgerAccountType.SYSTEM_PAYOUT_CLEARING,
          code: `system:payout-clearing:${dto.sourceCurrency}`,
          name: `${dto.sourceCurrency} payout clearing`,
        },
      });

      const ledgerTransaction = await tx.ledgerTransaction.create({
        data: {
          userId: authenticatedUser.sub,
          type: LedgerTransactionType.PAYOUT,
          status: LedgerTransactionStatus.POSTED,
          reference: `pyt_${randomUUID()}`,
          narration: `${dto.sourceCurrency} payout`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            ledgerTransactionId: ledgerTransaction.id,
            accountId: sourceAccount.id,
            direction: LedgerEntryDirection.DEBIT,
            currency: dto.sourceCurrency,
            amountMinor,
          },
          {
            ledgerTransactionId: ledgerTransaction.id,
            accountId: payoutClearingAccount.id,
            direction: LedgerEntryDirection.CREDIT,
            currency: dto.sourceCurrency,
            amountMinor,
          },
        ],
      });

      const payout = await tx.payout.create({
        data: {
          userId: authenticatedUser.sub,
          walletId: user.wallet.id,
          sourceAccountId: sourceAccount.id,
          sourceCurrency: dto.sourceCurrency,
          destinationCurrency: dto.sourceCurrency,
          amountMinor,
          recipientAccountNumber: dto.recipientAccountNumber,
          recipientBankCode: dto.recipientBankCode,
          recipientAccountName: dto.recipientAccountName,
          status: PayoutStatus.PENDING,
          ledgerTransactionId: ledgerTransaction.id,
        },
      });

      const balanceMinor = await this.getAccountBalanceMinor(
        tx,
        sourceAccount.id,
      );

      return {
        payout,
        balanceMinor,
      };
    });

    this.schedulePayoutLifecycle(result.payout.id);

    return {
      payout: {
        id: result.payout.id,
        sourceCurrency: result.payout.sourceCurrency,
        destinationCurrency: result.payout.destinationCurrency,
        amountMinor: result.payout.amountMinor.toString(),
        status: result.payout.status,
        recipientBankCode: result.payout.recipientBankCode,
        recipientAccountNumber: result.payout.recipientAccountNumber,
        recipientAccountName: result.payout.recipientAccountName,
        createdAt: result.payout.createdAt,
      },
      balanceMinor: result.balanceMinor.toString(),
    };
  }

  async getPayout(authenticatedUser: AuthenticatedUser, payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout || payout.userId !== authenticatedUser.sub) {
      throw new NotFoundException({
        message: 'Payout not found',
        field: 'payoutId',
      });
    }

    return {
      payout: {
        id: payout.id,
        sourceCurrency: payout.sourceCurrency,
        destinationCurrency: payout.destinationCurrency,
        amountMinor: payout.amountMinor.toString(),
        status: payout.status,
        failureReason: payout.failureReason,
        recipientBankCode: payout.recipientBankCode,
        recipientAccountNumber: payout.recipientAccountNumber,
        recipientAccountName: payout.recipientAccountName,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      },
    };
  }

  private schedulePayoutLifecycle(payoutId: string) {
    setTimeout(() => {
      void this.moveToProcessing(payoutId);
    }, PROCESSING_DELAY_MS);

    setTimeout(() => {
      void this.finalizePayout(payoutId);
    }, PROCESSING_DELAY_MS + FINALIZE_DELAY_MS);
  }

  private async moveToProcessing(payoutId: string) {
    await this.prisma.payout.updateMany({
      where: {
        id: payoutId,
        status: PayoutStatus.PENDING,
      },
      data: {
        status: PayoutStatus.PROCESSING,
      },
    });
  }

  private async finalizePayout(payoutId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        return;
      }

      if (
        payout.status !== PayoutStatus.PENDING &&
        payout.status !== PayoutStatus.PROCESSING
      ) {
        return;
      }

      const shouldFail = this.shouldFailPayout(payout.recipientAccountNumber);

      if (!shouldFail) {
        await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.SUCCESSFUL,
          },
        });
        return;
      }

      const payoutClearingAccount = await tx.ledgerAccount.findUnique({
        where: {
          code: `system:payout-clearing:${payout.sourceCurrency}`,
        },
      });

      const sourceAccount = await tx.ledgerAccount.findUnique({
        where: { id: payout.sourceAccountId },
      });

      if (!payoutClearingAccount || !sourceAccount) {
        throw new BadRequestException({
          message: 'Payout accounts are invalid',
          field: 'payoutId',
        });
      }

      const reversalLedgerTransaction = await tx.ledgerTransaction.create({
        data: {
          userId: payout.userId,
          type: LedgerTransactionType.PAYOUT_REVERSAL,
          status: LedgerTransactionStatus.POSTED,
          reference: `rev_${randomUUID()}`,
          narration: `${payout.sourceCurrency} payout reversal`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            ledgerTransactionId: reversalLedgerTransaction.id,
            accountId: payoutClearingAccount.id,
            direction: LedgerEntryDirection.DEBIT,
            currency: payout.sourceCurrency,
            amountMinor: payout.amountMinor,
          },
          {
            ledgerTransactionId: reversalLedgerTransaction.id,
            accountId: sourceAccount.id,
            direction: LedgerEntryDirection.CREDIT,
            currency: payout.sourceCurrency,
            amountMinor: payout.amountMinor,
          },
        ],
      });

      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: 'Simulated payout failure',
          reversalLedgerTransactionId: reversalLedgerTransaction.id,
        },
      });
    });
  }

  private shouldFailPayout(accountNumber: string) {
    return accountNumber.endsWith('0');
  }

  private assertBankCodeMatchesCurrency(
    currency: Currency,
    recipientBankCode: string,
  ) {
    const normalizedBankCode = recipientBankCode.toUpperCase();

    if (currency === Currency.NGN && normalizedBankCode.startsWith('NG')) {
      return;
    }

    if (currency === Currency.KES && normalizedBankCode.startsWith('KE')) {
      return;
    }

    throw new BadRequestException({
      message:
        'Recipient bank code must start with NG for NGN payouts or KE for KES payouts',
      field: 'recipientBankCode',
    });
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
