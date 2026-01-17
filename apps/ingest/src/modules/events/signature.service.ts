import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);
  private readonly masterSecret: string;
  private readonly timestampWindowMs: number;

  constructor(private readonly configService: ConfigService) {
    this.masterSecret = this.configService.get<string>(
      'HMAC_MASTER_SECRET',
      'default-master-secret',
    );
    this.timestampWindowMs = this.configService.get<number>(
      'TIMESTAMP_WINDOW_MS',
      300000, // 5 minutes
    );
  }

  /**
   * Validate HMAC signature
   * Signature format: HMAC-SHA256(timestamp + '.' + body, projectSecret)
   */
  validateSignature(
    signature: string,
    timestamp: string,
    body: string,
    projectSecret: string,
  ): boolean {
    try {
      const message = `${timestamp}.${body}`;
      const expectedSignature = this.computeHmac(message, projectSecret);

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.warn('Signature validation failed', error);
      return false;
    }
  }

  /**
   * Check if timestamp is within acceptable window (anti-replay)
   */
  validateTimestamp(timestamp: string): boolean {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;

    const now = Date.now();
    const diff = Math.abs(now - ts);

    return diff <= this.timestampWindowMs;
  }

  /**
   * Derive project-specific secret from master secret
   */
  deriveProjectSecret(projectId: string): string {
    return crypto
      .createHmac('sha256', this.masterSecret)
      .update(projectId)
      .digest('hex');
  }

  /**
   * Compute HMAC-SHA256
   */
  computeHmac(message: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Generate a signature for testing/SDK
   */
  generateSignature(body: string, projectSecret: string): { signature: string; timestamp: string } {
    const timestamp = Date.now().toString();
    const message = `${timestamp}.${body}`;
    const signature = this.computeHmac(message, projectSecret);

    return { signature, timestamp };
  }
}
