import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from './submission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Submission } from './entities/submission.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GetSubmissionFilterDto } from './dto/get-submission-filter.dto';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from '../common/storage/storage.service.interface';
import { CourseCatalog } from './entities/coursecatalog.entity';
import { ConfigService } from '@nestjs/config';
import { MarketofferingService } from '../marketoffering/marketoffering.service';
import { LearningPillarService } from '../learningpillar/learningpillar.service'; // Import LearningPillarService

describe('SubmissionService', () => {
  let service: SubmissionService;
  let submissionRepository: Repository<Submission>;

  const mockSubmissionRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockCourseCatalogRepository = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  const mockMarketofferingService = {
    validateMarketOffering: jest.fn(),
  };

  const mockLearningPillarService = { // Mock LearningPillarService
    validateLearningPillar: jest.fn(),
    validateMarketOfferingLearningPillarCombination: jest.fn(),
  };

  const mockSubmissions: Submission[] = [
    {
      submissionid: 1,
      practitioneremail: 'test1@example.com',
      coursecode: 'CC101',
      coursename: 'Course 1',
      hourscompleted: 10,
      hoursallocated: 10,
      islisted: true,
      dateofcompletion: '2023-01-15',
      certificateguid: 'guid1',
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
    {
      submissionid: 2,
      practitioneremail: 'test2@example.com',
      coursecode: 'CC102',
      coursename: 'Course 2',
      hourscompleted: 20,
      hoursallocated: 20,
      islisted: true,
      dateofcompletion: '2024-03-20',
      certificateguid: 'guid2',
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
    {
      submissionid: 3,
      practitioneremail: 'test1@example.com',
      coursecode: 'CC103',
      coursename: 'Course 3',
      hourscompleted: 15,
      hoursallocated: 15,
      islisted: false,
      dateofcompletion: '2023-06-01',
      certificateguid: 'guid3',
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
  ];

  const mockCourseCatalogs: CourseCatalog[] = [
    {
      coursecode: 'CC101',
      marketoffering: 'Cloud',
      learningpillar: 'AI/ML',
      coursename: 'Course 1',
      courselink: 'link1',
      coursedescription: 'desc1',
      duration: 10,
      vendorplatform: 'platform1',
      courselevel: 'level1',
      courseorcertification: 'course',
      paidorfree: 'paid',
      keywords: 'key1',
      isactive: true,
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
    {
      coursecode: 'CC102',
      marketoffering: 'Security',
      learningpillar: 'DevOps',
      coursename: 'Course 2',
      courselink: 'link2',
      coursedescription: 'desc2',
      duration: 20,
      vendorplatform: 'platform2',
      courselevel: 'level2',
      courseorcertification: 'certification',
      paidorfree: 'free',
      keywords: 'key2',
      isactive: true,
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
    {
      coursecode: 'CC103',
      marketoffering: 'Cloud',
      learningpillar: 'AI/ML',
      coursename: 'Course 3',
      courselink: 'link3',
      coursedescription: 'desc3',
      duration: 15,
      vendorplatform: 'platform3',
      courselevel: 'level3',
      courseorcertification: 'course',
      paidorfree: 'paid',
      keywords: 'key3',
      isactive: false,
      createdtimestamp: new Date(),
      lastmodifiedtimestamp: new Date(),
    },
  ];

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
        {
          provide: MarketofferingService,
          useValue: mockMarketofferingService,
        },
        {
          provide: LearningPillarService, // Provide LearningPillarService
          useValue: mockLearningPillarService,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    submissionRepository = module.get<Repository<Submission>>(
      getRepositoryToken(Submission),
    );
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
        courseCode: 'CC101',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A', // Valid market offering
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
      const mockCourse = { coursecode: 'CC101', duration: 20, marketoffering: 'Cloud' };

      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(null);
      mockSubmissionRepository.create.mockReturnValue(submissionPayload);
      mockSubmissionRepository.save.mockResolvedValue(savedSubmission);
      mockStorageService.uploadFile.mockResolvedValue(
        'http://fake-url.com/file.pdf',
      );
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true); // Market offering from DTO is valid
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true); // Learning Pillar from DTO is valid
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true); // Combination is valid


      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
      );
      expect(mockCourseCatalogRepository.findOne).toHaveBeenCalledWith({
        where: { coursecode: 'CC101', isactive: true },
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
        courseCode: 'CC101',
        dateOfCompletion: `${currentYear}-03-20`,
        hoursCompleted: 12,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A', // Valid market offering
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };
      const existingSubmission = {
        certificateguid: 'some-guid',
        coursecode: 'CC101',
        coursename: 'Old Course Name',
        dateofcompletion: `${currentYear}-01-15`,
        hourscompleted: 10,
        practitioneremail: 'test@test.com',
        submissionid: 1,
      };
      const mockCourse = { coursecode: 'CC101', duration: 25, marketoffering: 'Cloud' };

      mockCourseCatalogRepository.findOne.mockResolvedValue(mockCourse);
      mockSubmissionRepository.findOne.mockResolvedValue(existingSubmission);
      mockStorageService.uploadFile.mockResolvedValue(
        'http://fake-url.com/file.pdf',
      );
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true); // Market offering from DTO is valid
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true); // Learning Pillar from DTO is valid
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true); // Combination is valid

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

      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
      );
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
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          `Course with code "C-INVALID" is either not available or is inactive.`,
        ),
      );
      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
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

      mockCourseCatalogRepository.findOne.mockResolvedValue(null); // Assuming findOne returns null if inactive as well.
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          `Course with code "C-INACTIVE" is either not available or is inactive.`,
        ),
      );

      expect(mockCourseCatalogRepository.findOne).toHaveBeenCalledWith({
        where: {
          coursecode: 'C-INACTIVE',
          isactive: true,
        },
      });
      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
      );
    });

    it('should set hoursallocated to hoursCompleted for course code "00000"', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Special Course',
        courseCode: '00000',
        dateOfCompletion: `${currentYear}-02-10`,
        hoursCompleted: 15,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A', // Valid market offering
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
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      const result = await service.create(createSubmissionDto, mockFile);

      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        createSubmissionDto.marketOffering,
        createSubmissionDto.learningPillarL5,
      );
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
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException('Date of completion cannot be in the future.'),
      );
      // expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      // expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      // expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
      //   createSubmissionDto.marketOffering,
      //   createSubmissionDto.learningPillarL5,
      // );
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
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(
          'Date of completion cannot be in a previous calendar year.',
        ),
      );
      // expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      // expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      // expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
      //   createSubmissionDto.marketOffering,
      //   createSubmissionDto.learningPillarL5,
      // );
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
      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true);

      await expect(
        service.create(createSubmissionDto, largeMockFile),
      ).rejects.toThrow(
        new BadRequestException(
          'File size exceeds the limit of 2MB. Please upload a correct file.',
        ),
      );
      // expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith(createSubmissionDto.marketOffering);
      // expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith(createSubmissionDto.learningPillarL5);
      // expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
      //   createSubmissionDto.marketOffering,
      //   createSubmissionDto.learningPillarL5,
      // );
    });

    it('should throw BadRequestException if market offering from CreateSubmissionDto is invalid', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Test Course',
        courseCode: 'CC101',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Invalid Market', // Invalid market offering
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      mockMarketofferingService.validateMarketOffering.mockResolvedValue(false);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true); // Should not be called
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true); // Should not be called

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(`Market Offering "Invalid Market" is not valid.`),
      );
      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith('Invalid Market');
      expect(mockLearningPillarService.validateLearningPillar).not.toHaveBeenCalled();
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).not.toHaveBeenCalled();
      expect(mockCourseCatalogRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if learning pillar from CreateSubmissionDto is invalid', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Test Course',
        courseCode: 'CC101',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Invalid Pillar', // Invalid learning pillar
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(false);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(true); // Should not be called

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(`Learning Pillar "Invalid Pillar" is not valid.`),
      );
      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith('Offering A');
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith('Invalid Pillar');
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).not.toHaveBeenCalled();
      expect(mockCourseCatalogRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if market offering and learning pillar combination from CreateSubmissionDto is invalid', async () => {
      const createSubmissionDto: CreateSubmissionDto = {
        courseCertification: 'Test Course',
        courseCode: 'CC101',
        dateOfCompletion: `${currentYear}-01-15`,
        hoursCompleted: 10,
        learningPillarL5: 'Pillar B',
        marketOffering: 'Offering A',
        practitionerEmail: 'test@test.com',
        practitionerName: 'John Doe',
      };

      mockMarketofferingService.validateMarketOffering.mockResolvedValue(true);
      mockLearningPillarService.validateLearningPillar.mockResolvedValue(true);
      mockLearningPillarService.validateMarketOfferingLearningPillarCombination.mockResolvedValue(false);

      await expect(service.create(createSubmissionDto, mockFile)).rejects.toThrow(
        new BadRequestException(`Combination of Market Offering "Offering A" and Learning Pillar "Pillar B" is not valid.`),
      );
      expect(mockMarketofferingService.validateMarketOffering).toHaveBeenCalledWith('Offering A');
      expect(mockLearningPillarService.validateLearningPillar).toHaveBeenCalledWith('Pillar B');
      expect(mockLearningPillarService.validateMarketOfferingLearningPillarCombination).toHaveBeenCalledWith(
        'Offering A',
        'Pillar B',
      );
      expect(mockCourseCatalogRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    let queryBuilder: any;

    beforeEach(() => {
      queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSubmissions),
      };
      mockSubmissionRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('should return all submissions when no filters are provided', async () => {
      const filterDto: GetSubmissionFilterDto = {};
      const result = await service.findAll(filterDto);

      expect(mockSubmissionRepository.createQueryBuilder).toHaveBeenCalledWith('submission');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'CourseCatalog',
        'courseCatalog',
        'submission.coursecode = courseCatalog.coursecode',
      );
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockSubmissions);
    });

    it('should filter by practitioneremail', async () => {
      const filterDto: GetSubmissionFilterDto = { practitioneremail: 'test1@example.com' };
      const filteredSubmissions = mockSubmissions.filter(s => s.practitioneremail === 'test1@example.com');
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'submission.practitioneremail = :practitioneremail',
        { practitioneremail: 'test1@example.com' },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should filter by coursecode', async () => {
      const filterDto: GetSubmissionFilterDto = { coursecode: 'CC102' };
      const filteredSubmissions = mockSubmissions.filter(s => s.coursecode === 'CC102');
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'submission.coursecode = :coursecode',
        { coursecode: 'CC102' },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should filter by marketoffering', async () => {
      const filterDto: GetSubmissionFilterDto = { marketoffering: 'Cloud' };
      const filteredSubmissions = mockSubmissions.filter(s =>
        mockCourseCatalogs.find(cc => cc.coursecode === s.coursecode)?.marketoffering === 'Cloud'
      );
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'courseCatalog.marketoffering = :marketoffering',
        { marketoffering: 'Cloud' },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should filter by learningpillar', async () => {
      const filterDto: GetSubmissionFilterDto = { learningpillar: 'DevOps' };
      const filteredSubmissions = mockSubmissions.filter(s =>
        mockCourseCatalogs.find(cc => cc.coursecode === s.coursecode)?.learningpillar === 'DevOps'
      );
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'courseCatalog.learningpillar = :learningpillar',
        { learningpillar: 'DevOps' },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should filter by completionyear', async () => {
      const filterDto: GetSubmissionFilterDto = { completionyear: 2024 };
      const filteredSubmissions = mockSubmissions.filter(s =>
        new Date(s.dateofcompletion).getFullYear() === 2024
      );
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM submission.dateofcompletion) = :year',
        { year: 2024 },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should filter by multiple criteria', async () => {
      const filterDto: GetSubmissionFilterDto = {
        practitioneremail: 'test1@example.com',
        marketoffering: 'Cloud',
        completionyear: 2023,
      };
      const filteredSubmissions = mockSubmissions.filter(s =>
        s.practitioneremail === 'test1@example.com' &&
        mockCourseCatalogs.find(cc => cc.coursecode === s.coursecode)?.marketoffering === 'Cloud' &&
        new Date(s.dateofcompletion).getFullYear() === 2023
      );
      queryBuilder.getMany.mockResolvedValue(filteredSubmissions);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'submission.practitioneremail = :practitioneremail',
        { practitioneremail: 'test1@example.com' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'courseCatalog.marketoffering = :marketoffering',
        { marketoffering: 'Cloud' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM submission.dateofcompletion) = :year',
        { year: 2023 },
      );
      expect(result).toEqual(filteredSubmissions);
    });

    it('should return an empty array if no submissions match the filters', async () => {
      const filterDto: GetSubmissionFilterDto = { practitioneremail: 'nonexistent@example.com' };
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findAll(filterDto);

      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
