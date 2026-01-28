"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ConsentBanner: () => ConsentBanner,
  consent: () => consent,
  createConsentBanner: () => createConsentBanner,
  default: () => index_default,
  getInstance: () => getInstance,
  identify: () => identify,
  init: () => init,
  pageView: () => pageView,
  reset: () => reset,
  showConsentBanner: () => showConsentBanner,
  track: () => track
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
async function computeHMAC(message, secret) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  console.warn("[TrackPro] crypto.subtle not available, signature will be invalid");
  return "";
}
function getUTMParams(search) {
  const params = new URLSearchParams(search);
  const utmParams = {};
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  }
  return utmParams;
}
function getCookie(name) {
  if (typeof document === "undefined") return void 0;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return void 0;
}

// src/trackpro.ts
var STORAGE_KEY = "trackpro_data";
var TrackPro = class {
  constructor(config) {
    this.queue = [];
    this.flushTimeout = null;
    this.config = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      ingestUrl: config.ingestUrl || "https://ingest.trackpro.io/v1",
      autoPageView: config.autoPageView ?? true,
      autoUTM: config.autoUTM ?? true,
      sessionTimeout: config.sessionTimeout ?? 30,
      debug: config.debug ?? false
    };
    this.data = this.loadData();
    this.checkSession();
    if (this.config.autoUTM) {
      this.captureUTMParams();
    }
    if (this.config.autoPageView && typeof window !== "undefined") {
      this.pageView();
      if (typeof window.history !== "undefined") {
        const originalPushState = window.history.pushState;
        window.history.pushState = (...args) => {
          originalPushState.apply(window.history, args);
          this.pageView();
        };
        window.addEventListener("popstate", () => {
          this.pageView();
        });
      }
    }
    this.log("SDK initialized", { anonymousId: this.data.anonymousId });
  }
  track(eventName, properties) {
    const event = this.buildEvent(eventName, properties);
    this.enqueue(event);
    this.log("Event tracked", { eventName, properties });
  }
  pageView(properties) {
    this.track("page_view", {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      ...properties
    });
  }
  identify(userId, traits) {
    this.data.userId = userId;
    this.saveData();
    this.track("identify", {
      user_id: userId,
      ...traits
    });
    this.log("User identified", { userId });
  }
  consent(categories) {
    this.data.consent = categories;
    this.saveData();
    this.sendConsent(categories);
    this.log("Consent updated", { categories });
  }
  reset() {
    this.data = {
      anonymousId: generateUUID(),
      sessionId: generateUUID(),
      sessionStart: Date.now(),
      consent: ["necessary"]
    };
    this.saveData();
    this.log("User reset");
  }
  getAnonymousId() {
    return this.data.anonymousId;
  }
  getUserId() {
    return this.data.userId;
  }
  getSessionId() {
    return this.data.sessionId;
  }
  buildEvent(eventName, properties) {
    const event = {
      event_id: generateUUID(),
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1e3),
      anonymous_id: this.data.anonymousId,
      session_id: this.data.sessionId,
      url: typeof window !== "undefined" ? window.location.href : void 0,
      referrer: typeof document !== "undefined" ? document.referrer : void 0,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : void 0,
      consent_categories: this.data.consent
    };
    if (this.data.userId) {
      event.user_id = this.data.userId;
    }
    if (this.data.utmParams) {
      Object.assign(event, this.data.utmParams);
    }
    if (properties) {
      if (properties.order_id) event.order_id = String(properties.order_id);
      if (properties.value !== void 0) event.value = Number(properties.value);
      if (properties.currency) event.currency = String(properties.currency);
      const { order_id, value, currency, ...rest } = properties;
      if (Object.keys(rest).length > 0) {
        event.payload = rest;
      }
    }
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");
    if (fbp || fbc) {
      event.payload = {
        ...event.payload,
        fbp,
        fbc
      };
    }
    return event;
  }
  enqueue(event) {
    this.queue.push(event);
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 100);
  }
  async flush() {
    if (this.queue.length === 0) return;
    const events = [...this.queue];
    this.queue = [];
    try {
      await this.send(events);
    } catch (error) {
      this.queue.unshift(...events);
      this.log("Failed to send events, re-queued", { error });
    }
  }
  async send(events) {
    const body = JSON.stringify({ events });
    const timestamp = Date.now().toString();
    const signature = await computeHMAC(`${timestamp}.${body}`, this.config.apiSecret);
    const response = await fetch(`${this.config.ingestUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "x-signature": signature,
        "x-timestamp": timestamp
      },
      body
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    this.log("Events sent", { accepted: result.accepted, rejected: result.rejected });
  }
  async sendConsent(categories) {
    const body = JSON.stringify({
      anonymous_id: this.data.anonymousId,
      categories,
      source: "sdk"
    });
    const timestamp = Date.now().toString();
    const signature = await computeHMAC(`${timestamp}.${body}`, this.config.apiSecret);
    try {
      await fetch(`${this.config.ingestUrl}/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "x-signature": signature,
          "x-timestamp": timestamp
        },
        body
      });
    } catch (error) {
      this.log("Failed to send consent", { error });
    }
  }
  loadData() {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
    }
    return {
      anonymousId: generateUUID(),
      sessionId: generateUUID(),
      sessionStart: Date.now(),
      consent: ["necessary"]
    };
  }
  saveData() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch {
    }
  }
  checkSession() {
    const timeout = this.config.sessionTimeout * 60 * 1e3;
    const now = Date.now();
    if (now - this.data.sessionStart > timeout) {
      this.data.sessionId = generateUUID();
      this.data.sessionStart = now;
      this.saveData();
      this.log("Session expired, new session created");
    } else {
      this.data.sessionStart = now;
      this.saveData();
    }
  }
  captureUTMParams() {
    if (typeof window === "undefined") return;
    const utmParams = getUTMParams(window.location.search);
    if (Object.keys(utmParams).length > 0) {
      this.data.utmParams = utmParams;
      this.saveData();
      this.log("UTM params captured", utmParams);
    }
  }
  log(message, data) {
    if (this.config.debug) {
      console.log(`[TrackPro] ${message}`, data || "");
    }
  }
};

