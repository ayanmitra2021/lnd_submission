import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from './submission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Submission } from './entities/submission.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from '../common/storage/storage.service.interface';
import { CourseCatalog } from './entities/coursecatalog.entity';
import { ConfigService } from '@nestjs/config';

const mockSubmissionRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockCourseCatalogRepository = {
  findOne: jest.fn(),
};

const mockStorageService = {
  uploadFile: jest.fn(),
};

describe('SubmissionService', () => {
  let service: SubmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getRepositoryToken(Submission),
          useValue: mockSubmissionRepository,
        },
        {
          provide: getRepositoryToken(CourseCatalog),
          useValue: mockCourseCatalogRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MAX_FILE_SIZE_BYTES') {
                return 2 * 1024 * 1024; // 2MB
              }
              if (key === 'UNLISTED_COURSE_CODE') {
                return '00000';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const startOfCurrentYear = new Date(currentYear, 0, 1);

  describe('create', () => {
    it('should create a new submission if one does not exist for the current year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-123',
        courseCertification: 'Test Course',
        hoursCompleted: 10,
        dateOfCompletion: `${currentYear}-01-15`,
      };

      const submissionPayload = {
        practitioneremail: createSubmissionDto.practitionerEmail,
        coursecode: createSubmissionDto.courseCode,
        coursename: createSubmissionDto.courseCertification,
        hourscompleted: createSubmissionDto.hoursCompleted,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        certificateguid: expect.any(String),
        hoursallocated: 20,
        islisted: true,
      };
      const savedSubmission = { ...submissionPayload, submissionid: 1 };
      const mockCourse = { coursecode: 'C-123', duration: 20 };

      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(null);
      mockSubmissionRepository.create.mockReturnValue(submissionPayload);
      mockSubmissionRepository.save.mockResolvedValue(savedSubmission);
      mockStorageService.uploadFile.mockResolvedValue('http://fake-url.com/file.pdf');

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockCourseCatalogRepository.findOne).toHaveBeenCalledWith({ where: { coursecode: 'C-123' } });
      expect(mockSubmissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          practitioneremail: createSubmissionDto.practitionerEmail,
          coursecode: createSubmissionDto.courseCode,
          dateofcompletion: MoreThanOrEqual(startOfCurrentYear.toISOString().split('T')[0]),
        },
      });
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith(submissionPayload);
      expect(mockSubmissionRepository.save).toHaveBeenCalledWith(submissionPayload);
      expect(result).toEqual(savedSubmission);
    });

    it('should update an existing submission if one exists for the current year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-123',
        courseCertification: 'Updated Course Name',
        hoursCompleted: 12,
        dateOfCompletion: `${currentYear}-03-20`,
      };
      const existingSubmission = {
        submissionid: 1,
        practitioneremail: 'test@test.com',
        coursecode: 'C-123',
        coursename: 'Old Course Name',
        hourscompleted: 10,
        dateofcompletion: `${currentYear}-01-15`,
        certificateguid: 'some-guid',
      };
      const mockCourse = { coursecode: 'C-123', duration: 25 };
      
      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(existingSubmission);
      mockStorageService.uploadFile.mockResolvedValue('http://fake-url.com/file.pdf');

      const updatedSubmissionInDb = {
        ...existingSubmission,
        coursename: createSubmissionDto.courseCertification,
        hourscompleted: createSubmissionDto.hoursCompleted,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        certificateguid: expect.any(String),
        hoursallocated: 25,
        islisted: true,
      };
      mockSubmissionRepository.save.mockResolvedValue(updatedSubmissionInDb);


      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockSubmissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          practitioneremail: createSubmissionDto.practitionerEmail,
          coursecode: createSubmissionDto.courseCode,
          dateofcompletion: MoreThanOrEqual(startOfCurrentYear.toISOString().split('T')[0]),
        },
      });

      expect(mockSubmissionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        coursename: 'Updated Course Name',
        hourscompleted: 12,
        hoursallocated: 25,
        islisted: true,
      }));
      expect(result).toEqual(updatedSubmissionInDb);
    });
    
    it('should throw a BadRequestException if course code does not exist in catalog', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-INVALID',
        courseCertification: 'Invalid Course',
        hoursCompleted: 10,
        dateOfCompletion: `${currentYear}-01-15`,
      };

      mockCourseCatalogRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException('Course with code "C-INVALID" not found in Course Catalog.'),
      );
    });
    
    it('should set hoursallocated to hoursCompleted for course code "00000"', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: '00000',
        courseCertification: 'Special Course',
        hoursCompleted: 15,
        dateOfCompletion: `${currentYear}-02-10`,
      };

      const submissionPayload = {
        practitioneremail: createSubmissionDto.practitionerEmail,
        coursecode: createSubmissionDto.courseCode,
        coursename: createSubmissionDto.courseCertification,
        hourscompleted: createSubmissionDto.hoursCompleted,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        certificateguid: expect.any(String),
        hoursallocated: 15, // Should match hoursCompleted
        islisted: false,      // Should be false
      };
      const savedSubmission = { ...submissionPayload, submissionid: 3 };

      mockSubmissionRepository.findOne.mockResolvedValue(null);
      mockSubmissionRepository.create.mockReturnValue(submissionPayload);
      mockSubmissionRepository.save.mockResolvedValue(savedSubmission);
      mockStorageService.uploadFile.mockResolvedValue('http://fake-url.com/file.pdf');

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockCourseCatalogRepository.findOne).not.toHaveBeenCalled();
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith(submissionPayload);
      expect(result.hoursallocated).toBe(15);
      expect(result.islisted).toBe(false);
    });

    it('should throw a BadRequestException for a future dateOfCompletion', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-123',
        courseCertification: 'Future Course',
        hoursCompleted: 10,
        dateOfCompletion: `${currentYear + 1}-01-15`,
      };

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException('Date of completion cannot be in the future.'),
      );
    });

    it('should throw a BadRequestException for a dateOfCompletion in a previous calendar year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-123',
        courseCertification: 'Old Course',
        hoursCompleted: 10,
        dateOfCompletion: `${lastYear}-12-31`,
      };

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException('Date of completion cannot be in a previous calendar year.'),
      );
    });

    it('should throw a BadRequestException if file size exceeds 2MB', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        practitionerName: 'John Doe',
        practitionerEmail: 'test@test.com',
        marketOffering: 'Offering A',
        learningPillarL5: 'Pillar B',
        courseCode: 'C-123',
        courseCertification: 'Large File Course',
        hoursCompleted: 10,
        dateOfCompletion: `${currentYear}-01-15`,
      };

      const largeMockFile: Express.Multer.File = {
        ...mockFile,
        size: 2 * 1024 * 1024 + 1, // 2MB + 1 byte
      };

      await expect(service.create(createSubmissionDto, largeMockFile)).rejects.toThrow(
        new BadRequestException('File size exceeds the limit of 2MB. Please upload a correct file.'),
      );
    });
  });
});
