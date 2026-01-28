'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Users,
  Facebook,
  Instagram,
  Globe,
  RefreshCw,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';

interface Tenant {
  id: string;
  name: string;
}

interface Lead {
  lead_id: string;
  platform: string;
  form_id: string;
  form_name: string;
  email: string;
  name: string;
  phone: string;
  custom_fields: Record<string, unknown>;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
  page_url: string;
  created_at: string;
}

interface LeadStats {
  total: number;
  byPlatform: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
  recentLeads: Lead[];
}

const platformIcons: Record<string, typeof Facebook> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Users,
  WEBSITE: Globe,
};

const platformColors: Record<string, string> = {
  FACEBOOK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INSTAGRAM: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  TWITTER: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  WEBSITE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function LeadReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
  });

  const tenantId = tenants?.[0]?.id;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['lead-stats', tenantId, projectId, dateRange],
    queryFn: () =>
      get<LeadStats>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      ),
    enabled: !!tenantId,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', tenantId, projectId, dateRange, platformFilter],
    queryFn: () =>
      get<{ leads: Lead[]; total: number }>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/leads?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}${platformFilter !== 'all' ? `&platform=${platformFilter}` : ''}&limit=100`,
      ),
    enabled: !!tenantId,
  });

  if (statsLoading || leadsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  const totalLeads = stats?.total || 0;
  const platformStats = stats?.byPlatform || {};
  const dailyStats = stats?.byDay || [];

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
            <h1 className="text-2xl font-semibold tracking-tight text-white">Relatórios de Leads</h1>
            <p className="text-white/60">
              Visualize e analise os leads capturados
            </p>
          </div>
        </div>
        <button
          onClick={() => refetchStats()}
          className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-white">Data inicial</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="mt-1 flex h-10 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white">Data final</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="mt-1 flex h-10 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white">Plataforma</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="mt-1 flex h-10 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="all">Todas</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TWITTER">Twitter</option>
            <option value="WEBSITE">Website</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/60">Total de Leads</p>
            <Users className="h-5 w-5 text-white/60" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{totalLeads}</p>
          <p className="text-xs text-white/50">No período selecionado</p>
        </div>

        {Object.entries(platformStats).map(([platform, count]) => {
          const Icon = platformIcons[platform] || Globe;
          return (
            <div key={platform} className="rounded-lg border border-white/10 bg-transparent p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/60">{platform}</p>
                <Icon className="h-5 w-5 text-white/60" />
              </div>
              <p className="mt-2 text-3xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/50">
                {totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          );
        })}
      </div>

      {/* Daily Chart */}
      {dailyStats.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-transparent">
          <div className="border-b border-white/10 p-4">
            <h2 className="font-semibold text-white">Leads por Dia</h2>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between h-48 gap-1">
              {dailyStats.slice(-30).map((day) => {
                const maxCount = Math.max(...dailyStats.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div className="relative w-full">
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} leads`}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-[#1a1a2e] text-white px-2 py-1 rounded shadow">
                        {day.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/50">
              <span>{dailyStats[0]?.date}</span>
              <span>{dailyStats[dailyStats.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="rounded-lg border border-white/10 bg-transparent">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-semibold text-white">Leads Recentes</h2>
          <button className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {leads?.leads && leads.leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Plataforma
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-white/60">
                    Fonte
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.leads.map((lead) => (
                  <tr key={lead.lead_id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-white">
                      {new Date(lead.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{lead.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{lead.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{lead.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          platformColors[lead.platform] || 'bg-white/10 text-white/70'
                        }`}
                      >
                        {lead.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {lead.utm_source || lead.referrer || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-white/30" />
            <h3 className="mt-4 font-semibold text-white">Nenhum lead encontrado</h3>
            <p className="mt-2 text-sm text-white/60">
              Não há leads no período selecionado com os filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
