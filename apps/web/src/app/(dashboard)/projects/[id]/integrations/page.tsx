'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Settings,
  Facebook,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface MetaIntegration {
  id: string;
  pixelId: string;
  testEventCode: string | null;
  enabled: boolean;
  hasAccessToken: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface TestResult {
  success: boolean;
  pixelName?: string;
  pixelId?: string;
  error?: string;
}

export default function ProjectIntegrationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, post, put, del } = useApi();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [form, setForm] = useState({
    pixelId: '',
    accessToken: '',
    testEventCode: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const { data: integration, isLoading } = useQuery({
    queryKey: ['meta-integration', tenantId, projectId],
    queryFn: () =>
      get<MetaIntegration | null>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/integrations/meta`,
      ),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { pixelId: string; accessToken: string; testEventCode?: string }) =>
      post(`/api/v1/tenants/${tenantId}/projects/${projectId}/integrations/meta`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-integration', tenantId, projectId] });
      setIsEditing(false);
      setForm({ pixelId: '', accessToken: '', testEventCode: '' });
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      pixelId?: string;
      accessToken?: string;
      testEventCode?: string | null;
      enabled?: boolean;
    }) =>
      put(`/api/v1/tenants/${tenantId}/projects/${projectId}/integrations/meta`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-integration', tenantId, projectId] });
      setIsEditing(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      del(`/api/v1/tenants/${tenantId}/projects/${projectId}/integrations/meta`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-integration', tenantId, projectId] });
      setForm({ pixelId: '', accessToken: '', testEventCode: '' });
    },
  });

  const testMutation = useMutation({
    mutationFn: () =>
      post<TestResult>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/integrations/meta/test`,
        {},
      ),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (err: Error) => {
      setTestResult({ success: false, error: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (integration) {
      const updateData: Record<string, unknown> = {};
      if (form.pixelId && form.pixelId !== integration.pixelId) {
        updateData.pixelId = form.pixelId;
      }
      if (form.accessToken) {
        updateData.accessToken = form.accessToken;
      }
      if (form.testEventCode !== (integration.testEventCode || '')) {
        updateData.testEventCode = form.testEventCode || null;
      }
      updateMutation.mutate(updateData);
    } else {
      if (!form.pixelId || !form.accessToken) {
        setError('Pixel ID e Access Token são obrigatórios');
        return;
      }
      createMutation.mutate({
        pixelId: form.pixelId,
        accessToken: form.accessToken,
        testEventCode: form.testEventCode || undefined,
      });
    }
  };

  const handleToggleEnabled = () => {
    if (integration) {
      updateMutation.mutate({ enabled: !integration.enabled });
    }
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover a integração Meta CAPI?')) {
      deleteMutation.mutate();
    }
  };

  const handleStartEdit = () => {
    if (integration) {
      setForm({
        pixelId: integration.pixelId,
        accessToken: '',
        testEventCode: integration.testEventCode || '',
      });
    }
    setIsEditing(true);
    setTestResult(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/projects/${projectId}/settings`}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Configure integrações com plataformas externas
          </p>
        </div>
      </div>

      {/* Meta CAPI Integration */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold">Meta Conversions API</h2>
              <p className="text-sm text-muted-foreground">
                Envie eventos server-side para o Meta
              </p>
            </div>
          </div>
          {integration && !isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleEnabled}
                disabled={updateMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  integration.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    integration.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {integration.enabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {!integration && !isEditing ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Facebook className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Meta CAPI não configurado</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Configure a integração para enviar eventos de conversão
                diretamente para o Meta via server-side tracking.
              </p>
              <button
                onClick={handleStartEdit}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurar Integração
              </button>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="pixelId" className="text-sm font-medium">
                  Pixel ID
                </label>
                <input
                  id="pixelId"
                  type="text"
                  value={form.pixelId}
                  onChange={(e) => setForm({ ...form, pixelId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="123456789012345"
                  required={!integration}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre no Gerenciador de Eventos do Meta Business Suite
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="accessToken" className="text-sm font-medium">
                  Access Token {integration && '(deixe vazio para manter o atual)'}
                </label>
                <div className="relative">
                  <input
                    id="accessToken"
                    type={showAccessToken ? 'text' : 'password'}
                    value={form.accessToken}
                    onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 pr-10 py-2 text-sm"
                    placeholder="EAAxxxxxxxxxxxxxxxxx"
                    required={!integration}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAccessToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token de acesso do sistema com permissão ads_management
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="testEventCode" className="text-sm font-medium">
                  Test Event Code (opcional)
                </label>
                <input
                  id="testEventCode"
                  type="text"
                  value={form.testEventCode}
                  onChange={(e) => setForm({ ...form, testEventCode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="TEST12345"
                />
                <p className="text-xs text-muted-foreground">
                  Use para testar eventos no Event Manager antes de ir para produção
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    setForm({ pixelId: '', accessToken: '', testEventCode: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Integration Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pixel ID</p>
                  <p className="font-medium font-mono">{integration?.pixelId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Access Token</p>
                  <p className="font-medium">
                    {integration?.hasAccessToken ? '••••••••••••••••' : 'Não configurado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test Event Code</p>
                  <p className="font-medium">
                    {integration?.testEventCode || 'Não configurado (produção)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">
                    {integration?.updatedAt
                      ? new Date(integration.updatedAt).toLocaleString('pt-BR')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`rounded-md p-4 ${
                    testResult.success
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <p
                      className={`font-medium ${
                        testResult.success
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {testResult.success
                        ? `Conexão bem sucedida! Pixel: ${testResult.pixelName}`
                        : `Falha na conexão: ${testResult.error}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  {testMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Testar Conexão
                </button>
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Remover Integração
                </button>
              </div>

              {/* Warning */}
              {integration?.testEventCode && (
                <div className="flex items-start space-x-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 p-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                      Modo de Teste Ativo
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Os eventos estão sendo enviados com código de teste. Remova o
                      Test Event Code quando estiver pronto para produção.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Link to Delivery Logs */}
      {integration && (
        <Link
          href={`/projects/${projectId}/integrations/logs`}
          className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
        >
          <div>
            <h3 className="font-semibold">Logs de Entrega</h3>
            <p className="text-sm text-muted-foreground">
              Visualize o histórico de envios para o Meta CAPI
            </p>
          </div>
          <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}
