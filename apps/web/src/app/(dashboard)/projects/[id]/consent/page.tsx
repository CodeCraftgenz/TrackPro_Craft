'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  Users,
  TrendingUp,
  Settings,
  RefreshCw,
  Check,
  X,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface ConsentLog {
  id: string;
  anonymousId: string;
  categories: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    necessary: boolean;
  };
  source: 'sdk' | 'api' | 'manual';
  createdAt: string;
}

interface ConsentStats {
  total: number;
  last30Days: number;
  last7Days: number;
  uniqueUsers: number;
  acceptanceRates: {
    analytics: number;
    marketing: number;
    personalization: number;
  };
}

interface ConsentSettings {
  bannerEnabled: boolean;
  bannerPosition: 'bottom' | 'top' | 'center';
  bannerTheme: 'light' | 'dark' | 'auto';
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  categoriesConfig: {
    analytics: { enabled: boolean; description: string };
    marketing: { enabled: boolean; description: string };
    personalization: { enabled: boolean; description: string };
  };
}

interface LogsResponse {
  logs: ConsentLog[];
  total: number;
  limit: number;
  offset: number;
}

const SOURCE_LABELS: Record<ConsentLog['source'], string> = {
  sdk: 'SDK',
  api: 'API',
  manual: 'Manual',
};

