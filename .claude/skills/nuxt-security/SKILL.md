---
name: nuxt-security
description: Patrones de seguridad para server routes de Nuxt 3 en Tracciona. Usar cuando se creen o modifiquen endpoints en server/api/.
globs: ['**/server/api/**', '**/server/middleware/**', '**/server/utils/**']
---

# Seguridad en Server Routes — Tracciona

## Autenticación (OBLIGATORIA en endpoints protegidos)

```typescript
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Auth required')
  // ...
})
```

## Service Role (solo cuando RLS no basta)

```typescript
import { serverSupabaseServiceRole } from '#supabase/server'

// SIEMPRE verificar ownership DESPUÉS
const supabase = serverSupabaseServiceRole(event)
const { data } = await supabase.from('tabla').select('*').eq('id', id).single()
if (data.dealer_id !== user.id && !isAdmin(user)) {
  throw safeError(403, 'Not owner')
}
```

## Errores (producción)

```typescript
import { safeError } from '~/server/utils/safeError'
// Mensajes genéricos en prod, detallados en dev
throw safeError(400, 'Missing field: dealer_id')
```

## Webhooks

- Stripe: verificar firma con `stripe.webhooks.constructEvent`
- WhatsApp: verificar HMAC `x-hub-signature-256`
- Crons: `verifyCronSecret(event)` al inicio

## Headers (ya en server/middleware/security-headers.ts)

- CSP, X-Frame-Options, X-Content-Type-Options, HSTS
- Rate limiting en server/middleware/rate-limit.ts

## Checklist para cada endpoint nuevo

- [ ] ¿Tiene auth (serverSupabaseUser)?
- [ ] ¿Verifica ownership si usa service role?
- [ ] ¿Valida inputs? (zod o manual)
- [ ] ¿Usa safeError para errores?
- [ ] ¿Sanitiza output si devuelve HTML?
