import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Submission } from './entities/submission.entity';
import { GcpModule } from '../common/gcp/gcp.module';

@Module({
  imports: [TypeOrmModule.forFeature([Submission]), GcpModule],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule { }