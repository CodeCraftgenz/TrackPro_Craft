import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'My E-commerce' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'myecommerce.com' })
  @IsString()
  domain!: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  retentionDays?: number;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'My E-commerce Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'newdomain.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  retentionDays?: number;
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Key' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: ['events:write', 'events:read'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
