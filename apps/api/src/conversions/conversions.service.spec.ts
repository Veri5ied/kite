import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import {
  Currency,
  FxQuoteStatus,
  LedgerAccountType,
} from '../generated/prisma/enums';
import { ConversionsService } from './conversions.service';

describe('ConversionsService', () => {
  const authenticatedUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  it('creates a quote from a provider rate and applies the configured spread', async () => {
    const createdAt = new Date('2026-04-25T10:00:00.000Z');
    const expiresAt = new Date('2026-04-25T10:01:00.000Z');
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: authenticatedUser.sub,
          wallet: {
            id: 'wallet_1',
            accounts: [
              {
                id: 'acct_usd',
                currency: Currency.USD,
                type: LedgerAccountType.USER_ASSET,
              },
              {
                id: 'acct_ngn',
                currency: Currency.NGN,
                type: LedgerAccountType.USER_ASSET,
              },
            ],
          },
        }),
      },
      fxQuote: {
        create: jest.fn().mockResolvedValue({
          id: 'quote_1',
          sourceCurrency: Currency.USD,
          targetCurrency: Currency.NGN,
          sourceAmountMinor: 1000n,
          targetAmountMinor: 99250n,
          baseRate: new Prisma.Decimal('100.0000000000'),
          quotedRate: new Prisma.Decimal('99.2500000000'),
          spreadBps: 75,
          feeAmountMinor: 0n,
          expiresAt,
          status: FxQuoteStatus.ACTIVE,
          createdAt,
        }),
      },
    };
    const fxRatesService = {
      getRate: jest.fn().mockResolvedValue(100),
    };

    const service = new ConversionsService(
      prisma as never,
      fxRatesService as never,
    );

    await expect(
      service.createQuote(authenticatedUser, {
        sourceCurrency: Currency.USD,
        targetCurrency: Currency.NGN,
        amount: '10.00',
      }),
    ).resolves.toEqual({
      quote: {
        id: 'quote_1',
        sourceCurrency: Currency.USD,
        targetCurrency: Currency.NGN,
        sourceAmountMinor: '1000',
        targetAmountMinor: '99250',
        baseRate: '100',
        quotedRate: '99.25',
        spreadBps: 75,
        feeAmountMinor: '0',
        expiresAt,
        status: FxQuoteStatus.ACTIVE,
        createdAt,
      },
    });

    expect(fxRatesService.getRate).toHaveBeenCalledWith(
      Currency.USD,
      Currency.NGN,
    );
    expect(prisma.fxQuote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceAmountMinor: 1000n,
        targetAmountMinor: 99250n,
        baseRate: '100.0000000000',
        quotedRate: '99.2500000000',
        spreadBps: 75,
      }),
    });
  });

  it('marks an expired quote and rejects execution', async () => {
    const tx = {
      fxQuote: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'quote_1',
          userId: authenticatedUser.sub,
          status: FxQuoteStatus.ACTIVE,
          consumedAt: null,
          expiresAt: new Date(Date.now() - 5_000),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new ConversionsService(prisma as never, {} as never);

    await expect(
      service.executeQuote(authenticatedUser, { quoteId: 'quote_1' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.fxQuote.update).toHaveBeenCalledWith({
      where: { id: 'quote_1' },
      data: { status: FxQuoteStatus.EXPIRED },
    });
  });
});
