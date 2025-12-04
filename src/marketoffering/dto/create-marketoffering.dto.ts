import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateMarketofferingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  marketofferingname: string;

  @IsString()
  @IsOptional()
  marketofferingdescription?: string;
}
