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
    const take = limit + 1;

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
      take,
    });

    const conversions = await this.prisma.conversion.findMany({
      where: {
        userId: authenticatedUser.sub,
      },
      include: {
        sourceAccount: {
          select: {
            id: true,
            code: true,
            currency: true,
          },
        },
        targetAccount: {
          select: {
            id: true,
            code: true,
            currency: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });

    const normalizedDeposits = deposits.map((deposit) => ({
      cursorId: `deposit:${deposit.id}`,
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
    }));

    const normalizedConversions = conversions.map((conversion) => ({
      cursorId: `conversion:${conversion.id}`,
      id: conversion.id,
      type: 'conversion' as const,
      status: conversion.status,
      amountMinor: conversion.sourceAmountMinor.toString(),
      sourceAmountMinor: conversion.sourceAmountMinor.toString(),
      destinationAmountMinor: conversion.targetAmountMinor.toString(),
      sourceCurrency: conversion.sourceCurrency,
      destinationCurrency: conversion.targetCurrency,
      timestamp: conversion.createdAt,
      accounts: {
        source: {
          id: conversion.sourceAccount.id,
          code: conversion.sourceAccount.code,
          currency: conversion.sourceAccount.currency,
        },
        target: {
          id: conversion.targetAccount.id,
          code: conversion.targetAccount.code,
          currency: conversion.targetAccount.currency,
        },
      },
      rates: {
        quotedRate: conversion.quotedRate.toString(),
        bookedRate: conversion.bookedRate.toString(),
        spreadBps: conversion.spreadBps,
      },
    }));

    const merged = [...normalizedDeposits, ...normalizedConversions].sort(
      (left, right) => {
        const timestampDiff =
          right.timestamp.getTime() - left.timestamp.getTime();

        if (timestampDiff !== 0) {
          return timestampDiff;
        }

        return right.cursorId.localeCompare(left.cursorId);
      },
    );

    const filtered = query.cursor
      ? merged.filter((item) => item.cursorId < query.cursor!)
      : merged;

    const hasMore = filtered.length > limit;
    const pageItems = hasMore ? filtered.slice(0, limit) : filtered;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? pageItems[pageItems.length - 1].cursorId
        : null;

    return {
      data: pageItems.map(({ cursorId: _cursorId, ...item }) => item),
      page: {
        limit,
        hasMore,
        nextCursor,
      },
    };
  }
}
