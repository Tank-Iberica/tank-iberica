## ANEXO X: REGISTRO DE INTEGRACIONES EXTERNAS Y APIS

### X.1 Principio de diseño

Todas las integraciones externas siguen el **patrón adapter**:

- Cada servicio externo tiene una server route dedicada en `/server/api/`
- La lógica de negocio NUNCA llama a un proveedor directamente — siempre a través del adapter
- Cambiar de proveedor = cambiar el adapter, sin tocar frontend ni lógica de negocio
- Las API keys se almacenan en variables de entorno (Cloudflare Pages env vars)
- Los nombres de proveedores se configuran en `vertical_config` cuando el proveedor varía por vertical

### X.2 Mapa completo de integraciones

| Servicio                    | Proveedor actual          | Alternativas                   | Sesión | Server route                | Coste            |
| --------------------------- | ------------------------- | ------------------------------ | ------ | --------------------------- | ---------------- |
| **Autenticación**           | Supabase Auth             | Auth0, Firebase Auth           | 24     | built-in                    | 0€               |
| **Base de datos**           | Supabase (PostgreSQL)     | Neon, Railway, self-hosted     | 2      | built-in                    | 25€/mes          |
| **Almacenamiento imágenes** | Cloudinary                | Cloudflare Images, bunny.net   | 2      | built-in                    | 89€/mes          |
| **Hosting frontend**        | Cloudflare Pages          | Vercel, Netlify                | 2      | built-in                    | 0€               |
| **CDN + WAF + DNS**         | Cloudflare                | AWS CloudFront                 | 19     | built-in                    | 0€               |
| **Pagos**                   | Stripe                    | — (no alternativa real)        | 17     | `/api/stripe/*`             | 1,4%+0,25€/tx    |
| **Pagos marketplace**       | Stripe Connect            | —                              | 17     | `/api/stripe-connect-*`     | incluido         |
| **Facturación**             | Quaderno                  | Holded, export CSV             | 26     | `/api/quaderno/*`           | ~30€/mes         |
| **Email transaccional**     | Resend                    | SendGrid, Amazon SES           | 18     | `/api/email/send`           | 0€ (tier gratis) |
| **WhatsApp Business**       | 360dialog / Twilio        | MessageBird, Vonage            | 21     | `/api/whatsapp/*`           | ~50€/mes         |
| **Informe DGT**             | InfoCar                   | Carvertical, manual DGT        | 15     | `/api/dgt-report`           | 2-4€/consulta    |
| **IA - Descripciones**      | Claude Haiku (Anthropic)  | GPT-4o mini, Gemini Flash      | 24     | `/api/generate-description` | ~0,01€/desc      |
| **IA - Visión documentos**  | Claude Vision (Anthropic) | GPT-4o Vision, Gemini Pro      | 15, 21 | `/api/verify-document`      | ~0,10€/análisis  |
| **IA - Traducciones**       | GPT-4o mini Batch API     | Claude Haiku, DeepL API        | 12     | `/api/translate-batch`      | ~0,001€/ficha    |
| **Captcha**                 | Cloudflare Turnstile      | hCaptcha, reCAPTCHA v3         | 19     | client-side                 | 0€               |
| **Analytics**               | Google Analytics 4        | Plausible, Fathom              | 7      | client-side                 | 0€               |
| **Ads**                     | Google AdSense            | Ezoic, Mediavine               | 16b    | client-side                 | 0€ (ingreso)     |
| **SEM**                     | Google Ads                | Microsoft Ads                  | 16b    | pixel client-side           | variable         |
| **Shopping Feed**           | Google Merchant Center    | —                              | 16b    | `/api/merchant-feed`        | 0€               |
| **Social - LinkedIn**       | LinkedIn API v2           | —                              | 16d    | `/api/social/linkedin`      | 0€               |
| **Social - Facebook**       | Facebook Graph API        | —                              | 16d    | `/api/social/facebook`      | 0€               |
| **Social - Instagram**      | Facebook Graph API        | —                              | 16d    | `/api/social/instagram`     | 0€               |
| **Monitoreo errores**       | Sentry                    | LogRocket, Bugsnag             | 19     | SDK client+server           | 0€ (tier gratis) |
| **Monitoreo uptime**        | Better Uptime             | UptimeRobot, Pingdom           | 19     | webhook                     | 0€               |
| **Imprenta**                | Local (email)             | Vistaprint API, Pixartprinting | 31     | email manual                | 0€               |

### X.3 Patrón de implementación estándar

```typescript
// /server/utils/adapters/dgt-adapter.ts
// TODOS los adapters siguen esta estructura:

interface DgtReportProvider {
  name: string
  getReport(matricula: string): Promise<DgtReportData>
}

// Proveedor actual
class InfoCarProvider implements DgtReportProvider {
  name = 'infocar'
  async getReport(matricula: string): Promise<DgtReportData> {
    const response = await fetch('https://api.infocar.es/v1/vehicle/' + matricula, {
      headers: { Authorization: 'Bearer ' + process.env.INFOCAR_API_KEY },
    })
    return this.mapResponse(await response.json())
  }
  private mapResponse(raw: any): DgtReportData {
    /* normalizar */
  }
}

// Proveedor alternativo (cambiar aquí si se cambia de proveedor)
class CarverticalProvider implements DgtReportProvider {
  name = 'carvertical'
  async getReport(matricula: string): Promise<DgtReportData> {
    // ... diferente API, mismo output
  }
}

// Factory: lee de env var qué proveedor usar
export function getDgtProvider(): DgtReportProvider {
  const provider = process.env.DGT_PROVIDER || 'infocar'
  switch (provider) {
    case 'infocar':
      return new InfoCarProvider()
    case 'carvertical':
      return new CarverticalProvider()
    default:
      return new InfoCarProvider()
  }
}
```

