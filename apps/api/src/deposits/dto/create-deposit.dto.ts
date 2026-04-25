import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Matches } from 'class-validator';
import { Currency } from '../../generated/prisma/enums';

export class CreateDepositDto {
  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ example: '100.00' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;
}
