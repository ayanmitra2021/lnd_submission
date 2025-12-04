import { Test, TestingModule } from '@nestjs/testing';
import { CoursecatalogController } from './coursecatalog.controller';
import { CoursecatalogService } from './coursecatalog.service';
import { GetCourseCatalogFilterDto } from './dto/get-coursecatalog-filter.dto';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';

describe('CoursecatalogController', () => {
  let controller: CoursecatalogController;
  let service: CoursecatalogService;

  const mockCoursecatalogService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursecatalogController],
      providers: [
        {
          provide: CoursecatalogService,
          useValue: mockCoursecatalogService,
        },
      ],
    }).compile();

    controller = module.get<CoursecatalogController>(CoursecatalogController);
    service = module.get<CoursecatalogService>(CoursecatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of course catalogs', async () => {
      const result: CourseCatalog[] = [
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
      ];
      mockCoursecatalogService.findAll.mockResolvedValue(result);

      const filterDto: GetCourseCatalogFilterDto = { isactive: true };
      expect(await controller.findAll(filterDto)).toEqual(result);
      expect(mockCoursecatalogService.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should call findAll with empty filter when no query params are provided', async () => {
      const result: CourseCatalog[] = [];
      mockCoursecatalogService.findAll.mockResolvedValue(result);

      // We need to pass an empty object because the ValidationPipe will create one
      // if no query parameters are provided.
      expect(await controller.findAll({})).toEqual(result);
      expect(mockCoursecatalogService.findAll).toHaveBeenCalledWith({});
    });
  });
});
