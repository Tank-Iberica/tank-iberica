# API Conventions — Server Routes

Mandatory patterns for all `server/api/` endpoints.

## Error Handling

**Always use `safeError()`** (never `createError()` directly):

```typescript
import { safeError } from '../../utils/safeError'

// Usage:
throw safeError(400, 'email is required')
throw safeError(401, 'Authentication required')
throw safeError(403, 'Insufficient permissions')
throw safeError(404, 'Vehicle not found')
throw safeError(429, 'Rate limited')
```

`safeError()` hides detailed messages in production, showing only generic Spanish messages.

## Input Validation

**Always use Zod + `validateBody()`** for POST/PATCH endpoints:

```typescript
import { z } from 'zod'
import { validateBody } from '../../utils/validateBody'

const bodySchema = z.object({
  email: z.string().email(),
  action: z.enum(['check', 'record_failure']),
  token: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { email, action, token } = await validateBody(event, bodySchema)
  // ...
})
```

For GET endpoints, use `getQuery(event)` with manual validation or Zod `.parse()`.

## Authentication

```typescript
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// User-authenticated endpoint:
const user = await serverSupabaseUser(event)
if (!user) throw safeError(401, 'Authentication required')

// Service-role client (admin/cron operations):
const supabase = serverSupabaseServiceRole(event)
```

**Exceptions** (no user auth): webhooks (Stripe, WhatsApp) use signature verification; cron jobs use `verifyCronSecret()`.

## Supabase Client Typing

**Always type as `SupabaseClient`**, never `any`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

async function processData(supabase: SupabaseClient, id: string) { ... }
```

## Success Responses

Return domain-specific fields. Success is implicit (no error thrown = 200 OK):

```typescript
// Creation endpoints — return the created resource ID:
return { id: data.id }

// Action endpoints — return result:
return { locked: false, attemptsRemaining: 3 }

// Status change endpoints — return new status:
return { status: 'active' }
```

For endpoints that create resources, set `setResponseStatus(event, 201)` explicitly.

## Naming Conventions

- **Files**: kebab-case: `check-lockout.post.ts`, `import-stock.post.ts`
- **HTTP methods**: `.get.ts`, `.post.ts`, `.patch.ts`, `.delete.ts`
- **Dynamic params**: `[id].patch.ts`, `[slug].get.ts`
- **Nested routes**: `server/api/stripe/checkout.post.ts` → `POST /api/stripe/checkout`

## CSRF Protection

**Required** for all browser-initiated POST/PATCH/DELETE endpoints:

```typescript
import { verifyCsrf } from '../../utils/verifyCsrf'

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  // ...
})
```

**Exceptions**: webhooks, cron jobs, internal API calls (with `x-internal-secret`).

## Cron Jobs

```typescript
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireCronLock } from '../../utils/cronLock'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const lock = await acquireCronLock(supabase, 'job-name')
  if (!lock) return { skipped: true, reason: 'locked' }
  // ...
})
```

## Error Handling in Catch Blocks

**Always use `unknown`**, never `any`:

```typescript
// CORRECT:
catch (e: unknown) {
  const message = e instanceof Error ? e.message : 'Unexpected error'
}

// WRONG:
catch (e: any) {
  error.value = e?.message
}
```

## Checklist (before merging new endpoint)

- [ ] Uses `safeError()` for all error throws
- [ ] Input validated with Zod + `validateBody()`
- [ ] Auth check present (or documented exception)
- [ ] Supabase client typed as `SupabaseClient` (not `any`)
- [ ] CSRF protection for browser-initiated mutations
- [ ] No `catch (e: any)` — use `catch (e: unknown)`
- [ ] File named in kebab-case with correct HTTP method suffix
