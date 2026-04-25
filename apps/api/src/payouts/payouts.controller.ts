import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { PayoutsService } from './payouts.service';

@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  createPayout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.payoutsService.createPayout(user, dto);
  }

  @Get(':id')
  getPayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') payoutId: string,
  ) {
    return this.payoutsService.getPayout(user, payoutId);
  }
}
