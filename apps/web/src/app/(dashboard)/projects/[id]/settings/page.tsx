'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface NewApiKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  scopes: string[];
}

interface Tenant {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  domain: string;
  status: string;
}

const AVAILABLE_SCOPES = [
  { value: 'events:write', label: 'Enviar eventos', description: 'Permite enviar eventos para o projeto' },
  { value: 'events:read', label: 'Ler eventos', description: 'Permite ler eventos do projeto' },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, post, put, del } = useApi();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', scopes: ['events:write'] });
  const [createError, setCreateError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<NewApiKeyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', domain: '' });
  const [projectError, setProjectError] = useState<string | null>(null);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', tenantId, projectId],
    queryFn: () =>
      get<Project>(`/api/v1/tenants/${tenantId}/projects/${projectId}`),
    enabled: !!tenantId,
  });

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['apiKeys', tenantId, projectId],
    queryFn: () =>
      get<{ data: ApiKey[] }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/api-keys`,
      ),
    enabled: !!tenantId,
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (data: { name: string; scopes: string[] }) =>
      post<NewApiKeyResponse>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/api-keys`,
        data,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', tenantId, projectId] });
      setNewApiKey(data);
      setCreateForm({ name: '', scopes: ['events:write'] });
      setCreateError(null);
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (keyId: string) =>
      del(`/api/v1/tenants/${tenantId}/projects/${projectId}/api-keys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', tenantId, projectId] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: { name: string; domain: string }) =>
      put(`/api/v1/tenants/${tenantId}/projects/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', tenantId, projectId] });
      setEditingProject(false);
      setProjectError(null);
    },
    onError: (error: Error) => {
      setProjectError(error.message);
    },
  });

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createApiKeyMutation.mutate(createForm);
  };

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleDeleteApiKey = (keyId: string) => {
    if (confirm('Tem certeza que deseja revogar esta API key?')) {
      deleteApiKeyMutation.mutate(keyId);
    }
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    updateProjectMutation.mutate(projectForm);
  };

  const handleStartEdit = () => {
    if (project) {
      setProjectForm({ name: project.name, domain: project.domain });
      setEditingProject(true);
    }
  };

  const toggleScope = (scope: string) => {
    setCreateForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  if (projectLoading || keysLoading) {
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
          href={`/projects/${projectId}`}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Configurações
          </h1>
          <p className="text-muted-foreground">{project?.name}</p>
        </div>
      </div>

      {/* Project Settings */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Informações do Projeto</h2>
            <p className="text-sm text-muted-foreground">
              Dados básicos do projeto
            </p>
          </div>
          {!editingProject && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Editar
            </button>
          )}
        </div>
        <div className="p-4">
          {editingProject ? (
            <form onSubmit={handleUpdateProject} className="space-y-4">
              {projectError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {projectError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="projectName" className="text-sm font-medium">
                    Nome
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, name: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="projectDomain" className="text-sm font-medium">
                    Domínio
                  </label>
                  <input
                    id="projectDomain"
                    type="text"
                    value={projectForm.domain}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, domain: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingProject(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateProjectMutation.isPending ? (
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{project?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Domínio</p>
                <p className="font-medium">{project?.domain}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie as chaves de API do projeto
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova API Key
          </button>
        </div>
        <div className="p-4">
          {apiKeys?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Key className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Nenhuma API Key</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie uma API key para começar a enviar eventos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys?.data?.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <code className="rounded bg-muted px-1">
                          {key.keyPrefix}...
                        </code>
                        <span>•</span>
                        <span>
                          {key.scopes.map((s) => s.split(':')[1]).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {key.lastUsedAt
                        ? `Usado em ${new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}`
                        : 'Nunca usado'}
                    </span>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                      title="Revogar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {isCreateModalOpen && !newApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Criar Nova API Key</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A chave será exibida apenas uma vez
            </p>

            <form onSubmit={handleCreateApiKey} className="mt-6 space-y-4">
              {createError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="keyName" className="text-sm font-medium">
                  Nome da Key
                </label>
                <input
                  id="keyName"
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Produção, Desenvolvimento, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Permissões</label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-start space-x-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.scopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{scope.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {scope.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateForm({ name: '', scopes: ['events:write'] });
                    setCreateError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createApiKeyMutation.isPending || createForm.scopes.length === 0}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createApiKeyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar API Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New API Key Display Modal */}
      {newApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Salve sua API Key</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta chave não será exibida novamente. Copie e guarde em um local seguro.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <p className="text-sm">{newApiKey.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 rounded-md bg-muted p-3 text-sm break-all">
                    {newApiKey.key}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 hover:bg-accent rounded-md"
                    title="Copiar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {copiedKey && (
                  <p className="text-xs text-green-600">Copiado!</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setNewApiKey(null);
                  setIsCreateModalOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Entendi, salvei a chave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
