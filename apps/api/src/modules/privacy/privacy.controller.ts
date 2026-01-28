import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PrivacyService } from './privacy.service';
import {
  deleteUserDataSchema,
  anonymizeUserDataSchema,
} from './dto/privacy.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId/projects/:projectId/privacy')
@UseGuards(AuthGuard('jwt'))
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('users')
  async searchUsers(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.privacyService.searchUsers(
      projectId,
      tenantId,
      req!.user.userId,
      {
        query,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
    );
  }

  @Get('users/:anonymousId')
  async getUserDataSummary(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('anonymousId') anonymousId: string,
    @Request() req?: AuthRequest,
  ) {
    return this.privacyService.getUserDataSummary(
      projectId,
      tenantId,
      req!.user.userId,
      anonymousId,
    );
  }

  @Delete('users/:anonymousId')
  async deleteUserData(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('anonymousId') anonymousId: string,
    @Body() body: unknown,
    @Request() req?: AuthRequest,
  ) {
    const dto = deleteUserDataSchema.parse({ ...body as object, anonymousId });
    return this.privacyService.deleteUserData(
      projectId,
      tenantId,
      req!.user.userId,
      dto,
    );
  }

  @Post('users/:anonymousId/anonymize')
  async anonymizeUserData(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Param('anonymousId') anonymousId: string,
    @Body() body: unknown,
    @Request() req?: AuthRequest,
  ) {
    const dto = anonymizeUserDataSchema.parse({ ...body as object, anonymousId });
    return this.privacyService.anonymizeUserData(
      projectId,
      tenantId,
      req!.user.userId,
      dto,
    );
  }
}
