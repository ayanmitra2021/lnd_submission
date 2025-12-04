import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubmissionModule } from './submission/submission.module';
import { CourseCatalogRefreshModule } from './coursecatalog-refresh/coursecatalog-refresh.module';
import { StorageModule } from './common/storage/storage.module';
import { CoursecatalogModule } from './coursecatalog/coursecatalog.module';
import { MarketofferingModule } from './marketoffering/marketoffering.module';
import { LearningPillarModule } from './learningpillar/learningpillar.module';

@Module({
  imports: [
    // 1. Load the ConfigModule FIRST.
    // 'isGlobal: true' makes the ConfigService available everywhere in your app
    // without needing to import ConfigModule in other modules.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Configure TypeOrmModule asynchronously.
    TypeOrmModule.forRootAsync({
      // 3. Inject the ConfigService to use it.
      inject: [ConfigService],
      // 4. useFactory provides the configuration based on the injected services.
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT'), 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),

    // 3. Import your other feature modules
    SubmissionModule,

    StorageModule,

    CourseCatalogRefreshModule,

    CoursecatalogModule,

    MarketofferingModule,
    LearningPillarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}