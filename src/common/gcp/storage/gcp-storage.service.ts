import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import { StorageService as IStorageService } from '../../storage/storage.service.interface';

@Injectable()
export class GcpStorageService implements IStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly logger = new Logger(GcpStorageService.name);

  constructor(private readonly configService: ConfigService) {
     this.storage = new Storage({
      projectId: this.configService.get<string>('GCP_PROJECT_ID'),
      keyFilename: path.join(process.cwd(), '/keys/gcp-service-account-key.json'),
    });

    this.bucketName = this.configService.get<string>('GCP_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    destinationFileName: string,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(destinationFileName);

    return new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      stream.on('finish', () => {
        this.logger.log(`Successfully uploaded ${destinationFileName}`);
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${destinationFileName}`;
        resolve(publicUrl);
      });

      stream.on('error', (err) => {
        this.logger.error(`Failed to upload ${destinationFileName}`, err);
        reject(`Failed to upload file.`);
      });

      stream.end(file.buffer);
    });
  }
}
