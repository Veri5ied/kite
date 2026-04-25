import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Currency } from '../../generated/prisma/enums';

export class CreatePayoutDto {
  @IsEnum(Currency)
  sourceCurrency!: Currency;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+$/, {
    message: 'Recipient account number must contain only digits',
  })
  @MinLength(6)
  @MaxLength(20)
  recipientAccountNumber!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  recipientBankCode!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientAccountName!: string;
}
