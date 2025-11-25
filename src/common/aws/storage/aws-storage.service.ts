import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from '../../storage/storage.service.interface';

@Injectable()
export class AwsStorageService implements StorageService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(AwsStorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
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
      const publicUrl = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${destinationFileName}`;
      return publicUrl;
    } catch (err) {
      this.logger.error(`Failed to upload ${destinationFileName} to S3`, err);
      throw new Error(`Failed to upload file.`);
    }
  }
}