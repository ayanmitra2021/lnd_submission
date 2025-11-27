import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Submission } from './entities/submission.entity';
import { CourseCatalog } from './entities/coursecatalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, CourseCatalog])],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}