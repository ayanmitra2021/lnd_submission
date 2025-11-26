import { Test, TestingModule } from '@nestjs/testing';
import { AzureStorageService } from './azure-storage.service';
import { BlobServiceClient } from '@azure/storage-blob';

jest.mock('@azure/storage-blob', () => {
    const blockBlobClient = {
      upload: jest.fn().mockResolvedValue({}),
      url: 'http://fake-azure-url.com/test-file.pdf',
    };
    const containerClient = {
      getBlockBlobClient: jest.fn(() => blockBlobClient),
    };
    const blobServiceClient = {
      getContainerClient: jest.fn(() => containerClient),
    };
    return {
      BlobServiceClient: {
        fromConnectionString: jest.fn(() => blobServiceClient),
      },
    };
  });

describe('AzureStorageService Integration', () => {
  let service: AzureStorageService;
  let blobServiceClient: BlobServiceClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureStorageService],
    }).compile();

    service = module.get<AzureStorageService>(AzureStorageService);
    blobServiceClient = BlobServiceClient.fromConnectionString('');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file to Azure Blob Storage', async () => {
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

    const result = await service.uploadFile(mockFile, destinationFileName);

    const containerClient = blobServiceClient.getContainerClient('your-azure-bucket-name');
    const blockBlobClient = containerClient.getBlockBlobClient(destinationFileName);

    expect(blockBlobClient.upload).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.buffer.length,
        { blobHTTPHeaders: { blobContentType: mockFile.mimetype } }
    );
    expect(result).toBe(blockBlobClient.url);
  });
});
