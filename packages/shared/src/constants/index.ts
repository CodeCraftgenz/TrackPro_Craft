export const EVENT_NAMES = {
  PAGE_VIEW: 'page_view',
  VIEW_CONTENT: 'view_content',
  LEAD: 'lead',
  INITIATE_CHECKOUT: 'initiate_checkout',
  ADD_TO_CART: 'add_to_cart',
  PURCHASE: 'purchase',
  SEARCH: 'search',
  ADD_PAYMENT_INFO: 'add_payment_info',
  COMPLETE_REGISTRATION: 'complete_registration',
} as const;

export const CONSENT_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  PREFERENCES: 'preferences',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const MEMBER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
} as const;

export const EXPORT_TYPES = {
  EVENTS_RAW: 'EVENTS_RAW',
  EVENTS_AGG: 'EVENTS_AGG',
  FUNNEL: 'FUNNEL',
  REVENUE: 'REVENUE',
} as const;

export const EXPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const API_SCOPES = {
  EVENTS_WRITE: 'events:write',
  EVENTS_READ: 'events:read',
  REPORTS_READ: 'reports:read',
  ADMIN: 'admin',
} as const;

export const CURRENCIES = [
  'BRL',
  'USD',
  'EUR',
  'GBP',
  'ARS',
  'MXN',
  'CLP',
  'COP',
  'PEN',
] as const;

export const TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'America/Buenos_Aires',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
] as const;

export const MAX_EVENTS_PER_BATCH = 100;
export const MAX_PAYLOAD_SIZE_BYTES = 1048576; // 1MB
export const DEFAULT_RETENTION_DAYS = 90;
export const MIN_RETENTION_DAYS = 7;
export const MAX_RETENTION_DAYS = 365;
export const TIMESTAMP_WINDOW_MS = 300000; // 5 minutes
export const DEDUPE_TTL_SECONDS = 3600; // 1 hour
export const ORDER_DEDUPE_TTL_SECONDS = 86400; // 24 hours
