import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType: 'local' | 's3';
  private readonly localPath: string;
  private readonly s3Bucket?: string;
  private readonly s3Region?: string;
  private readonly baseUrl: string;
  private readonly s3Client?: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<'local' | 's3'>(
      'STORAGE_TYPE',
      'local',
    );
    this.localPath = this.configService.get<string>(
      'STORAGE_LOCAL_PATH',
      './exports',
    );
    this.s3Bucket = this.configService.get<string>('STORAGE_S3_BUCKET');
    this.s3Region = this.configService.get<string>(
      'STORAGE_S3_REGION',
      'us-east-1',
    );
    this.baseUrl = this.configService.get<string>(
      'STORAGE_BASE_URL',
      'http://localhost:3001/exports',
    );

    // Initialize S3 client if using S3 storage
    if (this.storageType === 's3') {
      if (!this.s3Bucket) {
        throw new Error('STORAGE_S3_BUCKET is required when STORAGE_TYPE is s3');
      }

      this.s3Client = new S3Client({
        region: this.s3Region,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get<string>(
            'AWS_SECRET_ACCESS_KEY',
            '',
          ),
        },
      });

      this.logger.log(
        `S3 Storage initialized: bucket=${this.s3Bucket}, region=${this.s3Region}`,
      );
    }
  }

  /**
   * Upload a file to storage
   */
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

  /**
   * Get a public URL for a file
   */
  async getFileUrl(key: string): Promise<string> {
    if (this.storageType === 's3') {
      return this.getS3Url(key);
    }
    return this.getLocalUrl(key);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (this.storageType === 's3') {
      return this.deleteFromS3(key);
    }
    return this.deleteFromLocal(key);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (this.storageType === 's3') {
      return this.existsInS3(key);
    }
    return this.existsLocally(key);
  }

  /**
   * Generate a presigned URL for download
   */
  async generateSignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    if (this.storageType === 's3' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        ResponseContentType: options.contentType,
      });

      return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    // For local storage, return public URL
    return this.getLocalUrl(key);
  }

  /**
   * Generate a presigned URL for upload (direct upload to S3)
   */
  async generateSignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const expiresIn = options.expiresIn || 3600;

    if (this.storageType === 's3' && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        ContentType: options.contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return {
        uploadUrl,
        publicUrl: this.getS3Url(key),
      };
    }

    // For local storage, return an endpoint to POST to
    return {
      uploadUrl: `${this.baseUrl}/upload?key=${encodeURIComponent(key)}`,
      publicUrl: this.getLocalUrl(key),
    };
  }

  // ==================== Local Storage Methods ====================

  private async uploadToLocal(
    key: string,
    content: Buffer | string,
  ): Promise<string> {
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

  private async existsLocally(key: string): Promise<boolean> {
    const filePath = path.join(this.localPath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== S3 Storage Methods ====================

  private async uploadToS3(
    key: string,
    content: Buffer | string,
    options: UploadOptions = {},
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const body = typeof content === 'string' ? Buffer.from(content) : content;

    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata,
      // ACL removed - use bucket policies instead for security
    });

    await this.s3Client.send(command);
    this.logger.debug(`File uploaded to S3: ${key}`);

    return this.getS3Url(key);
  }

  private getS3Url(key: string): string {
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.debug(`File deleted from S3: ${key}`);
  }

  private async existsInS3(key: string): Promise<boolean> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as Error).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Generate a unique key for a file
   */
  generateKey(
    prefix: string,
    filename: string,
    options: { tenantId?: string; projectId?: string } = {},
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const parts = [prefix];

    if (options.tenantId) {
      parts.push(options.tenantId);
    }

    if (options.projectId) {
      parts.push(options.projectId);
    }

    parts.push(`${timestamp}_${random}_${sanitizedFilename}`);

    return parts.join('/');
  }
}
