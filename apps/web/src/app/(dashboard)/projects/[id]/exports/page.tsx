'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileJson,
  Clock,
  Check,
  X,
  Loader2,
  Plus,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface ExportParams {
  startDate?: string;
  endDate?: string;
  eventNames?: string[];
  format: 'csv' | 'json';
}

interface ExportJob {
  id: string;
  type: 'EVENTS_RAW' | 'EVENTS_AGG' | 'FUNNEL' | 'REVENUE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  params: ExportParams;
  fileUrl?: string;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

const EXPORT_TYPE_CONFIG: Record<
  ExportJob['type'],
  { label: string; description: string }
> = {
  EVENTS_RAW: {
    label: 'Eventos Brutos',
    description: 'Exportar todos os eventos com dados completos',
  },
  EVENTS_AGG: {
    label: 'Eventos Agregados',
    description: 'Dados agregados por dia/evento',
  },
  FUNNEL: {
    label: 'Funil',
    description: 'Dados de conversão do funil',
  },
  REVENUE: {
    label: 'Receita',
    description: 'Relatório de receita e transações',
  },
};

const STATUS_CONFIG: Record<
  ExportJob['status'],
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Processando',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Check,
  },
  FAILED: {
    label: 'Falhou',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: X,
  },
};

export default function ExportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, post, del } = useApi();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportType, setExportType] = useState<ExportJob['type']>('EVENTS_RAW');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const {
    data: exports,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['exports', tenantId, projectId],
    queryFn: () =>
      get<ExportJob[]>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/exports`,
      ),
    enabled: !!tenantId,
    refetchInterval: 10000, // Check for updates every 10 seconds
  });

  const createExportMutation = useMutation({
    mutationFn: (data: {
      type: ExportJob['type'];
      format: 'csv' | 'json';
      startDate?: string;
      endDate?: string;
    }) =>
      post(`/api/v1/tenants/${tenantId}/projects/${projectId}/exports`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', tenantId, projectId] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const cancelExportMutation = useMutation({
    mutationFn: (exportId: string) =>
      del(`/api/v1/tenants/${tenantId}/projects/${projectId}/exports/${exportId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', tenantId, projectId] });
    },
  });

  const downloadExport = async (exportId: string) => {
    try {
      const result = await get<{ downloadUrl: string; expiresAt: string }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/exports/${exportId}/download`,
      );
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
    }
  };

  const resetForm = () => {
    setExportType('EVENTS_RAW');
    setExportFormat('csv');
    setStartDate('');
    setEndDate('');
  };

  const handleCreateExport = () => {
    createExportMutation.mutate({
      type: exportType,
      format: exportFormat,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
              Exportar Dados
            </h1>
            <p className="text-muted-foreground">
              Exporte seus dados de analytics em CSV ou JSON
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Exportação
          </button>
        </div>
      </div>

      {/* Export Types Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(EXPORT_TYPE_CONFIG) as [ExportJob['type'], typeof EXPORT_TYPE_CONFIG[ExportJob['type']]][]).map(
          ([type, config]) => (
            <div
              key={type}
              className="rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                setExportType(type);
                setShowCreateModal(true);
              }}
            >
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{config.label}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          ),
        )}
      </div>

      {/* Exports List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Histórico de Exportações</h2>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Carregando exportações...
            </p>
          </div>
        ) : !exports || exports.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">Nenhuma exportação</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Clique em &quot;Nova Exportação&quot; para começar
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {exports.map((exportJob) => {
              const statusConfig = STATUS_CONFIG[exportJob.status];
              const typeConfig = EXPORT_TYPE_CONFIG[exportJob.type];
              const StatusIcon = statusConfig.icon;
              const FormatIcon =
                exportJob.params.format === 'json' ? FileJson : FileSpreadsheet;

              return (
                <div
                  key={exportJob.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FormatIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{typeConfig.label}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                        >
                          <StatusIcon
                            className={`h-3 w-3 ${
                              exportJob.status === 'PROCESSING'
                                ? 'animate-spin'
                                : ''
                            }`}
                          />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(exportJob.createdAt)}
                        </span>
                        {exportJob.params.startDate && (
                          <span className="inline-flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            {new Date(exportJob.params.startDate).toLocaleDateString('pt-BR')}
                            {exportJob.params.endDate && (
                              <> - {new Date(exportJob.params.endDate).toLocaleDateString('pt-BR')}</>
                            )}
                          </span>
                        )}
                      </div>

                      {exportJob.error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          Erro: {exportJob.error}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {exportJob.status === 'COMPLETED' && exportJob.fileUrl && (
                        <button
                          onClick={() => downloadExport(exportJob.id)}
                          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Baixar
                        </button>
                      )}
                      {exportJob.status === 'PENDING' && (
                        <button
                          onClick={() => cancelExportMutation.mutate(exportJob.id)}
                          disabled={cancelExportMutation.isPending}
                          className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 disabled:opacity-50"
                        >
                          {cancelExportMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="mr-1 h-4 w-4" />
                              Cancelar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Export Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Nova Exportação</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure os parâmetros da exportação
            </p>

            <div className="mt-6 space-y-4">
              {/* Export Type */}
              <div>
                <label className="text-sm font-medium">Tipo de Exportação</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportJob['type'])}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {(Object.entries(EXPORT_TYPE_CONFIG) as [ExportJob['type'], typeof EXPORT_TYPE_CONFIG[ExportJob['type']]][]).map(
                    ([type, config]) => (
                      <option key={type} value={type}>
                        {config.label}
                      </option>
                    ),
                  )}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {EXPORT_TYPE_CONFIG[exportType].description}
                </p>
              </div>

              {/* Format */}
              <div>
                <label className="text-sm font-medium">Formato</label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="h-4 w-4"
                    />
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="text-sm">CSV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="h-4 w-4"
                    />
                    <FileJson className="h-4 w-4" />
                    <span className="text-sm">JSON</span>
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Exportações podem levar alguns minutos dependendo do volume de dados
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateExport}
                disabled={createExportMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createExportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Criar Exportação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
