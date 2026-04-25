import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Matches } from 'class-validator';
import { Currency } from '../../generated/prisma/enums';

export class CreateQuoteDto {
  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency)
  sourceCurrency!: Currency;

  @ApiProperty({ enum: Currency, example: Currency.NGN })
  @IsEnum(Currency)
  targetCurrency!: Currency;

  @ApiProperty({ example: '10.00' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;
}
