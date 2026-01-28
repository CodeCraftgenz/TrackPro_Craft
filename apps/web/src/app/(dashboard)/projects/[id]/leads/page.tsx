'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Route } from 'next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Facebook,
  Instagram,
  Globe,
  Settings,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Plus,
  Copy,
  ExternalLink,
  RefreshCw,
  Users,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface LeadIntegration {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'WEBSITE';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ERROR';
  pageId: string | null;
  pageName: string | null;
  formIds: string[] | null;
  hasAccessToken: boolean;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadForm {
  id: string;
  name: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  styling: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonText?: string;
    successMessage?: string;
  } | null;
  redirectUrl: string | null;
  enabled: boolean;
  embedCode: string;
  createdAt: string;
  updatedAt: string;
}

const platformConfig = {
  FACEBOOK: {
    name: 'Facebook Lead Ads',
    description: 'Capture leads diretamente dos anúncios do Facebook',
    icon: Facebook,
    color: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  INSTAGRAM: {
    name: 'Instagram Lead Ads',
    description: 'Capture leads dos anúncios do Instagram',
    icon: Instagram,
    color: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  TWITTER: {
    name: 'Twitter Lead Generation',
    description: 'Capture leads do Twitter Ads',
    icon: Users,
    color: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  WEBSITE: {
    name: 'Formulário do Site',
    description: 'Crie formulários personalizados para seu site',
    icon: Globe,
    color: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

export default function LeadsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, post } = useApi();
  const queryClient = useQueryClient();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['lead-integrations', tenantId, projectId],
    queryFn: () =>
      get<LeadIntegration[]>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/integrations`,
      ),
    enabled: !!tenantId,
  });

  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ['lead-forms', tenantId, projectId],
    queryFn: () =>
      get<LeadForm[]>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/forms`,
      ),
    enabled: !!tenantId,
  });

  const connectFacebookMutation = useMutation({
    mutationFn: () =>
      get<{ url: string }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/integrations/facebook/oauth-url`,
      ),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const syncFacebookMutation = useMutation({
    mutationFn: () =>
      post<{ synced: number; errors: number }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/integrations/facebook/sync`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-integrations', tenantId, projectId] });
    },
  });

  const getIntegrationByPlatform = (platform: keyof typeof platformConfig) => {
    return integrations?.find((i) => i.platform === platform);
  };

  const handleCopyCode = (code: string, formId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(formId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (integrationsLoading || formsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-64 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/projects/${projectId}/settings`}
          className="p-2 hover:bg-white/10 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Captura de Leads</h1>
          <p className="text-white/60">
            Configure integrações e formulários para captura de leads
          </p>
        </div>
      </div>

      {/* Platform Integrations */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(platformConfig).map(([platform, config]) => {
          const integration = getIntegrationByPlatform(platform as keyof typeof platformConfig);
          const Icon = config.icon;

          return (
            <div key={platform} className="rounded-lg border border-white/10 bg-transparent overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{config.name}</h2>
                    <p className="text-sm text-white/60">{config.description}</p>
                  </div>
                </div>
                {integration && (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        integration.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : integration.status === 'ERROR'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {integration.status === 'ACTIVE' && <Check className="mr-1 h-3 w-3" />}
                      {integration.status === 'ERROR' && <X className="mr-1 h-3 w-3" />}
                      {integration.status === 'ACTIVE'
                        ? 'Conectado'
                        : integration.status === 'ERROR'
                        ? 'Erro'
                        : 'Pendente'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                {platform === 'FACEBOOK' && (
                  <>
                    {!integration ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-white/60 mb-4">
                          Conecte sua conta do Facebook para receber leads automaticamente
                        </p>
                        <button
                          onClick={() => connectFacebookMutation.mutate()}
                          disabled={connectFacebookMutation.isPending}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {connectFacebookMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Facebook className="mr-2 h-4 w-4" />
                          )}
                          Conectar Facebook
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {integration.pageName && (
                          <div>
                            <p className="text-sm text-white/60">Página conectada</p>
                            <p className="font-medium text-white">{integration.pageName}</p>
                          </div>
                        )}
                        {integration.formIds && integration.formIds.length > 0 && (
                          <div>
                            <p className="text-sm text-white/60">Formulários ativos</p>
                            <p className="font-medium text-white">{integration.formIds.length} formulário(s)</p>
                          </div>
                        )}
                        {integration.lastSyncAt && (
                          <div>
                            <p className="text-sm text-white/60">Última sincronização</p>
                            <p className="font-medium text-white">
                              {new Date(integration.lastSyncAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                        {integration.errorMessage && (
                          <div className="flex items-start space-x-2 rounded-md bg-red-100 dark:bg-red-900/30 p-3">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {integration.errorMessage}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => syncFacebookMutation.mutate()}
                            disabled={syncFacebookMutation.isPending}
                            className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
                          >
                            {syncFacebookMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Sincronizar
                          </button>
                          <Link
                            href={`/projects/${projectId}/leads/facebook` as Route}
                            className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {platform === 'INSTAGRAM' && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-sm text-white/60 mb-2">
                      A integração com Instagram Lead Ads usa a mesma conexão do Facebook
                    </p>
                    {getIntegrationByPlatform('FACEBOOK') ? (
                      <span className="inline-flex items-center text-sm text-green-400">
                        <Check className="mr-1 h-4 w-4" /> Disponível
                      </span>
                    ) : (
                      <span className="text-sm text-white/60">
                        Conecte o Facebook primeiro
                      </span>
                    )}
                  </div>
                )}

                {platform === 'TWITTER' && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-sm text-white/60">
                      Integração com Twitter Lead Generation em breve
                    </p>
                  </div>
                )}

                {platform === 'WEBSITE' && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-sm text-white/60 mb-4">
                      Crie formulários personalizados para capturar leads do seu site
                    </p>
                    <Link
                      href={`/projects/${projectId}/leads/forms`}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Gerenciar Formulários
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Website Forms */}
      {forms && forms.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-transparent">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="font-semibold text-white">Formulários do Site</h2>
              <p className="text-sm text-white/60">
                Formulários ativos para captura de leads
              </p>
            </div>
            <Link
              href={`/projects/${projectId}/leads/forms/new`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Formulário
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-white">{form.name}</h3>
                  <p className="text-sm text-white/60">
                    {form.fields.length} campo(s) - {form.enabled ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(form.embedCode, form.id)}
                    className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                  >
                    {copiedCode === form.id ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código
                      </>
                    )}
                  </button>
                  <Link
                    href={`/projects/${projectId}/leads/forms/${form.id}` as Route}
                    className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Link */}
      <Link
        href={`/projects/${projectId}/leads/reports`}
        className="flex items-center justify-between rounded-lg border border-white/10 bg-transparent p-4 hover:bg-white/5 transition-colors"
      >
        <div>
          <h3 className="font-semibold text-white">Relatórios de Leads</h3>
          <p className="text-sm text-white/60">
            Visualize estatísticas e histórico de leads capturados
          </p>
        </div>
        <ExternalLink className="h-5 w-5 text-white/60" />
      </Link>
    </div>
  );
}
