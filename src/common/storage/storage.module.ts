import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GcpStorageService } from '../gcp/storage/gcp-storage.service';
import { AwsStorageService } from '../aws/storage/aws-storage.service';
import { AzureStorageService } from '../azure/storage/azure-storage.service';
import { StorageService } from './storage.service.interface';

@Global()
@Module({
  providers: [
    GcpStorageService,
    AwsStorageService,
    AzureStorageService,
    {
      provide: StorageService,
      useFactory: (configService: ConfigService, gcp: GcpStorageService, aws: AwsStorageService, azure: AzureStorageService) => {
        const destination = configService.get('STORAGE_DESTINATION');
        switch (destination) {
          case 'GCP':
            return gcp;
          case 'AWS':
            return aws;
          case 'AZURE':
            return azure;
          default:
            throw new Error('Invalid storage destination');
        }
      },
      inject: [ConfigService, GcpStorageService, AwsStorageService, AzureStorageService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}