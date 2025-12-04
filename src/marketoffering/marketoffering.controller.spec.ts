import { Test, TestingModule } from '@nestjs/testing';
import { MarketofferingController } from './marketoffering.controller';
import { MarketofferingService } from './marketoffering.service';
import { CreateMarketofferingDto } from './dto/create-marketoffering.dto';
import { MarketOffering } from './entities/marketoffering.entity';
import { ConflictException, HttpStatus } from '@nestjs/common';

describe('MarketofferingController', () => {
  let controller: MarketofferingController;
  let service: MarketofferingService;

  const mockMarketofferingService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketofferingController],
      providers: [
        {
          provide: MarketofferingService,
          useValue: mockMarketofferingService,
        },
      ],
    }).compile();

    controller = module.get<MarketofferingController>(MarketofferingController);
    service = module.get<MarketofferingService>(MarketofferingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a market offering successfully', async () => {
      const createDto: CreateMarketofferingDto = {
        marketofferingname: 'Test Market',
        marketofferingdescription: 'Description',
      };
      const expectedResult: MarketOffering = {
        marketofferingid: 1,
        ...createDto,
      };

      mockMarketofferingService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(mockMarketofferingService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if market offering name already exists', async () => {
      const createDto: CreateMarketofferingDto = {
        marketofferingname: 'Existing Market',
        marketofferingdescription: 'Description',
      };

      mockMarketofferingService.create.mockRejectedValue(
        new ConflictException(
          `Market offering with name "${createDto.marketofferingname}" already exists.`,
        ),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockMarketofferingService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of market offerings', async () => {
      const expectedResult: MarketOffering[] = [
        {
          marketofferingid: 1,
          marketofferingname: 'Market 1',
          marketofferingdescription: 'Desc 1',
        },
        {
          marketofferingid: 2,
          marketofferingname: 'Market 2',
          marketofferingdescription: 'Desc 2',
        },
      ];

      mockMarketofferingService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(mockMarketofferingService.findAll).toHaveBeenCalled();
    });

    it('should return an empty array if no market offerings exist', async () => {
      mockMarketofferingService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(mockMarketofferingService.findAll).toHaveBeenCalled();
    });
  });
});