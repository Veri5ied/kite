import { BadRequestException } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import {
  Currency,
  LedgerEntryDirection,
  LedgerTransactionStatus,
  LedgerTransactionType,
  PayoutStatus,
} from '../generated/prisma/enums';

describe('PayoutsService', () => {
  const authenticatedUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  it('rejects payouts outside NGN and KES', async () => {
    const service = new PayoutsService({} as never);

    await expect(
      service.createPayout(authenticatedUser, {
        sourceCurrency: Currency.USD,
        amount: '10.00',
        recipientAccountNumber: '1234567891',
        recipientBankCode: 'NG001',
        recipientAccountName: 'Jane Doe',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reverses failed payouts with a compensating ledger transaction', async () => {
    const tx = {
      payout: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'payout_1',
          userId: authenticatedUser.sub,
          status: PayoutStatus.PROCESSING,
          sourceCurrency: Currency.NGN,
          sourceAccountId: 'acct_ngn',
          recipientAccountNumber: '1234567890',
          amountMinor: 50000n,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      ledgerAccount: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'system_payout_ngn',
            code: 'system:payout-clearing:NGN',
          })
          .mockResolvedValueOnce({
            id: 'acct_ngn',
          }),
      },
      ledgerTransaction: {
        create: jest.fn().mockResolvedValue({
          id: 'rev_tx_1',
        }),
      },
      ledgerEntry: {
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new PayoutsService(prisma as never);

    await (service as any).finalizePayout('payout_1');

    expect(tx.ledgerTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: authenticatedUser.sub,
        type: LedgerTransactionType.PAYOUT_REVERSAL,
        status: LedgerTransactionStatus.POSTED,
      }),
    });
    expect(tx.ledgerEntry.createMany).toHaveBeenCalledWith({
      data: [
        {
          ledgerTransactionId: 'rev_tx_1',
          accountId: 'system_payout_ngn',
          direction: LedgerEntryDirection.DEBIT,
          currency: Currency.NGN,
          amountMinor: 50000n,
        },
        {
          ledgerTransactionId: 'rev_tx_1',
          accountId: 'acct_ngn',
          direction: LedgerEntryDirection.CREDIT,
          currency: Currency.NGN,
          amountMinor: 50000n,
        },
      ],
    });
    expect(tx.payout.update).toHaveBeenCalledWith({
      where: { id: 'payout_1' },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: 'Simulated payout failure',
        reversalLedgerTransactionId: 'rev_tx_1',
      },
    });
  });
});
