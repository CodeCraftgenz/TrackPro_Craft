'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  Search,
  Trash2,
  UserX,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Activity,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface UserData {
  anonymousId: string;
  consentLogsCount: number;
  lastActivity: string;
}

interface UserDataSummary {
  anonymousId: string;
  eventCount: number;
  consentLogsCount: number;
  firstSeen?: string;
  lastSeen?: string;
}

export default function PrivacyPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get, del, post } = useApi();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Tenant[] }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['privacy-users', tenantId, projectId, searchQuery],
    queryFn: () =>
      get<{ users: UserData[]; total: number }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/privacy/users?query=${encodeURIComponent(searchQuery)}&limit=50`,
      ),
    enabled: !!tenantId,
  });

  const { data: userSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['user-summary', tenantId, projectId, selectedUser],
    queryFn: () =>
      get<UserDataSummary>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/privacy/users/${encodeURIComponent(selectedUser!)}`,
      ),
    enabled: !!tenantId && !!selectedUser,
  });

  const deleteMutation = useMutation({
    mutationFn: async (anonymousId: string) => {
      return del(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/privacy/users/${encodeURIComponent(anonymousId)}`,
        { reason: actionReason },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-summary'] });
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      setActionReason('');
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: async (anonymousId: string) => {
      return post(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/privacy/users/${encodeURIComponent(anonymousId)}/anonymize`,
        { reason: actionReason },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-summary'] });
      setShowAnonymizeConfirm(false);
      setSelectedUser(null);
      setActionReason('');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/projects/${projectId}`}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Privacidade (LGPD)
            </h1>
            <p className="text-muted-foreground">
              Gerencie dados de usuários e solicitações de privacidade
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Ações de Privacidade (LGPD)
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              As ações de exclusão e anonimização são irreversíveis. Certifique-se de que a solicitação é legítima antes de prosseguir.
              Todas as ações são registradas para fins de auditoria.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border bg-card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por anonymous_id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users List */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuários ({usersData?.total || 0})
            </h3>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : usersData?.users?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {usersData?.users?.map((user) => (
                <button
                  key={user.anonymousId}
                  onClick={() => setSelectedUser(user.anonymousId)}
                  className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                    selectedUser === user.anonymousId ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm truncate max-w-[200px]">
                      {user.anonymousId}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {user.consentLogsCount} registros
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Última atividade:{' '}
                    {new Date(user.lastActivity).toLocaleDateString('pt-BR')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes do Usuário
            </h3>
          </div>

          {!selectedUser ? (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Selecione um usuário para ver os detalhes</p>
            </div>
          ) : isLoadingSummary ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : userSummary ? (
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Anonymous ID</p>
                  <p className="font-mono text-sm break-all">{userSummary.anonymousId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs">Eventos</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">
                      {userSummary.eventCount.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Consents</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">
                      {userSummary.consentLogsCount.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {userSummary.firstSeen && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Primeira atividade:</span>
                    <span>{new Date(userSummary.firstSeen).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}

                {userSummary.lastSeen && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Última atividade:</span>
                    <span>{new Date(userSummary.lastSeen).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm">Ações de Privacidade</h4>

                <button
                  onClick={() => setShowAnonymizeConfirm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <UserX className="h-4 w-4" />
                  Anonimizar Dados
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Todos os Dados
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Você está prestes a excluir permanentemente todos os dados do usuário{' '}
              <code className="bg-muted px-1 rounded">{selectedUser}</code>.
              Esta ação é irreversível.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Motivo da exclusão (opcional)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Solicitação do titular dos dados via email..."
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setActionReason('');
                }}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedUser)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymize Confirmation Modal */}
      {showAnonymizeConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center gap-3 text-yellow-600">
              <UserX className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirmar Anonimização</h3>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Você está prestes a anonimizar os dados do usuário{' '}
              <code className="bg-muted px-1 rounded">{selectedUser}</code>.
              O anonymous_id será substituído por um identificador aleatório e dados pessoais serão removidos.
              Esta ação é irreversível.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Motivo da anonimização (opcional)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Solicitação do titular dos dados via email..."
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAnonymizeConfirm(false);
                  setActionReason('');
                }}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => anonymizeMutation.mutate(selectedUser)}
                disabled={anonymizeMutation.isPending}
                className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                {anonymizeMutation.isPending ? 'Anonimizando...' : 'Anonimizar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
