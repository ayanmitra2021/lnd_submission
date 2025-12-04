import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningPillarService } from './learningpillar.service';
import { LearningPillarController } from './learningpillar.controller';
import { LearningPillar } from './entities/learningpillar.entity';
import { MarketofferingModule } from '../marketoffering/marketoffering.module';

@Module({
  imports: [TypeOrmModule.forFeature([LearningPillar]), MarketofferingModule],
  providers: [LearningPillarService],
  controllers: [LearningPillarController],
  exports: [LearningPillarService],
})
export class LearningPillarModule {}
