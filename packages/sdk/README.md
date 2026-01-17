# @trackpro/sdk

JavaScript SDK para tracking first-party com suporte a Meta CAPI e LGPD.

## Instalação

```bash
npm install @trackpro/sdk
# ou
pnpm add @trackpro/sdk
# ou
yarn add @trackpro/sdk
```

### CDN (UMD Build)

```html
<script src="https://cdn.seu-dominio.com/trackpro.min.js"></script>
<script>
  TrackPro.init({
    apiKey: 'tp_xxxxxxxxxxxx',
    apiSecret: 'tps_xxxxxxxxxxxx',
  });
</script>
```

## Início Rápido

```javascript
import TrackPro from '@trackpro/sdk';

// 1. Inicializar o SDK
TrackPro.init({
  apiKey: 'tp_xxxxxxxxxxxx',
  apiSecret: 'tps_xxxxxxxxxxxx',
  ingestUrl: 'https://ingest.trackpro.io/v1', // Opcional
  autoPageView: true,  // Page view automático
  autoUTM: true,       // Captura UTM params da URL
  sessionTimeout: 30,  // Timeout de sessão em minutos
  debug: false,        // Logs no console
});

// 2. Mostrar banner de consentimento (LGPD)
TrackPro.showConsentBanner({
  position: 'bottom',
  language: 'pt-BR',
  privacyPolicyUrl: '/politica-privacidade',
  cookiePolicyUrl: '/politica-cookies',
});

// 3. Trackear eventos
TrackPro.track('view_content', {
  content_id: 'produto-123',
  content_name: 'Produto Legal',
});
```

## API Reference

### `init(config)`

Inicializa o SDK. Deve ser chamado antes de qualquer outro método.

```typescript
interface TrackProConfig {
  apiKey: string;           // Obrigatório: API Key do projeto
  apiSecret: string;        // Obrigatório: API Secret para HMAC
  ingestUrl?: string;       // URL do serviço de ingestão
  autoPageView?: boolean;   // Auto page_view (default: true)
  autoUTM?: boolean;        // Captura UTM params (default: true)
  sessionTimeout?: number;  // Minutos até expirar sessão (default: 30)
  debug?: boolean;          // Logs no console (default: false)
}

TrackPro.init(config);
```

### `track(eventName, properties?)`

Trackeia um evento customizado.

```javascript
// Evento simples
TrackPro.track('button_click');

// Evento com propriedades
TrackPro.track('view_content', {
  content_id: 'produto-123',
  content_name: 'Tênis Nike Air',
  content_type: 'product',
  value: 499.90,
  currency: 'BRL',
});

// Evento de compra (Meta CAPI)
TrackPro.track('purchase', {
  order_id: 'order-456',
  value: 899.90,
  currency: 'BRL',
  content_ids: ['prod-1', 'prod-2'],
});
```

### `pageView(properties?)`

Trackeia uma visualização de página. Chamado automaticamente se `autoPageView: true`.

```javascript
// Page view automático captura:
// - url, path, title, referrer

// Page view manual com propriedades extras
TrackPro.pageView({
  page_category: 'produtos',
  page_type: 'listing',
});
```

### `identify(userId, traits?)`

Identifica um usuário (associa anonymous_id a um user_id).

```javascript
TrackPro.identify('user-123', {
  email: 'joao@email.com',
  name: 'João Silva',
  phone: '+5511999999999',
  plan: 'premium',
});
```

**Importante para Meta CAPI:** Os campos `email` e `phone` são automaticamente hasheados (SHA256) antes do envio para o Meta.

### `consent(categories)`

Atualiza as preferências de consentimento do usuário.

```javascript
// Apenas necessários
TrackPro.consent(['necessary']);

// Todos
TrackPro.consent(['necessary', 'analytics', 'marketing', 'preferences']);
```

### `reset()`

Reseta a identidade do usuário (logout). Gera novo `anonymous_id` e `session_id`.

```javascript
TrackPro.reset();
```

### `getInstance()`

Retorna a instância do SDK para acesso direto.

```javascript
const instance = TrackPro.getInstance();
console.log(instance.getAnonymousId());
console.log(instance.getUserId());
console.log(instance.getSessionId());
```

## Banner de Consentimento (LGPD)

O SDK inclui um banner de consentimento pronto para uso, compatível com LGPD.

### `showConsentBanner(config)`

```javascript
import TrackPro from '@trackpro/sdk';

TrackPro.showConsentBanner({
  // Posição do banner
  position: 'bottom', // 'bottom' | 'top' | 'center'

  // Tema
  theme: 'auto', // 'light' | 'dark' | 'auto'

  // Idioma
  language: 'pt-BR', // 'pt-BR' | 'en'

  // URLs das políticas
  privacyPolicyUrl: '/politica-privacidade',
  cookiePolicyUrl: '/politica-cookies',

  // Configurar categorias
  categories: {
    analytics: {
      enabled: true,
      description: 'Cookies de análise personalizados'
    },
    marketing: {
      enabled: true,
      description: 'Cookies de remarketing'
    },
    preferences: {
      enabled: false // Desabilita esta categoria
    },
  },

  // Callbacks
  onAccept: (categories) => {
    console.log('Usuário aceitou:', categories);
  },
  onReject: () => {
    console.log('Usuário recusou cookies opcionais');
  },
});
```

### Verificar consentimento existente

