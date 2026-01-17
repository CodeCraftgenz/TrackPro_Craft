'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface QualityReport {
  eventValidation: {
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  };
  metaDelivery: {
    total: number;
    delivered: number;
    failed: number;
    retrying: number;
    deliveryRate: number;
  };
  recentErrors: Array<{
    type: string;
    message: string;
    count: number;
  }>;
}

export default function QualityReportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

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
    queryKey: ['quality-report', tenantId, projectId],
    queryFn: () =>
      get<QualityReport>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/reports/quality`,
      ),
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (rate: number) => {
    if (rate >= 95) return 'bg-green-100 dark:bg-green-900/30';
    if (rate >= 80) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
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
              Qualidade dos Dados
            </h1>
            <p className="text-muted-foreground">
              Monitoramento da qualidade e integridade dos eventos
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
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <TrendingUp className="h-4 w-4" />
          Performance
        </Link>
        <Link
          href={`/projects/${projectId}/reports/quality`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Eye className="h-4 w-4" />
          Qualidade
        </Link>
      </div>

      {isLoading ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Carregando qualidade...
          </p>
        </div>
      ) : (
        <>
          {/* Event Validation */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Validação de Eventos</h3>
              <span className="text-sm text-muted-foreground">(últimas 24h)</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(report?.eventValidation.total || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Válidos</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {formatNumber(report?.eventValidation.valid || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">Inválidos</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-red-600">
                  {formatNumber(report?.eventValidation.invalid || 0)}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${getStatusBg(report?.eventValidation.validationRate || 100)}`}
              >
                <p className="text-sm text-muted-foreground">Taxa de Validação</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${getStatusColor(report?.eventValidation.validationRate || 100)}`}
                >
                  {report?.eventValidation.validationRate || 100}%
                </p>
              </div>
            </div>
          </div>

          {/* Meta CAPI Delivery */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Entrega Meta CAPI</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-5">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Enviado</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatNumber(report?.metaDelivery.total || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Entregues</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {formatNumber(report?.metaDelivery.delivered || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">Falharam</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-red-600">
                  {formatNumber(report?.metaDelivery.failed || 0)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">Tentando</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-yellow-600">
                  {formatNumber(report?.metaDelivery.retrying || 0)}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${getStatusBg(report?.metaDelivery.deliveryRate || 100)}`}
              >
                <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${getStatusColor(report?.metaDelivery.deliveryRate || 100)}`}
                >
                  {report?.metaDelivery.deliveryRate || 100}%
                </p>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Erros Recentes</h3>
            </div>

            {!report?.recentErrors?.length ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500/50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum erro recente encontrado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Mensagem
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Ocorrências
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report?.recentErrors?.map((error, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              error.type === 'validation'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : error.type === 'integration'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {error.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{error.message}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {error.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Health Summary */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Status de Saúde
                </h4>
                <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                  {(report?.eventValidation.validationRate || 100) >= 95 &&
                  (report?.metaDelivery.deliveryRate || 100) >= 95
                    ? 'Todos os sistemas estão operando normalmente. Taxa de validação e entrega dentro dos parâmetros esperados.'
                    : 'Alguns indicadores estão abaixo do esperado. Verifique os erros recentes para mais detalhes.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
