import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../common/storage/storage.service.interface';
import * as path from 'path';
import { CourseCatalog } from './entities/coursecatalog.entity';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(CourseCatalog)
    private readonly courseCatalogRepository: Repository<CourseCatalog>,
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

    let hoursallocated: number;
    let islisted: boolean;

    if (createSubmissionDto.courseCode === '00000') {
      hoursallocated = createSubmissionDto.hoursCompleted;
      islisted = false;
    } else {
      const course = await this.courseCatalogRepository.findOne({
        where: { coursecode: createSubmissionDto.courseCode },
      });
      if (!course) {
        throw new BadRequestException(
          `Course with code "${createSubmissionDto.courseCode}" not found in Course Catalog.`,
        );
      }
      hoursallocated = course.duration;
      islisted = true;
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
      existingSubmission.hoursallocated = hoursallocated;
      existingSubmission.islisted = islisted;
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
        hoursallocated,
        islisted,
      });
      return this.submissionRepository.save(newSubmission);
    }
  }
}
