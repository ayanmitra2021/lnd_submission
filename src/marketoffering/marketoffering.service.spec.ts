import { Test, TestingModule } from '@nestjs/testing';
import { MarketofferingService } from './marketoffering.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketOffering } from './entities/marketoffering.entity';
import { ConflictException } from '@nestjs/common';

describe('MarketofferingService', () => {
  let service: MarketofferingService;
  let repository: Repository<MarketOffering>;

  const mockMarketofferingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketofferingService,
        {
          provide: getRepositoryToken(MarketOffering),
          useValue: mockMarketofferingRepository,
        },
      ],
    }).compile();

    service = module.get<MarketofferingService>(MarketofferingService);
    repository = module.get<Repository<MarketOffering>>(getRepositoryToken(MarketOffering));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new market offering', async () => {
      const createDto = { marketofferingname: 'Test Market', marketofferingdescription: 'Description' };
      const newMarketOffering = { marketofferingid: 1, ...createDto };

      mockMarketofferingRepository.findOne.mockResolvedValue(undefined);
      mockMarketofferingRepository.create.mockReturnValue(newMarketOffering);
      mockMarketofferingRepository.save.mockResolvedValue(newMarketOffering);

      const result = await service.create(createDto);
      expect(result).toEqual(newMarketOffering);
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: createDto.marketofferingname } });
      expect(mockMarketofferingRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockMarketofferingRepository.save).toHaveBeenCalledWith(newMarketOffering);
    });

    it('should throw ConflictException if market offering name already exists', async () => {
      mockMarketofferingRepository.create.mockClear();
      mockMarketofferingRepository.save.mockClear(); // Clear save calls before this specific test

      const createDto = { marketofferingname: 'Existing Market', marketofferingdescription: 'Description' };
      const existingMarketOffering = { marketofferingid: 1, ...createDto };

      mockMarketofferingRepository.findOne.mockResolvedValue(existingMarketOffering);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: createDto.marketofferingname } });
      expect(mockMarketofferingRepository.create).not.toHaveBeenCalled();
      expect(mockMarketofferingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of market offerings', async () => {
      const marketOfferings = [
        { marketofferingid: 1, marketofferingname: 'Market 1', marketofferingdescription: 'Desc 1' },
        { marketofferingid: 2, marketofferingname: 'Market 2', marketofferingdescription: 'Desc 2' },
      ];
      mockMarketofferingRepository.find.mockResolvedValue(marketOfferings);

      const result = await service.findAll();
      expect(result).toEqual(marketOfferings);
      expect(mockMarketofferingRepository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no market offerings exist', async () => {
      mockMarketofferingRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(mockMarketofferingRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOneByName', () => {
    it('should return a market offering if found by name', async () => {
      const marketOffering = { marketofferingid: 1, marketofferingname: 'Test Market', marketofferingdescription: 'Description' };
      mockMarketofferingRepository.findOne.mockResolvedValue(marketOffering);

      const result = await service.findOneByName('Test Market');
      expect(result).toEqual(marketOffering);
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: 'Test Market' } });
    });

    it('should return undefined if no market offering is found by name', async () => {
      mockMarketofferingRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOneByName('NonExistent Market');
      expect(result).toBeUndefined();
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: 'NonExistent Market' } });
    });
  });

  describe('validateMarketOffering', () => {
    it('should return true if market offering exists', async () => {
      mockMarketofferingRepository.findOne.mockResolvedValue({});
      const result = await service.validateMarketOffering('Existing Market');
      expect(result).toBe(true);
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: 'Existing Market' } });
    });

    it('should return false if market offering does not exist', async () => {
      mockMarketofferingRepository.findOne.mockResolvedValue(undefined);
      const result = await service.validateMarketOffering('NonExistent Market');
      expect(result).toBe(false);
      expect(mockMarketofferingRepository.findOne).toHaveBeenCalledWith({ where: { marketofferingname: 'NonExistent Market' } });
    });

    it('should return false if market offering name is null or empty', async () => {
      const resultNull = await service.validateMarketOffering(null);
      expect(resultNull).toBe(false);
      const resultEmpty = await service.validateMarketOffering('');
      expect(resultEmpty).toBe(false);
      expect(mockMarketofferingRepository.findOne).not.toHaveBeenCalledWith({ where: { marketofferingname: null } });
      expect(mockMarketofferingRepository.findOne).not.toHaveBeenCalledWith({ where: { marketofferingname: '' } });
    });
  });
});