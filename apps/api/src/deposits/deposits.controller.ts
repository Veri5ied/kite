import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositsService } from './deposits.service';

@ApiTags('Deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @ApiOperation({
    summary: 'Create an inbound deposit for the authenticated user',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key used to prevent duplicate deposit processing',
  })
  @Post()
  createDeposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDepositDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.depositsService.createDeposit(user, dto, idempotencyKey);
  }
}
