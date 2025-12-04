import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import { CoursecatalogController } from './coursecatalog.controller';
import { CoursecatalogService } from './coursecatalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseCatalog])],
  controllers: [CoursecatalogController],
  providers: [CoursecatalogService],
})
export class CoursecatalogModule {}
