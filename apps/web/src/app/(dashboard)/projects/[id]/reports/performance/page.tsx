'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  BarChart3,
  Eye,
  DollarSign,
  ShoppingCart,
  Target,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface PerformanceReport {
  bySource: Array<{
    source: string;
    events: number;
    users: number;
    sessions: number;
    revenue: number;
  }>;
  byMedium: Array<{
    medium: string;
    events: number;
    users: number;
    revenue: number;
  }>;
  byCampaign: Array<{
    campaign: string;
    events: number;
    users: number;
    revenue: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export default function PerformanceReportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'source' | 'medium' | 'campaign'>('source');

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const {
    data: report,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['performance-report', tenantId, projectId, startDate, endDate],
    queryFn: () =>
      get<PerformanceReport>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/reports/performance?startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled: !!tenantId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/projects/${projectId}`}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Performance
            </h1>
            <p className="text-muted-foreground">
              Análise de performance por fonte de tráfego
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Atualizar
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/projects/${projectId}/reports`}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <BarChart3 className="h-4 w-4" />
          Visão Geral
        </Link>
        <Link
          href={`/projects/${projectId}/reports/funnel`}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Activity className="h-4 w-4" />
          Funil
        </Link>
        <Link
          href={`/projects/${projectId}/reports/performance`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <TrendingUp className="h-4 w-4" />
          Performance
        </Link>
        <Link
          href={`/projects/${projectId}/reports/quality`}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Eye className="h-4 w-4" />
          Qualidade
        </Link>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <span className="text-muted-foreground">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Carregando performance...
          </p>
        </div>
      ) : (
        <>
          {/* Revenue Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-green-600">
                {formatCurrency(report?.totalRevenue || 0)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {(report?.totalOrders || 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(report?.averageOrderValue || 0)}
              </p>
            </div>
          </div>

          {/* Performance Table */}
          <div className="rounded-lg border bg-card">
            {/* Tabs */}
            <div className="border-b px-4">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'source', label: 'Por Fonte' },
                  { id: 'medium', label: 'Por Meio' },
                  { id: 'campaign', label: 'Por Campanha' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {activeTab === 'source'
                        ? 'Fonte'
                        : activeTab === 'medium'
                          ? 'Meio'
                          : 'Campanha'}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Eventos
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Usuários
                    </th>
                    {activeTab === 'source' && (
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Sessões
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeTab === 'source' &&
                    report?.bySource?.map((item) => (
                      <tr key={item.source} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.source || '(direct)'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.events)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.users)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.sessions)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}

                  {activeTab === 'medium' &&
                    report?.byMedium?.map((item) => (
                      <tr key={item.medium} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.medium || '(none)'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.events)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.users)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}

                  {activeTab === 'campaign' &&
                    report?.byCampaign?.map((item) => (
                      <tr key={item.campaign} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.campaign || '(none)'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.events)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatNumber(item.users)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {((activeTab === 'source' && !report?.bySource?.length) ||
                (activeTab === 'medium' && !report?.byMedium?.length) ||
                (activeTab === 'campaign' && !report?.byCampaign?.length)) && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum dado disponível para este período
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
