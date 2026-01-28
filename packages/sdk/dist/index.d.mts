type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';
type ConsentCategories = ConsentCategory[];
interface TrackEvent {
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

interface TrackProConfig {
    apiKey: string;
    apiSecret: string;
    ingestUrl?: string;
    autoPageView?: boolean;
    autoUTM?: boolean;
    sessionTimeout?: number;
    debug?: boolean;
}
interface TrackProInstance {
    track: (eventName: string, properties?: Record<string, unknown>) => void;
    pageView: (properties?: Record<string, unknown>) => void;
    identify: (userId: string, traits?: Record<string, unknown>) => void;
    consent: (categories: ConsentCategories) => void;
    reset: () => void;
    getAnonymousId: () => string;
    getUserId: () => string | undefined;
    getSessionId: () => string;
}

interface ConsentBannerConfig {
    position?: 'bottom' | 'top' | 'center';
    theme?: 'light' | 'dark' | 'auto';
    privacyPolicyUrl?: string;
    cookiePolicyUrl?: string;
    companyName?: string;
    language?: 'pt-BR' | 'en';
    categories?: {
        analytics?: {
            enabled: boolean;
            description?: string;
        };
        marketing?: {
            enabled: boolean;
            description?: string;
        };
        preferences?: {
            enabled: boolean;
            description?: string;
        };
    };
    onAccept?: (categories: ConsentCategories) => void;
    onReject?: () => void;
}
declare class ConsentBanner {
    private config;
    private container;
    private t;
    constructor(config: ConsentBannerConfig);
    show(): void;
    hide(): void;
    hasConsent(): boolean;
    getConsent(): ConsentCategories | null;
    private render;
    private getHTML;
    private applyStyles;
    private attachEventListeners;
    private saveConsent;
    private getCookie;
}
declare function createConsentBanner(config: ConsentBannerConfig): ConsentBanner;

/**
 * Initialize TrackPro SDK
 */
declare function init(config: TrackProConfig): TrackProInstance;
/**
 * Track a custom event
 */
declare function track(eventName: string, properties?: Record<string, unknown>): void;
/**
 * Track page view
 */
declare function pageView(properties?: Record<string, unknown>): void;
/**
 * Identify a user
 */
declare function identify(userId: string, traits?: Record<string, unknown>): void;
/**
 * Update consent preferences
 */
declare function consent(categories: ConsentCategories): void;
/**
 * Reset user identity
 */
declare function reset(): void;
/**
 * Get the SDK instance
 */
declare function getInstance(): TrackProInstance | null;
/**
 * Show consent banner
 */
declare function showConsentBanner(config: ConsentBannerConfig): ConsentBanner;

declare const _default: {
    init: typeof init;
    track: typeof track;
    pageView: typeof pageView;
    identify: typeof identify;
    consent: typeof consent;
    reset: typeof reset;
    getInstance: typeof getInstance;
    showConsentBanner: typeof showConsentBanner;
    createConsentBanner: typeof createConsentBanner;
};

export { ConsentBanner, type ConsentBannerConfig, type ConsentCategories, type TrackEvent, type TrackProConfig, type TrackProInstance, consent, createConsentBanner, _default as default, getInstance, identify, init, pageView, reset, showConsentBanner, track };
