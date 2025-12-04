import { IsOptional, IsString, IsNumber, IsEmail, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetSubmissionFilterDto {
  @IsOptional()
  @IsString()
  marketoffering?: string;

  @IsOptional()
  @IsString()
  learningpillar?: string;

  @IsOptional()
  @IsEmail()
  practitioneremail?: string;

  @IsOptional()
  @IsString()
  coursecode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900) // Assuming no courses before this year
  @Max(new Date().getFullYear() + 1) // Allow up to next year for future planning
  completionyear?: number;
}