// src/consent-banner.ts
var translations = {
  "pt-BR": {
    title: "Utilizamos cookies",
    description: "Usamos cookies para melhorar sua experi\xEAncia em nosso site. Ao continuar navegando, voc\xEA concorda com nossa pol\xEDtica de privacidade.",
    acceptAll: "Aceitar todos",
    rejectAll: "Recusar",
    customize: "Personalizar",
    save: "Salvar prefer\xEAncias",
    necessary: "Necess\xE1rios",
    necessaryDesc: "Cookies essenciais para o funcionamento do site.",
    analytics: "An\xE1lise",
    analyticsDesc: "Cookies que nos ajudam a entender como voc\xEA usa o site.",
    marketing: "Marketing",
    marketingDesc: "Cookies usados para exibir an\xFAncios relevantes.",
    preferences: "Prefer\xEAncias",
    preferencesDesc: "Cookies que lembram suas prefer\xEAncias e configura\xE7\xF5es.",
    privacyPolicy: "Pol\xEDtica de Privacidade",
    cookiePolicy: "Pol\xEDtica de Cookies"
  },
  en: {
    title: "We use cookies",
    description: "We use cookies to improve your experience on our website. By continuing to browse, you agree to our privacy policy.",
    acceptAll: "Accept all",
    rejectAll: "Reject",
    customize: "Customize",
    save: "Save preferences",
    necessary: "Necessary",
    necessaryDesc: "Essential cookies for the website to function.",
    analytics: "Analytics",
    analyticsDesc: "Cookies that help us understand how you use the site.",
    marketing: "Marketing",
    marketingDesc: "Cookies used to display relevant advertisements.",
    preferences: "Preferences",
    preferencesDesc: "Cookies that remember your preferences and settings.",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy"
  }
};
var CONSENT_COOKIE = "trackpro_consent";
var ConsentBanner = class {
  constructor(config) {
    this.container = null;
    this.config = {
      position: config.position || "bottom",
      theme: config.theme || "auto",
      privacyPolicyUrl: config.privacyPolicyUrl || "",
      cookiePolicyUrl: config.cookiePolicyUrl || "",
      companyName: config.companyName || "",
      language: config.language || "pt-BR",
      categories: {
        analytics: { enabled: true, ...config.categories?.analytics },
        marketing: { enabled: true, ...config.categories?.marketing },
        preferences: { enabled: true, ...config.categories?.preferences }
      },
      onAccept: config.onAccept || (() => {
      }),
      onReject: config.onReject || (() => {
      })
    };
    this.t = translations[this.config.language];
  }
  show() {
    if (this.hasConsent()) {
      return;
    }
    this.render();
  }
  hide() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
  hasConsent() {
    return !!this.getCookie(CONSENT_COOKIE);
  }
  getConsent() {
    const cookie = this.getCookie(CONSENT_COOKIE);
    if (!cookie) return null;
    try {
      return JSON.parse(cookie);
    } catch {
      return null;
    }
  }
  render() {
    this.container = document.createElement("div");
    this.container.id = "trackpro-consent-banner";
    this.container.innerHTML = this.getHTML();
    this.applyStyles();
    document.body.appendChild(this.container);
    this.attachEventListeners();
  }
  getHTML() {
    const t = this.t;
    const { categories, privacyPolicyUrl, cookiePolicyUrl } = this.config;
    return `
      <div class="tp-consent-overlay">
        <div class="tp-consent-modal">
          <div class="tp-consent-main">
            <h2 class="tp-consent-title">${t.title}</h2>
            <p class="tp-consent-description">${t.description}</p>

            <div class="tp-consent-links">
              ${privacyPolicyUrl ? `<a href="${privacyPolicyUrl}" target="_blank" rel="noopener">${t.privacyPolicy}</a>` : ""}
              ${cookiePolicyUrl ? `<a href="${cookiePolicyUrl}" target="_blank" rel="noopener">${t.cookiePolicy}</a>` : ""}
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

              ${categories.analytics?.enabled ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="analytics" />
                    <span>${t.analytics}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.analytics.description || t.analyticsDesc}</p>
              </div>
              ` : ""}

              ${categories.marketing?.enabled ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="marketing" />
                    <span>${t.marketing}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.marketing.description || t.marketingDesc}</p>
              </div>
              ` : ""}

              ${categories.preferences?.enabled ? `
              <div class="tp-category">
                <div class="tp-category-header">
                  <label class="tp-category-label">
                    <input type="checkbox" data-category="preferences" />
                    <span>${t.preferences}</span>
                  </label>
                </div>
                <p class="tp-category-desc">${categories.preferences.description || t.preferencesDesc}</p>
              </div>
              ` : ""}
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
  applyStyles() {
    const isDark = this.config.theme === "dark" || this.config.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const colors = isDark ? {
      bg: "#1f2937",
      text: "#f9fafb",
      textMuted: "#9ca3af",
      border: "#374151",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      secondary: "#374151",
      secondaryHover: "#4b5563"
    } : {
      bg: "#ffffff",
      text: "#111827",
      textMuted: "#6b7280",
      border: "#e5e7eb",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      secondary: "#f3f4f6",
      secondaryHover: "#e5e7eb"
    };
    const style = document.createElement("style");
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
        align-items: ${this.config.position === "center" ? "center" : this.config.position === "top" ? "flex-start" : "flex-end"};
        justify-content: center;
        padding: ${this.config.position === "center" ? "16px" : "0"};
      }

      .tp-consent-modal {
        background: ${colors.bg};
        color: ${colors.text};
        border-radius: ${this.config.position === "center" ? "12px" : "0"};
        max-width: 600px;
        width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ${this.config.position !== "center" ? "border-top: 1px solid " + colors.border + ";" : ""}
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
  attachEventListeners() {
    if (!this.container) return;
    this.container.querySelector('[data-action="accept-all"]')?.addEventListener("click", () => {
      const allCategories = ["necessary", "analytics", "marketing", "preferences"];
      this.saveConsent(allCategories);
      this.config.onAccept(allCategories);
      this.hide();
    });
    this.container.querySelector('[data-action="reject"]')?.addEventListener("click", () => {
      const onlyNecessary = ["necessary"];
      this.saveConsent(onlyNecessary);
      this.config.onReject();
      this.hide();
    });
    this.container.querySelector('[data-action="customize"]')?.addEventListener("click", () => {
      const main = this.container?.querySelector(".tp-consent-main");
      const customize = this.container?.querySelector(".tp-consent-customize");
      if (main) main.style.display = "none";
      if (customize) customize.style.display = "block";
    });
    this.container.querySelector('[data-action="back"]')?.addEventListener("click", () => {
      const main = this.container?.querySelector(".tp-consent-main");
      const customize = this.container?.querySelector(".tp-consent-customize");
      if (main) main.style.display = "block";
      if (customize) customize.style.display = "none";
    });
    this.container.querySelector('[data-action="save"]')?.addEventListener("click", () => {
      const categories = ["necessary"];
      this.container?.querySelectorAll("input[data-category]:checked").forEach((checkbox) => {
        const category = checkbox.dataset.category;
        if (category) {
          categories.push(category);
        }
      });
      this.saveConsent(categories);
      this.config.onAccept(categories);
      this.hide();
    });
  }
  saveConsent(categories) {
    const value = JSON.stringify(categories);
    const expires = /* @__PURE__ */ new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
  getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    if (match) {
      return decodeURIComponent(match[2]);
    }
    return null;
  }
};
function createConsentBanner(config) {
  return new ConsentBanner(config);
}

// src/index.ts
var instance = null;
function init(config) {
  if (instance) {
    console.warn("[TrackPro] SDK already initialized");
    return instance;
  }
  instance = new TrackPro(config);
  return instance;
}
function track(eventName, properties) {
  if (!instance) {
    console.error("[TrackPro] SDK not initialized. Call init() first.");
    return;
  }
  instance.track(eventName, properties);
}
function pageView(properties) {
  if (!instance) {
    console.error("[TrackPro] SDK not initialized. Call init() first.");
    return;
  }
  instance.pageView(properties);
}
function identify(userId, traits) {
  if (!instance) {
    console.error("[TrackPro] SDK not initialized. Call init() first.");
    return;
  }
  instance.identify(userId, traits);
}
function consent(categories) {
  if (!instance) {
    console.error("[TrackPro] SDK not initialized. Call init() first.");
    return;
  }
  instance.consent(categories);
}
function reset() {
  if (!instance) {
    console.error("[TrackPro] SDK not initialized. Call init() first.");
    return;
  }
  instance.reset();
}
function getInstance() {
  return instance;
}
function showConsentBanner(config) {
  const banner = createConsentBanner({
    ...config,
    onAccept: (categories) => {
      if (instance) {
        instance.consent(categories);
      }
      config.onAccept?.(categories);
    }
  });
  banner.show();
  return banner;
}
var index_default = {
  init,
  track,
  pageView,
  identify,
  consent,
  reset,
  getInstance,
  showConsentBanner,
  createConsentBanner
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConsentBanner,
  consent,
  createConsentBanner,
  getInstance,
  identify,
  init,
  pageView,
  reset,
  showConsentBanner,
  track
});
