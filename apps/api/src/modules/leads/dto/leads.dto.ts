import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEmail,
  IsUrl,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LeadPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TWITTER = 'TWITTER',
  WEBSITE = 'WEBSITE',
}

// ==================== Lead Integration DTOs ====================

export class CreateLeadIntegrationDto {
  @ApiProperty({ enum: LeadPlatform })
  @IsEnum(LeadPlatform)
  platform!: LeadPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  formIds?: string[];
}

export class UpdateLeadIntegrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  formIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

// ==================== Lead Form DTOs ====================

export class FormFieldDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  type!: string; // text, email, phone, select, textarea

  @ApiProperty()
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: string[]; // For select fields
}

export class FormStylingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successMessage?: string;
}

export class CreateLeadFormDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields!: FormFieldDto[];

  @ApiPropertyOptional({ type: FormStylingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormStylingDto)
  styling?: FormStylingDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  redirectUrl?: string;
}

export class UpdateLeadFormDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: [FormFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields?: FormFieldDto[];

  @ApiPropertyOptional({ type: FormStylingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormStylingDto)
  styling?: FormStylingDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  redirectUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

// ==================== Lead Capture DTOs ====================

export class CaptureLeadDto {
  @ApiProperty()
  @IsString()
  formId!: string;

  @ApiProperty()
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_medium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page_url?: string;
}

// ==================== Notification Config DTOs ====================

export class CreateNotificationConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiProperty({ type: [String], enum: LeadPlatform })
  @IsArray()
  platforms!: LeadPlatform[];
}

export class UpdateNotificationConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({ type: [String], enum: LeadPlatform })
  @IsOptional()
  @IsArray()
  platforms?: LeadPlatform[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

// ==================== Webhook Lead Capture DTO ====================

export class WebhookLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Any additional custom fields' })
  @IsOptional()
  @IsObject()
  custom?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_medium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page_url?: string;
}

// ==================== Lead Query DTOs ====================

export class LeadQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: LeadPlatform })
  @IsOptional()
  @IsEnum(LeadPlatform)
  platform?: LeadPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  offset?: number;
}
