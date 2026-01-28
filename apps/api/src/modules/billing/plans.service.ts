import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanTier } from '@prisma/client';

interface PlanDefinition {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  maxProjects: number;
  maxEventsPerMonth: number;
  maxTeamMembers: number;
  retentionDays: number;
  features: string[];
}

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  // Default plan definitions
  static readonly PLANS: PlanDefinition[] = [
    {
      tier: PlanTier.FREE,
      name: 'Free',
      description: 'Get started with basic analytics',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxProjects: 1,
      maxEventsPerMonth: 10000,
      maxTeamMembers: 1,
      retentionDays: 30,
      features: [
        'basic_analytics',
        'single_project',
        '30_day_retention',
        'community_support',
      ],
    },
    {
      tier: PlanTier.STARTER,
      name: 'Starter',
      description: 'For small teams getting serious about analytics',
      monthlyPrice: 2900, // $29/month
      yearlyPrice: 29000, // $290/year (2 months free)
      maxProjects: 3,
      maxEventsPerMonth: 100000,
      maxTeamMembers: 5,
      retentionDays: 90,
      features: [
        'basic_analytics',
        'advanced_funnels',
        'multiple_projects',
        '90_day_retention',
        'email_support',
        'api_access',
        'csv_export',
      ],
    },
    {
      tier: PlanTier.PROFESSIONAL,
      name: 'Professional',
      description: 'For growing businesses with advanced needs',
      monthlyPrice: 9900, // $99/month
      yearlyPrice: 99000, // $990/year (2 months free)
      maxProjects: 10,
      maxEventsPerMonth: 1000000,
      maxTeamMembers: 20,
      retentionDays: 365,
      features: [
        'basic_analytics',
        'advanced_funnels',
        'multiple_projects',
        '365_day_retention',
        'priority_support',
        'api_access',
        'csv_export',
        'integrations',
        'custom_reports',
        'mfa_support',
        'audit_logs',
        'gdpr_tools',
      ],
    },
    {
      tier: PlanTier.ENTERPRISE,
      name: 'Enterprise',
      description: 'For large organizations with custom requirements',
      monthlyPrice: 49900, // $499/month
      yearlyPrice: 499000, // $4990/year (2 months free)
      maxProjects: -1, // unlimited
      maxEventsPerMonth: -1, // unlimited
      maxTeamMembers: -1, // unlimited
      retentionDays: 730, // 2 years
      features: [
        'basic_analytics',
        'advanced_funnels',
        'unlimited_projects',
        '2_year_retention',
        'dedicated_support',
        'api_access',
        'csv_export',
        'integrations',
        'custom_reports',
        'mfa_support',
        'audit_logs',
        'gdpr_tools',
        'sso_saml',
        'custom_branding',
        'sla_guarantee',
        'dedicated_infrastructure',
        'onboarding',
      ],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedPlans();
  }

  /**
   * Seed default plans if they don't exist
   */
  async seedPlans(): Promise<void> {
    for (const planDef of PlansService.PLANS) {
      const existing = await this.prisma.plan.findUnique({
        where: { tier: planDef.tier },
      });

      if (!existing) {
        await this.prisma.plan.create({
          data: {
            tier: planDef.tier,
            name: planDef.name,
            description: planDef.description,
            monthlyPrice: planDef.monthlyPrice,
            yearlyPrice: planDef.yearlyPrice,
            maxProjects: planDef.maxProjects,
            maxEventsPerMonth: planDef.maxEventsPerMonth,
            maxTeamMembers: planDef.maxTeamMembers,
            retentionDays: planDef.retentionDays,
            features: planDef.features,
          },
        });
        this.logger.log(`Created plan: ${planDef.name}`);
      }
    }
  }

  /**
   * Get all active plans
   */
  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  /**
   * Get plan by tier
   */
  async getPlanByTier(tier: PlanTier) {
    return this.prisma.plan.findUnique({
      where: { tier },
    });
  }

  /**
   * Get plan limits
   */
  async getPlanLimits(tier: PlanTier) {
    const plan = await this.getPlanByTier(tier);

    if (!plan) {
      // Default free tier limits
      return {
        maxProjects: 1,
        maxEventsPerMonth: 10000,
        maxTeamMembers: 1,
        retentionDays: 30,
      };
    }

    return {
      maxProjects: plan.maxProjects,
      maxEventsPerMonth: plan.maxEventsPerMonth,
      maxTeamMembers: plan.maxTeamMembers,
      retentionDays: plan.retentionDays,
    };
  }

  /**
   * Check if plan has a specific feature
   */
  async planHasFeature(tier: PlanTier, feature: string): Promise<boolean> {
    const plan = await this.getPlanByTier(tier);

    if (!plan) {
      return false;
    }

    const features = plan.features as string[];
    return features.includes(feature);
  }

  /**
   * Update plan Stripe price IDs (for admin use)
   */
  async updateStripePriceIds(
    tier: PlanTier,
    monthlyPriceId: string,
    yearlyPriceId: string,
  ) {
    return this.prisma.plan.update({
      where: { tier },
      data: {
        stripePriceIdMonthly: monthlyPriceId,
        stripePriceIdYearly: yearlyPriceId,
      },
    });
  }

  /**
   * Get plan comparison for pricing page
   */
  async getPlanComparison() {
    const plans = await this.getPlans();

    const allFeatures = [
      { key: 'basic_analytics', label: 'Basic Analytics' },
      { key: 'advanced_funnels', label: 'Advanced Funnels' },
      { key: 'multiple_projects', label: 'Multiple Projects' },
      { key: 'api_access', label: 'API Access' },
      { key: 'csv_export', label: 'CSV Export' },
      { key: 'integrations', label: 'Third-party Integrations' },
      { key: 'custom_reports', label: 'Custom Reports' },
      { key: 'mfa_support', label: 'Two-Factor Authentication' },
      { key: 'audit_logs', label: 'Audit Logs' },
      { key: 'gdpr_tools', label: 'GDPR Compliance Tools' },
      { key: 'sso_saml', label: 'SSO / SAML' },
      { key: 'custom_branding', label: 'Custom Branding' },
      { key: 'sla_guarantee', label: 'SLA Guarantee' },
      { key: 'dedicated_infrastructure', label: 'Dedicated Infrastructure' },
      { key: 'onboarding', label: 'Custom Onboarding' },
    ];

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        limits: {
          projects: plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects,
          eventsPerMonth: plan.maxEventsPerMonth === -1 ? 'Unlimited' : plan.maxEventsPerMonth.toLocaleString(),
          teamMembers: plan.maxTeamMembers === -1 ? 'Unlimited' : plan.maxTeamMembers,
          retentionDays: plan.retentionDays,
        },
      })),
      features: allFeatures.map((feature) => ({
        ...feature,
        availability: plans.reduce(
          (acc, plan) => {
            const planFeatures = plan.features as string[];
            acc[plan.tier] = planFeatures.includes(feature.key);
            return acc;
          },
          {} as Record<PlanTier, boolean>,
        ),
      })),
    };
  }
}
