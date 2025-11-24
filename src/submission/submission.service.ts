import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../common/gcp/storage/storage.service';
import * as path from 'path';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    file: Express.Multer.File,
  ): Promise<Submission> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the limit of 2MB. Please upload a correct file.');
    }

    const completionDate = new Date(createSubmissionDto.dateOfCompletion);
    const currentYear = new Date().getFullYear();

    if (completionDate > new Date()) {
      throw new BadRequestException('Date of completion cannot be in the future.');
    }

    if (completionDate.getFullYear() < currentYear) {
      throw new BadRequestException(
        'Date of completion cannot be in a previous calendar year.',
      );
    }
    
    // In a real application, you would upload the file.buffer to a cloud bucket here
    // and get a URL. For now, we just generate the GUID.
    this.logger.log(`Uploading file: ${file.originalname}`);
    const certificateGuid = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const destinationFileName = `${certificateGuid}${fileExtension}`;

    try {
      const publicUrl = await this.storageService.uploadFile(
        file,
        destinationFileName,
      );
      this.logger.log(`File available at: ${publicUrl}`);
    } catch (error) {
      this.logger.error('File upload failed', error.stack);
      throw new Error('Could not upload certificate file.');
    }
    
    // The RFC requires overwriting an existing record for the same course/user.
    const startOfCurrentYear = new Date(currentYear, 0, 1);
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        practitioneremail: createSubmissionDto.practitionerEmail,
        coursecode: createSubmissionDto.courseCode,
        dateofcompletion: MoreThanOrEqual(startOfCurrentYear.toISOString().split('T')[0]),
      },
    });

    if (existingSubmission) {
      // Update the existing record. This is needed to updated the records for the current PY. 
      this.logger.log('Updating existing submission...');
      existingSubmission.coursename = createSubmissionDto.courseCertification;
      existingSubmission.hourscompleted = createSubmissionDto.hoursCompleted;
      existingSubmission.dateofcompletion = createSubmissionDto.dateOfCompletion;
      existingSubmission.certificateguid = certificateGuid; // Link the new certificate
      return this.submissionRepository.save(existingSubmission);
    } else {
      // Create a new record
      this.logger.log('Creating new submission...');
      const newSubmission = this.submissionRepository.create({
        practitioneremail: createSubmissionDto.practitionerEmail,
        coursecode: createSubmissionDto.courseCode,
        coursename: createSubmissionDto.courseCertification,
        hourscompleted: createSubmissionDto.hoursCompleted,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        certificateguid: certificateGuid,
      });
      return this.submissionRepository.save(newSubmission);
    }
  }
}
