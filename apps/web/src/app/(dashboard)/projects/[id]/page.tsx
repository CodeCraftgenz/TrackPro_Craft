'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, Key, Settings, Code, Users, Copy, Check } from 'lucide-react';
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

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface ProjectStats {
  totalEvents: number;
  eventsToday: number;
  uniqueUsers: number;
  topEvents: Array<{ event_name: string; count: number }>;
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

  const { data: apiKeys } = useQuery({
    queryKey: ['apiKeys', tenantId, projectId],
    queryFn: () =>
      get<ApiKey[]>(`/api/v1/tenants/${tenantId}/projects/${projectId}/api-keys`),
    enabled: !!tenantId,
  });

  const { data: stats } = useQuery({
    queryKey: ['projectStats', tenantId, projectId],
    queryFn: () =>
      get<ProjectStats>(`/api/v1/tenants/${tenantId}/projects/${projectId}/stats`),
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
              <p className="text-2xl font-semibold text-white">{stats?.eventsToday ?? 0}</p>
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
              <p className="text-2xl font-semibold text-white">{apiKeys?.length ?? 0}</p>
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

      {/* Lead Capture Script */}
      <LeadCaptureCodeSection projectId={projectId} apiKey={apiKeys?.[0]?.keyPrefix ? `${apiKeys[0].keyPrefix}...` : undefined} />
    </div>
  );
}

function LeadCaptureCodeSection({ apiKey }: { projectId: string; apiKey?: string }) {
  const [copied, setCopied] = useState(false);
  const [formSelector, setFormSelector] = useState('#contact-form');

  const apiUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001';

  const scriptCode = `<!-- ZtackPro Lead Capture - Cole antes do </body> -->
<script>
(function() {
  var ZTACKPRO_CONFIG = {
    apiUrl: '${apiUrl}/api/v1/public/leads/webhook',
    apiKey: 'COLE_SUA_API_KEY_AQUI',
    formSelector: '${formSelector}', // Altere para o seletor do seu formulário
    successMessage: 'Obrigado! Entraremos em contato em breve.',
    errorMessage: 'Erro ao enviar. Tente novamente.'
  };

  function init() {
    var forms = document.querySelectorAll(ZTACKPRO_CONFIG.formSelector);
    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var formData = new FormData(form);
        var data = {};
        formData.forEach(function(value, key) {
          if (['name', 'nome', 'email', 'phone', 'telefone', 'celular', 'whatsapp'].includes(key.toLowerCase())) {
            var normalizedKey = key.toLowerCase();
            if (normalizedKey === 'nome') normalizedKey = 'name';
            if (['telefone', 'celular', 'whatsapp'].includes(normalizedKey)) normalizedKey = 'phone';
            data[normalizedKey] = value;
          } else {
            data.custom = data.custom || {};
            data.custom[key] = value;
          }
        });

        // Captura UTMs
        var params = new URLSearchParams(window.location.search);
        data.utm_source = params.get('utm_source') || '';
        data.utm_medium = params.get('utm_medium') || '';
        data.utm_campaign = params.get('utm_campaign') || '';
        data.page_url = window.location.href;
        data.referrer = document.referrer;

        fetch(ZTACKPRO_CONFIG.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ZTACKPRO_CONFIG.apiKey
          },
          body: JSON.stringify(data)
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
          if (result.success) {
            alert(ZTACKPRO_CONFIG.successMessage);
            form.reset();
          } else {
            alert(ZTACKPRO_CONFIG.errorMessage + ' (' + (result.error || 'Erro') + ')');
          }
        })
        .catch(function() {
          alert(ZTACKPRO_CONFIG.errorMessage);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-transparent">
      <div className="border-b border-white/10 p-4">
        <h2 className="font-semibold text-white">Captura de Leads (Fácil)</h2>
        <p className="text-sm text-white/60">
          Cole este código no seu site para capturar leads automaticamente de qualquer formulário
        </p>
      </div>
      <div className="p-4 space-y-4">
        {/* Configuração do seletor */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            Seletor CSS do seu formulário:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formSelector}
              onChange={(e) => setFormSelector(e.target.value)}
              placeholder="#meu-formulario ou .contact-form"
              className="flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <p className="text-xs text-white/50">
            Exemplos: <code className="bg-white/10 px-1 rounded">#contact-form</code>,
            <code className="bg-white/10 px-1 rounded ml-1">.formulario</code>,
            <code className="bg-white/10 px-1 rounded ml-1">form</code> (todos os forms)
          </p>
        </div>

        {/* Instruções */}
        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-sm text-blue-300 font-medium mb-2">Instruções:</p>
          <ol className="text-xs text-blue-200/80 space-y-1 list-decimal list-inside">
            <li>Copie o código abaixo</li>
            <li>Substitua <code className="bg-blue-500/20 px-1 rounded">COLE_SUA_API_KEY_AQUI</code> pela sua API Key</li>
            <li>Altere o <code className="bg-blue-500/20 px-1 rounded">formSelector</code> se necessário</li>
            <li>Cole antes do <code className="bg-blue-500/20 px-1 rounded">&lt;/body&gt;</code> do seu site</li>
          </ol>
        </div>

        {/* Código */}
        <div className="relative">
          <pre className="rounded-md bg-[#1a1a2e] p-4 overflow-x-auto text-xs text-white/80 max-h-64 overflow-y-auto">
            <code>{scriptCode}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copiar
              </>
            )}
          </button>
        </div>

        {apiKey && (
          <p className="text-xs text-white/50">
            Sua API Key começa com: <code className="bg-white/10 px-1 rounded">{apiKey}</code>
            {' '}— Veja a chave completa em Configurações
          </p>
        )}
      </div>
    </div>
  );
}
