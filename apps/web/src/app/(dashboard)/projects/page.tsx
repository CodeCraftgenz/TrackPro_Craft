'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, MoreVertical, Trash2, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Project {
  id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function ProjectsPage() {
  const { get, post, del } = useApi();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', domain: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  // Auto-create tenant if user doesn't have one
  const createTenantMutation = useMutation({
    mutationFn: (name: string) =>
      post<Tenant>('/api/v1/tenants', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  // Check if we need to create a tenant
  const needsTenant = !tenantsLoading && (!tenants || tenants.length === 0);

  // Auto-create tenant on first load if needed
  useEffect(() => {
    if (needsTenant && !createTenantMutation.isPending && !createTenantMutation.isSuccess) {
      createTenantMutation.mutate('Minha Empresa');
    }
  }, [needsTenant, createTenantMutation]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: () =>
      get<Project[]>(`/api/v1/tenants/${tenantId}/projects`),
    enabled: !!tenantId,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; domain: string }) =>
      post(`/api/v1/tenants/${tenantId}/projects`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', tenantId] });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', domain: '' });
      setCreateError(null);
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) =>
      del(`/api/v1/tenants/${tenantId}/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', tenantId] });
    },
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createProjectMutation.mutate(createForm);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      deleteProjectMutation.mutate(projectId);
    }
    setOpenMenuId(null);
  };

  const isLoading = tenantsLoading || projectsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Projetos</h1>
          <p className="text-white/60">
            Gerencie seus projetos de tracking
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 border-dashed p-12">
          <FolderKanban className="h-12 w-12 text-white/30" />
          <h3 className="mt-4 text-lg font-semibold text-white">Nenhum projeto</h3>
          <p className="mt-2 text-sm text-white/60 text-center">
            Você ainda não tem nenhum projeto.
            <br />
            Crie um para começar a rastrear eventos.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <div
              key={project.id}
              className="relative rounded-lg border border-white/10 bg-transparent hover:bg-white/5 transition-all"
            >
              <Link href={`/projects/${project.id}`} className="block p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-white/60">
                        {project.domain}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-xs text-white/50">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {project.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                  <span>
                    Criado em{' '}
                    {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </Link>

              {/* Actions menu */}
              <div className="absolute right-4 top-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === project.id ? null : project.id);
                  }}
                  className="p-1 hover:bg-white/10 rounded-md"
                >
                  <MoreVertical className="h-4 w-4 text-white/60" />
                </button>

                {openMenuId === project.id && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-white/10 bg-[#1a1a2e] shadow-lg z-10">
                    <Link
                      href={`/projects/${project.id}/settings`}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-white hover:bg-white/10"
                      onClick={() => setOpenMenuId(null)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg bg-[#1a1a2e] border border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white">Criar Novo Projeto</h2>
            <p className="mt-1 text-sm text-white/60">
              Configure um novo projeto de tracking para seu site
            </p>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              {createError && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white">
                  Nome do Projeto
                </label>
                <input
                  id="name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Meu Site"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium text-white">
                  Domínio
                </label>
                <input
                  id="domain"
                  type="text"
                  value={createForm.domain}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, domain: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="meusite.com.br"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateForm({ name: '', domain: '' });
                    setCreateError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
