import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Currency } from '../generated/prisma/enums';

type CachedRate = {
  rate: number;
  expiresAt: number;
};

@Injectable()
export class FxRatesService {
  private readonly cache = new Map<string, CachedRate>();
  private readonly cacheTtlMs: number;
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.cacheTtlMs = Number(
      configService.get('FX_RATE_CACHE_TTL_MS') ?? 5 * 60 * 1000,
    );
    this.baseUrl =
      configService.get<string>('FX_API_BASE_URL') ??
      'https://api.frankfurter.dev';
  }

  async getRate(sourceCurrency: Currency, targetCurrency: Currency) {
    if (sourceCurrency === targetCurrency) {
      return 1;
    }

    const cacheKey = `${sourceCurrency}:${targetCurrency}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    const url = new URL(
      `${this.baseUrl}/v2/rate/${sourceCurrency}/${targetCurrency}`,
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableException({
        message: 'Unable to fetch FX rate from upstream provider',
        provider: 'frankfurter',
      });
    }

    const payload = (await response.json()) as {
      rate?: number;
    };

    const rate = payload.rate;

    if (!rate || Number.isNaN(rate)) {
      throw new ServiceUnavailableException({
        message: 'FX provider returned an invalid rate',
        provider: 'frankfurter',
      });
    }

    this.cache.set(cacheKey, {
      rate,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return rate;
  }
}
