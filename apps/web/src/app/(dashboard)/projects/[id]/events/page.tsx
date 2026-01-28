'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface Event {
  event_id: string;
  event_name: string;
  event_time: number;
  received_at: number;
  anonymous_id: string;
  user_id: string;
  session_id: string;
  url: string;
  path: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  ip: string;
  user_agent: string;
  country: string;
  value: number;
  currency: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
}

const EVENT_COLORS: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purchase: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lead: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  add_to_cart: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  view_content: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  initiate_checkout: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function ProjectEventsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { get } = useApi();

  const [page, setPage] = useState(0);
  const [eventFilter, setEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => get<Tenant[]>('/api/v1/tenants'),
    staleTime: 5 * 60 * 1000, // Cache tenants for 5 minutes
    refetchOnWindowFocus: false,
  });

  const tenantId = tenants?.[0]?.id;

  const {
    data: eventsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['events', tenantId, projectId, page, eventFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (eventFilter) {
        params.set('eventName', eventFilter);
      }
      return get<EventsResponse>(
        `/api/v1/tenants/${tenantId}/projects/${projectId}/events?${params}`,
      );
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds (was 10s)
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const totalPages = eventsData ? Math.ceil(eventsData.total / limit) : 0;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventColor = (eventName: string) => {
    return (
      EVENT_COLORS[eventName] ||
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    );
  };

  const filteredEvents = eventsData?.events?.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.event_name.toLowerCase().includes(query) ||
      event.url?.toLowerCase().includes(query) ||
      event.user_id?.toLowerCase().includes(query) ||
      event.anonymous_id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/projects/${projectId}`}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Eventos</h1>
            <p className="text-white/60">
              Visualize eventos em tempo real
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Buscar por URL, user_id, anonymous_id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 pl-10 pr-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(0);
            }}
            className="flex h-10 w-full sm:w-48 rounded-md border border-white/20 bg-white/5 pl-10 pr-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Todos os eventos</option>
            <option value="page_view">Page View</option>
            <option value="purchase">Purchase</option>
            <option value="lead">Lead</option>
            <option value="add_to_cart">Add to Cart</option>
            <option value="view_content">View Content</option>
            <option value="initiate_checkout">Initiate Checkout</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <p className="text-sm text-white/60">Total de Eventos</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {eventsData?.total.toLocaleString('pt-BR') || 0}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <p className="text-sm text-white/60">Exibindo</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {filteredEvents?.length || 0} eventos
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-transparent p-4">
          <p className="text-sm text-white/60">Página</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {page + 1} de {totalPages || 1}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-lg border border-white/10 bg-transparent">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-white/60" />
            <p className="mt-4 text-sm text-white/60">
              Carregando eventos...
            </p>
          </div>
        ) : filteredEvents?.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <Activity className="h-12 w-12 text-white/30" />
            <h3 className="mt-4 font-semibold text-white">Nenhum evento encontrado</h3>
            <p className="mt-2 text-sm text-white/60">
              {eventFilter || searchQuery
                ? 'Tente ajustar os filtros'
                : 'Eventos aparecerão aqui quando começarem a ser recebidos'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredEvents?.map((event) => (
              <div
                key={event.event_id}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getEventColor(event.event_name)}`}
                      >
                        {event.event_name}
                      </span>
                      {event.value > 0 && (
                        <span className="text-sm font-medium text-green-400">
                          {event.currency} {event.value.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {event.url && (
                      <p className="mt-2 text-sm text-white/60 truncate">
                        {event.path || event.url}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                      {event.anonymous_id && (
                        <span>ID: {event.anonymous_id.slice(0, 8)}...</span>
                      )}
                      {event.user_id && <span>User: {event.user_id}</span>}
                      {event.utm_source && (
                        <span>
                          UTM: {event.utm_source}
                          {event.utm_medium && `/${event.utm_medium}`}
                        </span>
                      )}
                      {event.country && <span>{event.country}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/50 whitespace-nowrap">
                    <p>{formatTime(event.event_time)}</p>
                    {event.ip && <p className="mt-1">{event.ip}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 p-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-white/60">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
