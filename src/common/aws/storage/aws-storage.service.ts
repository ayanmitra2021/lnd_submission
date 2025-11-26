import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from '../../storage/storage.service.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AwsStorageService implements StorageService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(AwsStorageService.name);
  private readonly region: string;

  constructor() {
    const keyFilePath = path.join(process.cwd(), '/keys/aws-credentials.json');
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

    this.s3 = new S3Client({
      region: keyFile.region,
      credentials: {
        accessKeyId: keyFile.accessKeyId,
        secretAccessKey: keyFile.secretAccessKey,
      },
    });

    this.bucketName = keyFile.bucketName;
    this.region = keyFile.region;
  }

  async uploadFile(
    file: Express.Multer.File,
    destinationFileName: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: destinationFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3.send(command);
      this.logger.log(`Successfully uploaded ${destinationFileName} to S3`);
      // Construct the public URL. This might vary based on bucket settings.
      // Assuming the bucket is public-read.
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${destinationFileName}`;
      return publicUrl;
    } catch (err) {
      this.logger.error(`Failed to upload ${destinationFileName} to S3`, err);
      throw new Error(`Failed to upload file.`);
    }
  }
}
