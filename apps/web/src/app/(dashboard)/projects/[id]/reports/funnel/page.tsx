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
  ArrowDown,
  Target,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface FunnelReport {
  steps: FunnelStep[];
  conversionRate: number;
  totalStarted: number;
  totalCompleted: number;
}

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Visualização',
  view_content: 'Viu Conteúdo',
  add_to_cart: 'Add ao Carrinho',
  initiate_checkout: 'Iniciou Checkout',
  purchase: 'Compra',
  lead: 'Lead',
  search: 'Pesquisa',
};

export default function FunnelReportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [funnelSteps, setFunnelSteps] = useState<string[]>([
    'page_view',
    'view_content',
    'add_to_cart',
    'initiate_checkout',
    'purchase',
  ]);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const {
    data: report,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['funnel-report', tenantId, projectId, startDate, endDate, funnelSteps],
    queryFn: () =>
      get<FunnelReport>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/reports/funnel?startDate=${startDate}&endDate=${endDate}&steps=${funnelSteps.join(',')}`,
      ),
    enabled: !!tenantId,
  });

  const maxStepCount = Math.max(...(report?.steps?.map((s) => s.count) || [1]));

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
              Funil de Conversão
            </h1>
            <p className="text-muted-foreground">
              Análise do funil de conversão do seu projeto
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
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Activity className="h-4 w-4" />
          Funil
        </Link>
        <Link
          href={`/projects/${projectId}/reports/performance`}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
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
            Carregando funil...
          </p>
        </div>
      ) : (
        <>
          {/* Conversion Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Iniciaram</p>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {(report?.totalStarted || 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Converteram</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-green-600">
                {(report?.totalCompleted || 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {report?.conversionRate || 0}%
              </p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-6">Funil de Conversão</h3>

            <div className="space-y-4">
              {report?.steps?.map((step, index) => {
                const widthPercentage = Math.max(
                  (step.count / maxStepCount) * 100,
                  10,
                );
                const isLast = index === (report?.steps?.length || 0) - 1;

                return (
                  <div key={step.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium">
                          {EVENT_LABELS[step.name] || step.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          {step.count.toLocaleString('pt-BR')} usuários
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            step.percentage >= 50
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : step.percentage >= 20
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {step.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <div
                        className="h-10 bg-primary/80 rounded-md transition-all flex items-center justify-end pr-4"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        <span className="text-xs text-primary-foreground font-medium">
                          {step.count.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {!isLast && step.dropoff > 0 && (
                      <div className="flex items-center gap-2 mt-2 ml-8 text-sm text-muted-foreground">
                        <ArrowDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          -{step.dropoff.toLocaleString('pt-BR')} abandonaram
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Steps Editor */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Configurar Etapas do Funil</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione os eventos que compõem o funil de conversão
            </p>

            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_LABELS).map(([event, label]) => {
                const isSelected = funnelSteps.includes(event);
                const stepIndex = funnelSteps.indexOf(event);

                return (
                  <button
                    key={event}
                    onClick={() => {
                      if (isSelected) {
                        setFunnelSteps(funnelSteps.filter((s) => s !== event));
                      } else {
                        setFunnelSteps([...funnelSteps, event]);
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-accent'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">
                        {stepIndex + 1}
                      </span>
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
