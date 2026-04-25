import { IsString } from 'class-validator';

export class ExecuteQuoteDto {
  @IsString()
  quoteId!: string;
}
