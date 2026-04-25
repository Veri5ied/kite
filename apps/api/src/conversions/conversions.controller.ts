import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ConversionsService } from './conversions.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ExecuteQuoteDto } from './dto/execute-quote.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversions')
export class ConversionsController {
  constructor(private readonly conversionsService: ConversionsService) {}

  @Post('quote')
  createQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.conversionsService.createQuote(user, dto);
  }

  @Post('execute')
  executeQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExecuteQuoteDto,
  ) {
    return this.conversionsService.executeQuote(user, dto);
  }
}
