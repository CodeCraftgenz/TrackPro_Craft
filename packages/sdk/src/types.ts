export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';
export type ConsentCategories = ConsentCategory[];

export interface TrackEvent {
  event_id: string;
  event_name: string;
  event_time: number;
  anonymous_id?: string;
  user_id?: string;
  session_id: string;
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  user_agent?: string;
  consent_categories?: ConsentCategories;
  order_id?: string;
  value?: number;
  currency?: string;
  payload?: Record<string, unknown>;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface StorageData {
  anonymousId: string;
  userId?: string;
  sessionId: string;
  sessionStart: number;
  consent: ConsentCategories;
  utmParams?: UTMParams;
}
