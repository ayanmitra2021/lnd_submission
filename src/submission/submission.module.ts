import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Submission } from './entities/submission.entity';
import { CourseCatalog } from './entities/coursecatalog.entity';
import { MarketofferingModule } from '../marketoffering/marketoffering.module';
import { LearningPillarModule } from '../learningpillar/learningpillar.module';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, CourseCatalog]), MarketofferingModule, LearningPillarModule],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}