
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import { CourseCatalogRefreshController } from './coursecatalog-refresh.controller';
import { CourseCatalogRefreshService } from './coursecatalog-refresh.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseCatalog])],
  controllers: [CourseCatalogRefreshController],
  providers: [CourseCatalogRefreshService],
})
export class CourseCatalogRefreshModule {}
