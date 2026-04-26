import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';
import { ConversionsService } from './conversions.service';
import { FxRatesService } from './fx-rates.service';

@Module({
  controllers: [ConversionsController],
  providers: [ConversionsService, FxRatesService],
  exports: [FxRatesService],
})
export class ConversionsModule {}
