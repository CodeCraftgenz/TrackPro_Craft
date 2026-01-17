'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Users, FolderKanban, TrendingUp } from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface DashboardStats {
  totalProjects: number;
  totalEvents: number;
  totalMembers: number;
  eventsToday: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { get } = useApi();

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<{ data: Array<{ id: string; name: string }> }>('/api/v1/tenants'),
  });

  const tenantId = tenants?.data?.[0]?.id;

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: () =>
      get<{ data: Array<{ id: string; name: string }> }>(
        `/api/v1/tenants/${tenantId}/projects`,
      ),
    enabled: !!tenantId,
  });

  const { data: analyticsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', tenantId],
    queryFn: () =>
      get<{
        totalProjects: number;
        totalEvents: number;
        eventsToday: number;
        uniqueUsers: number;
      }>(`/api/v1/tenants/${tenantId}/stats`),
    enabled: !!tenantId,
  });

  const isLoading = tenantsLoading || projectsLoading || statsLoading;

  const stats: DashboardStats = {
    totalProjects: analyticsStats?.totalProjects || projects?.data?.length || 0,
    totalEvents: analyticsStats?.totalEvents || 0,
    totalMembers: analyticsStats?.uniqueUsers || 1,
    eventsToday: analyticsStats?.eventsToday || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu tracking e analytics
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Projetos"
            value={stats.totalProjects}
            icon={FolderKanban}
            description="Total de projetos ativos"
          />
          <StatCard
            title="Eventos Hoje"
            value={stats.eventsToday}
            icon={Activity}
            description="Eventos recebidos hoje"
          />
          <StatCard
            title="Total de Eventos"
            value={stats.totalEvents}
            icon={TrendingUp}
            description="Todos os eventos coletados"
          />
          <StatCard
            title="Membros"
            value={stats.totalMembers}
            icon={Users}
            description="Membros do workspace"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Placeholder */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Atividade Recente</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Nenhuma atividade recente
              </p>
              <p className="text-xs text-muted-foreground">
                Eventos aparecerão aqui quando você começar a rastrear
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Ações Rápidas</h2>
          </div>
          <div className="p-4 space-y-3">
            <a
              href="/projects"
              className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent transition-colors"
            >
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Criar Projeto</p>
                <p className="text-xs text-muted-foreground">
                  Configure um novo projeto de tracking
                </p>
              </div>
            </a>
            <a
              href="/settings"
              className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Convidar Membros</p>
                <p className="text-xs text-muted-foreground">
                  Adicione membros ao seu workspace
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
