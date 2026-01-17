'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Users,
  Building2,
  FolderKanban,
  Server,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface SystemStats {
  users: number;
  tenants: number;
  projects: number;
  activeProjects: number;
  totalEvents: number;
}

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: { status: 'up' | 'down'; latency?: number };
    redis: { status: 'up' | 'down'; latency?: number };
    clickhouse: { status: 'up' | 'down'; latency?: number };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default function AdminPage() {
  const { get } = useApi();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => get<SystemStats>('/api/v1/admin/stats'),
  });

  const { data: queues, isLoading: loadingQueues, refetch: refetchQueues } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: () => get<QueueStats[]>('/api/v1/admin/queues'),
    refetchInterval: 10000,
  });

  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => get<HealthStatus>('/health'),
    refetchInterval: 30000,
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: 'up' | 'down') => {
    return status === 'up' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'unhealthy':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoramento e operações do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              refetchQueues();
              refetchHealth();
            }}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/queues"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Server className="h-4 w-4" />
          Filas
        </Link>
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Activity className="h-4 w-4" />
          Audit Logs
        </Link>
        <Link
          href="/admin/errors"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <AlertTriangle className="h-4 w-4" />
          Erros
        </Link>
      </div>

      {/* Health Status */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </h2>
          {health && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(health.status)}`}
            >
              {health.status.toUpperCase()}
            </span>
          )}
        </div>

        {loadingHealth ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : health ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Services */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Serviços</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" /> Database
                  </span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(health.services.database.status)}
                    {health.services.database.latency}ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Server className="h-4 w-4" /> Redis
                  </span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(health.services.redis.status)}
                    {health.services.redis.latency}ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" /> ClickHouse
                  </span>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(health.services.clickhouse.status)}
                    {health.services.clickhouse.latency}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-xl font-semibold">{formatUptime(health.uptime)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Versão: {health.version}</p>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Memória</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold">{health.memory.percentage}%</span>
                <span className="text-sm text-muted-foreground">
                  ({health.memory.used}MB / {health.memory.total}MB)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${
                    health.memory.percentage > 80
                      ? 'bg-red-500'
                      : health.memory.percentage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${health.memory.percentage}%` }}
                />
              </div>
            </div>

            {/* Timestamp */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Última verificação</p>
              <p className="text-sm">
                {new Date(health.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* System Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Usuários</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {loadingStats ? '-' : stats?.users.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tenants</p>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {loadingStats ? '-' : stats?.tenants.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Projetos</p>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {loadingStats ? '-' : stats?.projects.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats?.activeProjects} ativos
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Eventos</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {loadingStats ? '-' : stats?.totalEvents.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Queues Overview */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Server className="h-5 w-5" />
            Filas de Processamento
          </h2>
        </div>

        {loadingQueues ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Fila
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Aguardando
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ativas
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Completas
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Falhas
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Atrasadas
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queues?.map((queue) => (
                  <tr key={queue.name} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{queue.name}</td>
                    <td className="px-4 py-3 text-right">{queue.waiting}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{queue.active}</td>
                    <td className="px-4 py-3 text-right text-green-600">{queue.completed}</td>
                    <td className="px-4 py-3 text-right text-red-600">{queue.failed}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">{queue.delayed}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          queue.paused
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {queue.paused ? 'Pausada' : 'Ativa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
