import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { CoursecatalogService } from './coursecatalog.service';
import { GetCourseCatalogFilterDto } from './dto/get-coursecatalog-filter.dto';

@Controller('coursecatalog')
export class CoursecatalogController {
  constructor(private readonly coursecatalogService: CoursecatalogService) {}

  @Get()
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    filterDto: GetCourseCatalogFilterDto,
  ) {
    return this.coursecatalogService.findAll(filterDto);
  }
}
