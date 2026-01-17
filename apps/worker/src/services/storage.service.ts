import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType: 'local' | 's3';
  private readonly localPath: string;
  private readonly s3Bucket?: string;
  private readonly s3Region?: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<'local' | 's3'>('STORAGE_TYPE', 'local');
    this.localPath = this.configService.get<string>('STORAGE_LOCAL_PATH', './exports');
    this.s3Bucket = this.configService.get<string>('STORAGE_S3_BUCKET');
    this.s3Region = this.configService.get<string>('STORAGE_S3_REGION', 'us-east-1');
    this.baseUrl = this.configService.get<string>('STORAGE_BASE_URL', 'http://localhost:3001/exports');
  }

  async uploadFile(
    key: string,
    content: Buffer | string,
    options: UploadOptions = {},
  ): Promise<string> {
    if (this.storageType === 's3') {
      return this.uploadToS3(key, content, options);
    }
    return this.uploadToLocal(key, content);
  }

  async getFileUrl(key: string): Promise<string> {
    if (this.storageType === 's3') {
      return this.getS3Url(key);
    }
    return this.getLocalUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    if (this.storageType === 's3') {
      return this.deleteFromS3(key);
    }
    return this.deleteFromLocal(key);
  }

  private async uploadToLocal(key: string, content: Buffer | string): Promise<string> {
    const filePath = path.join(this.localPath, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });

    if (typeof content === 'string') {
      await fs.writeFile(filePath, content, 'utf-8');
    } else {
      await fs.writeFile(filePath, content);
    }

    this.logger.debug(`File uploaded locally: ${filePath}`);

    return this.getLocalUrl(key);
  }

  private getLocalUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(this.localPath, key);
    try {
      await fs.unlink(filePath);
      this.logger.debug(`File deleted locally: ${filePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async uploadToS3(
    key: string,
    content: Buffer | string,
    _options: UploadOptions = {},
  ): Promise<string> {
    // In production, use AWS SDK
    // For now, fall back to local storage with a warning
    this.logger.warn('S3 storage not fully implemented, falling back to local');
    return this.uploadToLocal(key, content);
  }

  private getS3Url(key: string): string {
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
  }

  private async deleteFromS3(_key: string): Promise<void> {
    // In production, use AWS SDK
    this.logger.warn('S3 delete not fully implemented');
  }

  async generateSignedUrl(key: string, _expiresInSeconds: number = 3600): Promise<string> {
    // For local storage, just return the public URL
    // In production with S3, generate a presigned URL
    if (this.storageType === 's3') {
      this.logger.warn('S3 signed URLs not fully implemented, returning public URL');
    }
    return this.getFileUrl(key);
  }
}