```javascript
import { createConsentBanner } from '@trackpro/sdk';

const banner = createConsentBanner({ language: 'pt-BR' });

// Verificar se já deu consentimento
if (banner.hasConsent()) {
  const categories = banner.getConsent();
  console.log('Consentimento salvo:', categories);
} else {
  banner.show();
}
```

## Eventos Padrão (Meta CAPI)

Os eventos abaixo são automaticamente mapeados para o Meta Conversions API:

| Evento SDK | Meta CAPI | Descrição |
|------------|-----------|-----------|
| `page_view` | PageView | Visualização de página |
| `view_content` | ViewContent | Visualização de conteúdo/produto |
| `lead` | Lead | Captura de lead |
| `search` | Search | Pesquisa |
| `add_to_cart` | AddToCart | Adicionar ao carrinho |
| `add_payment_info` | AddPaymentInfo | Adicionar info de pagamento |
| `initiate_checkout` | InitiateCheckout | Iniciar checkout |
| `purchase` | Purchase | Compra finalizada |
| `complete_registration` | CompleteRegistration | Cadastro completo |

### Propriedades do Evento de Compra

```javascript
TrackPro.track('purchase', {
  // Obrigatórios
  order_id: 'order-12345',    // ID único do pedido
  value: 299.90,              // Valor total
  currency: 'BRL',            // Moeda ISO 4217

  // Opcionais (melhoram match rate Meta)
  content_ids: ['sku-1', 'sku-2'],  // IDs dos produtos
  content_type: 'product',           // Tipo de conteúdo
  num_items: 2,                      // Quantidade de itens
});
```

## Categorias de Consentimento

| Categoria | Descrição |
|-----------|-----------|
| `necessary` | Cookies essenciais (sempre ativo) |
| `analytics` | Análise de uso e métricas |
| `marketing` | Publicidade e remarketing |
| `preferences` | Preferências e personalização |

## Dados Coletados Automaticamente

O SDK coleta automaticamente:

- **Identificadores**: anonymous_id, session_id, user_id (após identify)
- **Página**: url, path, referrer, title
- **UTM**: utm_source, utm_medium, utm_campaign, utm_content, utm_term
- **Device**: user_agent
- **Meta Pixel**: _fbp, _fbc (cookies do Meta)
- **Consentimento**: consent_categories

## Segurança

### Assinatura HMAC

Todas as requisições são assinadas com HMAC-SHA256:

```
Signature = HMAC-SHA256(timestamp + "." + body, apiSecret)
```

Headers enviados:
- `x-api-key`: API Key do projeto
- `x-signature`: Assinatura HMAC
- `x-timestamp`: Timestamp Unix em milissegundos

### Anti-Replay

O servidor valida que o timestamp está dentro de uma janela de 5 minutos.

### Dados Sensíveis

- Email e telefone são automaticamente hasheados (SHA256) para envio ao Meta CAPI
- IP do usuário é coletado pelo servidor, não pelo SDK

## Integração com Frameworks

### Next.js

```jsx
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import TrackPro from '@trackpro/sdk';

export function TrackProProvider({ children }) {
  useEffect(() => {
    TrackPro.init({
      apiKey: process.env.NEXT_PUBLIC_TRACKPRO_KEY,
      apiSecret: process.env.NEXT_PUBLIC_TRACKPRO_SECRET,
    });

    TrackPro.showConsentBanner({
      position: 'bottom',
      language: 'pt-BR',
    });
  }, []);

  return children;
}
```

### React

```jsx
// App.jsx
import { useEffect } from 'react';
import TrackPro from '@trackpro/sdk';

function App() {
  useEffect(() => {
    TrackPro.init({
      apiKey: import.meta.env.VITE_TRACKPRO_KEY,
      apiSecret: import.meta.env.VITE_TRACKPRO_SECRET,
    });
  }, []);

  const handlePurchase = () => {
    TrackPro.track('purchase', {
      order_id: 'order-123',
      value: 99.90,
      currency: 'BRL',
    });
  };

  return <button onClick={handlePurchase}>Comprar</button>;
}
```

### Google Tag Manager

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.seu-dominio.com/trackpro.min.js';
    script.onload = function() {
      TrackPro.init({
        apiKey: '{{TrackPro API Key}}',
        apiSecret: '{{TrackPro API Secret}}',
      });
    };
    document.head.appendChild(script);
  })();
</script>
```

## Troubleshooting

### Eventos não aparecem no dashboard

1. Verifique se o SDK foi inicializado com `debug: true`
2. Confira os logs no console do navegador
3. Verifique se API Key e Secret estão corretos
4. Confirme que o domínio está configurado no projeto

### Banner não aparece

1. O banner só aparece se não houver consentimento salvo
2. Para testar, limpe o cookie `trackpro_consent`
3. Verifique se `showConsentBanner()` está sendo chamado

### Eventos duplicados

1. Verifique se `init()` está sendo chamado apenas uma vez
2. O SDK faz deduplicação automática no servidor (Redis)

## Build

```bash
# Desenvolvimento
pnpm --filter @trackpro/sdk dev

# Build de produção
pnpm --filter @trackpro/sdk build

# Gerar UMD bundle
pnpm --filter @trackpro/sdk build:umd
```

## Suporte

- Documentação: https://docs.trackpro.io
- GitHub Issues: https://github.com/seu-usuario/trackpro/issues
- Email: suporte@trackpro.io
