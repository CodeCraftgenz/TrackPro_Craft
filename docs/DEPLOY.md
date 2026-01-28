# Guia de Deploy - TrackPro

Este guia explica como fazer deploy do TrackPro usando **Render** (backend) e **Hostinger** (frontend).

## Arquitetura de Produção

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     HOSTINGER (Frontend)                     │
│                                                              │
│   app.trackpro.io  ──────────────────────────────────────   │
│   Next.js (SSR ou Static)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      RENDER (Backend)                        │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  API        │  │  Worker     │  │  Ingest     │        │
│   │  :3001      │  │  (jobs)     │  │  :3002      │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│   api.trackpro.io       (background)    ingest.trackpro.io  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASES                              │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  MySQL      │  │  Redis      │  │  ClickHouse │        │
│   │ PlanetScale │  │  Upstash    │  │  Cloud      │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Configurar Databases

### 1.1 MySQL (PlanetScale - Recomendado)

1. Crie uma conta em [planetscale.com](https://planetscale.com)
2. Crie um novo database: `trackpro`
3. Vá em **Settings > Passwords** e crie uma senha
4. Copie a **Connection String** (formato MySQL)

```env
DATABASE_URL="mysql://user:password@host.planetscale.com/trackpro?sslaccept=strict"
```

**Alternativa: Railway MySQL**
- Crie em [railway.app](https://railway.app)
- Provisione um MySQL database
- Copie a connection string

### 1.2 Redis (Upstash - Recomendado)

1. Crie uma conta em [upstash.com](https://upstash.com)
2. Crie um novo Redis database
3. Copie a **REDIS_URL**

```env
REDIS_URL="rediss://default:xxxxx@xxx-xxx.upstash.io:6379"
```

### 1.3 ClickHouse (ClickHouse Cloud)

1. Crie uma conta em [clickhouse.cloud](https://clickhouse.cloud)
2. Crie um novo serviço
3. Copie as credenciais

```env
CLICKHOUSE_HOST=xxx.clickhouse.cloud
CLICKHOUSE_DATABASE=trackpro
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=xxxxx
```

---

## 2. Deploy Backend (Render)

### 2.1 Conectar Repositório

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **New > Blueprint**
3. Conecte seu repositório GitHub
4. Selecione o repositório `TrackPro_Craft`

O Render vai detectar o `render.yaml` automaticamente.

### 2.2 Configurar Variáveis de Ambiente

No Render Dashboard, configure as variáveis:

```env
# Server
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app.trackpro.io
FRONTEND_URL=https://app.trackpro.io

# Database
DATABASE_URL=mysql://...
REDIS_URL=rediss://...

# ClickHouse
CLICKHOUSE_HOST=xxx.clickhouse.cloud
CLICKHOUSE_DATABASE=trackpro
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=xxxxx

# Security (Render gera automaticamente se usar render.yaml)
JWT_SECRET=xxxxx (min 32 caracteres)
REFRESH_SECRET=xxxxx
ENCRYPTION_KEY=xxxxx
HMAC_MASTER_SECRET=xxxxx
INTERNAL_API_SECRET=xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (opcional)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx

# Sentry (opcional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 2.3 Deploy Manual (Alternativa)

Se preferir não usar Blueprint:

1. **New > Web Service**
2. Conecte o repositório
3. Configure:
   - **Name**: trackpro-api
   - **Root Directory**: `apps/api`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`

### 2.4 Rodar Migrations

Após o primeiro deploy, rode as migrations:

```bash
# No Render Shell (ou local com DATABASE_URL de produção)
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 3. Deploy Frontend (Hostinger)

### Opção A: Hostinger com Node.js (Recomendado)

Se seu plano Hostinger suporta Node.js:

#### 3.1 Preparar o Build

```bash
# Local
cd apps/web
pnpm build
```

#### 3.2 Configurar Hostinger

1. Acesse o **hPanel** da Hostinger
2. Vá em **Websites > Gerenciar**
3. Configure Node.js:
   - **Node.js Version**: 20.x
   - **Startup File**: `server.js` ou `npm start`

#### 3.3 Upload via Git

1. No hPanel, vá em **Git**
2. Conecte seu repositório
3. Configure:
   - **Branch**: main
   - **Root Directory**: apps/web

#### 3.4 Variáveis de Ambiente

No hPanel, configure:

```env
NEXT_PUBLIC_API_URL=https://api.trackpro.io
NEXT_PUBLIC_INGEST_URL=https://ingest.trackpro.io
```

### Opção B: Hostinger Estático (Export)

Se seu plano só suporta arquivos estáticos:

#### 3.1 Configurar Next.js para Export

Adicione ao `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ... resto da config
};
```

#### 3.2 Build e Export

```bash
cd apps/web
pnpm build
# Isso gera a pasta 'out' com arquivos estáticos
```

#### 3.3 Upload para Hostinger

1. Compacte a pasta `out` em ZIP
2. No hPanel, vá em **Gerenciador de Arquivos**
3. Navegue até `public_html`
4. Faça upload e extraia o ZIP

**Nota**: Com export estático, algumas funcionalidades SSR não funcionarão.

---

## 4. Configurar Domínios

### 4.1 DNS Records

Configure no seu provedor de DNS:

| Tipo | Nome | Valor |
|------|------|-------|
| A | app | IP da Hostinger |
| CNAME | api | trackpro-api.onrender.com |
| CNAME | ingest | trackpro-ingest.onrender.com |

### 4.2 SSL/HTTPS

- **Render**: SSL automático ✅
- **Hostinger**: Ative o SSL gratuito no hPanel

---

## 5. Configurar Stripe Webhook

Após o deploy, configure o webhook de produção:

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. Configure:
   - **URL**: `https://api.trackpro.io/api/v1/billing/webhooks/stripe`
   - **Events**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     aided`invoice.payment_failed`
4. Copie o **Signing secret** e atualize `STRIPE_WEBHOOK_SECRET` no Render

---

## 6. Checklist de Produção

### Segurança
- [ ] Todas as variáveis sensíveis configuradas
- [ ] CORS configurado apenas para seu domínio
- [ ] HTTPS habilitado em todos os serviços
- [ ] Rate limiting ativo

### Monitoramento
- [ ] Sentry configurado para erros
- [ ] Health checks funcionando
- [ ] Logs acessíveis no Render

### Backup
- [ ] Backup automático do MySQL (PlanetScale faz automaticamente)
- [ ] Backup do ClickHouse configurado

### Performance
- [ ] CDN configurado para assets estáticos
- [ ] Cache Redis funcionando
- [ ] Compressão GZIP ativa

---

## 7. Comandos Úteis

### Logs no Render
```bash
# Via Render Dashboard > Logs
# Ou via CLI
render logs trackpro-api
```

### Rodar Migrations em Produção
```bash
# Conecte via Render Shell
npx prisma db push
```

### Verificar Health
```bash
curl https://api.trackpro.io/api/v1/health
```

---

## 8. Custos Estimados

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| Render API | Starter | $7 |
| Render Worker | Starter | $7 |
| Render Ingest | Starter | $7 |
| PlanetScale | Hobby | Grátis |
| Upstash Redis | Free | Grátis |
| ClickHouse Cloud | Dev | ~$25 |
| Hostinger | Premium | ~R$15 |
| **Total** | | **~$46/mês** |

**Nota**: Pode começar com Render Free tier ($0) para testes.

---

## Troubleshooting

### API não inicia
- Verifique se `DATABASE_URL` está correta
- Verifique logs no Render Dashboard

### Frontend não conecta na API
- Verifique `NEXT_PUBLIC_API_URL`
- Verifique CORS no backend

### Stripe webhook falha
- Verifique `STRIPE_WEBHOOK_SECRET`
- Verifique se URL está acessível
- Veja logs de webhook no Stripe Dashboard

### Erro de SSL
- Aguarde propagação DNS (até 48h)
- Verifique certificado no Render/Hostinger
