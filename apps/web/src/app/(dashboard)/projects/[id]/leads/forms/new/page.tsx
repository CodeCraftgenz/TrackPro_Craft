'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Type,
  Mail,
  Phone,
  List,
  AlignLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

interface FormStyling {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  successMessage: string;
}

const fieldTypeIcons = {
  text: Type,
  email: Mail,
  phone: Phone,
  select: List,
  textarea: AlignLeft,
};

const fieldTypeLabels = {
  text: 'Texto',
  email: 'E-mail',
  phone: 'Telefone',
  select: 'Seleção',
  textarea: 'Texto longo',
};

const defaultStyling: FormStyling = {
  primaryColor: '#00E4F2',
  backgroundColor: '#1A1A2E',
  textColor: '#FFFFFF',
  buttonText: 'Enviar',
  successMessage: 'Obrigado! Entraremos em contato em breve.',
};

export default function NewLeadFormPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { get, post } = useApi();

  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormField[]>([
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
  ]);
  const [styling, setStyling] = useState<FormStyling>(defaultStyling);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showStyling, setShowStyling] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      fields: FormField[];
      styling?: FormStyling;
      redirectUrl?: string;
    }) =>
      post(`/api/v1/tenants/${tenantId}/projects/${projectId}/leads/forms`, data),
    onSuccess: () => {
      router.push(`/projects/${projectId}/leads/forms`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const addField = (type: FormField['type']) => {
    const baseName = type === 'email' ? 'email' : type === 'phone' ? 'phone' : `field_${fields.length + 1}`;
    const baseLabel =
      type === 'email' ? 'E-mail' : type === 'phone' ? 'Telefone' : type === 'textarea' ? 'Mensagem' : 'Campo';

    setFields([
      ...fields,
      {
        name: baseName,
        label: baseLabel,
        type,
        required: false,
        options: type === 'select' ? ['Opção 1', 'Opção 2'] : undefined,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formName.trim()) {
      setError('Nome do formulário é obrigatório');
      return;
    }

    if (fields.length === 0) {
      setError('Adicione pelo menos um campo ao formulário');
      return;
    }

    createMutation.mutate({
      name: formName,
      fields,
      styling,
      redirectUrl: redirectUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/projects/${projectId}/leads/forms`}
          className="p-2 hover:bg-white/10 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Novo Formulário</h1>
          <p className="text-white/60">
            Configure os campos e estilo do formulário
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form Name */}
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <label htmlFor="formName" className="text-sm font-medium text-white">
            Nome do Formulário
          </label>
          <input
            id="formName"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="mt-2 flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            placeholder="Ex: Formulário de Contato"
            required
          />
        </div>

        {/* Fields Builder */}
        <div className="rounded-lg border border-white/10 bg-transparent">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="font-semibold text-white">Campos do Formulário</h2>
              <p className="text-sm text-white/60">
                Arraste para reordenar os campos
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {fields.map((field, index) => {
              const Icon = fieldTypeIcons[field.type];
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border border-white/10 p-4"
                >
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <GripVertical className="h-4 w-4 text-white/60" />
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                    <Icon className="h-5 w-5 text-white/60" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-white/60">
                          Nome do campo (sem espaços)
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, {
                              name: e.target.value.replace(/\s/g, '_'),
                            })
                          }
                          className="mt-1 flex h-9 w-full rounded-md border border-white/20 bg-white/5 px-3 py-1 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">
                          Label (exibido ao usuário)
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          className="mt-1 flex h-9 w-full rounded-md border border-white/20 bg-white/5 px-3 py-1 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          className="rounded border-white/20"
                        />
                        Campo obrigatório
                      </label>
                      <span className="text-xs text-white/60">
                        Tipo: {fieldTypeLabels[field.type]}
                      </span>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="text-xs text-white/60">
                          Opções (uma por linha)
                        </label>
                        <textarea
                          value={field.options?.join('\n') || ''}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value.split('\n').filter(Boolean),
                            })
                          }
                          rows={3}
                          className="mt-1 flex w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Add Field Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
              <span className="text-sm text-white/60 mr-2">Adicionar campo:</span>
              {(Object.keys(fieldTypeIcons) as FormField['type'][]).map((type) => {
                const Icon = fieldTypeIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type)}
                    className="inline-flex items-center rounded-md border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {fieldTypeLabels[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Styling Options */}
        <div className="rounded-lg border border-white/10 bg-transparent">
          <button
            type="button"
            onClick={() => setShowStyling(!showStyling)}
            className="flex w-full items-center justify-between p-4"
          >
            <div>
              <h2 className="font-semibold text-left text-white">Personalização</h2>
              <p className="text-sm text-white/60">
                Cores e mensagens do formulário
              </p>
            </div>
            {showStyling ? (
              <ChevronUp className="h-5 w-5 text-white" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white" />
            )}
          </button>

          {showStyling && (
            <div className="border-t border-white/10 p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-white">Cor principal</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.primaryColor}
                      onChange={(e) =>
                        setStyling({ ...styling, primaryColor: e.target.value })
                      }
                      className="h-10 w-14 rounded border border-white/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.primaryColor}
                      onChange={(e) =>
                        setStyling({ ...styling, primaryColor: e.target.value })
                      }
                      className="flex h-10 flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Cor de fundo</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.backgroundColor}
                      onChange={(e) =>
                        setStyling({ ...styling, backgroundColor: e.target.value })
                      }
                      className="h-10 w-14 rounded border border-white/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.backgroundColor}
                      onChange={(e) =>
                        setStyling({ ...styling, backgroundColor: e.target.value })
                      }
                      className="flex h-10 flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Cor do texto</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={styling.textColor}
                      onChange={(e) =>
                        setStyling({ ...styling, textColor: e.target.value })
                      }
                      className="h-10 w-14 rounded border border-white/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={styling.textColor}
                      onChange={(e) =>
                        setStyling({ ...styling, textColor: e.target.value })
                      }
                      className="flex h-10 flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-white">Texto do botão</label>
                  <input
                    type="text"
                    value={styling.buttonText}
                    onChange={(e) =>
                      setStyling({ ...styling, buttonText: e.target.value })
                    }
                    className="mt-2 flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">URL de redirecionamento</label>
                  <input
                    type="url"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://seu-site.com/obrigado"
                    className="mt-2 flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white">Mensagem de sucesso</label>
                <input
                  type="text"
                  value={styling.successMessage}
                  onChange={(e) =>
                    setStyling({ ...styling, successMessage: e.target.value })
                  }
                  className="mt-2 flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Preview */}
        <div className="rounded-lg border border-white/10 bg-transparent">
          <div className="border-b border-white/10 p-4">
            <h2 className="font-semibold text-white">Preview</h2>
          </div>
          <div className="p-8 flex justify-center">
            <div
              className="w-full max-w-md rounded-lg p-6"
              style={{
                backgroundColor: styling.backgroundColor,
                color: styling.textColor,
              }}
            >
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        disabled
                        rows={3}
                        className="w-full rounded border px-3 py-2 text-sm bg-white/10"
                        placeholder={`Digite ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        disabled
                        className="w-full rounded border px-3 py-2 text-sm bg-white/10"
                      >
                        <option>Selecione...</option>
                        {field.options?.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        disabled
                        className="w-full rounded border px-3 py-2 text-sm bg-white/10"
                        placeholder={
                          field.type === 'email'
                            ? 'exemplo@email.com'
                            : field.type === 'phone'
                            ? '(11) 99999-9999'
                            : `Digite ${field.label.toLowerCase()}`
                        }
                      />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  disabled
                  className="w-full rounded-md py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: styling.primaryColor }}
                >
                  {styling.buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/projects/${projectId}/leads/forms`}
            className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Criar Formulário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
