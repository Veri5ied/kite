import { BadRequestException } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import {
  Currency,
  DepositStatus,
  LedgerEntryDirection,
} from '../generated/prisma/enums';

describe('DepositsService', () => {
  const authenticatedUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  it('requires an idempotency key header', async () => {
    const service = new DepositsService({} as never);

    await expect(
      service.createDeposit(
        authenticatedUser,
        { currency: Currency.USD, amount: '10.00' },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replays an existing deposit instead of creating a duplicate', async () => {
    const existingDeposit = {
      id: 'dep_1',
      userId: authenticatedUser.sub,
      destinationAccountId: 'acct_usd',
      destinationAccount: {
        id: 'acct_usd',
        currency: Currency.USD,
        code: 'wallet:wallet_1:USD',
      },
      currency: Currency.USD,
      amountMinor: 1000n,
      status: DepositStatus.COMPLETED,
      idempotencyKey: 'dep-key-1',
      createdAt: new Date('2026-04-25T10:00:00.000Z'),
    };

    const tx = {
      deposit: {
        findUnique: jest.fn().mockResolvedValue(existingDeposit),
      },
      ledgerEntry: {
        findMany: jest.fn().mockResolvedValue([
          {
            direction: LedgerEntryDirection.CREDIT,
            amountMinor: 1000n,
          },
        ]),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new DepositsService(prisma as never);

    await expect(
      service.createDeposit(
        authenticatedUser,
        { currency: Currency.USD, amount: '10.00' },
        'dep-key-1',
      ),
    ).resolves.toEqual({
      idempotentReplay: true,
      deposit: {
        id: 'dep_1',
        currency: Currency.USD,
        amountMinor: '1000',
        status: DepositStatus.COMPLETED,
        idempotencyKey: 'dep-key-1',
        createdAt: existingDeposit.createdAt,
      },
      account: existingDeposit.destinationAccount,
      balanceMinor: '1000',
    });

    expect(tx.user.findUnique).not.toHaveBeenCalled();
  });
});
