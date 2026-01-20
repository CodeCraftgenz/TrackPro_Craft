import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditAction, AuditResource } from '../audit/audit.service';
import {
  PlanTier,
  SubscriptionStatus,
  PaymentStatus,
} from '@prisma/client';

export interface CreateCheckoutSessionDto {
  tenantId: string;
  planTier: PlanTier;
  billingInterval: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerPortalSessionDto {
  tenantId: string;
  returnUrl: string;
}

export interface SubscriptionDetails {
  id: string;
  status: SubscriptionStatus;
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    price: number;
  };
  billingInterval: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export interface UsageSummary {
  eventsCount: number;
  eventsLimit: number;
  eventsPercentage: number;
  projectsCount: number;
  projectsLimit: number;
  teamMembersCount: number;
  teamMembersLimit: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null = null;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');

    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia',
        typescript: true,
      });
      this.logger.log('Stripe initialized');
    } else {
      this.logger.warn('Stripe not configured - billing features disabled');
    }
  }

  /**
   * Get or create Stripe customer for tenant
   */
  async getOrCreateStripeCustomer(tenantId: string): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Get tenant owner's email
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: { user: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const ownerEmail = tenant.memberships[0]?.user?.email || `tenant-${tenantId}@trackpro.app`;

    // Create Stripe customer
    const customer = await this.stripe.customers.create({
      email: ownerEmail,
      name: tenant.name,
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    });

    // Update subscription with Stripe customer ID
    if (subscription) {
      await this.prisma.subscription.update({
        where: { tenantId },
        data: { stripeCustomerId: customer.id },
      });
    }

    return customer.id;
  }

  /**
   * Create checkout session for new subscription or upgrade
   */
  async createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { tier: dto.planTier },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const priceId = dto.billingInterval === 'yearly'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException('Price not configured for this plan');
    }

    const customerId = await this.getOrCreateStripeCustomer(dto.tenantId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      subscription_data: {
        trial_period_days: dto.planTier !== PlanTier.FREE ? 14 : undefined,
        metadata: {
          tenantId: dto.tenantId,
          planId: plan.id,
          billingInterval: dto.billingInterval,
        },
      },
      metadata: {
        tenantId: dto.tenantId,
        planId: plan.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return { url: session.url! };
  }

  /**
   * Create customer portal session for managing subscription
   */
  async createCustomerPortalSession(dto: CreateCustomerPortalSessionDto): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId: dto.tenantId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: dto.returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Get subscription details for tenant
   */
  async getSubscription(tenantId: string): Promise<SubscriptionDetails | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    const price = subscription.billingInterval === 'yearly'
      ? subscription.plan.yearlyPrice
      : subscription.plan.monthlyPrice;

    return {
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        tier: subscription.plan.tier,
        price,
      },
      billingInterval: subscription.billingInterval,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
    };
  }

  /**
   * Get usage summary for tenant
   */
  async getUsageSummary(tenantId: string): Promise<UsageSummary> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      // Return free tier limits
      return {
        eventsCount: 0,
        eventsLimit: 10000,
        eventsPercentage: 0,
        projectsCount: 0,
        projectsLimit: 1,
        teamMembersCount: 1,
        teamMembersLimit: 1,
      };
    }

    // Get current period usage
    const now = new Date();
    const periodStart = subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);

    const [projectsCount, teamMembersCount, usageRecord] = await Promise.all([
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.membership.count({ where: { tenantId } }),
      this.prisma.usageRecord.findFirst({
        where: {
          subscriptionId: subscription.id,
          periodStart: { lte: now },
          periodEnd: { gte: now },
        },
      }),
    ]);

    const eventsCount = usageRecord?.eventsCount || 0;
    const eventsLimit = subscription.plan.maxEventsPerMonth;

    return {
      eventsCount,
      eventsLimit,
      eventsPercentage: Math.round((eventsCount / eventsLimit) * 100),
      projectsCount,
      projectsLimit: subscription.plan.maxProjects,
      teamMembersCount,
      teamMembersLimit: subscription.plan.maxTeamMembers,
    };
  }

  /**
   * Get invoices for tenant
   */
  async getInvoices(tenantId: string, limit = 10) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return [];
    }

    return this.prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(tenantId: string, userId: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: AuditAction.SETTINGS_CHANGED,
      resource: AuditResource.SETTINGS,
      resourceId: subscription.id,
      payload: { action: 'subscription_canceled' },
    });
  }

  /**
   * Resume canceled subscription
   */
  async resumeSubscription(tenantId: string, userId: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: AuditAction.SETTINGS_CHANGED,
      resource: AuditResource.SETTINGS,
      resourceId: subscription.id,
      payload: { action: 'subscription_resumed' },
    });
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Billing is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.debug(`Unhandled webhook event: ${event.type}`);
    }
  }

  /**
   * Handle checkout.session.completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;

    if (!tenantId || !planId) {
      this.logger.warn('Missing metadata in checkout session');
      return;
    }

    // Subscription will be created by the subscription.created webhook
    this.logger.log(`Checkout completed for tenant ${tenantId}`);
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const tenantId = stripeSubscription.metadata?.tenantId;
    const planId = stripeSubscription.metadata?.planId;
    const billingInterval = stripeSubscription.metadata?.billingInterval || 'monthly';

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    const status = this.mapStripeStatus(stripeSubscription.status);

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId: planId || (await this.getDefaultPlanId()),
        status,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        billingInterval,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    this.logger.log(`Subscription updated for tenant ${tenantId}: ${status}`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const tenantId = stripeSubscription.metadata?.tenantId;

    if (!tenantId) {
      return;
    }

    // Downgrade to free plan
    const freePlan = await this.prisma.plan.findUnique({
      where: { tier: PlanTier.FREE },
    });

    if (freePlan) {
      await this.prisma.subscription.update({
        where: { tenantId },
        data: {
          planId: freePlan.id,
          status: SubscriptionStatus.CANCELED,
          stripeSubscriptionId: null,
        },
      });
    }

    this.logger.log(`Subscription deleted for tenant ${tenantId}`);
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: PaymentStatus.SUCCEEDED,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        paidAt: new Date(),
      },
      update: {
        amountPaid: invoice.amount_paid,
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Invoice paid for subscription ${subscription.id}`);
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amountDue: invoice.amount_due,
        amountPaid: 0,
        currency: invoice.currency,
        status: PaymentStatus.FAILED,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
      },
      update: {
        status: PaymentStatus.FAILED,
      },
    });

    this.logger.warn(`Invoice payment failed for subscription ${subscription.id}`);
  }

  /**
   * Map Stripe subscription status to internal status
   */
  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
  }

  /**
   * Get default (free) plan ID
   */
  private async getDefaultPlanId(): Promise<string> {
    const freePlan = await this.prisma.plan.findUnique({
      where: { tier: PlanTier.FREE },
    });

    if (!freePlan) {
      throw new Error('Free plan not configured');
    }

    return freePlan.id;
  }

  /**
   * Increment event count for usage tracking
   */
  async incrementEventCount(tenantId: string, count = 1): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return;
    }

    const now = new Date();
    const periodStart = subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await this.prisma.usageRecord.upsert({
      where: {
        subscriptionId_periodStart: {
          subscriptionId: subscription.id,
          periodStart,
        },
      },
      create: {
        subscriptionId: subscription.id,
        periodStart,
        periodEnd,
        eventsCount: count,
      },
      update: {
        eventsCount: { increment: count },
      },
    });
  }

  /**
   * Check if tenant can perform action based on plan limits
   */
  async checkPlanLimit(
    tenantId: string,
    limitType: 'projects' | 'events' | 'team_members',
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      // Free tier defaults
      const limits = { projects: 1, events: 10000, team_members: 1 };
      const current = await this.getCurrentCount(tenantId, limitType);
      return {
        allowed: current < limits[limitType],
        current,
        limit: limits[limitType],
      };
    }

    const limitMap = {
      projects: subscription.plan.maxProjects,
      events: subscription.plan.maxEventsPerMonth,
      team_members: subscription.plan.maxTeamMembers,
    };

    const current = await this.getCurrentCount(tenantId, limitType, subscription.id);
    const limit = limitMap[limitType];

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }

  private async getCurrentCount(
    tenantId: string,
    limitType: string,
    subscriptionId?: string,
  ): Promise<number> {
    switch (limitType) {
      case 'projects':
        return this.prisma.project.count({ where: { tenantId } });

      case 'team_members':
        return this.prisma.membership.count({ where: { tenantId } });

      case 'events':
        if (!subscriptionId) return 0;
        const now = new Date();
        const usage = await this.prisma.usageRecord.findFirst({
          where: {
            subscriptionId,
            periodStart: { lte: now },
            periodEnd: { gte: now },
          },
        });
        return usage?.eventsCount || 0;

      default:
        return 0;
    }
  }
}
