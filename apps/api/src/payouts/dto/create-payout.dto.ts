import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ enum: Currency, example: Currency.NGN })
  @IsEnum(Currency)
  sourceCurrency!: Currency;

  @ApiProperty({ example: '1000.00' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @ApiProperty({ example: '1234567891' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+$/, {
    message: 'Recipient account number must contain only digits',
  })
  @MinLength(6)
  @MaxLength(20)
  recipientAccountNumber!: string;

  @ApiProperty({ example: 'NG001' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  recipientBankCode!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientAccountName!: string;
}
