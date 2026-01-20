import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { MfaService } from './mfa.service';
import {
  VerifyMfaDto,
  DisableMfaDto,
  RegenerateBackupCodesDto,
  MfaSetupResponseDto,
  MfaStatusResponseDto,
} from './dto/mfa.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth/mfa')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA status',
    type: MfaStatusResponseDto,
  })
  async getMfaStatus(@CurrentUser() user: JwtPayload): Promise<MfaStatusResponseDto> {
    return this.mfaService.getMfaStatus(user.sub);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Initialize MFA setup (generate secret and QR code)' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup data (secret, QR code, backup codes)',
    type: MfaSetupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'MFA already enabled',
  })
  async setupMfa(@CurrentUser() user: JwtPayload): Promise<MfaSetupResponseDto> {
    return this.mfaService.setupMfa(user.sub);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA' })
  @ApiResponse({
    status: 200,
    description: 'MFA enabled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code',
  })
  async verifyAndEnableMfa(
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyMfaDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.mfaService.verifyAndEnableMfa(user.sub, dto.token);
    return {
      success: true,
      message: 'MFA enabled successfully',
    };
  }

  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA (requires current TOTP code)' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code',
  })
  async disableMfa(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DisableMfaDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.mfaService.disableMfa(user.sub, dto.token);
    return {
      success: true,
      message: 'MFA disabled successfully',
    };
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes (requires current TOTP code)' })
  @ApiResponse({
    status: 200,
    description: 'New backup codes',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code',
  })
  async regenerateBackupCodes(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegenerateBackupCodesDto,
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.mfaService.regenerateBackupCodes(
      user.sub,
      dto.token,
    );
    return { backupCodes };
  }
}
