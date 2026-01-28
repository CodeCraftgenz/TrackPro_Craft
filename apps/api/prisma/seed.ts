import { PrismaClient, MemberRole, PlanTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('Seeding billing plans...');

  const plans = [
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

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxProjects: plan.maxProjects,
        maxEventsPerMonth: plan.maxEventsPerMonth,
        maxTeamMembers: plan.maxTeamMembers,
        retentionDays: plan.retentionDays,
        features: plan.features,
      },
      create: {
        tier: plan.tier,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxProjects: plan.maxProjects,
        maxEventsPerMonth: plan.maxEventsPerMonth,
        maxTeamMembers: plan.maxTeamMembers,
        retentionDays: plan.retentionDays,
        features: plan.features,
      },
    });
    console.log(`  ✓ Plan "${plan.name}" created/updated`);
  }

  console.log('Billing plans seeded successfully!\n');
}

async function main() {
  console.log('Seeding database...\n');

  // Seed billing plans first
  await seedPlans();

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@trackpro.io' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@trackpro.io',
      passwordHash,
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
    },
  });

  console.log('Created demo tenant:', demoTenant.name);

  // Create membership
  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: demoUser.id,
        tenantId: demoTenant.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      tenantId: demoTenant.id,
      role: MemberRole.OWNER,
    },
  });

  console.log('Created membership for demo user');

  // Create demo project
  const demoProject = await prisma.project.upsert({
    where: {
      tenantId_domain: {
        tenantId: demoTenant.id,
        domain: 'demo.trackpro.io',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Demo Project',
      domain: 'demo.trackpro.io',
      timezone: 'America/Sao_Paulo',
      retentionDays: 90,
    },
  });

  console.log('Created demo project:', demoProject.name);

  console.log('Seed completed!');
  console.log('\nDemo credentials:');
  console.log('Email: demo@trackpro.io');
  console.log('Password: demo123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
