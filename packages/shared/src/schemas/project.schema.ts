import { z } from 'zod';

import {
  PROJECT_STATUS,
  MEMBER_ROLES,
  TIMEZONES,
  API_SCOPES,
  MIN_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
} from '../constants';

export const projectStatusSchema = z.enum([
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.PAUSED,
  PROJECT_STATUS.ARCHIVED,
]);

export const memberRoleSchema = z.enum([
  MEMBER_ROLES.OWNER,
  MEMBER_ROLES.ADMIN,
  MEMBER_ROLES.ANALYST,
]);

export const timezoneSchema = z.enum(TIMEZONES);

export const apiScopeSchema = z.enum([
  API_SCOPES.EVENTS_WRITE,
  API_SCOPES.EVENTS_READ,
  API_SCOPES.REPORTS_READ,
  API_SCOPES.ADMIN,
]);

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100),
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().min(3).max(255),
  timezone: timezoneSchema.optional().default('America/Sao_Paulo'),
  retentionDays: z.number().int().min(MIN_RETENTION_DAYS).max(MAX_RETENTION_DAYS).optional().default(90),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().min(3).max(255).optional(),
  status: projectStatusSchema.optional(),
  timezone: timezoneSchema.optional(),
  retentionDays: z.number().int().min(MIN_RETENTION_DAYS).max(MAX_RETENTION_DAYS).optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(2).max(100),
  scopes: z.array(apiScopeSchema).optional().default([API_SCOPES.EVENTS_WRITE]),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: memberRoleSchema,
});

export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type Timezone = z.infer<typeof timezoneSchema>;
export type ApiScope = z.infer<typeof apiScopeSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
