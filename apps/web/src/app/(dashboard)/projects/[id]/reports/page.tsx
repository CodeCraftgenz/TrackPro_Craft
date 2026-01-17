'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Calendar,
  RefreshCw,
  BarChart3,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface OverviewReport {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventsToday: number;
  eventsTrend: number;
  topEvents: Array<{ event_name: string; count: number }>;
  eventsByDay: Array<{ date: string; count: number }>;
}

export default function ReportsOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

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
    queryKey: ['overview-report', tenantId, projectId, startDate, endDate],
    queryFn: () =>
      get<OverviewReport>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/reports/overview?startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled: !!tenantId,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('pt-BR');
  };

  const maxEventCount = Math.max(...(report?.eventsByDay?.map((d) => d.count) || [1]));

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
              Visão Geral
            </h1>
            <p className="text-muted-foreground">
              Métricas e estatísticas do seu projeto
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
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
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
            Carregando relatório...
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total de Eventos</p>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(report?.totalEvents || 0)}
              </p>
              <div className="mt-1 flex items-center gap-1 text-sm">
                {(report?.eventsTrend || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    (report?.eventsTrend || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {report?.eventsTrend || 0}%
                </span>
                <span className="text-muted-foreground">vs período anterior</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Usuários Únicos</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(report?.uniqueUsers || 0)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Sessões Únicas</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(report?.uniqueSessions || 0)}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Eventos Hoje</p>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatNumber(report?.eventsToday || 0)}
              </p>
            </div>
          </div>

          {/* Events by Day Chart */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Eventos por Dia</h3>
            <div className="mt-4 h-48 flex items-end gap-1">
              {report?.eventsByDay?.map((day, index) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary/80 hover:bg-primary rounded-t transition-colors"
                    style={{
                      height: `${(day.count / maxEventCount) * 100}%`,
                      minHeight: day.count > 0 ? '4px' : '0',
                    }}
                    title={`${day.date}: ${day.count.toLocaleString('pt-BR')} eventos`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Events */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Top Eventos</h3>
            <div className="mt-4 space-y-3">
              {report?.topEvents?.map((event, index) => {
                const maxCount = report.topEvents[0]?.count || 1;
                const percentage = (event.count / maxCount) * 100;

                return (
                  <div key={event.event_name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{event.event_name}</span>
                      <span className="text-muted-foreground">
                        {event.count.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
