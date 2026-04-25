import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositsService } from './deposits.service';

@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  createDeposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDepositDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.depositsService.createDeposit(user, dto, idempotencyKey);
  }
}
