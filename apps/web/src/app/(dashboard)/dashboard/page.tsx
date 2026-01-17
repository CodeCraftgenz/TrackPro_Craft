'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Users,
  FolderKanban,
  TrendingUp,
  Eye,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  UserPlus,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Tenant {
  id: string;
  name: string;
  memberships?: Array<{ id: string }>;
}

interface DashboardStats {
  totalProjects: number;
  totalEvents: number;
  totalMembers: number;
  eventsToday: number;
  totalLeads: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
  gradient: 'cyan' | 'magenta' | 'green' | 'purple' | 'blue' | 'orange';
  prefix?: string;
}

const gradientClasses = {
  cyan: 'card-gradient-cyan',
  magenta: 'card-gradient-magenta',
  green: 'card-gradient-green',
  purple: 'card-gradient-purple',
  blue: 'card-gradient-blue',
  orange: 'card-gradient-orange',
};

const iconColors = {
  cyan: 'text-[#00E4F2]',
  magenta: 'text-[#D12BF2]',
  green: 'text-[#00E676]',
  purple: 'text-[#68007B]',
  blue: 'text-blue-400',
  orange: 'text-orange-400',
};

function StatCard({ title, value, icon: Icon, description, trend, gradient, prefix }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`rounded-xl p-5 ${gradientClasses[gradient]} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#B0B0B0]">{title}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-lg text-[#B0B0B0]">{prefix}</span>}
            <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-[#00E676]' : 'text-[#FF6B6B]'}`}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(trend)}%</span>
              <span className="text-[#B0B0B0]">vs ontem</span>
            </div>
          )}
          {description && trend === undefined && (
            <p className="text-xs text-[#B0B0B0]">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-[#1A1A2E] ${iconColors[gradient]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function FunnelChart({ stats }: { stats: DashboardStats }) {
  const stages = [
    { label: 'Visitantes', value: stats.eventsToday, percentage: 100, color: 'bg-[#00E4F2]' },
    { label: 'Engajados', value: 0, percentage: 0, color: 'bg-[#D12BF2]' },
    { label: 'Leads', value: stats.totalLeads, percentage: stats.eventsToday > 0 ? Math.round((stats.totalLeads / stats.eventsToday) * 100) : 0, color: 'bg-[#68007B]' },
    { label: 'Conversões', value: 0, percentage: 0, color: 'bg-[#00E676]' },
  ];

  const hasData = stats.eventsToday > 0 || stats.totalLeads > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BarChart3 className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/60 text-sm">Nenhum dado disponível</p>
        <p className="text-white/40 text-xs mt-1">Configure um projeto e comece a capturar eventos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <div key={stage.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#B0B0B0]">{stage.label}</span>
            <span className="font-semibold text-white">{stage.value.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full bg-[#1A1A2E] overflow-hidden">
            <div
              className={`h-full ${stage.color} transition-all duration-500`}
              style={{ width: `${stage.percentage}%` }}
            />
          </div>
          {index < stages.length - 1 && stage.value > 0 && stages[index + 1].value > 0 && (
            <div className="flex justify-center">
              <span className="text-xs text-[#666]">
                {Math.round((stages[index + 1].value / stage.value) * 100)}% taxa de conversão
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RecentActivity() {
  // Sem dados reais ainda - mostra estado vazio
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Activity className="h-12 w-12 text-white/20 mb-4" />
      <p className="text-white/60 text-sm">Nenhuma atividade recente</p>
      <p className="text-white/40 text-xs mt-1">Eventos aparecerão aqui em tempo real</p>
    </div>
  );
}

export default function DashboardPage() {
  const { get } = useApi();

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenant = tenants?.[0];
  const tenantId = tenant?.id;

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: () => get<Project[]>(`/api/v1/tenants/${tenantId}/projects`),
    enabled: !!tenantId,
  });

  const isLoading = tenantsLoading || projectsLoading;

  // Dados zerados - serão preenchidos quando houver integração real
  const stats: DashboardStats = {
    totalProjects: projects?.length || 0,
    totalEvents: 0,
    totalMembers: tenant?.memberships?.length || 1,
    eventsToday: 0,
    totalLeads: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-[#B0B0B0]">
            Visão geral do seu tracking e analytics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#B0B0B0]">
          <div className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
          <span>Dados em tempo real</span>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[#16213E]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pageviews Hoje"
            value={stats.eventsToday.toLocaleString()}
            icon={Eye}
            gradient="cyan"
            description="Visitantes únicos"
          />
          <StatCard
            title="Eventos Total"
            value={stats.totalEvents.toLocaleString()}
            icon={Zap}
            gradient="magenta"
            description="Todos os eventos capturados"
          />
          <StatCard
            title="Leads Capturados"
            value={stats.totalLeads.toLocaleString()}
            icon={UserPlus}
            gradient="green"
            description="Total de leads"
          />
          <StatCard
            title="Conversões"
            value={0}
            icon={Target}
            gradient="purple"
            description="Vendas realizadas"
          />
        </div>
      )}

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Projetos Ativos"
          value={stats.totalProjects}
          icon={FolderKanban}
          gradient="cyan"
          description="Com tracking configurado"
        />
        <StatCard
          title="Membros"
          value={stats.totalMembers}
          icon={Users}
          gradient="magenta"
          description="No workspace"
        />
        <StatCard
          title="Taxa de Conversão"
          value="0%"
          icon={TrendingUp}
          gradient="green"
          description="Leads para vendas"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-xl border border-[#00E4F2]/10 bg-[#16213E] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Funil de Conversão</h2>
              <p className="text-sm text-[#666]">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#B0B0B0]">Taxa geral:</span>
              <span className="font-semibold text-[#00E676]">0%</span>
            </div>
          </div>
          <FunnelChart stats={stats} />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-[#00E4F2]/10 bg-[#16213E] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Atividade Recente</h2>
              <p className="text-sm text-[#666]">Eventos em tempo real</p>
            </div>
            <Activity className="h-5 w-5 text-[#B0B0B0]" />
          </div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[#00E4F2]/10 bg-[#16213E] p-6">
        <h2 className="font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href="/projects"
            className="flex items-center gap-4 p-4 rounded-lg bg-[#1A1A2E]/50 hover:bg-[#1A1A2E] transition-colors group"
          >
            <div className="p-3 rounded-lg bg-[#00E4F2]/10 text-[#00E4F2]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-[#00E4F2] transition-colors">Criar Projeto</p>
              <p className="text-xs text-[#666]">
                Configure um novo projeto
              </p>
            </div>
          </a>
          <a
            href="/settings"
            className="flex items-center gap-4 p-4 rounded-lg bg-[#1A1A2E]/50 hover:bg-[#1A1A2E] transition-colors group"
          >
            <div className="p-3 rounded-lg bg-[#D12BF2]/10 text-[#D12BF2]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-[#D12BF2] transition-colors">Convidar Membros</p>
              <p className="text-xs text-[#666]">
                Adicione sua equipe
              </p>
            </div>
          </a>
          <a
            href="/projects"
            className="flex items-center gap-4 p-4 rounded-lg bg-[#1A1A2E]/50 hover:bg-[#1A1A2E] transition-colors group"
          >
            <div className="p-3 rounded-lg bg-[#00E676]/10 text-[#00E676]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white group-hover:text-[#00E676] transition-colors">Ver Relatórios</p>
              <p className="text-xs text-[#666]">
                Analytics detalhados
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
