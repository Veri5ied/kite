import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTransactions(
    authenticatedUser: AuthenticatedUser,
    query: ListTransactionsDto,
  ) {
    const limit = query.limit ?? 20;

    const deposits = await this.prisma.deposit.findMany({
      where: {
        userId: authenticatedUser.sub,
      },
      include: {
        destinationAccount: {
          select: {
            id: true,
            code: true,
            currency: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = deposits.length > limit;
    const pageItems = hasMore ? deposits.slice(0, limit) : deposits;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null;

    return {
      data: pageItems.map((deposit) => ({
        id: deposit.id,
        type: 'deposit' as const,
        status: deposit.status,
        amountMinor: deposit.amountMinor.toString(),
        sourceAmountMinor: deposit.amountMinor.toString(),
        destinationAmountMinor: deposit.amountMinor.toString(),
        sourceCurrency: deposit.currency,
        destinationCurrency: deposit.currency,
        timestamp: deposit.createdAt,
        account: {
          id: deposit.destinationAccount.id,
          code: deposit.destinationAccount.code,
          currency: deposit.destinationAccount.currency,
        },
      })),
      page: {
        limit,
        hasMore,
        nextCursor,
      },
    };
  }
}
