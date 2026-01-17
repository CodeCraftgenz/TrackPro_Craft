import type { TrackEvent, ConsentCategories, UTMParams, StorageData } from './types';
import { generateUUID, computeHMAC, getUTMParams, getCookie, setCookie } from './utils';

export interface TrackProConfig {
  apiKey: string;
  apiSecret: string;
  ingestUrl?: string;
  autoPageView?: boolean;
  autoUTM?: boolean;
  sessionTimeout?: number; // minutes
  debug?: boolean;
}

export interface TrackProInstance {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  pageView: (properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  consent: (categories: ConsentCategories) => void;
  reset: () => void;
  getAnonymousId: () => string;
  getUserId: () => string | undefined;
  getSessionId: () => string;
}

const STORAGE_KEY = 'trackpro_data';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes default

export class TrackPro implements TrackProInstance {
  private config: Required<TrackProConfig>;
  private data: StorageData;
  private queue: TrackEvent[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: TrackProConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      ingestUrl: config.ingestUrl || 'https://ingest.trackpro.io/v1',
      autoPageView: config.autoPageView ?? true,
      autoUTM: config.autoUTM ?? true,
      sessionTimeout: config.sessionTimeout ?? 30,
      debug: config.debug ?? false,
    };

    // Initialize or restore data
    this.data = this.loadData();

    // Check session expiry
    this.checkSession();

    // Capture UTM params
    if (this.config.autoUTM) {
      this.captureUTMParams();
    }

    // Auto page view
    if (this.config.autoPageView && typeof window !== 'undefined') {
      this.pageView();

      // Listen for history changes (SPA)
      if (typeof window.history !== 'undefined') {
        const originalPushState = window.history.pushState;
        window.history.pushState = (...args) => {
          originalPushState.apply(window.history, args);
          this.pageView();
        };

        window.addEventListener('popstate', () => {
          this.pageView();
        });
      }
    }

    this.log('SDK initialized', { anonymousId: this.data.anonymousId });
  }

  track(eventName: string, properties?: Record<string, unknown>): void {
    const event = this.buildEvent(eventName, properties);
    this.enqueue(event);
    this.log('Event tracked', { eventName, properties });
  }

  pageView(properties?: Record<string, unknown>): void {
    this.track('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      ...properties,
    });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.data.userId = userId;
    this.saveData();

    this.track('identify', {
      user_id: userId,
      ...traits,
    });

    this.log('User identified', { userId });
  }

  consent(categories: ConsentCategories): void {
    this.data.consent = categories;
    this.saveData();

    // Send consent update to server
    this.sendConsent(categories);

    this.log('Consent updated', { categories });
  }

  reset(): void {
    this.data = {
      anonymousId: generateUUID(),
      sessionId: generateUUID(),
      sessionStart: Date.now(),
      consent: ['necessary'],
    };
    this.saveData();
    this.log('User reset');
  }

  getAnonymousId(): string {
    return this.data.anonymousId;
  }

  getUserId(): string | undefined {
    return this.data.userId;
  }

  getSessionId(): string {
    return this.data.sessionId;
  }

  private buildEvent(eventName: string, properties?: Record<string, unknown>): TrackEvent {
    const event: TrackEvent = {
      event_id: generateUUID(),
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      anonymous_id: this.data.anonymousId,
      session_id: this.data.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      consent_categories: this.data.consent,
    };

    // Add user_id if identified
    if (this.data.userId) {
      event.user_id = this.data.userId;
    }

    // Add UTM params
    if (this.data.utmParams) {
      Object.assign(event, this.data.utmParams);
    }

    // Add custom properties
    if (properties) {
      // Extract known fields
      if (properties.order_id) event.order_id = String(properties.order_id);
      if (properties.value !== undefined) event.value = Number(properties.value);
      if (properties.currency) event.currency = String(properties.currency);

      // Add remaining as payload
      const { order_id, value, currency, ...rest } = properties;
      if (Object.keys(rest).length > 0) {
        event.payload = rest;
      }
    }

    // Add fbp/fbc cookies for Meta
    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');
    if (fbp || fbc) {
      event.payload = {
        ...event.payload,
        fbp,
        fbc,
      };
    }

    return event;
  }

  private enqueue(event: TrackEvent): void {
    this.queue.push(event);

    // Flush after short delay (batch events)
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 100);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await this.send(events);
    } catch (error) {
      // Re-queue failed events
      this.queue.unshift(...events);
      this.log('Failed to send events, re-queued', { error });
    }
  }

  private async send(events: TrackEvent[]): Promise<void> {
    const body = JSON.stringify({ events });
    const timestamp = Date.now().toString();
    const signature = await computeHMAC(`${timestamp}.${body}`, this.config.apiSecret);

    const response = await fetch(`${this.config.ingestUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'x-signature': signature,
        'x-timestamp': timestamp,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    this.log('Events sent', { accepted: result.accepted, rejected: result.rejected });
  }

  private async sendConsent(categories: ConsentCategories): Promise<void> {
    const body = JSON.stringify({
      anonymous_id: this.data.anonymousId,
      categories,
      source: 'sdk',
    });
    const timestamp = Date.now().toString();
    const signature = await computeHMAC(`${timestamp}.${body}`, this.config.apiSecret);

    try {
      await fetch(`${this.config.ingestUrl}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'x-signature': signature,
          'x-timestamp': timestamp,
        },
        body,
      });
    } catch (error) {
      this.log('Failed to send consent', { error });
    }
  }

  private loadData(): StorageData {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // localStorage not available
    }

    // Default data
    return {
      anonymousId: generateUUID(),
      sessionId: generateUUID(),
      sessionStart: Date.now(),
      consent: ['necessary'],
    };
  }

  private saveData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch {
      // localStorage not available
    }
  }

  private checkSession(): void {
    const timeout = this.config.sessionTimeout * 60 * 1000;
    const now = Date.now();

    if (now - this.data.sessionStart > timeout) {
      // Session expired, create new session
      this.data.sessionId = generateUUID();
      this.data.sessionStart = now;
      this.saveData();
      this.log('Session expired, new session created');
    } else {
      // Update session start
      this.data.sessionStart = now;
      this.saveData();
    }
  }

  private captureUTMParams(): void {
    if (typeof window === 'undefined') return;

    const utmParams = getUTMParams(window.location.search);
    if (Object.keys(utmParams).length > 0) {
      this.data.utmParams = utmParams;
      this.saveData();
      this.log('UTM params captured', utmParams);
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[TrackPro] ${message}`, data || '');
    }
  }
}
