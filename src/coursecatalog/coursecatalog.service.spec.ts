import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursecatalogService } from './coursecatalog.service';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import { GetCourseCatalogFilterDto } from './dto/get-coursecatalog-filter.dto';

const mockCourseCatalog: CourseCatalog[] = [
  {
    coursecode: 'CC101',
    marketoffering: 'Cloud',
    learningpillar: 'AI/ML',
    coursename: 'Introduction to AI',
    courselink: 'http://example.com/ai',
    coursedescription: 'A basic course on AI.',
    duration: 10,
    vendorplatform: 'Coursera',
    courselevel: 'Beginner',
    courseorcertification: 'Course',
    paidorfree: 'Paid',
    keywords: 'AI, Machine Learning',
    isactive: true,
    createdtimestamp: new Date(),
    lastmodifiedtimestamp: new Date(),
  },
  {
    coursecode: 'CC102',
    marketoffering: 'Cloud',
    learningpillar: 'DevOps',
    coursename: 'Advanced DevOps',
    courselink: 'http://example.com/devops',
    coursedescription: 'Advanced topics in DevOps.',
    duration: 20,
    vendorplatform: 'Udemy',
    courselevel: 'Advanced',
    courseorcertification: 'Course',
    paidorfree: 'Paid',
    keywords: 'DevOps, Cloud',
    isactive: true,
    createdtimestamp: new Date(),
    lastmodifiedtimestamp: new Date(),
  },
  {
    coursecode: 'CC103',
    marketoffering: 'Security',
    learningpillar: 'Cybersecurity',
    coursename: 'Network Security',
    courselink: 'http://example.com/security',
    coursedescription: 'Fundamentals of network security.',
    duration: 15,
    vendorplatform: 'edX',
    courselevel: 'Intermediate',
    courseorcertification: 'Certification',
    paidorfree: 'Free',
    keywords: 'Security, Network',
    isactive: false,
    createdtimestamp: new Date(),
    lastmodifiedtimestamp: new Date(),
  },
];

describe('CoursecatalogService', () => {
  let service: CoursecatalogService;
  let courseCatalogRepository: Repository<CourseCatalog>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursecatalogService,
        {
          provide: getRepositoryToken(CourseCatalog),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockCourseCatalog),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<CoursecatalogService>(CoursecatalogService);
    courseCatalogRepository = module.get<Repository<CourseCatalog>>(
      getRepositoryToken(CourseCatalog),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all courses when no filters are provided', async () => {
      const filterDto: GetCourseCatalogFilterDto = {};
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCourseCatalog),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(mockCourseCatalog);
      expect(courseCatalogRepository.createQueryBuilder).toHaveBeenCalledWith('coursecatalog');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by isactive: true', async () => {
      const filterDto: GetCourseCatalogFilterDto = { isactive: true };
      const activeCourses = mockCourseCatalog.filter((c) => c.isactive === true);
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeCourses),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(activeCourses);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'coursecatalog.isactive = :isactive',
        { isactive: true },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by isactive: false', async () => {
      const filterDto: GetCourseCatalogFilterDto = { isactive: false };
      const inactiveCourses = mockCourseCatalog.filter((c) => c.isactive === false);
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(inactiveCourses),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(inactiveCourses);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'coursecatalog.isactive = :isactive',
        { isactive: false },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by marketoffering', async () => {
      const filterDto: GetCourseCatalogFilterDto = { marketoffering: 'Cloud' };
      const cloudCourses = mockCourseCatalog.filter((c) => c.marketoffering === 'Cloud');
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(cloudCourses),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(cloudCourses);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled(); // No initial where for marketoffering
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'coursecatalog.marketoffering = :marketoffering',
        { marketoffering: 'Cloud' },
      );
    });

    it('should filter by learningpillar', async () => {
      const filterDto: GetCourseCatalogFilterDto = { learningpillar: 'DevOps' };
      const devopsCourses = mockCourseCatalog.filter((c) => c.learningpillar === 'DevOps');
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(devopsCourses),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(devopsCourses);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled(); // No initial where for learningpillar
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'coursecatalog.learningpillar = :learningpillar',
        { learningpillar: 'DevOps' },
      );
    });

    it('should filter by multiple criteria', async () => {
      const filterDto: GetCourseCatalogFilterDto = {
        marketoffering: 'Cloud',
        learningpillar: 'AI/ML',
        isactive: true,
      };
      const filteredCourses = mockCourseCatalog.filter(
        (c) =>
          c.marketoffering === 'Cloud' &&
          c.learningpillar === 'AI/ML' &&
          c.isactive === true,
      );
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(filteredCourses),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual(filteredCourses);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'coursecatalog.isactive = :isactive',
        { isactive: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'coursecatalog.marketoffering = :marketoffering',
        { marketoffering: 'Cloud' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'coursecatalog.learningpillar = :learningpillar',
        { learningpillar: 'AI/ML' },
      );
    });

    it('should return an empty array if no courses match the filters', async () => {
      const filterDto: GetCourseCatalogFilterDto = {
        marketoffering: 'NonExistent',
        isactive: true,
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(courseCatalogRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(filterDto);
      expect(result).toEqual([]);
    });
  });
});
