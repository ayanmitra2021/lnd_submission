import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Submission } from './entities/submission.entity';
import { CourseCatalog } from './entities/coursecatalog.entity';
import { MarketofferingModule } from '../marketoffering/marketoffering.module';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, CourseCatalog]), MarketofferingModule],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}