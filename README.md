# TrackPro

Plataforma SaaS de tracking first-party + server-side tracking (Meta CAPI) + dashboard analítico.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend API**: NestJS + Prisma + MySQL
- **Ingest**: NestJS + Fastify (alta performance)
- **Worker**: NestJS + BullMQ
- **Analytics DB**: ClickHouse Cloud
- **Queue/Cache**: Redis
- **Deploy**: Render

## Estrutura do Monorepo

```
trackpro-monorepo/
├── apps/
│   ├── web/          # Next.js 15 - Frontend (Landing + Dashboard)
│   ├── api/          # NestJS - API principal (Auth, Tenants, Projects)
│   ├── ingest/       # NestJS+Fastify - Ingestão de eventos
│   └── worker/       # NestJS - Background jobs (Meta CAPI, agregações)
├── packages/
│   ├── shared/       # Types, Zod schemas, DTOs, constantes
│   ├── sdk/          # JS SDK para tracking
│   ├── ui/           # Design system (shadcn/ui)
│   ├── tsconfig/     # TypeScript configs compartilhados
│   └── eslint-config/# ESLint configs compartilhados
└── infra/
    ├── render/       # render.yaml (Blueprint)
    ├── clickhouse/   # DDL e materialized views
    └── mysql/        # Init scripts
```

## Começando

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/trackpro.git
cd trackpro

# Instale as dependências
pnpm install

# Suba os serviços de desenvolvimento
pnpm docker:up

# Configure as variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/ingest/.env.example apps/ingest/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env

# Gere o Prisma Client e rode as migrations
pnpm db:generate
pnpm db:migrate

# Inicie em modo de desenvolvimento
pnpm dev
```

### URLs de Desenvolvimento

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs
- **Ingest**: http://localhost:3002
- **ClickHouse**: http://localhost:8123

### Ferramentas de Dev (opcional)

```bash
# Suba com ferramentas de administração
docker-compose -f docker-compose.dev.yml --profile tools up -d

# Redis Commander: http://localhost:8081
# phpMyAdmin: http://localhost:8082
```

## Scripts

```bash
pnpm dev          # Desenvolvimento com hot reload
pnpm build        # Build de produção
pnpm lint         # Lint em todos os packages
pnpm typecheck    # Type check em todos os packages
pnpm test         # Roda os testes
pnpm db:migrate   # Roda migrations do Prisma
pnpm db:studio    # Abre o Prisma Studio
pnpm docker:up    # Sobe containers de dev
pnpm docker:down  # Para containers de dev
```

## Deployment

### Render (Blueprint)

1. Conecte seu repositório ao Render
2. Use o Blueprint em `infra/render/render.yaml`
3. Configure as variáveis de ambiente do ClickHouse Cloud manualmente

### ClickHouse Cloud

1. Crie uma instância no [ClickHouse Cloud](https://clickhouse.cloud)
2. Execute o script DDL em `infra/clickhouse/init.sql`
3. Configure as variáveis `CLICKHOUSE_*` no Render

## Arquitetura

### Fluxo de Eventos

```
[SDK/Browser] → [Ingest Service] → [ClickHouse]
                      ↓
                  [Redis Queue]
                      ↓
                  [Worker]
                      ↓
                [Meta CAPI]
```

### Segurança

- HMAC signature validation no ingest
- Anti-replay com janela de timestamp
- Rate limiting por projeto
- API Keys com scopes
- RBAC (Owner/Admin/Analyst)

## Licença

Proprietário - Todos os direitos reservados.
