import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExecuteQuoteDto {
  @ApiProperty({ example: 'cm_quote_id' })
  @IsString()
  quoteId!: string;
}
