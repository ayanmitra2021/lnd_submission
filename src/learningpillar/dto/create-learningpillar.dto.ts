import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';

export class CreateLearningPillarDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  marketofferingid: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  learningpillarname: string;

  @IsString()
  @IsOptional()
  learningpillardescription?: string;
}
