import { Controller, Get, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { MarketofferingService } from './marketoffering.service';
import { CreateMarketofferingDto } from './dto/create-marketoffering.dto';
import { MarketOffering } from './entities/marketoffering.entity';

@Controller('marketoffering')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class MarketofferingController {
  constructor(private readonly marketofferingService: MarketofferingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMarketofferingDto: CreateMarketofferingDto): Promise<MarketOffering> {
    return this.marketofferingService.create(createMarketofferingDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<MarketOffering[]> {
    return this.marketofferingService.findAll();
  }
}
