import { Test, TestingModule } from '@nestjs/testing';
import { LearningPillarService } from './learningpillar.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPillar } from './entities/learningpillar.entity';
import { MarketofferingService } from '../marketoffering/marketoffering.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateLearningPillarDto } from './dto/create-learningpillar.dto';
import { MarketOffering } from '../marketoffering/entities/marketoffering.entity';

describe('LearningPillarService', () => {
  let service: LearningPillarService;
  let learningPillarRepository: Repository<LearningPillar>;
  let marketofferingService: MarketofferingService;

  const mockLearningPillarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMarketofferingService = {
    findOneById: jest.fn(),
    findOneByName: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningPillarService,
        {
          provide: getRepositoryToken(LearningPillar),
          useValue: mockLearningPillarRepository,
        },
        {
          provide: MarketofferingService,
          useValue: mockMarketofferingService,
        },
      ],
    }).compile();

    service = module.get<LearningPillarService>(LearningPillarService);
    learningPillarRepository = module.get<Repository<LearningPillar>>(getRepositoryToken(LearningPillar));
    marketofferingService = module.get<MarketofferingService>(MarketofferingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateLearningPillarDto = {
      marketofferingid: 1,
      learningpillarname: 'Cloud Computing',
      learningpillardescription: 'Description for Cloud Computing',
    };
    const mockMarketOffering: MarketOffering = {
      marketofferingid: 1,
      marketofferingname: 'Cloud',
      marketofferingdescription: 'Cloud Offerings',
    };
    const mockLearningPillar: LearningPillar = {
      learningpillarid: 1,
      ...createDto,
      marketOffering: mockMarketOffering,
    };

    it('should successfully create a new learning pillar', async () => {
      mockMarketofferingService.findOneById.mockResolvedValue(mockMarketOffering);
      mockLearningPillarRepository.findOne.mockResolvedValue(undefined);
      mockLearningPillarRepository.create.mockReturnValue(mockLearningPillar);
      mockLearningPillarRepository.save.mockResolvedValue(mockLearningPillar);

      const result = await service.create(createDto);
      expect(result).toEqual(mockLearningPillar);
      expect(mockMarketofferingService.findOneById).toHaveBeenCalledWith(createDto.marketofferingid);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({
        where: {
          marketofferingid: createDto.marketofferingid,
          learningpillarname: createDto.learningpillarname,
        },
      });
      expect(mockLearningPillarRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockLearningPillarRepository.save).toHaveBeenCalledWith(mockLearningPillar);
    });

    it('should throw NotFoundException if marketofferingid does not exist', async () => {
      mockMarketofferingService.findOneById.mockResolvedValue(undefined);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockMarketofferingService.findOneById).toHaveBeenCalledWith(createDto.marketofferingid);
      expect(mockLearningPillarRepository.findOne).not.toHaveBeenCalled();
      expect(mockLearningPillarRepository.create).not.toHaveBeenCalled();
      expect(mockLearningPillarRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if learning pillar name already exists for the market offering', async () => {
      mockMarketofferingService.findOneById.mockResolvedValue(mockMarketOffering);
      mockLearningPillarRepository.findOne.mockResolvedValue(mockLearningPillar);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockMarketofferingService.findOneById).toHaveBeenCalledWith(createDto.marketofferingid);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({
        where: {
          marketofferingid: createDto.marketofferingid,
          learningpillarname: createDto.learningpillarname,
        },
      });
      expect(mockLearningPillarRepository.create).not.toHaveBeenCalled();
      expect(mockLearningPillarRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of learning pillars', async () => {
      const learningPillars: LearningPillar[] = [
        { learningpillarid: 1, marketofferingid: 1, learningpillarname: 'LP1', learningpillardescription: 'Desc1', marketOffering: {} as MarketOffering },
        { learningpillarid: 2, marketofferingid: 1, learningpillarname: 'LP2', learningpillardescription: 'Desc2', marketOffering: {} as MarketOffering },
      ];
      mockLearningPillarRepository.find.mockResolvedValue(learningPillars);

      const result = await service.findAll();
      expect(result).toEqual(learningPillars);
      expect(mockLearningPillarRepository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no learning pillars exist', async () => {
      mockLearningPillarRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(mockLearningPillarRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOneByName', () => {
    it('should return a learning pillar if found by name', async () => {
      const learningPillar: LearningPillar = { learningpillarid: 1, marketofferingid: 1, learningpillarname: 'LP1', learningpillardescription: 'Desc1', marketOffering: {} as MarketOffering };
      mockLearningPillarRepository.findOne.mockResolvedValue(learningPillar);

      const result = await service.findOneByName('LP1');
      expect(result).toEqual(learningPillar);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({ where: { learningpillarname: 'LP1' } });
    });

    it('should return undefined if no learning pillar is found by name', async () => {
      mockLearningPillarRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOneByName('NonExistent LP');
      expect(result).toBeUndefined();
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({ where: { learningpillarname: 'NonExistent LP' } });
    });
  });

  describe('validateLearningPillar', () => {
    it('should return true if learning pillar exists', async () => {
      mockLearningPillarRepository.findOne.mockResolvedValue({});
      const result = await service.validateLearningPillar('Existing LP');
      expect(result).toBe(true);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({ where: { learningpillarname: 'Existing LP' } });
    });

    it('should return false if learning pillar does not exist', async () => {
      mockLearningPillarRepository.findOne.mockResolvedValue(undefined);
      const result = await service.validateLearningPillar('NonExistent LP');
      expect(result).toBe(false);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({ where: { learningpillarname: 'NonExistent LP' } });
    });

    it('should return false if learning pillar name is null or empty', async () => {
      const resultNull = await service.validateLearningPillar(null);
      expect(resultNull).toBe(false);
      const resultEmpty = await service.validateLearningPillar('');
      expect(resultEmpty).toBe(false);
      expect(mockLearningPillarRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('validateMarketOfferingLearningPillarCombination', () => {
    const marketOfferingName = 'Cloud';
    const learningPillarName = 'Cloud Computing';
    const mockMarketOffering: MarketOffering = { marketofferingid: 1, marketofferingname: marketOfferingName, marketofferingdescription: 'Desc' };
    const mockLearningPillar: LearningPillar = { learningpillarid: 1, marketofferingid: 1, learningpillarname: learningPillarName, learningpillardescription: 'Desc', marketOffering: mockMarketOffering };

    it('should return true if combination exists', async () => {
      mockMarketofferingService.findOneByName.mockResolvedValue(mockMarketOffering);
      mockLearningPillarRepository.findOne.mockResolvedValue(mockLearningPillar);

      const result = await service.validateMarketOfferingLearningPillarCombination(
        marketOfferingName,
        learningPillarName,
      );
      expect(result).toBe(true);
      expect(mockMarketofferingService.findOneByName).toHaveBeenCalledWith(marketOfferingName);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({
        where: {
          marketofferingid: mockMarketOffering.marketofferingid,
          learningpillarname: learningPillarName,
        },
      });
    });

    it('should return false if market offering does not exist', async () => {
      mockMarketofferingService.findOneByName.mockResolvedValue(undefined);

      const result = await service.validateMarketOfferingLearningPillarCombination(
        'NonExistent MO',
        learningPillarName,
      );
      expect(result).toBe(false);
      expect(mockMarketofferingService.findOneByName).toHaveBeenCalledWith('NonExistent MO');
      expect(mockLearningPillarRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return false if learning pillar does not exist for the market offering', async () => {
      mockMarketofferingService.findOneByName.mockResolvedValue(mockMarketOffering);
      mockLearningPillarRepository.findOne.mockResolvedValue(undefined);

      const result = await service.validateMarketOfferingLearningPillarCombination(
        marketOfferingName,
        'NonExistent LP',
      );
      expect(result).toBe(false);
      expect(mockMarketofferingService.findOneByName).toHaveBeenCalledWith(marketOfferingName);
      expect(mockLearningPillarRepository.findOne).toHaveBeenCalledWith({
        where: {
          marketofferingid: mockMarketOffering.marketofferingid,
          learningpillarname: 'NonExistent LP',
        },
      });
    });

    it('should return false if market offering name or learning pillar name is null or empty', async () => {
      let result = await service.validateMarketOfferingLearningPillarCombination(null, learningPillarName);
      expect(result).toBe(false);
      result = await service.validateMarketOfferingLearningPillarCombination('', learningPillarName);
      expect(result).toBe(false);
      result = await service.validateMarketOfferingLearningPillarCombination(marketOfferingName, null);
      expect(result).toBe(false);
      result = await service.validateMarketOfferingLearningPillarCombination(marketOfferingName, '');
      expect(result).toBe(false);
      expect(mockMarketofferingService.findOneByName).not.toHaveBeenCalled();
      expect(mockLearningPillarRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
