# @trackpro/ingest

Serviço de ingestão de eventos - NestJS + Fastify para alta performance.

## Responsabilidades

- Receber eventos do SDK
- Validar HMAC signature
- Anti-replay protection
- Rate limiting
- Deduplicação
- Gravação no ClickHouse
- Enfileiramento de jobs (BullMQ)

## Endpoints

- `POST /v1/events` - Batch de eventos
- `POST /v1/event` - Evento único
- `POST /v1/consent` - Atualização de consentimento
- `GET /v1/health` - Health check

## Headers Obrigatórios

```
x-api-key: tp_xxxxxxxxxxxx
x-signature: <HMAC-SHA256>
x-timestamp: <Unix timestamp em ms>
```

## Payload

```json
{
  "events": [
    {
      "event_id": "uuid",
      "event_name": "page_view",
      "event_time": 1704067200,
      "anonymous_id": "anon_123",
      "session_id": "sess_456",
      "url": "https://example.com/page",
      "referrer": "https://google.com",
      "utm_source": "google",
      "utm_medium": "cpc",
      "consent_categories": ["necessary", "analytics"]
    }
  ]
}
```

## Segurança

### HMAC Signature

```
signature = HMAC-SHA256(timestamp + "." + body, projectSecret)
```

### Anti-Replay

- Timestamp deve estar dentro de 5 minutos
- Signature única por request

## Desenvolvimento

```bash
pnpm --filter @trackpro/ingest dev
```

## Variáveis de Ambiente

Ver `.env.example`
