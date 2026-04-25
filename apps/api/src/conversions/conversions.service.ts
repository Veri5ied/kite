import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client';
import {
  ConversionStatus,
  Currency,
  FxQuoteStatus,
  LedgerAccountType,
  LedgerEntryDirection,
  LedgerTransactionStatus,
  LedgerTransactionType,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ExecuteQuoteDto } from './dto/execute-quote.dto';
import { FxRatesService } from './fx-rates.service';

const QUOTE_TTL_MS = 60_000;
const SPREAD_BPS = 75;

@Injectable()
export class ConversionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fxRatesService: FxRatesService,
  ) {}

  async createQuote(authenticatedUser: AuthenticatedUser, dto: CreateQuoteDto) {
    if (dto.sourceCurrency === dto.targetCurrency) {
      throw new BadRequestException({
        message: 'Source and target currencies must be different',
        field: 'targetCurrency',
      });
    }

    const sourceAmountMinor = this.parseAmountToMinor(dto.amount);

    if (sourceAmountMinor <= 0n) {
      throw new BadRequestException({
        message: 'Amount must be greater than zero',
        field: 'amount',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        wallet: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!user?.wallet) {
      throw new UnauthorizedException({
        message: 'Wallet not found for user',
      });
    }

    const sourceAccount = user.wallet.accounts.find(
      (account) =>
        account.currency === dto.sourceCurrency &&
        account.type === LedgerAccountType.USER_ASSET,
    );
    const targetAccount = user.wallet.accounts.find(
      (account) =>
        account.currency === dto.targetCurrency &&
        account.type === LedgerAccountType.USER_ASSET,
    );

    if (!sourceAccount || !targetAccount) {
      throw new BadRequestException({
        message: 'Wallet accounts for the selected currencies are missing',
      });
    }

    const baseRate = await this.fxRatesService.getRate(
      dto.sourceCurrency,
      dto.targetCurrency,
    );
    const quotedRate = baseRate * (1 - SPREAD_BPS / 10_000);
    const targetAmountMinor = this.convertAmountMinor(
      sourceAmountMinor,
      quotedRate,
    );

    const quote = await this.prisma.fxQuote.create({
      data: {
        userId: user.id,
        walletId: user.wallet.id,
        sourceAccountId: sourceAccount.id,
        targetAccountId: targetAccount.id,
        sourceCurrency: dto.sourceCurrency,
        targetCurrency: dto.targetCurrency,
        sourceAmountMinor,
        targetAmountMinor,
        baseRate: this.decimalString(baseRate),
        quotedRate: this.decimalString(quotedRate),
        spreadBps: SPREAD_BPS,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
        status: FxQuoteStatus.ACTIVE,
      },
    });

    return this.serializeQuote(quote);
  }

  async executeQuote(
    authenticatedUser: AuthenticatedUser,
    dto: ExecuteQuoteDto,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.fxQuote.findUnique({
        where: { id: dto.quoteId },
      });

      if (!quote || quote.userId !== authenticatedUser.sub) {
        throw new NotFoundException({
          message: 'Quote not found',
          field: 'quoteId',
        });
      }

      if (quote.status !== FxQuoteStatus.ACTIVE || quote.consumedAt) {
        throw new BadRequestException({
          message: 'Quote has already been used',
          field: 'quoteId',
        });
      }

      if (quote.expiresAt.getTime() <= Date.now()) {
        await tx.fxQuote.update({
          where: { id: quote.id },
          data: { status: FxQuoteStatus.EXPIRED },
        });

        throw new BadRequestException({
          message: 'Quote has expired',
          field: 'quoteId',
        });
      }

      const sourceAccount = await tx.ledgerAccount.findUnique({
        where: { id: quote.sourceAccountId },
      });
      const targetAccount = await tx.ledgerAccount.findUnique({
        where: { id: quote.targetAccountId },
      });

      if (!sourceAccount || !targetAccount) {
        throw new BadRequestException({
          message: 'Quote accounts are invalid',
          field: 'quoteId',
        });
      }

      const sourceBalanceMinor = await this.getAccountBalanceMinor(
        tx,
        sourceAccount.id,
      );

      if (sourceBalanceMinor < BigInt(quote.sourceAmountMinor.toString())) {
        throw new BadRequestException({
          message: 'Insufficient balance for conversion',
          field: 'amount',
        });
      }

      const baseTargetAmountMinor = this.convertAmountMinor(
        BigInt(quote.sourceAmountMinor.toString()),
        Number(quote.baseRate),
      );
      const targetAmountMinor = BigInt(quote.targetAmountMinor.toString());
      const spreadAmountMinor = baseTargetAmountMinor - targetAmountMinor;

      const sourceClearingAccount = await tx.ledgerAccount.upsert({
        where: {
          code: `system:clearing:${quote.sourceCurrency}`,
        },
        update: {},
        create: {
          currency: quote.sourceCurrency,
          type: LedgerAccountType.SYSTEM_CLEARING,
          code: `system:clearing:${quote.sourceCurrency}`,
          name: `${quote.sourceCurrency} system clearing`,
        },
      });

      const targetClearingAccount = await tx.ledgerAccount.upsert({
        where: {
          code: `system:clearing:${quote.targetCurrency}`,
        },
        update: {},
        create: {
          currency: quote.targetCurrency,
          type: LedgerAccountType.SYSTEM_CLEARING,
          code: `system:clearing:${quote.targetCurrency}`,
          name: `${quote.targetCurrency} system clearing`,
        },
      });

      const targetRevenueAccount = await tx.ledgerAccount.upsert({
        where: {
          code: `system:revenue:${quote.targetCurrency}`,
        },
        update: {},
        create: {
          currency: quote.targetCurrency,
          type: LedgerAccountType.SYSTEM_REVENUE,
          code: `system:revenue:${quote.targetCurrency}`,
          name: `${quote.targetCurrency} conversion revenue`,
        },
      });

      const ledgerTransaction = await tx.ledgerTransaction.create({
        data: {
          userId: authenticatedUser.sub,
          type: LedgerTransactionType.CONVERSION,
          status: LedgerTransactionStatus.POSTED,
          reference: `cnv_${randomUUID()}`,
          narration: `${quote.sourceCurrency} to ${quote.targetCurrency} conversion`,
        },
      });

      const ledgerEntries: Prisma.LedgerEntryCreateManyInput[] = [
        {
          ledgerTransactionId: ledgerTransaction.id,
          accountId: sourceAccount.id,
          direction: LedgerEntryDirection.DEBIT,
          currency: quote.sourceCurrency,
          amountMinor: BigInt(quote.sourceAmountMinor.toString()),
        },
        {
          ledgerTransactionId: ledgerTransaction.id,
          accountId: sourceClearingAccount.id,
          direction: LedgerEntryDirection.CREDIT,
          currency: quote.sourceCurrency,
          amountMinor: BigInt(quote.sourceAmountMinor.toString()),
        },
        {
          ledgerTransactionId: ledgerTransaction.id,
          accountId: targetClearingAccount.id,
          direction: LedgerEntryDirection.DEBIT,
          currency: quote.targetCurrency,
          amountMinor: baseTargetAmountMinor,
        },
        {
          ledgerTransactionId: ledgerTransaction.id,
          accountId: targetAccount.id,
          direction: LedgerEntryDirection.CREDIT,
          currency: quote.targetCurrency,
          amountMinor: targetAmountMinor,
        },
      ];

      if (spreadAmountMinor > 0n) {
        ledgerEntries.push({
          ledgerTransactionId: ledgerTransaction.id,
          accountId: targetRevenueAccount.id,
          direction: LedgerEntryDirection.CREDIT,
          currency: quote.targetCurrency,
          amountMinor: spreadAmountMinor,
        });
      }

      await tx.ledgerEntry.createMany({
        data: ledgerEntries,
      });

      const conversion = await tx.conversion.create({
        data: {
          userId: authenticatedUser.sub,
          walletId: quote.walletId,
          quoteId: quote.id,
          sourceAccountId: sourceAccount.id,
          targetAccountId: targetAccount.id,
          sourceCurrency: quote.sourceCurrency,
          targetCurrency: quote.targetCurrency,
          sourceAmountMinor: BigInt(quote.sourceAmountMinor.toString()),
          targetAmountMinor,
          quotedRate: quote.quotedRate,
          bookedRate: quote.quotedRate,
          spreadBps: quote.spreadBps,
          feeAmountMinor: spreadAmountMinor > 0n ? spreadAmountMinor : 0n,
          status: ConversionStatus.COMPLETED,
          ledgerTransactionId: ledgerTransaction.id,
        },
      });

      await tx.fxQuote.update({
        where: { id: quote.id },
        data: {
          status: FxQuoteStatus.EXECUTED,
          consumedAt: new Date(),
        },
      });

      const updatedSourceBalanceMinor = await this.getAccountBalanceMinor(
        tx,
        sourceAccount.id,
      );
      const updatedTargetBalanceMinor = await this.getAccountBalanceMinor(
        tx,
        targetAccount.id,
      );

      return {
        conversion,
        sourceAccount,
        targetAccount,
        sourceBalanceMinor: updatedSourceBalanceMinor,
        targetBalanceMinor: updatedTargetBalanceMinor,
      };
    });

    return {
      conversion: {
        id: result.conversion.id,
        quoteId: result.conversion.quoteId,
        sourceCurrency: result.conversion.sourceCurrency,
        targetCurrency: result.conversion.targetCurrency,
        sourceAmountMinor: result.conversion.sourceAmountMinor.toString(),
        targetAmountMinor: result.conversion.targetAmountMinor.toString(),
        quotedRate: result.conversion.quotedRate.toString(),
        bookedRate: result.conversion.bookedRate.toString(),
        spreadBps: result.conversion.spreadBps,
        status: result.conversion.status,
        createdAt: result.conversion.createdAt,
      },
      balances: {
        source: {
          accountId: result.sourceAccount.id,
          currency: result.sourceAccount.currency,
          balanceMinor: result.sourceBalanceMinor.toString(),
        },
        target: {
          accountId: result.targetAccount.id,
          currency: result.targetAccount.currency,
          balanceMinor: result.targetBalanceMinor.toString(),
        },
      },
    };
  }

  private serializeQuote(quote: {
    id: string;
    sourceCurrency: Currency;
    targetCurrency: Currency;
    sourceAmountMinor: bigint;
    targetAmountMinor: bigint;
    baseRate: Prisma.Decimal;
    quotedRate: Prisma.Decimal;
    spreadBps: number;
    feeAmountMinor: bigint;
    expiresAt: Date;
    status: FxQuoteStatus;
    createdAt: Date;
  }) {
    return {
      quote: {
        id: quote.id,
        sourceCurrency: quote.sourceCurrency,
        targetCurrency: quote.targetCurrency,
        sourceAmountMinor: quote.sourceAmountMinor.toString(),
        targetAmountMinor: quote.targetAmountMinor.toString(),
        baseRate: quote.baseRate.toString(),
        quotedRate: quote.quotedRate.toString(),
        spreadBps: quote.spreadBps,
        feeAmountMinor: quote.feeAmountMinor.toString(),
        expiresAt: quote.expiresAt,
        status: quote.status,
        createdAt: quote.createdAt,
      },
    };
  }

  private decimalString(value: number) {
    return value.toFixed(10);
  }

  private convertAmountMinor(
    amountMinor: bigint,
    rate: number | string | Prisma.Decimal,
  ) {
    const converted = new Prisma.Decimal(amountMinor.toString())
      .mul(rate)
      .floor();

    return BigInt(converted.toString());
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
