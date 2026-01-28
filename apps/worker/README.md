# @trackpro/worker

Background worker - NestJS + BullMQ para processamento assíncrono.

## Responsabilidades

- Envio para Meta CAPI (com retry/backoff)
- Construção de agregados
- Cleanup de retenção
- Processamento de exports
- DLQ management

## Jobs

### meta-capi
Envia eventos para Meta Conversions API.
- 3 tentativas com backoff exponencial
- Loga status em `meta_delivery_log`

### aggregates
Constrói agregados diários no ClickHouse.

### retention
Remove eventos antigos baseado em `retentionDays`.

### exports
Gera arquivos de export.

## Queues

```
meta-capi     → send_meta_capi
aggregates    → build_aggregates
retention     → cleanup_retention
exports       → export_job
```

## Desenvolvimento

```bash
pnpm --filter @trackpro/worker dev
```

## Variáveis de Ambiente

Ver `.env.example`
