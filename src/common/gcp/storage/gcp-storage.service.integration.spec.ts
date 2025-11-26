import { Test, TestingModule } from '@nestjs/testing';
import { GcpStorageService } from './gcp-storage.service';

const writeStream = {
    on: jest.fn().mockImplementation(function (this, event, handler) {
        if (event === 'finish') {
            handler();
        }
        return this;
    }),
    end: jest.fn(),
};

const fileMock = {
    createWriteStream: jest.fn(() => writeStream),
};

const bucketMock = {
    file: jest.fn(() => fileMock),
};

const storageMock = {
    bucket: jest.fn(() => bucketMock),
};

jest.mock('@google-cloud/storage', () => ({
    Storage: jest.fn(() => storageMock),
}));

describe('GcpStorageService Integration', () => {
  let service: GcpStorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [GcpStorageService],
    }).compile();

    service = module.get<GcpStorageService>(GcpStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file to GCP Cloud Storage', async () => {
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

    expect(storageMock.bucket).toHaveBeenCalledWith('lndtest');
    expect(bucketMock.file).toHaveBeenCalledWith(destinationFileName);
    expect(fileMock.createWriteStream).toHaveBeenCalledWith({
        resumable: false,
        contentType: mockFile.mimetype,
    });
    expect(writeStream.end).toHaveBeenCalledWith(mockFile.buffer);
    expect(result).toContain(destinationFileName);
  });
});