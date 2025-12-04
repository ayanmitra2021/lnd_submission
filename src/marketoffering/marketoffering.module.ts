import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketofferingService } from './marketoffering.service';
import { MarketofferingController } from './marketoffering.controller';
import { MarketOffering } from './entities/marketoffering.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketOffering])],
  providers: [MarketofferingService],
  controllers: [MarketofferingController],
  exports: [MarketofferingService],
})
export class MarketofferingModule {}
