import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { StorageService } from '../../storage/storage.service.interface';

@Injectable()
export class AzureStorageService implements StorageService {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly bucketName: string;
  private readonly logger = new Logger(AzureStorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING'),
    );
    this.bucketName = this.configService.get<string>('AZURE_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    destinationFileName: string,
  ): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.bucketName);
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(destinationFileName);

    try {
      await blockBlobClient.upload(file.buffer, file.buffer.length, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });
      this.logger.log(`Successfully uploaded ${destinationFileName} to Azure Blob Storage`);
      return blockBlobClient.url;
    } catch (err) {
      this.logger.error(`Failed to upload ${destinationFileName} to Azure Blob Storage`, err);
      throw new Error(`Failed to upload file.`);
    }
  }
}