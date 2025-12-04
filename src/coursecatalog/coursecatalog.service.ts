import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import { GetCourseCatalogFilterDto } from './dto/get-coursecatalog-filter.dto';

@Injectable()
export class CoursecatalogService {
  constructor(
    @InjectRepository(CourseCatalog)
    private readonly courseCatalogRepository: Repository<CourseCatalog>,
  ) {}

  async findAll(
    filterDto: GetCourseCatalogFilterDto,
  ): Promise<CourseCatalog[]> {
    const { marketoffering, learningpillar, isactive } = filterDto;
    const query = this.courseCatalogRepository.createQueryBuilder('coursecatalog');

    if (isactive !== undefined) {
      query.where('coursecatalog.isactive = :isactive', { isactive });
    }

    if (marketoffering) {
      query.andWhere('coursecatalog.marketoffering = :marketoffering', {
        marketoffering,
      });
    }

    if (learningpillar) {
      query.andWhere('coursecatalog.learningpillar = :learningpillar', {
        learningpillar,
      });
    }

    const courses = await query.getMany();
    return courses;
  }
}
