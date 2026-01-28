'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Route } from 'next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Settings,
  Copy,
  Check,
  Trash2,
  Globe,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
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

export default function LeadFormsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, del, put } = useApi();
  const queryClient = useQueryClient();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const { data: forms, isLoading } = useQuery({
    queryKey: ['lead-forms', tenantId, projectId],
    queryFn: () =>
      get<LeadForm[]>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/forms`,
      ),
    enabled: !!tenantId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ formId, enabled }: { formId: string; enabled: boolean }) =>
      put(`/api/v1/tenants/${tenantId}/projects/${projectId}/leads/forms/${formId}`, {
        enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-forms', tenantId, projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (formId: string) =>
      del(`/api/v1/tenants/${tenantId}/projects/${projectId}/leads/forms/${formId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-forms', tenantId, projectId] });
    },
  });

  const handleCopyCode = (code: string, formId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(formId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = (formId: string, formName: string) => {
    if (confirm(`Tem certeza que deseja excluir o formulário "${formName}"?`)) {
      deleteMutation.mutate(formId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-64 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/projects/${projectId}/leads`}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Formulários de Lead</h1>
            <p className="text-white/60">
              Crie e gerencie formulários para capturar leads do seu site
            </p>
          </div>
        </div>
        <Link
          href={`/projects/${projectId}/leads/forms/new`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Formulário
        </Link>
      </div>

      {forms && forms.length > 0 ? (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div key={form.id} className="rounded-lg border border-white/10 bg-transparent overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-900/30">
                    <Globe className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{form.name}</h2>
                    <p className="text-sm text-white/60">
                      {form.fields.length} campo(s) - Criado em{' '}
                      {new Date(form.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ formId: form.id, enabled: !form.enabled })
                    }
                    disabled={toggleMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.enabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/60">
                    {form.enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Fields preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-white">Campos do formulário:</p>
                  <div className="flex flex-wrap gap-2">
                    {form.fields.map((field) => (
                      <span
                        key={field.name}
                        className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80"
                      >
                        {field.label}
                        {field.required && <span className="text-red-400 ml-0.5">*</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Embed code preview */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">Código de incorporação:</p>
                    <button
                      onClick={() =>
                        setShowPreview(showPreview === form.id ? null : form.id)
                      }
                      className="text-sm text-white/60 hover:text-white"
                    >
                      {showPreview === form.id ? (
                        <>
                          <EyeOff className="inline mr-1 h-4 w-4" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="inline mr-1 h-4 w-4" /> Mostrar
                        </>
                      )}
                    </button>
                  </div>
                  {showPreview === form.id && (
                    <pre className="rounded-md bg-[#0d0d1a] p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto text-white/80">
                      <code>{form.embedCode}</code>
                    </pre>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
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
                  <button
                    onClick={() => handleDelete(form.id, form.name)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center justify-center rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-transparent p-8 text-center">
          <Globe className="mx-auto h-12 w-12 text-white/30" />
          <h3 className="mt-4 font-semibold text-white">Nenhum formulário criado</h3>
          <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
            Crie formulários personalizados para capturar leads diretamente do seu site.
            Os formulários são incorporados facilmente com um simples código HTML.
          </p>
          <Link
            href={`/projects/${projectId}/leads/forms/new`}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Formulário
          </Link>
        </div>
      )}
    </div>
  );
}
