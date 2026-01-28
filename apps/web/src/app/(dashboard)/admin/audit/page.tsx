'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  Search,
  User,
  Calendar,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown> | null;
}

export default function AuditPage() {
  const { get } = useApi();

  const [filters, setFilters] = useState({
    userId: '',
    entity: '',
    action: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.action) params.set('action', filters.action);
      return get<{ logs: AuditEntry[]; total: number }>(`/api/v1/admin/audit?${params}`);
    },
  });

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('CREATE')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
    if (action.includes('update') || action.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (action.includes('delete') || action.includes('DELETE')) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">
              Histórico de ações e alterações no sistema
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              <User className="h-4 w-4 inline mr-1" />
              User ID
            </label>
            <input
              type="text"
              placeholder="Filtrar por usuário..."
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              <Filter className="h-4 w-4 inline mr-1" />
              Entidade
            </label>
            <input
              type="text"
              placeholder="Filtrar por entidade..."
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              <Search className="h-4 w-4 inline mr-1" />
              Ação
            </label>
            <input
              type="text"
              placeholder="Filtrar por ação..."
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ userId: '', entity: '', action: '' })}
              className="h-9 px-4 rounded-md border text-sm hover:bg-accent"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} registros encontrados
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.logs?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro de auditoria encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Ação
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Entidade
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Alterações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {log.userId.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{log.entity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {log.entityId?.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      {log.changes ? (
                        <details>
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Ver alterações
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded max-w-xs overflow-x-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
