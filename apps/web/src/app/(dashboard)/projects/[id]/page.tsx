'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, Key, Settings, Code, Users } from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Project {
  id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  name: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', tenantId, projectId],
    queryFn: () =>
      get<Project>(`/api/v1/tenants/${tenantId}/projects/${projectId}`),
    enabled: !!tenantId,
  });

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
          href="/projects"
          className="p-2 hover:bg-white/10 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {project?.name}
          </h1>
          <p className="text-white/60">{project?.domain}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">0</p>
              <p className="text-sm text-white/60">Eventos hoje</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-900/30">
              <Key className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">0</p>
              <p className="text-sm text-white/60">API Keys ativas</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/30">
              <Code className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {project?.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </p>
              <p className="text-sm text-white/60">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/projects/${projectId}/settings`}
          className="rounded-lg border border-white/10 bg-transparent p-6 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Configurações</h3>
              <p className="text-sm text-white/60">
                Gerencie API keys, integrações e mais
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/events`}
          className="rounded-lg border border-white/10 bg-transparent p-6 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Eventos</h3>
              <p className="text-sm text-white/60">
                Visualize eventos em tempo real
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/leads`}
          className="rounded-lg border border-white/10 bg-transparent p-6 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-900/30">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Captura de Leads</h3>
              <p className="text-sm text-white/60">
                Configure formulários e integrações para capturar leads
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Integration Code */}
      <div className="rounded-lg border border-white/10 bg-transparent">
        <div className="border-b border-white/10 p-4">
          <h2 className="font-semibold text-white">Código de Integração</h2>
          <p className="text-sm text-white/60">
            Adicione este código ao seu site para começar a rastrear eventos
          </p>
        </div>
        <div className="p-4">
          <div className="relative rounded-md bg-[#1a1a2e] p-4">
            <pre className="overflow-x-auto text-sm text-white/80">
              <code>{`<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'trackpro.start':
  new Date().getTime(),event:'trackpro.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s);j.async=true;j.src='https://cdn.trackpro.io/tp.js';
  f.parentNode.insertBefore(j,f);
  })(window,document,'script','tpLayer','${projectId}');

  // Exemplo de uso:
  // trackpro.track('page_view', { page: window.location.pathname });
</script>`}</code>
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'trackpro.start':
  new Date().getTime(),event:'trackpro.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s);j.async=true;j.src='https://cdn.trackpro.io/tp.js';
  f.parentNode.insertBefore(j,f);
  })(window,document,'script','tpLayer','${projectId}');
</script>`);
              }}
              className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
            >
              Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
