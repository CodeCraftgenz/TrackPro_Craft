import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Req,
  Res,
  RawBodyRequest,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { PlansService } from './plans.service';
import {
  CreateCheckoutSessionDto,
  CreatePortalSessionDto,
  UpdateStripePriceIdsDto,
  PlanResponseDto,
  SubscriptionResponseDto,
  UsageSummaryResponseDto,
  InvoiceResponseDto,
  CheckoutSessionResponseDto,
  PlanComparisonResponseDto,
} from './billing.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly plansService: PlansService,
  ) {}

  // ========================
  // PUBLIC ENDPOINTS
  // ========================

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans' })
  @ApiResponse({ status: 200, type: [PlanResponseDto] })
  async getPlans() {
    return this.plansService.getPlans();
  }

  @Get('plans/compare')
  @ApiOperation({ summary: 'Get plan comparison for pricing page' })
  @ApiResponse({ status: 200, type: PlanComparisonResponseDto })
  async getPlanComparison() {
    return this.plansService.getPlanComparison();
  }

  // ========================
  // WEBHOOK (NO AUTH)
  // ========================

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;

    if (!payload) {
      return { received: false, error: 'Missing raw body' };
    }

    await this.billingService.handleWebhook(payload, signature);
    return { received: true };
  }

  // ========================
  // AUTHENTICATED ENDPOINTS
  // ========================

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getSubscription(user.tenantId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage summary' })
  @ApiResponse({ status: 200, type: UsageSummaryResponseDto })
  async getUsageSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getUsageSummary(user.tenantId);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice history' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  async getInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getInvoices(user.tenantId, limit || 10);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session for subscription' })
  @ApiResponse({ status: 201, type: CheckoutSessionResponseDto })
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession({
      tenantId: user.tenantId,
      ...dto,
    });
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create customer portal session' })
  @ApiResponse({ status: 201, type: CheckoutSessionResponseDto })
  async createPortalSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePortalSessionDto,
  ) {
    return this.billingService.createCustomerPortalSession({
      tenantId: user.tenantId,
      returnUrl: dto.returnUrl,
    });
  }

  @Delete('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  @ApiResponse({ status: 204, description: 'Subscription canceled' })
  async cancelSubscription(@CurrentUser() user: AuthenticatedUser) {
    await this.billingService.cancelSubscription(user.tenantId, user.userId);
  }

  @Post('subscription/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resume canceled subscription' })
  @ApiResponse({ status: 204, description: 'Subscription resumed' })
  async resumeSubscription(@CurrentUser() user: AuthenticatedUser) {
    await this.billingService.resumeSubscription(user.tenantId, user.userId);
  }

  @Get('limits/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if action is allowed by plan limits' })
  @ApiResponse({ status: 200 })
  async checkPlanLimit(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') limitType: 'projects' | 'events' | 'team_members',
  ) {
    return this.billingService.checkPlanLimit(user.tenantId, limitType);
  }

  // ========================
  // ADMIN ENDPOINTS
  // ========================

  @Post('admin/plans/stripe-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Stripe price IDs for a plan (admin only)' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async updateStripePriceIds(@Body() dto: UpdateStripePriceIdsDto) {
    return this.plansService.updateStripePriceIds(
      dto.tier,
      dto.monthlyPriceId,
      dto.yearlyPriceId,
    );
  }
}
