import { IsEnum, IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: PlanTier, description: 'The plan tier to subscribe to' })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;

  @ApiProperty({ enum: ['monthly', 'yearly'], description: 'Billing interval' })
  @IsEnum(['monthly', 'yearly'])
  @IsNotEmpty()
  billingInterval: 'monthly' | 'yearly';

  @ApiProperty({ description: 'URL to redirect to after successful checkout' })
  @IsUrl()
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ description: 'URL to redirect to if checkout is canceled' })
  @IsUrl()
  @IsNotEmpty()
  cancelUrl: string;
}

export class CreatePortalSessionDto {
  @ApiProperty({ description: 'URL to redirect to after leaving the portal' })
  @IsUrl()
  @IsNotEmpty()
  returnUrl: string;
}

export class UpdateStripePriceIdsDto {
  @ApiProperty({ enum: PlanTier, description: 'The plan tier to update' })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  tier: PlanTier;

  @ApiProperty({ description: 'Stripe price ID for monthly billing' })
  @IsString()
  @IsNotEmpty()
  monthlyPriceId: string;

  @ApiProperty({ description: 'Stripe price ID for yearly billing' })
  @IsString()
  @IsNotEmpty()
  yearlyPriceId: string;
}

// Response DTOs

export class PlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PlanTier })
  tier: PlanTier;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ description: 'Monthly price in cents' })
  monthlyPrice: number;

  @ApiProperty({ description: 'Yearly price in cents' })
  yearlyPrice: number;

  @ApiProperty()
  maxProjects: number;

  @ApiProperty()
  maxEventsPerMonth: number;

  @ApiProperty()
  maxTeamMembers: number;

  @ApiProperty()
  retentionDays: number;

  @ApiProperty({ type: [String] })
  features: string[];
}

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    price: number;
  };

  @ApiProperty()
  billingInterval: string;

  @ApiPropertyOptional()
  currentPeriodStart?: Date;

  @ApiPropertyOptional()
  currentPeriodEnd?: Date;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional()
  trialEnd?: Date;
}

export class UsageSummaryResponseDto {
  @ApiProperty()
  eventsCount: number;

  @ApiProperty()
  eventsLimit: number;

  @ApiProperty({ description: 'Percentage of events used (0-100)' })
  eventsPercentage: number;

  @ApiProperty()
  projectsCount: number;

  @ApiProperty()
  projectsLimit: number;

  @ApiProperty()
  teamMembersCount: number;

  @ApiProperty()
  teamMembersLimit: number;
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Amount due in cents' })
  amountDue: number;

  @ApiProperty({ description: 'Amount paid in cents' })
  amountPaid: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  invoiceUrl?: string;

  @ApiPropertyOptional()
  invoicePdf?: string;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({ description: 'URL to redirect the user to for checkout' })
  url: string;
}

export class PlanLimitCheckResponseDto {
  @ApiProperty({ description: 'Whether the action is allowed' })
  allowed: boolean;

  @ApiProperty({ description: 'Current usage count' })
  current: number;

  @ApiProperty({ description: 'Plan limit' })
  limit: number;
}

export class PlanComparisonResponseDto {
  @ApiProperty({ type: [Object] })
  plans: Array<{
    id: string;
    name: string;
    tier: PlanTier;
    description?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    limits: {
      projects: string | number;
      eventsPerMonth: string;
      teamMembers: string | number;
      retentionDays: number;
    };
  }>;

  @ApiProperty({ type: [Object] })
  features: Array<{
    key: string;
    label: string;
    availability: Record<PlanTier, boolean>;
  }>;
}
