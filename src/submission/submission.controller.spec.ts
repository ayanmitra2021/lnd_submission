import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { GetSubmissionFilterDto } from './dto/get-submission-filter.dto';
import { Submission } from './entities/submission.entity';

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let service: SubmissionService;

  const mockSubmissionService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
      ],
    }).compile();

    controller = module.get<SubmissionController>(SubmissionController);
    service = module.get<SubmissionService>(SubmissionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of submissions', async () => {
      const result: Submission[] = [
        {
          submissionid: 1,
          practitioneremail: 'test@example.com',
          coursecode: 'CC101',
          coursename: 'Test Course',
          hourscompleted: 10,
          hoursallocated: 10,
          islisted: true,
          dateofcompletion: '2023-01-01',
          certificateguid: 'uuid-1',
          createdtimestamp: new Date(),
          lastmodifiedtimestamp: new Date(),
        },
      ];
      mockSubmissionService.findAll.mockResolvedValue(result);

      const filterDto: GetSubmissionFilterDto = {
        practitioneremail: 'test@example.com',
      };
      expect(await controller.findAll(filterDto)).toEqual(result);
      expect(mockSubmissionService.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should call findAll with empty filter when no query params are provided', async () => {
      const result: Submission[] = [];
      mockSubmissionService.findAll.mockResolvedValue(result);

      // We need to pass an empty object because the ValidationPipe will create one
      // if no query parameters are provided.
      expect(await controller.findAll({})).toEqual(result); 
      expect(mockSubmissionService.findAll).toHaveBeenCalledWith({});
    });
  });
});
