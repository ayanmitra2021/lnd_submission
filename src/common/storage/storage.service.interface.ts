// src/common/storage/storage.service.interface.ts
export abstract class StorageService {
  abstract uploadFile(
    file: Express.Multer.File,
    destinationFileName: string,
  ): Promise<string>;
}
