import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPillar } from './entities/learningpillar.entity';
import { CreateLearningPillarDto } from './dto/create-learningpillar.dto';
import { MarketofferingService } from '../marketoffering/marketoffering.service';

@Injectable()
export class LearningPillarService {
  constructor(
    @InjectRepository(LearningPillar)
    private readonly learningPillarRepository: Repository<LearningPillar>,
    private readonly marketofferingService: MarketofferingService,
  ) {}

  async create(createLearningPillarDto: CreateLearningPillarDto): Promise<LearningPillar> {
    const { marketofferingid, learningpillarname } = createLearningPillarDto;

    // Validate if marketofferingid exists
    const marketOffering = await this.marketofferingService.findOneById(marketofferingid);
    if (!marketOffering) {
      throw new NotFoundException(`Market Offering with ID "${marketofferingid}" not found.`);
    }

    // Check for duplicate learningpillarname under the same marketofferingid
    const existingLearningPillar = await this.learningPillarRepository.findOne({
      where: { marketofferingid, learningpillarname },
    });

    if (existingLearningPillar) {
      throw new ConflictException(
        `Learning Pillar "${learningpillarname}" already exists for Market Offering ID "${marketofferingid}".`,
      );
    }

    const learningPillar = this.learningPillarRepository.create(createLearningPillarDto);
    return this.learningPillarRepository.save(learningPillar);
  }

  async findAll(): Promise<LearningPillar[]> {
    return this.learningPillarRepository.find();
  }

  async findOneByName(name: string): Promise<LearningPillar | undefined> {
    return this.learningPillarRepository.findOne({ where: { learningpillarname: name } });
  }

  async validateLearningPillar(name: string): Promise<boolean> {
    if (!name) {
      return false;
    }
    const exists = await this.learningPillarRepository.findOne({ where: { learningpillarname: name } });
    return !!exists;
  }

  async validateMarketOfferingLearningPillarCombination(
    marketOfferingName: string,
    learningPillarName: string,
  ): Promise<boolean> {
    if (!marketOfferingName || !learningPillarName) {
      return false;
    }

    const marketOffering = await this.marketofferingService.findOneByName(marketOfferingName);
    if (!marketOffering) {
      return false;
    }

    const learningPillar = await this.learningPillarRepository.findOne({
      where: {
        marketofferingid: marketOffering.marketofferingid,
        learningpillarname: learningPillarName,
      },
    });

    return !!learningPillar;
  }
}
