# TrackPro - Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUÁRIO (Browser)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                                │
│                    Hostinger: lightblue-peafowl-175970                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Login     │  │  Dashboard  │  │   Billing   │  │  Settings   │        │
│  │   Page      │  │    Page     │  │    Page     │  │    Page     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                          ┌────────┴────────┐                                │
│                          │   AuthContext   │                                │
│                          │   (Estado Auth) │                                │
│                          └────────┬────────┘                                │
│                                   │                                          │
│                          ┌────────┴────────┐                                │
│                          │   API Client    │                                │
│                          │  (lib/api.ts)   │                                │
│                          └────────┬────────┘                                │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │ HTTP/HTTPS
                                    │ (Cookies httpOnly + Bearer Token)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (NestJS)                                    │
│                          Render.com:3001                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         API Gateway (/api/v1)                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│     ┌──────────────────────────────┼──────────────────────────────┐         │
│     │                              │                              │         │
│     ▼                              ▼                              ▼         │
│  ┌──────────┐               ┌──────────┐               ┌──────────┐        │
│  │   Auth   │               │ Billing  │               │  Users   │        │
│  │  Module  │               │  Module  │               │  Module  │        │
│  └────┬─────┘               └────┬─────┘               └────┬─────┘        │
│       │                          │                          │               │
│  ┌────┴─────┐               ┌────┴─────┐               ┌────┴─────┐        │
│  │ Services │               │ Services │               │ Services │        │
│  │- Auth    │               │- Billing │               │- Users   │        │
│  │- MFA     │               │- Plans   │               │          │        │
│  │- JWT     │               │- Stripe  │               │          │        │
│  └────┬─────┘               └────┬─────┘               └────┬─────┘        │
│       │                          │                          │               │
└───────┼──────────────────────────┼──────────────────────────┼───────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   MySQL (Prisma)  │    │      Stripe       │    │    ClickHouse     │
│   Hostinger       │    │   (Pagamentos)    │    │    (Analytics)    │
│                   │    │                   │    │                   │
│ - Users           │    │ - Checkout        │    │ - Events          │
│ - Tenants         │    │ - Subscriptions   │    │ - Metrics         │
│ - RefreshTokens   │    │ - Invoices        │    │ - Tracking        │
│ - Subscriptions   │    │ - Webhooks        │    │                   │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

---

## Fluxo de Autenticação

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE LOGIN                                     │
└──────────────────────────────────────────────────────────────────────────┘

1. LOGIN COM EMAIL/SENHA
========================

  Usuário                    Frontend                     Backend
     │                          │                            │
     │  1. Digite email/senha   │                            │
     │ ─────────────────────────>                            │
     │                          │                            │
     │                          │  2. POST /api/v1/auth/login│
     │                          │ ───────────────────────────>
     │                          │                            │
     │                          │                            │  3. Verifica senha
     │                          │                            │     (bcrypt.compare)
     │                          │                            │
     │                          │                            │  4. Gera tokens:
     │                          │                            │     - accessToken (JWT, 15min)
     │                          │                            │     - refreshToken (UUID, 7 dias)
     │                          │                            │
     │                          │  5. Response + Cookies     │
     │                          │ <───────────────────────────
     │                          │     Set-Cookie: accessToken (httpOnly)
     │                          │     Set-Cookie: refreshToken (httpOnly)
     │                          │     Body: { user, expiresIn }
     │                          │                            │
     │                          │  6. Salva no AuthContext   │
     │  7. Redireciona /dashboard                           │
     │ <─────────────────────────                            │
     │                          │                            │


2. LOGIN COM GOOGLE/GITHUB (OAuth)
==================================

  Usuário                    Frontend                     Backend              Google/GitHub
     │                          │                            │                      │
     │  1. Clica "Login Google" │                            │                      │
     │ ─────────────────────────>                            │                      │
     │                          │                            │                      │
     │                          │  2. Redirect para OAuth    │                      │
     │                          │ ───────────────────────────>                      │
     │                          │                            │                      │
     │                          │                            │  3. Redirect Google  │
     │                          │                            │ ─────────────────────>
     │                          │                            │                      │
     │  4. Autoriza app         │                            │                      │
     │ ────────────────────────────────────────────────────────────────────────────>
     │                          │                            │                      │
     │                          │                            │  5. Callback + code  │
     │                          │                            │ <─────────────────────
     │                          │                            │                      │
     │                          │                            │  6. Valida profile   │
     │                          │                            │     Cria/Atualiza user│
     │                          │                            │     Gera tokens      │
     │                          │                            │                      │
     │                          │  7. Redirect /auth/callback│                      │
     │                          │ <───────────────────────────                      │
     │                          │     (cookies já setados)   │                      │
     │                          │                            │                      │
     │  8. Redireciona /dashboard                           │                      │
     │ <─────────────────────────                            │                      │


