import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ProjectsService } from './projects.service';
import { ApiKeysService } from './api-keys.service';
import { CreateProjectDto, UpdateProjectDto, CreateApiKeyDto } from './dto/projects.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('projects')
@Controller('tenants/:tenantId/projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for tenant' })
  async findAll(@CurrentUser() user: JwtPayload, @Param('tenantId') tenantId: string) {
    return this.projectsService.findAllForTenant(tenantId, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.projectsService.findById(id, tenantId, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, tenantId, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.projectsService.delete(id, tenantId, user.sub);
  }

  // API Keys endpoints
  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Create API key for project' })
  async createApiKey(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(projectId, tenantId, user.sub, dto);
  }

  @Get(':id/api-keys')
  @ApiOperation({ summary: 'List API keys for project' })
  async listApiKeys(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') projectId: string,
  ) {
    return this.apiKeysService.findAllForProject(projectId, tenantId, user.sub);
  }

  @Delete(':id/api-keys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeApiKey(
    @CurrentUser() user: JwtPayload,
    @Param('tenantId') tenantId: string,
    @Param('id') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    await this.apiKeysService.revoke(keyId, projectId, tenantId, user.sub);
  }
}
