export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'ANALYST';
  createdAt: Date;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  timezone: string;
  retentionDays: number;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface IntegrationMeta {
  id: string;
  projectId: string;
  pixelId: string;
  testEventCode?: string;
  enabled: boolean;
  createdAt: Date;
}

export interface EventRaw {
  event_id: string;
  project_id: string;
  event_name: string;
  event_time: number;
  received_at: number;
  anonymous_id: string;
  user_id?: string;
  session_id: string;
  url?: string;
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ip?: string;
  user_agent?: string;
  country?: string;
  consent_categories: string[];
  order_id?: string;
  value?: number;
  currency?: string;
  payload_json: string;
}

export interface EventAggDaily {
  project_id: string;
  date: string;
  event_name: string;
  event_count: number;
  unique_users: number;
  unique_sessions: number;
}

export interface MetaDeliveryLog {
  event_id: string;
  project_id: string;
  status: 'delivered' | 'failed' | 'retrying';
  attempts: number;
  last_error?: string;
  updated_at: number;
}

export interface ReportOverview {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ReportFunnel {
  steps: Array<{
    name: string;
    count: number;
    conversionRate: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ReportPerformance {
  data: Array<{
    date: string;
    events: number;
    users: number;
    sessions: number;
    revenue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ExportJob {
  id: string;
  projectId: string;
  type: 'EVENTS_RAW' | 'EVENTS_AGG' | 'FUNNEL' | 'REVENUE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  params: Record<string, unknown>;
  fileUrl?: string;
  error?: string;
  createdAt: Date;
  finishedAt?: Date;
}
