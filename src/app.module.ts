import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'host.docker.internal', 
      port: 5432,
      username: 'dockeruser',
      password: 'dockeruser',
      database: 'lndsubmission',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: false, 
    }),
    SubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
