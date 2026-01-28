# Configuração do Stripe para TrackPro

Este guia explica como configurar o Stripe para habilitar o sistema de billing do TrackPro.

## 1. Criar Conta no Stripe

1. Acesse [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie sua conta e complete a verificação

## 2. Obter as Chaves de API

1. No Dashboard do Stripe, vá para **Developers > API keys**
2. Copie as chaves:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)

3. Adicione ao seu `.env`:
```env
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
```

## 3. Criar Produtos e Preços no Stripe

### Via Dashboard (Recomendado para início)

1. Vá para **Products** no Dashboard
2. Clique em **+ Add product**
3. Crie os seguintes produtos:

#### Produto: Starter
- Nome: `TrackPro Starter`
- Descrição: `For small teams getting serious about analytics`
- Preços:
  - Mensal: $29.00 USD / mês (recurring)
  - Anual: $290.00 USD / ano (recurring)

#### Produto: Professional
- Nome: `TrackPro Professional`
- Descrição: `For growing businesses with advanced needs`
- Preços:
  - Mensal: $99.00 USD / mês (recurring)
  - Anual: $990.00 USD / ano (recurring)

#### Produto: Enterprise
- Nome: `TrackPro Enterprise`
- Descrição: `For large organizations with custom requirements`
- Preços:
  - Mensal: $499.00 USD / mês (recurring)
  - Anual: $4,990.00 USD / ano (recurring)

### Após criar os preços

1. Copie o **Price ID** de cada preço (começa com `price_`)
2. Atualize o banco de dados com os IDs:

```sql
-- Starter
UPDATE plans SET
  stripe_price_id_monthly = 'price_xxx_monthly',
  stripe_price_id_yearly = 'price_xxx_yearly'
WHERE tier = 'STARTER';

-- Professional
UPDATE plans SET
  stripe_price_id_monthly = 'price_xxx_monthly',
  stripe_price_id_yearly = 'price_xxx_yearly'
WHERE tier = 'PROFESSIONAL';

-- Enterprise
UPDATE plans SET
  stripe_price_id_monthly = 'price_xxx_monthly',
  stripe_price_id_yearly = 'price_xxx_yearly'
WHERE tier = 'ENTERPRISE';
```

Ou via API:

```bash
curl -X POST http://localhost:3001/api/v1/billing/admin/plans/stripe-prices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "STARTER",
    "monthlyPriceId": "price_xxx_monthly",
    "yearlyPriceId": "price_xxx_yearly"
  }'
```

## 4. Configurar Webhook

O webhook é necessário para receber notificações do Stripe sobre eventos de pagamento.

### Desenvolvimento Local (usando Stripe CLI)

1. Instale o Stripe CLI:
   - Windows: `winget install Stripe.StripeCLI`
   - macOS: `brew install stripe/stripe-cli/stripe`
   - Linux: [Ver documentação](https://stripe.com/docs/stripe-cli)

2. Faça login:
```bash
stripe login
```

3. Encaminhe eventos para seu servidor local:
```bash
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe
```

4. Copie o **webhook signing secret** exibido (começa com `whsec_`) e adicione ao `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

### Produção

1. No Dashboard do Stripe, vá para **Developers > Webhooks**
2. Clique em **+ Add endpoint**
3. Configure:
   - URL: `https://seu-dominio.com/api/v1/billing/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

4. Após criar, copie o **Signing secret** e adicione ao `.env` de produção

## 5. Configurar Customer Portal

O Customer Portal permite que clientes gerenciem suas assinaturas.

1. Vá para **Settings > Billing > Customer portal**
2. Configure as opções desejadas:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoice history
   - ✅ Allow customers to cancel subscriptions
   - Cancellation: At end of billing period

3. Personalize a aparência com sua marca

## 6. Testar o Fluxo

### Dados de Teste

Use cartões de teste do Stripe:
- **Sucesso**: `4242 4242 4242 4242`
- **Requer autenticação**: `4000 0025 0000 3155`
- **Pagamento recusado**: `4000 0000 0000 9995`

Data de validade: qualquer data futura
CVC: qualquer 3 dígitos

### Fluxo de Teste

1. Acesse a página de billing no dashboard
2. Selecione um plano e clique em "Upgrade"
3. Complete o checkout com cartão de teste
4. Verifique se a assinatura aparece no dashboard
5. Teste o Customer Portal clicando em "Manage Billing"

## 7. Variáveis de Ambiente Completas

```env
# Stripe Billing
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

## 8. Checklist de Produção

- [ ] Mudar para chaves de produção (`sk_live_`, `pk_live_`)
- [ ] Configurar webhook de produção
- [ ] Configurar Customer Portal
- [ ] Testar fluxo completo com cartão real
- [ ] Configurar alertas de falha de pagamento
- [ ] Configurar emails de cobrança no Stripe
- [ ] Revisar políticas de cancelamento

## Troubleshooting

### Webhook não recebe eventos
- Verifique se a URL está acessível externamente
- Confirme que o `STRIPE_WEBHOOK_SECRET` está correto
- Verifique os logs no Dashboard do Stripe

### Erro de assinatura no webhook
- O `rawBody` deve estar disponível no request
- Verifique se o middleware de JSON está configurado corretamente

### Checkout não redireciona
- Confirme que os Price IDs estão configurados no banco
- Verifique os logs do servidor para erros

## Links Úteis

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/webhooks)
