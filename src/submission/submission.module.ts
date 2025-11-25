import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Submission } from './entities/submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule { }