import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as fs from 'fs';
import { StorageService as IStorageService } from '../../storage/storage.service.interface';

@Injectable()
export class GcpStorageService implements IStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly logger = new Logger(GcpStorageService.name);

  constructor() {
    const keyFilePath = path.join(process.cwd(), '/keys/gcp-service-account-key.json');
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    this.storage = new Storage({
      projectId: keyFile.project_id,
      keyFilename: keyFilePath,
    });

    this.bucketName = keyFile.bucket_name;
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