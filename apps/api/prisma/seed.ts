import { PrismaClient, MemberRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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
