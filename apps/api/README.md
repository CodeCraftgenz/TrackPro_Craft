# @trackpro/api

API principal do TrackPro - NestJS com Prisma e MySQL.

## Responsabilidades

- Autenticação (JWT + Refresh Tokens)
- RBAC (Owner/Admin/Analyst)
- Gestão de Tenants e Memberships
- Gestão de Projects e API Keys
- Integrações (Meta CAPI config)
- Reports (consulta ClickHouse)
- Exports

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Perfil atual

### Tenants
- `POST /api/v1/tenants` - Criar tenant
- `GET /api/v1/tenants` - Listar tenants
- `GET /api/v1/tenants/:id` - Detalhes
- `PUT /api/v1/tenants/:id` - Atualizar
- `DELETE /api/v1/tenants/:id` - Deletar
- `POST /api/v1/tenants/:id/members` - Adicionar membro
- `DELETE /api/v1/tenants/:id/members/:userId` - Remover membro

### Projects
- `POST /api/v1/tenants/:tenantId/projects` - Criar
- `GET /api/v1/tenants/:tenantId/projects` - Listar
- `GET /api/v1/tenants/:tenantId/projects/:id` - Detalhes
- `PUT /api/v1/tenants/:tenantId/projects/:id` - Atualizar
- `DELETE /api/v1/tenants/:tenantId/projects/:id` - Deletar

### API Keys
- `POST /api/v1/tenants/:tenantId/projects/:id/api-keys` - Criar
- `GET /api/v1/tenants/:tenantId/projects/:id/api-keys` - Listar
- `DELETE /api/v1/tenants/:tenantId/projects/:id/api-keys/:keyId` - Revogar

### Health
- `GET /api/v1/health` - Status
- `GET /api/v1/health/ready` - Readiness
- `GET /api/v1/health/live` - Liveness

## Desenvolvimento

```bash
# Na raiz do monorepo
pnpm --filter @trackpro/api dev

# Database
pnpm --filter @trackpro/api db:migrate
pnpm --filter @trackpro/api db:studio

# Testes
pnpm --filter @trackpro/api test
```

## Variáveis de Ambiente

Ver `.env.example`
