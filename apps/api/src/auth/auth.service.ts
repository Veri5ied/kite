import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { Currency, LedgerAccountType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

const scrypt = promisify(scryptCallback);

const SUPPORTED_CURRENCIES = [
  Currency.USD,
  Currency.GBP,
  Currency.EUR,
  Currency.NGN,
  Currency.KES,
] as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const { email, password } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'A user with this email already exists',
        field: 'email',
      });
    }

    const passwordHash = await this.hashPassword(password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
        },
      });

      await tx.ledgerAccount.createMany({
        data: SUPPORTED_CURRENCIES.map((currency) => ({
          walletId: wallet.id,
          currency,
          type: LedgerAccountType.USER_ASSET,
          code: `wallet:${wallet.id}:${currency}`,
          name: `${currency} balance`,
        })),
      });

      const accounts = await tx.ledgerAccount.findMany({
        where: {
          walletId: wallet.id,
          type: LedgerAccountType.USER_ASSET,
        },
        orderBy: {
          currency: 'asc',
        },
        select: {
          id: true,
          currency: true,
          code: true,
          type: true,
        },
      });

      return {
        user,
        wallet,
        accounts,
      };
    });

    return this.buildAuthResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        createdAt: result.user.createdAt,
      },
      wallet: {
        id: result.wallet.id,
        createdAt: result.wallet.createdAt,
      },
      accounts: result.accounts,
    });
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        wallet: {
          include: {
            accounts: {
              orderBy: { currency: 'asc' },
              select: {
                id: true,
                currency: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    return this.buildAuthResponse({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            createdAt: user.wallet.createdAt,
          }
        : null,
      accounts: user.wallet?.accounts ?? [],
    });
  }

  async getMe(authenticatedUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        wallet: {
          include: {
            accounts: {
              orderBy: { currency: 'asc' },
              select: {
                id: true,
                currency: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'User no longer exists',
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            createdAt: user.wallet.createdAt,
          }
        : null,
      accounts: user.wallet?.accounts ?? [],
    };
  }

  async hashPassword(password: string) {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(password: string, storedHash: string) {
    const [saltHex, hashHex] = storedHash.split(':');

    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const derivedKey = (await scrypt(
      password,
      salt,
      expectedHash.length,
    )) as Buffer;

    return timingSafeEqual(derivedKey, expectedHash);
  }

  private async signAccessToken(payload: AuthenticatedUser) {
    return this.jwtService.signAsync(payload);
  }

  private async buildAuthResponse(data: {
    user: {
      id: string;
      email: string;
      createdAt: Date;
    };
    wallet: {
      id: string;
      createdAt: Date;
    } | null;
    accounts: Array<{
      id: string;
      currency: string;
      code: string;
      type: string;
    }>;
  }) {
    const accessToken = await this.signAccessToken({
      sub: data.user.id,
      email: data.user.email,
    });

    return {
      accessToken,
      user: data.user,
      wallet: data.wallet,
      accounts: data.accounts,
    };
  }
}
