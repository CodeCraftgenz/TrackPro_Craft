import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../integrations/encryption.service';

interface MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface MfaVerifyResult {
  success: boolean;
  backupCodeUsed?: boolean;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly issuer: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.issuer = this.configService.get<string>('MFA_ISSUER', 'TrackPro');

    // Configure TOTP settings
    authenticator.options = {
      digits: 6,
      step: 30, // 30 seconds validity
      window: 1, // Allow 1 step before/after for clock drift
    };
  }

  /**
   * Generate MFA setup for a user
   */
  async setupMfa(userId: string): Promise<MfaSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate QR code URL
    const otpauthUrl = authenticator.keyuri(user.email, this.issuer, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Encrypt and store the secret temporarily (not enabled yet)
    const encryptedSecret = this.encryptionService.encrypt(secret);
    const hashedBackupCodes = backupCodes.map((code) =>
      this.encryptionService.hash(code),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
        mfaBackupCodes: JSON.stringify(hashedBackupCodes),
        mfaPendingSetup: true,
      },
    });

    this.logger.log(`MFA setup initiated for user ${userId}`);

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaSecret: true,
        mfaPendingSetup: true,
        mfaEnabled: true,
      },
    });

    if (!user || !user.mfaSecret || !user.mfaPendingSetup) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Decrypt secret and verify token
    const secret = this.encryptionService.decrypt(user.mfaSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaPendingSetup: false,
      },
    });

    this.logger.log(`MFA enabled for user ${userId}`);

    return true;
  }

  /**
   * Verify MFA token during login
   */
  async verifyMfaToken(
    userId: string,
    token: string,
  ): Promise<MfaVerifyResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true,
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA not enabled for this user');
    }

    // First, try TOTP verification
    const secret = this.encryptionService.decrypt(user.mfaSecret);
    const isValidTotp = authenticator.verify({ token, secret });

    if (isValidTotp) {
      return { success: true, backupCodeUsed: false };
    }

    // If TOTP fails, check if it's a backup code
    if (user.mfaBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.mfaBackupCodes);
      const tokenHash = this.encryptionService.hash(token);
      const codeIndex = backupCodes.indexOf(tokenHash);

      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            mfaBackupCodes: JSON.stringify(backupCodes),
          },
        });

        this.logger.warn(
          `Backup code used for user ${userId}. Remaining: ${backupCodes.length}`,
        );

        return { success: true, backupCodeUsed: true };
      }
    }

    return { success: false };
  }

  /**
   * Disable MFA for a user
   */
  async disableMfa(userId: string, token: string): Promise<boolean> {
    // Verify token before disabling
    const result = await this.verifyMfaToken(userId, token);

    if (!result.success) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        mfaPendingSetup: false,
      },
    });

    this.logger.log(`MFA disabled for user ${userId}`);

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    token: string,
  ): Promise<string[]> {
    // Verify current MFA before regenerating
    const result = await this.verifyMfaToken(userId, token);

    if (!result.success) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = backupCodes.map((code) =>
      this.encryptionService.hash(code),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);

    return backupCodes;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    return user?.mfaEnabled ?? false;
  }

  /**
   * Get MFA status for a user
   */
  async getMfaStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaBackupCodes: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let backupCodesRemaining = 0;
    if (user.mfaBackupCodes) {
      const codes: string[] = JSON.parse(user.mfaBackupCodes);
      backupCodesRemaining = codes.length;
    }

    return {
      enabled: user.mfaEnabled ?? false,
      backupCodesRemaining,
    };
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Format: XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }
}
