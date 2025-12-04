import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GetSubmissionFilterDto } from './dto/get-submission-filter.dto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../common/storage/storage.service.interface';
import * as path from 'path';
import { CourseCatalog } from './entities/coursecatalog.entity';
import { MarketofferingService } from '../marketoffering/marketoffering.service';
import { LearningPillarService } from '../learningpillar/learningpillar.service';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  private readonly maxFileSize: number;
  private readonly unlistedCourseCode: string;

  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(CourseCatalog)
    private readonly courseCatalogRepository: Repository<CourseCatalog>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly marketofferingService: MarketofferingService,
    private readonly learningPillarService: LearningPillarService, // Inject LearningPillarService // Inject MarketofferingService
  ) {
    this.maxFileSize = +this.configService.get<number>('MAX_FILE_SIZE_BYTES');
    this.unlistedCourseCode = this.configService.get<string>('UNLISTED_COURSE_CODE');
  }

  async create(
    createSubmissionDto: CreateSubmissionDto,
    file: Express.Multer.File,
  ): Promise<Submission> {
    if (file.size > this.maxFileSize) {
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

    const isMarketOfferingValid = await this.marketofferingService.validateMarketOffering(createSubmissionDto.marketOffering);
    if (!isMarketOfferingValid) {
        throw new BadRequestException(`Market Offering "${createSubmissionDto.marketOffering}" is not valid.`);
    }

    // Learning Pillar validation
    const isLearningPillarValid = await this.learningPillarService.validateLearningPillar(createSubmissionDto.learningPillarL5);
    if (!isLearningPillarValid) {
        throw new BadRequestException(`Learning Pillar "${createSubmissionDto.learningPillarL5}" is not valid.`);
    }

    // Market Offering - Learning Pillar combination validation
    const isCombinationValid = await this.learningPillarService.validateMarketOfferingLearningPillarCombination(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
    );
    if (!isCombinationValid) {
        throw new BadRequestException(`Combination of Market Offering "${createSubmissionDto.marketOffering}" and Learning Pillar "${createSubmissionDto.learningPillarL5}" is not valid.`);
    }

    if (createSubmissionDto.courseCode === this.unlistedCourseCode) {
      hoursallocated = createSubmissionDto.hoursCompleted;
      islisted = false;
    } else {
      const course = await this.courseCatalogRepository.findOne({
        where: {
          coursecode: createSubmissionDto.courseCode,
          isactive: true,
        },
      });
      if (!course) {
        throw new BadRequestException(
          `Course with code "${createSubmissionDto.courseCode}" is either not available or is inactive.`,
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

  async findAll(filterDto: GetSubmissionFilterDto): Promise<Submission[]> {
    const {
      marketoffering,
      learningpillar,
      practitioneremail,
      coursecode,
      completionyear,
    } = filterDto;

    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('CourseCatalog', 'courseCatalog', 'submission.coursecode = courseCatalog.coursecode');

    if (practitioneremail) {
      query.andWhere('submission.practitioneremail = :practitioneremail', {
        practitioneremail,
      });
    }

    if (coursecode) {
      query.andWhere('submission.coursecode = :coursecode', { coursecode });
    }

    if (marketoffering) {
      query.andWhere('courseCatalog.marketoffering = :marketoffering', {
        marketoffering,
      });
    }

    if (learningpillar) {
      query.andWhere('courseCatalog.learningpillar = :learningpillar', {
        learningpillar,
      });
    }

    if (completionyear) {
      query.andWhere('EXTRACT(YEAR FROM submission.dateofcompletion) = :year', {
        year: completionyear,
      });
    }

    return query.getMany();
  }
}
