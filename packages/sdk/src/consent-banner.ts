import type { ConsentCategories, ConsentCategory } from './types';

export interface ConsentBannerConfig {
  position?: 'bottom' | 'top' | 'center';
  theme?: 'light' | 'dark' | 'auto';
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  companyName?: string;
  language?: 'pt-BR' | 'en';
  categories?: {
    analytics?: { enabled: boolean; description?: string };
    marketing?: { enabled: boolean; description?: string };
    preferences?: { enabled: boolean; description?: string };
  };
  onAccept?: (categories: ConsentCategories) => void;
  onReject?: () => void;
}

interface Translations {
  title: string;
  description: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  save: string;
  necessary: string;
  necessaryDesc: string;
  analytics: string;
  analyticsDesc: string;
  marketing: string;
  marketingDesc: string;
  preferences: string;
  preferencesDesc: string;
  privacyPolicy: string;
  cookiePolicy: string;
}

const translations: Record<'pt-BR' | 'en', Translations> = {
  'pt-BR': {
    title: 'Utilizamos cookies',
    description:
      'Usamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa política de privacidade.',
    acceptAll: 'Aceitar todos',
    rejectAll: 'Recusar',
    customize: 'Personalizar',
    save: 'Salvar preferências',
    necessary: 'Necessários',
    necessaryDesc: 'Cookies essenciais para o funcionamento do site.',
    analytics: 'Análise',
    analyticsDesc: 'Cookies que nos ajudam a entender como você usa o site.',
    marketing: 'Marketing',
    marketingDesc: 'Cookies usados para exibir anúncios relevantes.',
    preferences: 'Preferências',
    preferencesDesc: 'Cookies que lembram suas preferências e configurações.',
    privacyPolicy: 'Política de Privacidade',
    cookiePolicy: 'Política de Cookies',
  },
  en: {
    title: 'We use cookies',
    description:
      'We use cookies to improve your experience on our website. By continuing to browse, you agree to our privacy policy.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject',
    customize: 'Customize',
    save: 'Save preferences',
    necessary: 'Necessary',
    necessaryDesc: 'Essential cookies for the website to function.',
    analytics: 'Analytics',
    analyticsDesc: 'Cookies that help us understand how you use the site.',
    marketing: 'Marketing',
    marketingDesc: 'Cookies used to display relevant advertisements.',
    preferences: 'Preferences',
    preferencesDesc: 'Cookies that remember your preferences and settings.',
    privacyPolicy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
  },
};

const CONSENT_COOKIE = 'trackpro_consent';

export class ConsentBanner {
  private config: Required<ConsentBannerConfig>;
  private container: HTMLElement | null = null;
  private selectedCategories: Set<ConsentCategory> = new Set(['necessary']);
  private t: Translations;

  constructor(config: ConsentBannerConfig) {
    this.config = {
      position: config.position || 'bottom',
      theme: config.theme || 'auto',
      privacyPolicyUrl: config.privacyPolicyUrl || '',
      cookiePolicyUrl: config.cookiePolicyUrl || '',
      companyName: config.companyName || '',
      language: config.language || 'pt-BR',
      categories: {
        analytics: { enabled: true, ...config.categories?.analytics },
        marketing: { enabled: true, ...config.categories?.marketing },
        preferences: { enabled: true, ...config.categories?.preferences },
      },
      onAccept: config.onAccept || (() => {}),
      onReject: config.onReject || (() => {}),
    };

    this.t = translations[this.config.language];
  }

  show(): void {
    // Check if consent already given
    if (this.hasConsent()) {
      return;
    }

    this.render();
  }

