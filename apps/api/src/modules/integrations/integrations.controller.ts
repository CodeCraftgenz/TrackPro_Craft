import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { IntegrationsService } from './integrations.service';
import {
  createMetaIntegrationSchema,
  updateMetaIntegrationSchema,
  CreateMetaIntegrationDto,
  UpdateMetaIntegrationDto,
} from './dto/integrations.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('tenants/:tenantId/projects/:projectId/integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // Meta CAPI Integration
  @Get('meta')
  async getMetaIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ) {
    return this.integrationsService.getMetaIntegration(
      projectId,
      tenantId,
      req.user.userId,
    );
  }

  @Post('meta')
  @HttpCode(HttpStatus.CREATED)
  async createMetaIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Request() req: AuthRequest,
  ) {
    const result = createMetaIntegrationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }

    return this.integrationsService.createMetaIntegration(
      projectId,
      tenantId,
      req.user.userId,
      result.data,
    );
  }

  @Put('meta')
  async updateMetaIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Request() req: AuthRequest,
  ) {
    const result = updateMetaIntegrationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }

    return this.integrationsService.updateMetaIntegration(
      projectId,
      tenantId,
      req.user.userId,
      result.data,
    );
  }

  @Delete('meta')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMetaIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ) {
    await this.integrationsService.deleteMetaIntegration(
      projectId,
      tenantId,
      req.user.userId,
    );
  }

  @Post('meta/test')
  async testMetaIntegration(
    @Param('tenantId') tenantId: string,
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ) {
    return this.integrationsService.testMetaIntegration(
      projectId,
      tenantId,
      req.user.userId,
    );
  }
}
