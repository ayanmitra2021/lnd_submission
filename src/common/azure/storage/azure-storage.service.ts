import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { StorageService } from '../../storage/storage.service.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AzureStorageService implements StorageService {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly bucketName: string;
  private readonly logger = new Logger(AzureStorageService.name);

  constructor() {
    const keyFilePath = path.join(process.cwd(), '/keys/azure-credentials.json');
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      keyFile.connectionString,
    );
    this.bucketName = keyFile.bucketName;
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
