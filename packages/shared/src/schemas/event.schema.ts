import { z } from 'zod';

import { EVENT_NAMES, CURRENCIES, CONSENT_CATEGORIES } from '../constants';

export const eventNameSchema = z.enum([
  EVENT_NAMES.PAGE_VIEW,
  EVENT_NAMES.VIEW_CONTENT,
  EVENT_NAMES.LEAD,
  EVENT_NAMES.INITIATE_CHECKOUT,
  EVENT_NAMES.ADD_TO_CART,
  EVENT_NAMES.PURCHASE,
  EVENT_NAMES.SEARCH,
  EVENT_NAMES.ADD_PAYMENT_INFO,
  EVENT_NAMES.COMPLETE_REGISTRATION,
]);

export const currencySchema = z.enum(CURRENCIES);

export const consentCategorySchema = z.enum([
  CONSENT_CATEGORIES.NECESSARY,
  CONSENT_CATEGORIES.ANALYTICS,
  CONSENT_CATEGORIES.MARKETING,
  CONSENT_CATEGORIES.PREFERENCES,
]);

export const baseEventSchema = z.object({
  event_id: z.string().uuid(),
  event_name: z.string().min(1).max(100),
  event_time: z.number().int().positive(),
  anonymous_id: z.string().max(100).optional(),
  user_id: z.string().max(100).optional(),
  session_id: z.string().min(1).max(100),
  url: z.string().url().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  user_agent: z.string().max(1000).optional(),
  consent_categories: z.array(consentCategorySchema).optional(),
  payload: z.record(z.unknown()).optional(),
});

export const purchaseEventSchema = baseEventSchema.extend({
  event_name: z.literal('purchase'),
  order_id: z.string().min(1).max(100),
  value: z.number().nonnegative(),
  currency: currencySchema,
});

export const ecommerceEventSchema = baseEventSchema.extend({
  order_id: z.string().max(100).optional(),
  value: z.number().nonnegative().optional(),
  currency: currencySchema.optional(),
});

export const ingestEventSchema = z.union([
  purchaseEventSchema,
  ecommerceEventSchema,
]).refine(
  (data) => data.anonymous_id || data.user_id,
  { message: 'Either anonymous_id or user_id must be provided' },
);

export const batchEventsSchema = z.object({
  events: z.array(ingestEventSchema).min(1).max(100),
});

export type EventName = z.infer<typeof eventNameSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type ConsentCategory = z.infer<typeof consentCategorySchema>;
export type BaseEvent = z.infer<typeof baseEventSchema>;
export type PurchaseEvent = z.infer<typeof purchaseEventSchema>;
export type EcommerceEvent = z.infer<typeof ecommerceEventSchema>;
export type IngestEvent = z.infer<typeof ingestEventSchema>;
export type BatchEvents = z.infer<typeof batchEventsSchema>;
