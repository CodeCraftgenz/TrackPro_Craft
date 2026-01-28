import type { UTMParams } from './types';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Compute HMAC-SHA256 signature
 */
export async function computeHMAC(message: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback: return empty (server will reject - better than exposing secret)
  console.warn('[TrackPro] crypto.subtle not available, signature will be invalid');
  return '';
}

/**
 * Extract UTM parameters from URL
 */
export function getUTMParams(search: string): UTMParams {
  const params = new URLSearchParams(search);
  const utmParams: UTMParams = {};

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  }

  return utmParams;
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }

  return undefined;
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Parse referrer to extract source
 */
export function parseReferrer(referrer: string): { source: string; medium: string } | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Search engines
    const searchEngines: Record<string, string> = {
      'google.com': 'google',
      'google.com.br': 'google',
      'bing.com': 'bing',
      'yahoo.com': 'yahoo',
      'duckduckgo.com': 'duckduckgo',
      'baidu.com': 'baidu',
    };

    // Social networks
    const socialNetworks: Record<string, string> = {
      'facebook.com': 'facebook',
      'instagram.com': 'instagram',
      'twitter.com': 'twitter',
      'x.com': 'twitter',
      'linkedin.com': 'linkedin',
      'youtube.com': 'youtube',
      'tiktok.com': 'tiktok',
      'pinterest.com': 'pinterest',
    };

    for (const [domain, source] of Object.entries(searchEngines)) {
      if (hostname.includes(domain)) {
        return { source, medium: 'organic' };
      }
    }

    for (const [domain, source] of Object.entries(socialNetworks)) {
      if (hostname.includes(domain)) {
        return { source, medium: 'social' };
      }
    }

    return { source: hostname, medium: 'referral' };
  } catch {
    return null;
  }
}
