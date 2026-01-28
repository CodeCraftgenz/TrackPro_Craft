'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface DeliveryLog {
  event_id: string;
  project_id: string;
  status: string;
  attempts: number;
  last_error: string;
  delivered_at: number;
}

interface DeliveryStats {
  total: number;
  delivered: number;
  failed: number;
  retrying: number;
}

interface Tenant {
  id: string;
  name: string;
}

interface LogsResponse {
  logs: DeliveryLog[];
  total: number;
  limit: number;
  offset: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  delivered: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Check,
  },
  failed: {
    label: 'Falhou',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: X,
  },
  retrying: {
    label: 'Tentando',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
};

export default function MetaDeliveryLogsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['meta-delivery-stats', tenantId, projectId],
    queryFn: () =>
      get<DeliveryStats>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/meta-delivery/stats`,
      ),
    enabled: !!tenantId,
  });

  const {
    data: logsData,
    isLoading: logsLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['meta-delivery-logs', tenantId, projectId, page, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      return get<LogsResponse>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/meta-delivery?${params}`,
      );
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const totalPages = logsData ? Math.ceil(logsData.total / limit) : 0;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isLoading = statsLoading || logsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/projects/${projectId}/integrations`}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Logs de Entrega Meta CAPI
            </h1>
            <p className="text-muted-foreground">
              Histórico de envios para o Meta Conversions API
            </p>
          </div>
        </div>
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.total.toLocaleString('pt-BR') || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Entregues</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
            {stats?.delivered.toLocaleString('pt-BR') || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-red-500" />
            <p className="text-sm text-muted-foreground">Falharam</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {stats?.failed.toLocaleString('pt-BR') || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Tentando</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
            {stats?.retrying.toLocaleString('pt-BR') || 0}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="flex h-10 w-48 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Todos os status</option>
            <option value="delivered">Entregues</option>
            <option value="failed">Falharam</option>
            <option value="retrying">Tentando</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Carregando logs...
            </p>
          </div>
        ) : logsData?.logs?.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">Nenhum log encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {statusFilter
                ? 'Tente ajustar os filtros'
                : 'Logs aparecerão aqui quando eventos forem enviados para o Meta'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {logsData?.logs?.map((log) => {
              const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.retrying;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={`${log.event_id}-${log.delivered_at}`}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Tentativa {log.attempts}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-sm text-muted-foreground truncate">
                        Event ID: {log.event_id}
                      </p>
                      {log.last_error && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          Erro: {log.last_error}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <p>{formatTime(log.delivered_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
