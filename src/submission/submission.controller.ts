import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    ParseFilePipe,
    MaxFileSizeValidator,
    Logger,
    Get,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GetSubmissionFilterDto } from './dto/get-submission-filter.dto';

@Controller('learning-submission')
export class SubmissionController {
  private readonly logger = new Logger(SubmissionController.name);
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('certificate')) // 'certificate' is the field name for the file
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })], // 2MB size limit
      }),
    )
    file: Express.Multer.File,
    @Body('submissionData') submissionDataString: string,
  ) {
    // The DTO comes as a JSON string, so we need to parse it
    const submissionData: CreateSubmissionDto = JSON.parse(submissionDataString);
    
    // We can even re-validate it after parsing
    // (Requires enabling ValidationPipe globally in main.ts - see Step 8)
    
    this.logger.log(`Received file: ${file.originalname}`);
    this.logger.log(`Received data: ${JSON.stringify(submissionData)}`);

    return this.submissionService.create(submissionData, file);
  }

  @Get()
  async findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    filterDto: GetSubmissionFilterDto,
  ) {
    return this.submissionService.findAll(filterDto);
  }
}