
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import { CourseCatalogRefreshService, RefreshResult } from './coursecatalog-refresh.service';

const mockCourseCatalogRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

describe('CourseCatalogRefreshService', () => {
  let service: CourseCatalogRefreshService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseCatalogRefreshService,
        {
          provide: getRepositoryToken(CourseCatalog),
          useValue: mockCourseCatalogRepository,
        },
      ],
    }).compile();

    service = module.get<CourseCatalogRefreshService>(CourseCatalogRefreshService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processCsv', () => {
    it('should correctly process a CSV with mixed operations', async () => {
      const csvData = `
"C001","Edited Row","New Market","New Pillar","Updated Course","http://example.com/updated","Updated Desc","10","New Vendor","Guidance","Intermediate","Course","Free","","",""
"C002","New Row","New Market 2","New Pillar 2","New Course","http://example.com/new","New Desc","20","New Vendor 2","Guidance 2","Beginner","Certification","Paid","new,course","",""
"C003","Delete Row",,,,,,,,,,,,,
"C004","No Change",,,,,,,,,,,,,
"C005","Edited Row","New Market 5","New Pillar 5","Incomplete Course",,,,,,,,,,
`;

      const mockFile: Express.Multer.File = {
        buffer: Buffer.from(csvData),
        originalname: 'test.csv',
        fieldname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const existingCourse = { coursecode: 'C001', isactive: true, duration: 5 };
      mockCourseCatalogRepository.findOne.mockResolvedValueOnce(existingCourse);
      mockCourseCatalogRepository.findOne.mockResolvedValueOnce(null); // For new row
      const courseToInactivate = { coursecode: 'C003', isactive: true };
      mockCourseCatalogRepository.findOne.mockResolvedValueOnce(courseToInactivate);


      const result: RefreshResult = await service.processCsv(mockFile);

      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(1);
      expect(result.inactivated).toBe(1);
      expect(result.unchanged).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].courseId).toBe('C005');
      expect(mockCourseCatalogRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should return an error for invalid duration', async () => {
      const csvData = `
"C001","Edited Row","Market","Pillar","Course","http://example.com","Desc","-10","Vendor","Guidance","Intermediate","Course","Free"
`;
      const mockFile = { buffer: Buffer.from(csvData) } as Express.Multer.File;
      const result = await service.processCsv(mockFile);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].errors[0]).toContain('Invalid duration');
    });

    it('should update an existing course if Edit Flag is New Row and course exists', async () => {
      const csvData = `
"C001","New Row","Market","Pillar","Course","http://example.com","Desc","10","Vendor","Guidance","Intermediate","Course","Free"
`;
      const mockFile = { buffer: Buffer.from(csvData) } as Express.Multer.File;
      const existingCourse = { coursecode: 'C001', coursename: 'Old Name' };
      mockCourseCatalogRepository.findOne.mockResolvedValue(existingCourse);
      const result = await service.processCsv(mockFile);
      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(mockCourseCatalogRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        coursename: 'Course'
      }));
    });

    it('should return an error if course not found for edited row', async () => {
        const csvData = `
"C001","Edited Row","Market","Pillar","Course","http://example.com","Desc","10","Vendor","Guidance","Intermediate","Course","Free"
`;
        const mockFile = { buffer: Buffer.from(csvData) } as Express.Multer.File;
        mockCourseCatalogRepository.findOne.mockResolvedValue(null);
        const result = await service.processCsv(mockFile);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errors[0]).toContain('not found for update');
    });

    it('should return an error if course not found for delete row', async () => {
        const csvData = `
"C001","Delete Row"
`;
        const mockFile = { buffer: Buffer.from(csvData) } as Express.Multer.File;
        mockCourseCatalogRepository.findOne.mockResolvedValue(null);
        const result = await service.processCsv(mockFile);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errors[0]).toContain('not found for inactivation');
    });

    it('should return an error for invalid Edit Flag', async () => {
        const csvData = `
"C001","Invalid Flag"
`;
        const mockFile = { buffer: Buffer.from(csvData) } as Express.Multer.File;
        const result = await service.processCsv(mockFile);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errors[0]).toContain('Invalid Edit Flag');
    });
  });
});
