'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Server,
  Play,
  Pause,
  Trash2,
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  attempts: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

export default function QueuesPage() {
  const { get, post, del } = useApi();
  const queryClient = useQueryClient();

  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'>('waiting');

  const { data: queues, isLoading, refetch } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: () => get<QueueStats[]>('/api/v1/admin/queues'),
    refetchInterval: 5000,
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['queue-jobs', selectedQueue, jobStatus],
    queryFn: () =>
      get<QueueJob[]>(`/api/v1/admin/queues/${selectedQueue}/jobs?status=${jobStatus}&limit=50`),
    enabled: !!selectedQueue,
  });

  const pauseMutation = useMutation({
    mutationFn: (queueName: string) => post(`/api/v1/admin/queues/${queueName}/pause`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queues'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (queueName: string) => post(`/api/v1/admin/queues/${queueName}/resume`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queues'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      post(`/api/v1/admin/queues/${queueName}/jobs/${jobId}/retry`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
    },
  });

  const removeJobMutation = useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      del(`/api/v1/admin/queues/${queueName}/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
    },
  });

  const cleanMutation = useMutation({
    mutationFn: ({ queueName, status }: { queueName: string; status: 'completed' | 'failed' }) =>
      post(`/api/v1/admin/queues/${queueName}/clean?status=${status}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queues'] });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
    },
  });

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'delayed':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Server className="h-6 w-6" />
              Gerenciamento de Filas
            </h1>
            <p className="text-muted-foreground">
              Monitore e gerencie as filas de processamento
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Queues List */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Filas</h2>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {queues?.map((queue) => (
                <div
                  key={queue.name}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedQueue === queue.name ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedQueue(queue.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{queue.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        queue.paused
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30'
                      }`}
                    >
                      {queue.paused ? 'Pausada' : 'Ativa'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-muted-foreground">Aguardando</p>
                      <p className="font-semibold text-yellow-600">{queue.waiting}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Completas</p>
                      <p className="font-semibold text-green-600">{queue.completed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Falhas</p>
                      <p className="font-semibold text-red-600">{queue.failed}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {queue.paused ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeMutation.mutate(queue.name);
                        }}
                        className="flex-1 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Resumir
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pauseMutation.mutate(queue.name);
                        }}
                        className="flex-1 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Pausar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cleanMutation.mutate({ queueName: queue.name, status: 'completed' });
                      }}
                      className="flex-1 inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Limpar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Jobs {selectedQueue && `- ${selectedQueue}`}
            </h2>
            {selectedQueue && (
              <div className="flex gap-1">
                {(['waiting', 'active', 'completed', 'failed', 'delayed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setJobStatus(status)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      jobStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-accent'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedQueue ? (
            <div className="p-8 text-center text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma fila para ver os jobs</p>
            </div>
          ) : loadingJobs ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum job com status &quot;{jobStatus}&quot;</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {jobs?.map((job) => (
                <div key={job.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(jobStatus)}
                        <span className="font-mono text-sm">{job.id}</span>
                        <span className="text-xs text-muted-foreground">({job.name})</span>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Criado: {formatTimestamp(job.timestamp)}</p>
                        {job.processedOn && <p>Processado: {formatTimestamp(job.processedOn)}</p>}
                        {job.finishedOn && <p>Finalizado: {formatTimestamp(job.finishedOn)}</p>}
                        <p>Tentativas: {job.attempts}</p>
                      </div>

                      {job.failedReason && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {job.failedReason}
                        </p>
                      )}

                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Ver dados
                        </summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(job.data, null, 2)}
                        </pre>
                      </details>
                    </div>

                    <div className="flex gap-1">
                      {jobStatus === 'failed' && (
                        <button
                          onClick={() =>
                            retryMutation.mutate({ queueName: selectedQueue, jobId: job.id })
                          }
                          className="p-2 rounded-md border hover:bg-accent"
                          title="Retry"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          removeJobMutation.mutate({ queueName: selectedQueue, jobId: job.id })
                        }
                        className="p-2 rounded-md border hover:bg-accent text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
