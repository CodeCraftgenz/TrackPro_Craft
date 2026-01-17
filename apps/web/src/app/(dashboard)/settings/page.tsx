'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Building2,
  Mail,
  Shield,
} from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'analyst';
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  memberships: Member[];
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  analyst: 'Analista',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: 'Acesso total, pode gerenciar membros e faturamento',
  admin: 'Pode gerenciar projetos e membros',
  analyst: 'Pode visualizar dados e relatórios',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { get, post, put, del } = useApi();
  const queryClient = useQueryClient();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'analyst' });
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [editingTenant, setEditingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({ name: '' });
  const [tenantError, setTenantError] = useState<string | null>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenant = tenants?.data?.[0];

  const updateTenantMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      put(`/api/v1/tenants/${tenant?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingTenant(false);
      setTenantError(null);
    },
    onError: (error: Error) => {
      setTenantError(error.message);
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      post(`/api/v1/tenants/${tenant?.id}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', role: 'analyst' });
      setInviteError(null);
    },
    onError: (error: Error) => {
      setInviteError(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      del(`/api/v1/tenants/${tenant?.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const handleUpdateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);
    updateTenantMutation.mutate(tenantForm);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    inviteMemberMutation.mutate(inviteForm);
  };

  const handleRemoveMember = (userId: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover ${name} do workspace?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  const handleStartEdit = () => {
    if (tenant) {
      setTenantForm({ name: tenant.name });
      setEditingTenant(true);
    }
  };

  const currentMember = tenant?.memberships?.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === 'owner';
  const isAdmin = currentMember?.role === 'admin' || isOwner;

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu workspace e membros
        </p>
      </div>

      {/* Workspace Settings */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Workspace</h2>
              <p className="text-sm text-muted-foreground">
                Informações do seu workspace
              </p>
            </div>
          </div>
          {isOwner && !editingTenant && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Editar
            </button>
          )}
        </div>
        <div className="p-4">
          {editingTenant ? (
            <form onSubmit={handleUpdateTenant} className="space-y-4">
              {tenantError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {tenantError}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="tenantName" className="text-sm font-medium">
                  Nome do Workspace
                </label>
                <input
                  id="tenantName"
                  type="text"
                  value={tenantForm.name}
                  onChange={(e) =>
                    setTenantForm({ ...tenantForm, name: e.target.value })
                  }
                  className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateTenantMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateTenantMutation.isPending ? (
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{tenant?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="font-medium">{tenant?.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-medium capitalize">{tenant?.plan || 'Free'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Membros</h2>
              <p className="text-sm text-muted-foreground">
                {tenant?.memberships?.length || 0} membro(s)
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Convidar
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {tenant?.memberships?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {member.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.user.name}
                      {member.userId === user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ROLE_LABELS[member.role]}</span>
                  </div>
                  {isAdmin &&
                    member.userId !== user?.id &&
                    member.role !== 'owner' && (
                      <button
                        onClick={() =>
                          handleRemoveMember(member.userId, member.user.name)
                        }
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Convidar Membro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione um novo membro ao workspace
            </p>

            <form onSubmit={handleInviteMember} className="mt-6 space-y-4">
              {inviteError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {inviteError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Função</label>
                <div className="space-y-2">
                  {(['admin', 'analyst'] as const).map((role) => (
                    <label
                      key={role}
                      className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer hover:bg-accent ${
                        inviteForm.role === role ? 'border-primary' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={inviteForm.role === role}
                        onChange={(e) =>
                          setInviteForm({ ...inviteForm, role: e.target.value })
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{ROLE_LABELS[role]}</p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[role]}
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
                    setIsInviteModalOpen(false);
                    setInviteForm({ email: '', role: 'analyst' });
                    setInviteError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {inviteMemberMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Convidando...
                    </>
                  ) : (
                    'Convidar'
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
