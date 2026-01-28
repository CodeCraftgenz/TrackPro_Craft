import { TrackPro, type TrackProConfig, type TrackProInstance } from './trackpro';
import { ConsentBanner, createConsentBanner, type ConsentBannerConfig } from './consent-banner';
import type { TrackEvent, ConsentCategories } from './types';

// Global instance
let instance: TrackProInstance | null = null;

/**
 * Initialize TrackPro SDK
 */
export function init(config: TrackProConfig): TrackProInstance {
  if (instance) {
    console.warn('[TrackPro] SDK already initialized');
    return instance;
  }

  instance = new TrackPro(config);
  return instance;
}

/**
 * Track a custom event
 */
export function track(eventName: string, properties?: Record<string, unknown>): void {
  if (!instance) {
    console.error('[TrackPro] SDK not initialized. Call init() first.');
    return;
  }
  instance.track(eventName, properties);
}

/**
 * Track page view
 */
export function pageView(properties?: Record<string, unknown>): void {
  if (!instance) {
    console.error('[TrackPro] SDK not initialized. Call init() first.');
    return;
  }
  instance.pageView(properties);
}

/**
 * Identify a user
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!instance) {
    console.error('[TrackPro] SDK not initialized. Call init() first.');
    return;
  }
  instance.identify(userId, traits);
}

/**
 * Update consent preferences
 */
export function consent(categories: ConsentCategories): void {
  if (!instance) {
    console.error('[TrackPro] SDK not initialized. Call init() first.');
    return;
  }
  instance.consent(categories);
}

/**
 * Reset user identity
 */
export function reset(): void {
  if (!instance) {
    console.error('[TrackPro] SDK not initialized. Call init() first.');
    return;
  }
  instance.reset();
}

/**
 * Get the SDK instance
 */
export function getInstance(): TrackProInstance | null {
  return instance;
}

/**
 * Show consent banner
 */
export function showConsentBanner(config: ConsentBannerConfig): ConsentBanner {
  const banner = createConsentBanner({
    ...config,
    onAccept: (categories) => {
      // Auto-update SDK consent when banner is accepted
      if (instance) {
        instance.consent(categories);
      }
      config.onAccept?.(categories);
    },
  });
  banner.show();
  return banner;
}

// Export types
export type { TrackProConfig, TrackProInstance, TrackEvent, ConsentCategories, ConsentBannerConfig };
export { ConsentBanner, createConsentBanner };

// Default export for UMD builds
export default {
  init,
  track,
  pageView,
  identify,
  consent,
  reset,
  getInstance,
  showConsentBanner,
  createConsentBanner,
};
