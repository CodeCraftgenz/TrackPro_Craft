'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Check, X, Loader2, CreditCard, Receipt, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  tier: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxProjects: number;
  maxEventsPerMonth: number;
  maxTeamMembers: number;
  retentionDays: number;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  plan: {
    id: string;
    name: string;
    tier: string;
    price: number;
  };
  billingInterval: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

interface UsageSummary {
  eventsCount: number;
  eventsLimit: number;
  eventsPercentage: number;
  projectsCount: number;
  projectsLimit: number;
  teamMembersCount: number;
  teamMembersLimit: number;
}

interface Invoice {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoiceUrl?: string;
  invoicePdf?: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
}

const featureLabels: Record<string, string> = {
  basic_analytics: 'Basic Analytics',
  advanced_funnels: 'Advanced Funnels',
  multiple_projects: 'Multiple Projects',
  api_access: 'API Access',
  csv_export: 'CSV Export',
  integrations: 'Third-party Integrations',
  custom_reports: 'Custom Reports',
  mfa_support: 'Two-Factor Authentication',
  audit_logs: 'Audit Logs',
  gdpr_tools: 'GDPR Compliance Tools',
  sso_saml: 'SSO / SAML',
  custom_branding: 'Custom Branding',
  sla_guarantee: 'SLA Guarantee',
  dedicated_infrastructure: 'Dedicated Infrastructure',
  onboarding: 'Custom Onboarding',
  community_support: 'Community Support',
  email_support: 'Email Support',
  priority_support: 'Priority Support',
  dedicated_support: 'Dedicated Support',
};

export default function BillingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [plansRes, subscriptionRes, usageRes, invoicesRes] = await Promise.all([
        apiClient.get('/billing/plans'),
        apiClient.get('/billing/subscription'),
        apiClient.get('/billing/usage'),
        apiClient.get('/billing/invoices'),
      ]);

      setPlans(plansRes.data || []);
      setSubscription(subscriptionRes.data);
      setUsage(usageRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planTier: string) => {
    setActionLoading(planTier);
    try {
      const res = await apiClient.post('/billing/checkout', {
        planTier,
        billingInterval,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('portal');
    try {
      const res = await apiClient.post('/billing/portal', {
        returnUrl: window.location.href,
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      await apiClient.delete('/billing/subscription');
      await loadBillingData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading('resume');
    try {
      await apiClient.post('/billing/subscription/resume');
      await loadBillingData();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      alert('Failed to resume subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'succeeded':
        return 'text-green-400';
      case 'trialing':
        return 'text-blue-400';
      case 'past_due':
      case 'failed':
        return 'text-red-400';
      case 'canceled':
        return 'text-gray-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentTier = subscription?.plan?.tier || 'FREE';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="mt-1 text-gray-400">Manage your subscription and billing details</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Plan</p>
              <p className="text-white font-medium">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`font-medium capitalize ${getStatusColor(subscription.status)}`}>
                {subscription.status.replace('_', ' ')}
                {subscription.cancelAtPeriodEnd && ' (Canceling)'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Billing Cycle</p>
              <p className="text-white font-medium capitalize">{subscription.billingInterval}</p>
            </div>
            {subscription.currentPeriodEnd && (
              <div>
                <p className="text-gray-400 text-sm">
                  {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                </p>
                <p className="text-white font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            )}
            {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
              <div>
                <p className="text-gray-400 text-sm">Trial Ends</p>
                <p className="text-blue-400 font-medium">{formatDate(subscription.trialEnd)}</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === 'portal' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Manage Billing'
              )}
            </button>
            {subscription.cancelAtPeriodEnd ? (
              <button
                onClick={handleResumeSubscription}
                disabled={actionLoading === 'resume'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'resume' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Resume Subscription'
                )}
              </button>
            ) : (
              subscription.plan.tier !== 'FREE' && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading === 'cancel'}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Usage */}
      {usage && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Current Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Events</span>
                <span className="text-white">
                  {usage.eventsCount.toLocaleString()} / {usage.eventsLimit === -1 ? 'Unlimited' : usage.eventsLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${usage.eventsPercentage > 90 ? 'bg-red-500' : usage.eventsPercentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(usage.eventsPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Projects</span>
                <span className="text-white">
                  {usage.projectsCount} / {usage.projectsLimit === -1 ? 'Unlimited' : usage.projectsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(usage.projectsCount / (usage.projectsLimit === -1 ? 100 : usage.projectsLimit)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Team Members</span>
                <span className="text-white">
                  {usage.teamMembersCount} / {usage.teamMembersLimit === -1 ? 'Unlimited' : usage.teamMembersLimit}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(usage.teamMembersCount / (usage.teamMembersLimit === -1 ? 100 : usage.teamMembersLimit)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Available Plans</h2>
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly <span className="text-green-400 text-xs ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = plan.tier === currentTier;
            const isPopular = plan.tier === 'PROFESSIONAL';

            return (
              <div
                key={plan.id}
                className={`bg-gray-800 rounded-lg p-6 relative ${
                  isPopular ? 'ring-2 ring-blue-500' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1 min-h-[40px]">{plan.description}</p>

                <div className="mt-4">
                  <span className="text-3xl font-bold text-white">{formatPrice(price)}</span>
                  <span className="text-gray-400">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects} project{plan.maxProjects !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{plan.maxEventsPerMonth === -1 ? 'Unlimited' : plan.maxEventsPerMonth.toLocaleString()} events/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{plan.maxTeamMembers === -1 ? 'Unlimited' : plan.maxTeamMembers} team member{plan.maxTeamMembers !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>{plan.retentionDays} days data retention</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
                  {plan.features.slice(0, 4).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-blue-400" />
                      <span>{featureLabels[feature] || feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-gray-500">+{plan.features.length - 4} more features</p>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={isCurrentPlan || actionLoading === plan.tier || plan.tier === 'FREE'}
                  className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : plan.tier === 'FREE'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : plan.tier === 'ENTERPRISE'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {actionLoading === plan.tier ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.tier === 'FREE' ? (
                    'Free Forever'
                  ) : plan.tier === 'ENTERPRISE' ? (
                    'Contact Sales'
                  ) : (
                    'Upgrade'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-700/50">
                    <td className="py-3 text-white">{formatDate(invoice.createdAt)}</td>
                    <td className="py-3 text-gray-400 text-sm">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="py-3 text-white">{formatPrice(invoice.amountDue)}</td>
                    <td className="py-3">
                      <span className={`capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {invoice.invoiceUrl && (
                        <a
                          href={invoice.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                      )}
                      {invoice.invoicePdf && (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm ml-3"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
