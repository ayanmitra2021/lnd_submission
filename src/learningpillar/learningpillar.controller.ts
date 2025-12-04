import { Controller, Get, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { LearningPillarService } from './learningpillar.service';
import { CreateLearningPillarDto } from './dto/create-learningpillar.dto';
import { LearningPillar } from './entities/learningpillar.entity'; // Typo here, should be learningpillar.entity

@Controller('learningpillar')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class LearningPillarController {
  constructor(private readonly learningPillarService: LearningPillarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLearningPillarDto: CreateLearningPillarDto): Promise<LearningPillar> {
    return this.learningPillarService.create(createLearningPillarDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<LearningPillar[]> {
    return this.learningPillarService.findAll();
  }
}
