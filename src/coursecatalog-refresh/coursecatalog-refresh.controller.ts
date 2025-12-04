
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CourseCatalogRefreshService } from './coursecatalog-refresh.service';

@Controller('coursecatalog-refresh')
export class CourseCatalogRefreshController {
  private readonly logger = new Logger(CourseCatalogRefreshController.name);

  constructor(
    private readonly courseCatalogRefreshService: CourseCatalogRefreshService,
  ) {}

  @Post('refresh')
  @UseInterceptors(FileInterceptor('file'))
  async refreshCourseCatalog(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`Received new course catalog file: ${file.originalname}`);
    const result = await this.courseCatalogRefreshService.processCsv(file);
    return result;
  }
}
