import { IsString, IsNotEmpty, IsEmail, IsNumber, IsDateString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  practitionerName: string;

  @IsEmail()
  @IsNotEmpty()
  practitionerEmail: string;

  @IsString()
  @IsNotEmpty()
  marketOffering: string;

  @IsString()
  @IsNotEmpty()
  learningPillarL5: string;
  
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @IsString()
  @IsNotEmpty()
  courseCertification: string;

  @IsNumber()
  hoursCompleted: number;

  @IsDateString()
  @IsNotEmpty()
  dateOfCompletion: string;
}