import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    file: Express.Multer.File,
  ): Promise<Submission> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the limit of 2MB.');
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
    console.log(`Simulating upload for file: ${file.originalname}`);
    const certificateGuid = uuidv4();

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
      console.log('Updating existing submission...');
      existingSubmission.coursename = createSubmissionDto.courseCertification;
      existingSubmission.hourscompleted = createSubmissionDto.hoursCompleted;
      existingSubmission.dateofcompletion = createSubmissionDto.dateOfCompletion;
      existingSubmission.certificateguid = certificateGuid; // Link the new certificate
      return this.submissionRepository.save(existingSubmission);
    } else {
      // Create a new record
      console.log('Creating new submission...');
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
