import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

// Predefined audit actions for consistency
export enum AuditAction {
  // Authentication
  USER_LOGIN = 'user.login',
  USER_LOGIN_FAILED = 'user.login_failed',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  PASSWORD_CHANGE = 'user.password_change',
  PASSWORD_RESET_REQUEST = 'user.password_reset_request',
  PASSWORD_RESET_COMPLETE = 'user.password_reset_complete',

  // MFA
  MFA_ENABLED = 'user.mfa_enabled',
  MFA_DISABLED = 'user.mfa_disabled',
  MFA_BACKUP_USED = 'user.mfa_backup_used',
  MFA_BACKUP_REGENERATED = 'user.mfa_backup_regenerated',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Tenant/Organization
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_DELETED = 'tenant.deleted',
  MEMBER_INVITED = 'tenant.member_invited',
  MEMBER_REMOVED = 'tenant.member_removed',

  // Project
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PROJECT_ARCHIVED = 'project.archived',

  // API Keys
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_USED = 'api_key.used',

  // Integrations
  INTEGRATION_CONNECTED = 'integration.connected',
  INTEGRATION_DISCONNECTED = 'integration.disconnected',
  INTEGRATION_UPDATED = 'integration.updated',
  INTEGRATION_ERROR = 'integration.error',

  // Data Operations
  DATA_EXPORTED = 'data.exported',
  DATA_DELETED = 'data.deleted',
  DATA_ACCESS = 'data.access',

  // Privacy/GDPR
  CONSENT_UPDATED = 'privacy.consent_updated',
  DATA_SUBJECT_REQUEST = 'privacy.data_subject_request',
  DATA_DELETION_REQUEST = 'privacy.deletion_request',

  // Admin
  ADMIN_ACTION = 'admin.action',
  SETTINGS_CHANGED = 'admin.settings_changed',
  BACKUP_CREATED = 'admin.backup_created',
}

export enum AuditResource {
  USER = 'user',
  TENANT = 'tenant',
  PROJECT = 'project',
  API_KEY = 'api_key',
  INTEGRATION = 'integration',
  EXPORT = 'export',
  CONSENT = 'consent',
  LEAD = 'lead',
  SETTINGS = 'settings',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface AuditLogData {
  tenantId: string;
  actorUserId?: string;
  action: AuditAction | string;
  resource: AuditResource | string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  metadata?: {
    sessionId?: string;
    requestId?: string;
    country?: string;
    city?: string;
  };
}

export interface AuditLogFilters {
  limit?: number;
  offset?: number;
  action?: string;
  resource?: string;
  actorUserId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly retentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.retentionDays = this.configService.get<number>(
      'AUDIT_RETENTION_DAYS',
      365, // 1 year default for compliance
    );
  }

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      // Sanitize payload to remove sensitive data
      const sanitizedPayload = this.sanitizePayload(data.payload);

      // Determine severity based on action if not provided
      const severity = data.severity || this.getSeverityForAction(data.action);

      await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          actorUserId: data.actorUserId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          payload: {
            ...sanitizedPayload,
            severity,
            metadata: data.metadata,
          } as object,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      // Log critical events separately for monitoring
      if (severity === AuditSeverity.CRITICAL) {
        this.logger.warn({
          message: 'Critical audit event',
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          tenantId: data.tenantId,
          actorUserId: data.actorUserId,
        });
      } else {
        this.logger.debug({
          message: 'Audit log created',
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
        });
      }
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging shouldn't break the application
    }
  }

  /**
   * Get audit logs with advanced filtering
   */
  async getLogs(tenantId: string, filters: AuditLogFilters = {}) {
    const {
      limit = 50,
      offset = 0,
      action,
      resource,
      actorUserId,
      severity,
      startDate,
      endDate,
      searchTerm,
    } = filters;

    const where: Record<string, unknown> = { tenantId };

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (actorUserId) where.actorUserId = actorUserId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
    }

    // Filter by severity in payload
    if (severity) {
      where.payload = {
        path: ['severity'],
        equals: severity,
      };
    }

    // Search in action, resource, or resourceId
    if (searchTerm) {
      where.OR = [
        { action: { contains: searchTerm } },
        { resource: { contains: searchTerm } },
        { resourceId: { contains: searchTerm } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  }

  /**
   * Get audit logs for a specific resource
   */
  async getLogsForResource(
    tenantId: string,
    resource: AuditResource | string,
    resourceId: string,
    limit = 50,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resource,
        resourceId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user's actions
   */
  async getLogsForUser(tenantId: string, userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        actorUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get security-related audit logs (for security dashboard)
   */
  async getSecurityLogs(tenantId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const securityActions = [
      AuditAction.USER_LOGIN,
      AuditAction.USER_LOGIN_FAILED,
      AuditAction.PASSWORD_CHANGE,
      AuditAction.PASSWORD_RESET_REQUEST,
      AuditAction.PASSWORD_RESET_COMPLETE,
      AuditAction.MFA_ENABLED,
      AuditAction.MFA_DISABLED,
      AuditAction.MFA_BACKUP_USED,
      AuditAction.API_KEY_CREATED,
      AuditAction.API_KEY_REVOKED,
    ];

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: { in: securityActions },
        createdAt: { gte: startDate },
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStats(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLogs, actionBreakdown, dailyActivity] = await Promise.all([
      // Total logs count
      this.prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),

      // Breakdown by action
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),

      // Daily activity
      this.prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM audit_logs
        WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    return {
      totalLogs,
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      dailyActivity,
    };
  }

  /**
   * Export audit logs (for compliance reports)
   */
  async exportLogs(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Convert to CSV format
    const headers = [
      'Timestamp',
      'Action',
      'Resource',
      'Resource ID',
      'Actor Name',
      'Actor Email',
      'IP Address',
      'User Agent',
      'Payload',
    ];

    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.action,
      log.resource,
      log.resourceId || '',
      log.actor?.name || 'System',
      log.actor?.email || '',
      log.ipAddress || '',
      log.userAgent || '',
      JSON.stringify(log.payload || {}),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );

    return csv;
  }

  /**
   * Cleanup old audit logs (beyond retention period)
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(
      `Cleaned up ${result.count} audit logs older than ${this.retentionDays} days`,
    );

    return result.count;
  }

  /**
   * Sanitize payload to remove sensitive data
   */
  private sanitizePayload(
    payload?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!payload) return undefined;

    const sensitiveKeys = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'credential',
      'mfaSecret',
      'backupCodes',
    ];

    const sanitized = { ...payload };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Determine severity based on action
   */
  private getSeverityForAction(action: string): AuditSeverity {
    const criticalActions = [
      AuditAction.USER_DELETED,
      AuditAction.TENANT_DELETED,
      AuditAction.PROJECT_DELETED,
      AuditAction.DATA_DELETED,
      AuditAction.MFA_DISABLED,
      AuditAction.API_KEY_REVOKED,
      AuditAction.DATA_DELETION_REQUEST,
    ];

    const warningActions = [
      AuditAction.USER_LOGIN_FAILED,
      AuditAction.PASSWORD_RESET_REQUEST,
      AuditAction.MFA_BACKUP_USED,
      AuditAction.INTEGRATION_ERROR,
      AuditAction.USER_ROLE_CHANGED,
    ];

    if (criticalActions.includes(action as AuditAction)) {
      return AuditSeverity.CRITICAL;
    }

    if (warningActions.includes(action as AuditAction)) {
      return AuditSeverity.WARNING;
    }

    return AuditSeverity.INFO;
  }
}
