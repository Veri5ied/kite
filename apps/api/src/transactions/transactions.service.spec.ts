import { Prisma } from '../generated/prisma/client';
import {
  Currency,
  ConversionStatus,
  DepositStatus,
  PayoutStatus,
} from '../generated/prisma/enums';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const authenticatedUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  it('merges deposits, conversions, and payouts into one reverse-chronological feed', async () => {
    const depositCreatedAt = new Date('2026-04-25T09:00:00.000Z');
    const conversionCreatedAt = new Date('2026-04-25T09:05:00.000Z');
    const payoutCreatedAt = new Date('2026-04-25T09:10:00.000Z');

    const prisma = {
      deposit: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'dep_1',
            currency: Currency.USD,
            amountMinor: 10000n,
            status: DepositStatus.COMPLETED,
            createdAt: depositCreatedAt,
            destinationAccount: {
              id: 'acct_usd',
              code: 'wallet:wallet_1:USD',
              currency: Currency.USD,
            },
          },
        ]),
      },
      conversion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'cnv_1',
            sourceCurrency: Currency.USD,
            targetCurrency: Currency.NGN,
            sourceAmountMinor: 1000n,
            targetAmountMinor: 150000n,
            quotedRate: new Prisma.Decimal('150.0000000000'),
            bookedRate: new Prisma.Decimal('149.2500000000'),
            spreadBps: 75,
            status: ConversionStatus.COMPLETED,
            createdAt: conversionCreatedAt,
            sourceAccount: {
              id: 'acct_usd',
              code: 'wallet:wallet_1:USD',
              currency: Currency.USD,
            },
            targetAccount: {
              id: 'acct_ngn',
              code: 'wallet:wallet_1:NGN',
              currency: Currency.NGN,
            },
          },
        ]),
      },
      payout: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'payout_1',
            sourceCurrency: Currency.NGN,
            destinationCurrency: Currency.NGN,
            amountMinor: 50000n,
            status: PayoutStatus.SUCCESSFUL,
            recipientAccountNumber: '1234567891',
            recipientBankCode: 'NG001',
            recipientAccountName: 'Jane Doe',
            failureReason: null,
            createdAt: payoutCreatedAt,
            sourceAccount: {
              id: 'acct_ngn',
              code: 'wallet:wallet_1:NGN',
              currency: Currency.NGN,
            },
          },
        ]),
      },
    };

    const service = new TransactionsService(prisma as never);

    await expect(
      service.listTransactions(authenticatedUser, { limit: 2 }),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: 'payout_1',
          type: 'payout',
        }),
        expect.objectContaining({
          id: 'cnv_1',
          type: 'conversion',
        }),
      ],
      page: {
        limit: 2,
        hasMore: true,
        nextCursor: 'conversion:cnv_1',
      },
    });
  });
});