  hide(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  hasConsent(): boolean {
    return !!this.getCookie(CONSENT_COOKIE);
  }

  getConsent(): ConsentCategories | null {
    const cookie = this.getCookie(CONSENT_COOKIE);
    if (!cookie) return null;

    try {
      return JSON.parse(cookie) as ConsentCategories;
    } catch {
      return null;
    }
  }

  private render(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'trackpro-consent-banner';
    this.container.innerHTML = this.getHTML();

    // Apply styles
    this.applyStyles();

    // Add to DOM
    document.body.appendChild(this.container);

    // Add event listeners
    this.attachEventListeners();
  }

  private getHTML(): string {
    const t = this.t;
    const { categories, privacyPolicyUrl, cookiePolicyUrl } = this.config;

    return `
      <div class="tp-consent-overlay">
        <div class="tp-consent-modal">
          <div class="tp-consent-main">
            <h2 class="tp-consent-title">${t.title}</h2>
            <p class="tp-consent-description">${t.description}</p>

            <div class="tp-consent-links">
              ${privacyPolicyUrl ? `<a href="${privacyPolicyUrl}" target="_blank" rel="noopener">${t.privacyPolicy}</a>` : ''}
              ${cookiePolicyUrl ? `<a href="${cookiePolicyUrl}" target="_blank" rel="noopener">${t.cookiePolicy}</a>` : ''}
            </div>

            <div class="tp-consent-buttons">
              <button class="tp-btn tp-btn-secondary" data-action="customize">${t.customize}</button>
              <button class="tp-btn tp-btn-secondary" data-action="reject">${t.rejectAll}</button>
              <button class="tp-btn tp-btn-primary" data-action="accept-all">${t.acceptAll}</button>
            </div>
          </div>

          <div class="tp-consent-customize" style="display: none;">
            <h2 class="tp-consent-title">${t.customize}</h2>

            <div class="tp-consent-categories">
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" checked disabled />
                    <span>${t.necessary}</span>
                  </label>
                  <span class="tp-category-required">Sempre ativo</span>
                </div>
                <p class="tp-category-desc">${t.necessaryDesc}</p>
              </div>

              ${
                categories.analytics?.enabled
                  ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="analytics" />
                    <span>${t.analytics}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.analytics.description || t.analyticsDesc}</p>
              </div>
              `
                  : ''
              }

              ${
                categories.marketing?.enabled
                  ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="marketing" />
                    <span>${t.marketing}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.marketing.description || t.marketingDesc}</p>
              </div>
              `
                  : ''
              }

              ${
                categories.preferences?.enabled
                  ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="preferences" />
                    <span>${t.preferences}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.preferences.description || t.preferencesDesc}</p>
              </div>
              `
                  : ''
              }
            </div>