3. REFRESH TOKEN (Renovação Automática)
=======================================

  Frontend                           Backend
     │                                  │
     │  1. Request com token expirado   │
     │ ────────────────────────────────>│
     │                                  │
     │  2. 401 Unauthorized             │
     │ <────────────────────────────────│
     │                                  │
     │  3. POST /api/v1/auth/refresh    │
     │     (refreshToken no cookie)     │
     │ ────────────────────────────────>│
     │                                  │
     │                                  │ 4. Valida refreshToken no DB
     │                                  │    Revoga token antigo
     │                                  │    Gera novos tokens
     │                                  │
     │  5. Novos cookies + retry        │
     │ <────────────────────────────────│
     │                                  │


4. LOGOUT
=========

  Usuário                    Frontend                     Backend
     │                          │                            │
     │  1. Clica "Logout"       │                            │
     │ ─────────────────────────>                            │
     │                          │                            │
     │                          │  2. POST /api/v1/auth/logout
     │                          │ ───────────────────────────>
     │                          │                            │
     │                          │                            │  3. Revoga refreshToken
     │                          │                            │     no banco de dados
     │                          │                            │
     │                          │  4. Clear cookies          │
     │                          │ <───────────────────────────
     │                          │                            │
     │                          │  5. Limpa AuthContext      │
     │  6. Redireciona /login   │                            │
     │ <─────────────────────────                            │
```

---

## Fluxo de Billing/Pagamentos

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE ASSINATURA                                   │
└──────────────────────────────────────────────────────────────────────────┘

1. CRIAR ASSINATURA (Checkout)
==============================

  Usuário              Frontend                 Backend                 Stripe
     │                    │                        │                       │
     │ 1. Seleciona plano │                        │                       │
     │ ──────────────────>│                        │                       │
     │                    │                        │                       │
     │                    │ 2. POST /billing/checkout                      │
     │                    │    { planTier, billingInterval }               │
     │                    │ ───────────────────────>                       │
     │                    │                        │                       │
     │                    │                        │ 3. Cria/busca Customer│
     │                    │                        │ ──────────────────────>
     │                    │                        │                       │
     │                    │                        │ 4. Cria Checkout Session
     │                    │                        │ ──────────────────────>
     │                    │                        │                       │
     │                    │                        │ 5. Return session URL │
     │                    │                        │ <──────────────────────
     │                    │                        │                       │
     │                    │ 6. Return { url }      │                       │
     │                    │ <───────────────────────                       │
     │                    │                        │                       │
     │ 7. Redirect Stripe │                        │                       │
     │ <──────────────────│                        │                       │
     │                    │                        │                       │
     │ 8. Preenche pagamento no Stripe            │                       │
     │ ───────────────────────────────────────────────────────────────────>
     │                    │                        │                       │
     │                    │                        │ 9. Webhook: checkout.session.completed
     │                    │                        │ <──────────────────────
     │                    │                        │                       │
     │                    │                        │ 10. Atualiza Subscription no DB
     │                    │                        │                       │
     │ 11. Redirect /billing?success=true         │                       │
     │ <───────────────────────────────────────────────────────────────────
     │                    │                        │                       │


2. VERIFICAR LIMITES DO PLANO
=============================

  Frontend                           Backend                         DB
     │                                  │                              │
     │ 1. GET /billing/limits/check     │                              │
     │    ?type=projects                │                              │
     │ ────────────────────────────────>│                              │
     │                                  │                              │
     │                                  │ 2. Busca subscription        │
     │                                  │ ─────────────────────────────>
     │                                  │                              │
     │                                  │ 3. Busca plan limits         │
     │                                  │ ─────────────────────────────>
     │                                  │                              │
     │                                  │ 4. Conta uso atual           │
     │                                  │ ─────────────────────────────>
     │                                  │                              │
     │ 5. { allowed, current, limit }   │                              │
     │ <────────────────────────────────│                              │
     │                                  │                              │


3. CANCELAR ASSINATURA
======================

  Usuário              Frontend                 Backend                 Stripe
     │                    │                        │                       │
     │ 1. Clica Cancelar  │                        │                       │
     │ ──────────────────>│                        │                       │
     │                    │                        │                       │
     │ 2. Confirma ação   │                        │                       │
     │ ──────────────────>│                        │                       │
     │                    │                        │                       │
     │                    │ 3. DELETE /billing/subscription               │
     │                    │ ───────────────────────>                       │
     │                    │                        │                       │
     │                    │                        │ 4. Cancel at period end
     │                    │                        │ ──────────────────────>
     │                    │                        │                       │
     │                    │                        │ 5. Atualiza status    │
     │                    │                        │    "canceling"        │
     │                    │                        │                       │
     │                    │ 6. 204 No Content      │                       │
     │                    │ <───────────────────────                       │
     │                    │                        │                       │
     │ 7. Atualiza UI     │                        │                       │
     │ <──────────────────│                        │                       │


4. WEBHOOKS DO STRIPE
=====================

  Stripe                             Backend                           DB
     │                                  │                               │
     │ customer.subscription.updated    │                               │
     │ ────────────────────────────────>│                               │
     │                                  │                               │
     │                                  │ 1. Verifica assinatura        │
     │                                  │ ─────────────────────────────>│
     │                                  │                               │
     │                                  │ 2. Atualiza Subscription      │
     │                                  │ ─────────────────────────────>│
     │                                  │                               │
     │ invoice.payment_succeeded        │                               │
     │ ────────────────────────────────>│                               │
     │                                  │                               │
     │                                  │ 3. Registra pagamento         │
     │                                  │ ─────────────────────────────>│
     │                                  │                               │
     │ customer.subscription.deleted    │                               │
     │ ────────────────────────────────>│                               │
     │                                  │                               │
     │                                  │ 4. Marca como canceled        │
     │                                  │ ─────────────────────────────>│
```

