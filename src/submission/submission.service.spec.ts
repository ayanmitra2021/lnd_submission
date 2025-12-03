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
  create: jest.fn(),
  findOne: jest.fn(),
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
    buffer: Buffer.from('test'),
    destination: '',
    encoding: '7bit',
    fieldname: 'file',
    filename: '',
    mimetype: 'application/pdf',
    originalname: 'test.pdf',
    path: '',
    size: 1024,
    stream: null,
  };

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const startOfCurrentYear = new Date(currentYear, 0, 1);

  describe('create', () => {
    it('should create a new submission if one does not exist for the current year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Test Course',
        courseCode: 'C-123',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      const submissionPayload = {
        certificateguid: expect.any(String),
        coursecode: createSubmissionDto.courseCode,
        coursename: createSubmissionDto.courseCertification,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        hoursallocated: 20,
        hourscompleted: createSubmissionDto.hoursCompleted,
        islisted: true,
        practitioneremail: createSubmissionDto.practitionerEmail,
      };
      const savedSubmission = { ...submissionPayload, submissionid: 1 };
      const mockCourse = { coursecode: 'C-123', duration: 20 };

      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(null);
      mockSubmissionRepository.create.mockReturnValue(submissionPayload);
      mockSubmissionRepository.save.mockResolvedValue(savedSubmission);
      mockStorageService.uploadFile.mockResolvedValue(
        'http://fake-url.com/file.pdf',
      );

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockCourseCatalogRepository.findOne).toHaveBeenCalledWith({
        where: { coursecode: 'C-123', IsActive: true },
      });
      expect(mockSubmissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          coursecode: createSubmissionDto.courseCode,
          dateofcompletion: MoreThanOrEqual(
            startOfCurrentYear.toISOString().split('T')[0],
          ),
          practitioneremail: createSubmissionDto.practitionerEmail,
        },
      });
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith(
        submissionPayload,
      );
      expect(mockSubmissionRepository.save).toHaveBeenCalledWith(
        submissionPayload,
      );
      expect(result).toEqual(savedSubmission);
    });

    it('should update an existing submission if one exists for the current year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Updated Course Name',
        courseCode: 'C-123',
        dateOfCompletion: `${currentYear}-03-20`,
        hoursCompleted: 12,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };
      const existingSubmission = {
        certificateguid: 'some-guid',
        coursecode: 'C-123',
        coursename: 'Old Course Name',
        dateofcompletion: `${currentYear}-01-15`,
        hourscompleted: 10,
        practitioneremail: 'test@test.com',
        submissionid: 1,
      };
      const mockCourse = { coursecode: 'C-123', duration: 25 };

      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(existingSubmission);
      mockStorageService.uploadFile.mockResolvedValue(
        'http://fake-url.com/file.pdf',
      );

      const updatedSubmissionInDb = {
        ...existingSubmission,
        certificateguid: expect.any(String),
        coursename: createSubmissionDto.courseCertification,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        hoursallocated: 25,
        hourscompleted: createSubmissionDto.hoursCompleted,
        islisted: true,
      };
      mockSubmissionRepository.save.mockResolvedValue(updatedSubmissionInDb);

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockSubmissionRepository.findOne).toHaveBeenCalledWith({
        where: {
          coursecode: createSubmissionDto.courseCode,
          dateofcompletion: MoreThanOrEqual(
            startOfCurrentYear.toISOString().split('T')[0],
          ),
          practitioneremail: createSubmissionDto.practitionerEmail,
        },
      });

      expect(mockSubmissionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          coursename: 'Updated Course Name',
          hoursallocated: 25,
          hourscompleted: 12,
          islisted: true,
        }),
      );
      expect(result).toEqual(updatedSubmissionInDb);
    });

    it('should throw a BadRequestException if course code does not exist in catalog', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Invalid Course',
        courseCode: 'C-INVALID',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      mockCourseCatalogRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          `Course with code "C-INVALID" is either not available or is inactive.`,
        ),
      );
    });

    it('should throw a BadRequestException if the course is inactive', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Inactive Course',
        courseCode: 'C-INACTIVE',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      mockCourseCatalogRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          `Course with code "C-INACTIVE" is either not available or is inactive.`,
        ),
      );

      expect(mockCourseCatalogRepository.findOne).toHaveBeenCalledWith({
        where: {
          coursecode: 'C-INACTIVE',
          IsActive: true,
        },
      });
    });

    it('should set hoursallocated to hoursCompleted for course code "00000"', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Special Course',
        courseCode: '00000',
        dateOfCompletion: `${currentYear}-02-10`,
        hoursCompleted: 15,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      const submissionPayload = {
        certificateguid: expect.any(String),
        coursecode: createSubmissionDto.courseCode,
        coursename: createSubmissionDto.courseCertification,
        dateofcompletion: createSubmissionDto.dateOfCompletion,
        hoursallocated: 15, // Should match hoursCompleted
        hourscompleted: createSubmissionDto.hoursCompleted,
        islisted: false, // Should be false
        practitioneremail: createSubmissionDto.practitionerEmail,
      };
      const savedSubmission = { ...submissionPayload, submissionid: 3 };

      mockSubmissionRepository.findOne.mockResolvedValue(null);
      mockSubmissionRepository.create.mockReturnValue(submissionPayload);
      mockSubmissionRepository.save.mockResolvedValue(savedSubmission);
      mockStorageService.uploadFile.mockResolvedValue(
        'http://fake-url.com/file.pdf',
      );

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockCourseCatalogRepository.findOne).not.toHaveBeenCalled();
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith(
        submissionPayload,
      );
      expect(result.hoursallocated).toBe(15);
      expect(result.islisted).toBe(false);
    });

    it('should throw a BadRequestException for a future dateOfCompletion', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Future Course',
        courseCode: 'C-123',
        dateOfCompletion: `${currentYear + 1}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException('Date of completion cannot be in the future.'),
      );
    });

    it('should throw a BadRequestException for a dateOfCompletion in a previous calendar year', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Old Course',
        courseCode: 'C-123',
        dateOfCompletion: `${lastYear}-12-31`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          'Date of completion cannot be in a previous calendar year.',
        ),
      );
    });

    it('should throw a BadRequestException if file size exceeds 2MB', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Large File Course',
        courseCode: 'C-123',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      const largeMockFile: Express.Multer.File = {
        ...mockFile,
        size: 2 * 1024 * 1024 + 1, // 2MB + 1 byte
      };

      await expect(
        service.create(createSubmissionDto, largeMockFile),
      ).rejects.toThrow(
        new BadRequestException(
          'File size exceeds the limit of 2MB. Please upload a correct file.',
        ),
      );
    });
  });
});
