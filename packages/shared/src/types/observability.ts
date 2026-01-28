// Observability Types

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  projectId?: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  eventId?: string;
  userId?: string;
  tenantId?: string;
  projectId?: string;
  duration?: number;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    clickhouse: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

export interface MetricsSnapshot {
  timestamp: string;
  requests: {
    total: number;
    perSecond: number;
    byStatus: Record<string, number>;
  };
  events: {
    received: number;
    processed: number;
    failed: number;
  };
  queues: {
    [queueName: string]: QueueMetrics;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
  failedReason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  requestId: string;
  level: 'error' | 'warn';
  message: string;
  stack?: string;
  context: {
    path?: string;
    method?: string;
    userId?: string;
    tenantId?: string;
  };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}