---

## Estrutura de Dados

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MODELOS DO BANCO DE DADOS                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Tenant      │       │      Plan       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──┐    │ id              │       │ id              │
│ email           │  │    │ name            │       │ name            │
│ name            │  │    │ slug            │       │ tier            │
│ passwordHash    │  └───>│ ownerId         │       │ monthlyPrice    │
│ avatarUrl       │       │ stripeCustomerId│       │ yearlyPrice     │
│ mfaEnabled      │       │ planId ─────────┼──────>│ features (JSON) │
│ mfaSecret       │       │ subscriptionId  │       │ limits (JSON)   │
│ mfaBackupCodes  │       │ createdAt       │       │ stripePriceIds  │
│ createdAt       │       └─────────────────┘       └─────────────────┘
└─────────────────┘               │
        │                         │
        │                         ▼
        │               ┌─────────────────┐
        │               │  Subscription   │
        │               ├─────────────────┤
        │               │ id              │
        │               │ tenantId        │
        │               │ stripeSubId     │
        │               │ status          │
        │               │ currentPeriodEnd│
        │               │ cancelAtPeriodEnd│
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐       ┌─────────────────┐
│  RefreshToken   │       │   TenantUser    │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ token           │       │ userId          │
│ userId ─────────│       │ tenantId        │
│ expiresAt       │       │ role            │
│ revokedAt       │       │ createdAt       │
│ createdAt       │       └─────────────────┘
└─────────────────┘
```

---

## Endpoints da API

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ENDPOINTS                                       │
└──────────────────────────────────────────────────────────────────────────┘

AUTH (/api/v1/auth)
├── POST   /register          - Criar conta
├── POST   /login             - Login com email/senha
├── POST   /refresh           - Renovar access token
├── POST   /logout            - Encerrar sessão
├── GET    /me                - Dados do usuário logado
├── GET    /google            - Iniciar OAuth Google
├── GET    /google/callback   - Callback OAuth Google
├── GET    /github            - Iniciar OAuth GitHub
└── GET    /github/callback   - Callback OAuth GitHub

BILLING (/api/v1/billing)
├── GET    /plans             - Listar planos (público)
├── GET    /plans/compare     - Comparação de planos (público)
├── GET    /subscription      - Assinatura atual (auth)
├── GET    /usage             - Uso atual (auth)
├── GET    /invoices          - Histórico de faturas (auth)
├── POST   /checkout          - Criar sessão de checkout (auth, OWNER/ADMIN)
├── POST   /portal            - Abrir portal do Stripe (auth, OWNER/ADMIN)
├── DELETE /subscription      - Cancelar assinatura (auth, OWNER)
├── POST   /subscription/resume - Reativar assinatura (auth, OWNER)
├── GET    /limits/check      - Verificar limites do plano (auth)
└── POST   /webhooks/stripe   - Webhook do Stripe (público)

USERS (/api/v1/users)
├── GET    /                  - Listar usuários do tenant
├── GET    /:id               - Detalhes do usuário
├── PUT    /:id               - Atualizar usuário
└── DELETE /:id               - Remover usuário

MFA (/api/v1/auth/mfa)
├── POST   /setup             - Iniciar configuração MFA
├── POST   /verify            - Verificar e ativar MFA
├── POST   /disable           - Desativar MFA
├── GET    /status            - Status do MFA
└── POST   /backup-codes      - Regenerar códigos de backup
```

