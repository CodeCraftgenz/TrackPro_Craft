'use client';

import { useState } from 'react';
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
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: () =>
      get<{ data: Project[] }>(`/api/v1/tenants/${tenantId}/projects`),
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
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
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
      ) : projects?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum projeto</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
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
          {projects?.data?.map((project) => (
            <div
              key={project.id}
              className="relative rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <Link href={`/projects/${project.id}`} className="block p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.domain}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-xs text-muted-foreground">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {project.status === 'active' ? 'Ativo' : 'Inativo'}
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
                  className="p-1 hover:bg-accent rounded-md"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>

                {openMenuId === project.id && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-card shadow-lg z-10">
                    <Link
                      href={`/projects/${project.id}/settings`}
                      className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setOpenMenuId(null)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-destructive hover:bg-accent"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Criar Novo Projeto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure um novo projeto de tracking para seu site
            </p>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              {createError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Projeto
                </label>
                <input
                  id="name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Meu Site"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium">
                  Domínio
                </label>
                <input
                  id="domain"
                  type="text"
                  value={createForm.domain}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, domain: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
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