            <div class="tp-consent-buttons">
              <button class="tp-btn tp-btn-secondary" data-action="back">Voltar</button>
              <button class="tp-btn tp-btn-primary" data-action="save">${t.save}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private applyStyles(): void {
    const isDark =
      this.config.theme === 'dark' ||
      (this.config.theme === 'auto' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const colors = isDark
      ? {
          bg: '#1f2937',
          text: '#f9fafb',
          textMuted: '#9ca3af',
          border: '#374151',
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          secondary: '#374151',
          secondaryHover: '#4b5563',
        }
      : {
          bg: '#ffffff',
          text: '#111827',
          textMuted: '#6b7280',
          border: '#e5e7eb',
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          secondary: '#f3f4f6',
          secondaryHover: '#e5e7eb',
        };

    const positionStyles: Record<string, string> = {
      bottom: 'bottom: 0; left: 0; right: 0;',
      top: 'top: 0; left: 0; right: 0;',
      center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
    };

    const style = document.createElement('style');
    style.textContent = `
      #trackpro-consent-banner {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tp-consent-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: ${this.config.position === 'center' ? 'center' : this.config.position === 'top' ? 'flex-start' : 'flex-end'};
        justify-content: center;
        padding: ${this.config.position === 'center' ? '16px' : '0'};
      }

      .tp-consent-modal {
        background: ${colors.bg};
        color: ${colors.text};
        border-radius: ${this.config.position === 'center' ? '12px' : '0'};
        max-width: 600px;
        width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ${this.config.position !== 'center' ? 'border-top: 1px solid ' + colors.border + ';' : ''}
      }

      .tp-consent-main,
      .tp-consent-customize {
        padding: 24px;
      }

      .tp-consent-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }

      .tp-consent-description {
        font-size: 14px;
        color: ${colors.textMuted};
        margin: 0 0 16px 0;
        line-height: 1.5;
      }

      .tp-consent-links {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }

      .tp-consent-links a {
        font-size: 13px;
        color: ${colors.primary};
        text-decoration: none;
      }

      .tp-consent-links a:hover {
        text-decoration: underline;
      }

      .tp-consent-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .tp-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: background 0.2s;
      }

      .tp-btn-primary {
        background: ${colors.primary};
        color: white;
      }

      .tp-btn-primary:hover {
        background: ${colors.primaryHover};
      }

      .tp-btn-secondary {
        background: ${colors.secondary};
        color: ${colors.text};
      }

      .tp-btn-secondary:hover {
        background: ${colors.secondaryHover};
      }

      .tp-consent-categories {
        margin: 20px 0;
      }

      .tp-category {
        padding: 16px;
        border: 1px solid ${colors.border};
        border-radius: 8px;
        margin-bottom: 12px;
      }

      .tp-category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tp-category-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        cursor: pointer;
      }

      .tp-category-label input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .tp-category-required {
        font-size: 12px;
        color: ${colors.textMuted};
      }

      .tp-category-desc {
        font-size: 13px;
        color: ${colors.textMuted};
        margin: 8px 0 0 28px;
        line-height: 1.4;
      }

      @media (max-width: 480px) {
        .tp-consent-modal {
          max-width: 100%;
        }

        .tp-consent-buttons {
          flex-direction: column;
        }

        .tp-btn {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Accept all
    this.container
      .querySelector('[data-action="accept-all"]')
      ?.addEventListener('click', () => {
        const allCategories: ConsentCategories = ['necessary', 'analytics', 'marketing', 'preferences'];
        this.saveConsent(allCategories);
        this.config.onAccept(allCategories);
        this.hide();
      });

    // Reject all
    this.container
      .querySelector('[data-action="reject"]')
      ?.addEventListener('click', () => {
        const onlyNecessary: ConsentCategories = ['necessary'];
        this.saveConsent(onlyNecessary);
        this.config.onReject();
        this.hide();
      });

    // Show customize
    this.container
      .querySelector('[data-action="customize"]')
      ?.addEventListener('click', () => {
        const main = this.container?.querySelector('.tp-consent-main') as HTMLElement;
        const customize = this.container?.querySelector('.tp-consent-customize') as HTMLElement;
        if (main) main.style.display = 'none';
        if (customize) customize.style.display = 'block';
      });

    // Back to main
    this.container
      .querySelector('[data-action="back"]')
      ?.addEventListener('click', () => {
        const main = this.container?.querySelector('.tp-consent-main') as HTMLElement;
        const customize = this.container?.querySelector('.tp-consent-customize') as HTMLElement;
        if (main) main.style.display = 'block';
        if (customize) customize.style.display = 'none';
      });

    // Save preferences
    this.container
      .querySelector('[data-action="save"]')
      ?.addEventListener('click', () => {
        const categories: ConsentCategories = ['necessary'];

        // Check each category checkbox
        this.container
          ?.querySelectorAll('input[data-category]:checked')
          .forEach((checkbox) => {
            const category = (checkbox as HTMLInputElement).dataset
              .category as ConsentCategory;
            if (category) {
              categories.push(category);
            }
          });

        this.saveConsent(categories);
        this.config.onAccept(categories);
        this.hide();
      });
  }

  private saveConsent(categories: ConsentCategories): void {
    const value = JSON.stringify(categories);
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1); // 1 year

    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      return decodeURIComponent(match[2]);
    }
    return null;
  }
}

// Factory function
export function createConsentBanner(config: ConsentBannerConfig): ConsentBanner {
  return new ConsentBanner(config);
}
