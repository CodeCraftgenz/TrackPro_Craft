import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({
    description: '6-digit TOTP code or backup code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class DisableMfaDto {
  @ApiProperty({
    description: '6-digit TOTP code to confirm disable',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 9) // 6 for TOTP, 9 for backup code (XXXX-XXXX)
  token!: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: '6-digit TOTP code to confirm regeneration',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token!: string;
}

export class MfaSetupResponseDto {
  @ApiProperty({ description: 'TOTP secret (show only once)' })
  secret!: string;

  @ApiProperty({ description: 'QR code as data URL' })
  qrCodeUrl!: string;

  @ApiProperty({ description: 'Backup codes (show only once)' })
  backupCodes!: string[];
}

export class MfaStatusResponseDto {
  @ApiProperty({ description: 'Whether MFA is enabled' })
  enabled!: boolean;

  @ApiPropertyOptional({ description: 'Number of backup codes remaining' })
  backupCodesRemaining?: number;
}

export class LoginWithMfaDto {
  @ApiProperty({ description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ description: 'MFA token (if MFA is enabled)' })
  @IsString()
  mfaToken?: string;
}
