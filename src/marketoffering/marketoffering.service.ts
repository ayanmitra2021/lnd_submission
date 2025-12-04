import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketOffering } from './entities/marketoffering.entity';
import { CreateMarketofferingDto } from './dto/create-marketoffering.dto';

@Injectable()
export class MarketofferingService {
  constructor(
    @InjectRepository(MarketOffering)
    private readonly marketofferingRepository: Repository<MarketOffering>,
  ) {}

  async create(createMarketofferingDto: CreateMarketofferingDto): Promise<MarketOffering> {
    const { marketofferingname } = createMarketofferingDto;
    const existingOffering = await this.marketofferingRepository.findOne({ where: { marketofferingname } });

    if (existingOffering) {
      throw new ConflictException(`Market offering with name "${marketofferingname}" already exists.`);
    }

    const marketOffering = this.marketofferingRepository.create(createMarketofferingDto);
    return this.marketofferingRepository.save(marketOffering);
  }

  async findAll(): Promise<MarketOffering[]> {
    return this.marketofferingRepository.find();
  }

  async findOneByName(marketofferingname: string): Promise<MarketOffering | undefined> {
    return this.marketofferingRepository.findOne({ where: { marketofferingname } });
  }

  async findOneById(id: number): Promise<MarketOffering | undefined> {
    return this.marketofferingRepository.findOne({ where: { marketofferingid: id } });
  }

  async validateMarketOffering(marketOfferingName: string): Promise<boolean> {
    if (!marketOfferingName) {
      return false;
    }
    const exists = await this.findOneByName(marketOfferingName);
    return !!exists;
  }

}
