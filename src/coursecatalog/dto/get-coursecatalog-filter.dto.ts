import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class GetCourseCatalogFilterDto {
  @IsOptional()
  @IsString()
  marketoffering?: string;

  @IsOptional()
  @IsString()
  learningpillar?: string;

  @IsOptional()
  @IsBoolean()
  isactive?: boolean;
}
