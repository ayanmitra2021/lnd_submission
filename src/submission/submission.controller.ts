import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    ParseFilePipe,
    MaxFileSizeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('learning-submission')
export class SubmissionController {
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
    
    console.log('Received file:', file.originalname);
    console.log('Received data:', submissionData);

    return this.submissionService.create(submissionData, file);
  }
}