---

## Variáveis de Ambiente

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO DE AMBIENTE                               │
└──────────────────────────────────────────────────────────────────────────┘

BACKEND (apps/api/.env)
=======================
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://seu-frontend.com
FRONTEND_URL=https://seu-frontend.com

# Banco de Dados
DATABASE_URL=mysql://user:pass@host:3306/db

# JWT
JWT_SECRET=<64 chars hex>
JWT_EXPIRES_IN=15m
REFRESH_SECRET=<64 chars hex>
REFRESH_TOKEN_EXPIRES_DAYS=7

# Criptografia (MFA)
ENCRYPTION_KEY=<64 chars hex>
MFA_ISSUER=TrackPro

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ClickHouse (Analytics)
CLICKHOUSE_HOST=...
CLICKHOUSE_DATABASE=default
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=...

# Redis (opcional)
REDIS_URL=redis://...


FRONTEND (apps/web/.env.local)
==============================
NEXT_PUBLIC_API_URL=https://seu-backend.com
NEXT_PUBLIC_APP_URL=https://seu-frontend.com
```

---

## Fluxo de Dados nas Páginas

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PÁGINA DE LOGIN (/login)                               │
└──────────────────────────────────────────────────────────────────────────┘

1. Usuário acessa /login
2. Componente verifica se já está autenticado (AuthContext)
3. Se autenticado → redireciona para /dashboard
4. Se não → exibe formulário de login
5. Usuário submete form → POST /api/v1/auth/login
6. Backend valida → retorna tokens nos cookies
7. Frontend atualiza AuthContext
8. Redireciona para /dashboard


┌──────────────────────────────────────────────────────────────────────────┐
│                   PÁGINA DE BILLING (/billing)                            │
└──────────────────────────────────────────────────────────────────────────┘

1. Usuário acessa /billing
2. useAuth() verifica autenticação
3. Se não autenticado → redireciona para /login
4. loadBillingData() faz 4 requests em paralelo:
   ├── GET /billing/plans        → Lista de planos
   ├── GET /billing/subscription → Assinatura atual
   ├── GET /billing/usage        → Uso do período
   └── GET /billing/invoices     → Histórico de faturas
5. Renderiza UI com dados:
   ├── Seletor Monthly/Yearly
   ├── Cards de planos com botões
   ├── Barra de uso (se tiver assinatura)
   └── Tabela de faturas (se tiver histórico)
6. Ao clicar em plano → POST /billing/checkout
7. Redireciona para Stripe Checkout
8. Após pagamento → Stripe redireciona para /billing?success=true


┌──────────────────────────────────────────────────────────────────────────┐
│                   PÁGINA DE DASHBOARD (/dashboard)                        │
└──────────────────────────────────────────────────────────────────────────┘

1. Usuário acessa /dashboard
2. Layout verifica autenticação (AuthContext)
3. Se não autenticado → redireciona para /login
4. Carrega dados do tenant e projetos
5. Verifica limites do plano antes de criar novos itens
6. Exibe métricas e lista de projetos
```
