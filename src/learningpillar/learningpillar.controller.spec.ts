import { Test, TestingModule } from '@nestjs/testing';
import { LearningPillarController } from './learningpillar.controller';
import { LearningPillarService } from './learningpillar.service';
import { CreateLearningPillarDto } from './dto/create-learningpillar.dto';
import { LearningPillar } from './entities/learningpillar.entity';
import { MarketOffering } from '../marketoffering/entities/marketoffering.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LearningPillarController', () => {
  let controller: LearningPillarController;
  let service: LearningPillarService;

  const mockLearningPillarService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningPillarController],
      providers: [
        {
          provide: LearningPillarService,
          useValue: mockLearningPillarService,
        },
      ],
    }).compile();

    controller = module.get<LearningPillarController>(LearningPillarController);
    service = module.get<LearningPillarService>(LearningPillarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateLearningPillarDto = {
      marketofferingid: 1,
      learningpillarname: 'Cloud Computing',
      learningpillardescription: 'Description for Cloud Computing',
    };
    const mockLearningPillar: LearningPillar = {
      learningpillarid: 1,
      ...createDto,
      marketOffering: { marketofferingid: 1, marketofferingname: 'Cloud', marketofferingdescription: 'Desc' },
    };

    it('should create a learning pillar successfully', async () => {
      mockLearningPillarService.create.mockResolvedValue(mockLearningPillar);

      const result = await controller.create(createDto);
      expect(result).toEqual(mockLearningPillar);
      expect(mockLearningPillarService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException if marketofferingid does not exist', async () => {
      mockLearningPillarService.create.mockRejectedValue(
        new NotFoundException(`Market Offering with ID "${createDto.marketofferingid}" not found.`),
      );

      await expect(controller.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockLearningPillarService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if learning pillar name already exists for the market offering', async () => {
      mockLearningPillarService.create.mockRejectedValue(
        new ConflictException(
          `Learning Pillar "${createDto.learningpillarname}" already exists for Market Offering ID "${createDto.marketofferingid}".`,
        ),
      );

      await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockLearningPillarService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of learning pillars', async () => {
      const learningPillars: LearningPillar[] = [
        { learningpillarid: 1, marketofferingid: 1, learningpillarname: 'LP1', learningpillardescription: 'Desc1', marketOffering: {} as any },
        { learningpillarid: 2, marketofferingid: 1, learningpillarname: 'LP2', learningpillardescription: 'Desc2', marketOffering: {} as any },
      ];
      mockLearningPillarService.findAll.mockResolvedValue(learningPillars);

      const result = await controller.findAll();
      expect(result).toEqual(learningPillars);
      expect(mockLearningPillarService.findAll).toHaveBeenCalled();
    });

    it('should return an empty array if no learning pillars exist', async () => {
      mockLearningPillarService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(mockLearningPillarService.findAll).toHaveBeenCalled();
    });
  });
});
