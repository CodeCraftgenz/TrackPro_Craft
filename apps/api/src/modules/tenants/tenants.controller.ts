import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto/tenants.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants for current user' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tenantsService.findById(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.tenantsService.delete(id, user.sub);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to tenant' })
  async addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.tenantsService.addMember(id, user.sub, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from tenant' })
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantsService.removeMember(id, user.sub, userId);
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tenantsService.updateMemberRole(id, user.sub, userId, dto.role);
  }
}
