import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Currency, LedgerAccountType, LedgerEntryDirection } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { FxRatesService } from '../conversions/fx-rates.service';

const CURRENCY_ORDER: Currency[] = [
  Currency.USD,
  Currency.GBP,
  Currency.EUR,
  Currency.NGN,
  Currency.KES,
];

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fxRatesService: FxRatesService,
  ) {}

  async getBalances(authenticatedUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        wallet: {
          include: {
            accounts: {
              where: {
                type: LedgerAccountType.USER_ASSET,
              },
              orderBy: {
                createdAt: 'asc',
              },
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

    const balances = await Promise.all(
      user.wallet.accounts.map(async (account) => {
        const amountMinor = await this.getAccountBalanceMinor(account.id);
        const usdEquivalentMinor = await this.convertMinorToUsdEquivalent(
          account.currency,
          amountMinor,
        );

        return {
          accountId: account.id,
          currency: account.currency,
          code: account.code,
          amountMinor,
          amount: this.formatMinorAmount(amountMinor),
          usdEquivalentMinor,
        };
      }),
    );

    const orderedBalances = balances.sort(
      (left, right) =>
        CURRENCY_ORDER.indexOf(left.currency) - CURRENCY_ORDER.indexOf(right.currency),
    );

    const totalUsdEquivalentMinor = orderedBalances.reduce(
      (sum, balance) => sum + balance.usdEquivalentMinor,
      0n,
    );

    return {
      wallet: {
        id: user.wallet.id,
      },
      balances: orderedBalances.map((balance) => ({
        accountId: balance.accountId,
        currency: balance.currency,
        code: balance.code,
        amountMinor: balance.amountMinor.toString(),
        amount: balance.amount,
        usdEquivalentMinor: balance.usdEquivalentMinor.toString(),
      })),
      summary: {
        totalUsdEquivalentMinor: totalUsdEquivalentMinor.toString(),
        totalUsdEquivalent: this.formatMinorAmount(totalUsdEquivalentMinor),
      },
    };
  }

  private async convertMinorToUsdEquivalent(currency: Currency, amountMinor: bigint) {
    if (currency === Currency.USD) {
      return amountMinor;
    }

    if (amountMinor === 0n) {
      return 0n;
    }

    try {
      const rate = await this.fxRatesService.getRate(currency, Currency.USD);
      const amount = Number(this.formatMinorAmount(amountMinor));
      const usdAmount = amount * rate;

      return BigInt(Math.floor(usdAmount * 100));
    } catch (error) {
      this.logger.warn(
        `Unable to convert ${currency} balance into USD equivalent. Falling back to 0 for summary.`,
        error instanceof Error ? error.message : undefined,
      );

      return 0n;
    }
  }

  private formatMinorAmount(amountMinor: bigint) {
    const isNegative = amountMinor < 0n;
    const absolute = isNegative ? amountMinor * -1n : amountMinor;
    const whole = absolute / 100n;
    const fractional = (absolute % 100n).toString().padStart(2, '0');

    return `${isNegative ? '-' : ''}${whole.toString()}.${fractional}`;
  }

  private async getAccountBalanceMinor(accountId: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
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
