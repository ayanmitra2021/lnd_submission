import { Test, TestingModule } from '@nestjs/testing';
import { AwsStorageService } from './aws-storage.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const s3Mock = mockClient(S3Client);

describe('AwsStorageService Integration', () => {
  let service: AwsStorageService;

  beforeEach(async () => {
    s3Mock.reset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsStorageService],
    }).compile();

    service = module.get<AwsStorageService>(AwsStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file to S3', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
      stream: null,
      destination: '',
      filename: '',
      path: '',
    };
    const destinationFileName = 'test-file.pdf';
    
    s3Mock.resolves({});

    const result = await service.uploadFile(mockFile, destinationFileName);

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'your-aws-bucket-name',
      Key: destinationFileName,
      Body: mockFile.buffer,
      ContentType: mockFile.mimetype,
    });
    expect(result).toContain(destinationFileName);
  });
});