```typescript
// /server/api/dgt-report.post.ts
// La server route SOLO usa el adapter, nunca el proveedor directamente
import { getDgtProvider } from '~/server/utils/adapters/dgt-adapter'

export default defineEventHandler(async (event) => {
  const { matricula } = await readBody(event)
  const provider = getDgtProvider()
  const report = await provider.getReport(matricula)
  // ... generar PDF, guardar en BD
  return { report }
})
```

### X.4 Patrón de IA adaptable

```typescript
// /server/utils/adapters/ai-adapter.ts
interface AIProvider {
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>
  analyzeImage(imageUrl: string, prompt: string): Promise<string>
}

class AnthropicProvider implements AIProvider {
  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    // Usar Claude Haiku para textos cortos (descripciones, traducciones)
    // Usar Claude Sonnet para textos largos (artículos, informes)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: options?.maxTokens || 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    return data.content[0].text
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    // Claude Vision para análisis de documentos, placas, fotos
    // ...mismo patrón con type: 'image'
  }
}

class OpenAIProvider implements AIProvider {
  async generateText(prompt: string): Promise<string> {
    // GPT-4o mini como alternativa
    // ...
  }
  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    // GPT-4o Vision como alternativa
    // ...
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'anthropic'
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider()
    case 'openai':
      return new OpenAIProvider()
    default:
      return new AnthropicProvider()
  }
}
```

### X.5 Variables de entorno necesarias

```bash
# === Infraestructura (ya configuradas) ===
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # SOLO en server routes
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# === Pagos ===
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# === Facturación ===
QUADERNO_API_KEY=xxx
QUADERNO_API_URL=https://xxx.quadernoapp.com/api

# === Email ===
RESEND_API_KEY=re_xxx

# === WhatsApp ===
WHATSAPP_PROVIDER=360dialog  # o 'twilio'
WHATSAPP_API_KEY=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx

# === IA ===
AI_PROVIDER=anthropic  # o 'openai'
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx  # backup

# === DGT ===
DGT_PROVIDER=infocar  # o 'carvertical' o 'manual'
INFOCAR_API_KEY=xxx

# === Social Media ===
LINKEDIN_ACCESS_TOKEN=xxx
FACEBOOK_PAGE_TOKEN=xxx
FACEBOOK_PAGE_ID=xxx

# === Analytics ===
GA4_MEASUREMENT_ID=G-xxx
GOOGLE_ADS_ID=AW-xxx

# === Seguridad ===
CLOUDFLARE_TURNSTILE_SECRET=xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### X.6 Orden de activación recomendado

| Prioridad | Servicio                                 | Cuándo activar                                     | Requiere contrato              |
| --------- | ---------------------------------------- | -------------------------------------------------- | ------------------------------ |
| 1         | Supabase, Cloudinary, Cloudflare, Resend | Día 1 (ya activos)                                 | Sí (ya hecho)                  |
| 2         | Stripe                                   | Pre-lanzamiento (sesión 17)                        | Sí (KYC)                       |
| 3         | Anthropic API                            | Pre-lanzamiento (sesiones 12, 15, 21, 24)          | Sí (tarjeta)                   |
| 4         | Cloudflare Turnstile, Sentry             | Pre-lanzamiento (sesión 19)                        | No (gratis)                    |
| 5         | GA4, Google Ads pixel                    | Lanzamiento (sesión 7)                             | No (gratis)                    |
| 6         | WhatsApp Business API                    | Post-lanzamiento mes 1 (sesión 21)                 | Sí (verificación Meta)         |
| 7         | InfoCar / DGT                            | Post-lanzamiento mes 2-3 (sesión 15)               | Sí (contrato B2B)              |
| 8         | Quaderno                                 | Cuando haya >10 facturas/mes (sesión 26)           | Sí (plan pago)                 |
| 9         | LinkedIn/Facebook/Instagram APIs         | Cuando haya >20 vehículos (sesión 16d)             | No (gratis con cuenta empresa) |
| 10        | Google Merchant Center                   | Cuando haya >50 vehículos (sesión 16b)             | No (gratis)                    |
| 11        | AdSense                                  | Cuando haya >30 vehículos + contenido (sesión 16b) | Sí (aprobación Google)         |
| 12        | Imprenta partner                         | Cuando haya >5 dealers (sesión 31)                 | Sí (acuerdo comercial)         |

### X.7 Plan de contingencia por servicio

| Si falla...       | Impacto                         | Plan B                                  | Tiempo de migración            |
| ----------------- | ------------------------------- | --------------------------------------- | ------------------------------ |
| Supabase          | Total (BD + auth)               | Neon/Railway + self-hosted auth         | 2-3 días (sesión 30)           |
| Cloudinary        | Imágenes no cargan              | Cloudflare Images o bunny.net           | 1 día                          |
| Cloudflare Pages  | Web caída                       | Vercel o Netlify                        | 2 horas (push a otro provider) |
| Stripe            | No se cobra                     | Ninguno real. Esperar resolución.       | N/A                            |
| Resend            | Emails no salen                 | SendGrid (cambiar API key)              | 1 hora                         |
| Anthropic API     | IA no funciona                  | OpenAI (cambiar env var AI_PROVIDER)    | 5 minutos                      |
| InfoCar           | No se generan informes DGT      | Manual vía sede electrónica DGT         | Inmediato                      |
| WhatsApp API      | Publishing WhatsApp no funciona | Los dealers publican por formulario web | Funcionalidad degradada        |
| GA4               | Sin analytics                   | Plausible self-hosted                   | 1 hora                         |
| LinkedIn/Facebook | Auto-posting no funciona        | Publicar manualmente                    | Funcionalidad degradada        |

---
