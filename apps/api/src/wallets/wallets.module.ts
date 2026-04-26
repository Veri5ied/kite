import { Module } from '@nestjs/common';
import { ConversionsModule } from '../conversions/conversions.module';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [ConversionsModule],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}