export default function ConsentPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, put } = useApi();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'settings'>('overview');
  const [page, setPage] = useState(0);
  const [searchId, setSearchId] = useState('');
  const limit = 20;

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['consent-stats', tenantId, projectId],
    queryFn: () =>
      get<ConsentStats>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/consent/stats`,
      ),
    enabled: !!tenantId,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['consent-settings', tenantId, projectId],
    queryFn: () =>
      get<ConsentSettings>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/consent/settings`,
      ),
    enabled: !!tenantId,
  });

  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
    isFetching: logsFetching,
  } = useQuery({
    queryKey: ['consent-logs', tenantId, projectId, page, searchId],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (searchId) {
        params.set('anonymousId', searchId);
      }
      return get<LogsResponse>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/consent/logs?${params}`,
      );
    },
    enabled: !!tenantId && activeTab === 'logs',
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<ConsentSettings>) =>
      put(`/api/v1/tenants/${tenantId}/projects/${projectId}/consent/settings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['consent-settings', tenantId, projectId],
      });
    },
  });

  const totalPages = logsData ? Math.ceil(logsData.total / limit) : 0;

  const defaultCategoriesConfig = {
    analytics: { enabled: true, description: 'Cookies de análise' },
    marketing: { enabled: true, description: 'Cookies de marketing' },
    personalization: { enabled: true, description: 'Cookies de personalização' },
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
              Gestão de Consentimento
            </h1>
            <p className="text-muted-foreground">
              LGPD - Controle e histórico de consentimentos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'logs', label: 'Histórico', icon: Clock },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total de Consentimentos</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {statsLoading ? '...' : stats?.total.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Usuários Únicos</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {statsLoading ? '...' : stats?.uniqueUsers.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {statsLoading ? '...' : stats?.last30Days.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {statsLoading ? '...' : stats?.last7Days.toLocaleString('pt-BR') || 0}
              </p>
            </div>
          </div>

          {/* Acceptance Rates */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Taxa de Aceitação por Categoria</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Baseado nos últimos 100 consentimentos registrados
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  key: 'analytics',
                  label: 'Analytics',
                  color: 'bg-blue-500',
                  description: 'Cookies de análise e métricas',
                },
                {
                  key: 'marketing',
                  label: 'Marketing',
                  color: 'bg-purple-500',
                  description: 'Cookies de publicidade e remarketing',
                },
                {
                  key: 'personalization',
                  label: 'Personalização',
                  color: 'bg-green-500',
                  description: 'Preferências e experiência personalizada',
                },
              ].map((category) => {
                const rate =
                  stats?.acceptanceRates[
                    category.key as keyof typeof stats.acceptanceRates
                  ] || 0;

                return (
                  <div key={category.key}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      <span className="text-lg font-semibold">{rate}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${category.color} transition-all`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LGPD Compliance Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Conformidade LGPD
                </h4>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  Todos os consentimentos são registrados com timestamp, hash de IP e
                  fonte de origem. Os dados são mantidos conforme a política de
                  retenção do projeto para fins de auditoria.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por Anonymous ID..."
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setPage(0);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <button
              onClick={() => refetchLogs()}
              disabled={logsFetching}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${logsFetching ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
          </div>

          {/* Logs List */}
          <div className="rounded-lg border bg-card">
            {logsLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Carregando histórico...
                </p>
              </div>
            ) : !logsData || logsData.logs.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Shield className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">Nenhum registro encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchId
                    ? 'Tente buscar por outro ID'
                    : 'Registros de consentimento aparecerão aqui'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {logsData.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">
                            {log.anonymousId}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {SOURCE_LABELS[log.source]}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(log.categories).map(([key, value]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                value
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {value ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <p>{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {settingsLoading ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Carregando configurações...
              </p>
            </div>
          ) : (
            <>
              {/* Banner Settings */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Banner de Consentimento</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure como o banner de cookies aparece no seu site
                </p>

                <div className="mt-6 space-y-4">
                  {/* Banner Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Exibir Banner</p>
                      <p className="text-sm text-muted-foreground">
                        Mostrar o banner de consentimento para novos visitantes
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSettingsMutation.mutate({
                          bannerEnabled: !settings?.bannerEnabled,
                        })
                      }
                      disabled={updateSettingsMutation.isPending}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings?.bannerEnabled
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings?.bannerEnabled
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Banner Position */}
                  <div>
                    <label className="text-sm font-medium">Posição do Banner</label>
                    <select
                      value={settings?.bannerPosition || 'bottom'}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          bannerPosition: e.target.value as ConsentSettings['bannerPosition'],
                        })
                      }
                      className="mt-1 flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="bottom">Inferior</option>
                      <option value="top">Superior</option>
                      <option value="center">Central (Modal)</option>
                    </select>
                  </div>

                  {/* Banner Theme */}
                  <div>
                    <label className="text-sm font-medium">Tema do Banner</label>
                    <select
                      value={settings?.bannerTheme || 'auto'}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          bannerTheme: e.target.value as ConsentSettings['bannerTheme'],
                        })
                      }
                      className="mt-1 flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="auto">Automático</option>
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Policy URLs */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Links de Políticas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  URLs das suas páginas de políticas de privacidade e cookies
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Política de Privacidade
                    </label>
                    <input
                      type="url"
                      value={settings?.privacyPolicyUrl || ''}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          privacyPolicyUrl: e.target.value,
                        })
                      }
                      placeholder="https://seusite.com/privacidade"
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Política de Cookies</label>
                    <input
                      type="url"
                      value={settings?.cookiePolicyUrl || ''}
                      onChange={(e) =>
                        updateSettingsMutation.mutate({
                          cookiePolicyUrl: e.target.value,
                        })
                      }
                      placeholder="https://seusite.com/cookies"
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Config */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Categorias de Consentimento</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure quais categorias de cookies são exibidas
                </p>

                <div className="mt-6 space-y-4">
                  {/* Necessary - Always enabled */}
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                    <div>
                      <p className="font-medium">Necessários</p>
                      <p className="text-sm text-muted-foreground">
                        Cookies essenciais para o funcionamento do site
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Sempre ativo
                    </span>
                  </div>

                  {[
                    {
                      key: 'analytics',
                      label: 'Analytics',
                      description: 'Cookies de análise e métricas',
                    },
                    {
                      key: 'marketing',
                      label: 'Marketing',
                      description: 'Cookies de publicidade e remarketing',
                    },
                    {
                      key: 'personalization',
                      label: 'Personalização',
                      description: 'Preferências e experiência personalizada',
                    },
                  ].map((category) => {
                    const isEnabled =
                      settings?.categoriesConfig?.[
                        category.key as keyof typeof settings.categoriesConfig
                      ]?.enabled ?? true;

                    return (
                      <div
                        key={category.key}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="font-medium">{category.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const currentConfig = settings?.categoriesConfig ?? defaultCategoriesConfig;
                            const categoryKey = category.key as keyof typeof currentConfig;
                            updateSettingsMutation.mutate({
                              categoriesConfig: {
                                ...currentConfig,
                                [categoryKey]: {
                                  ...currentConfig[categoryKey],
                                  enabled: !isEnabled,
                                },
                              },
                            });
                          }}
                          disabled={updateSettingsMutation.isPending}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isEnabled ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SDK Integration Info */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Integração com SDK
                    </h4>
                    <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                      Para que o banner funcione, certifique-se de que o SDK TrackPro
                      está instalado no seu site com a opção de consentimento habilitada.
                    </p>
                    <a
                      href="#"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
                    >
                      Ver documentação
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
