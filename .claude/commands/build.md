Implementa la siguiente feature en Tracciona.

**ANTES de escribir código:**

1. Lee CLAUDE.md
2. Lee docs/PROYECTO-CONTEXTO.md
3. Busca en BACKLOG.md si ya hay un item que cubra esto

**Stack:** Nuxt 3 + TypeScript + Supabase (RLS) + CSS custom (tokens.css) + Cloudflare Pages

**Reglas obligatorias:**

- TypeScript estricto. No `any`.
- Mobile-first. Touch targets ≥ 44px.
- i18n: todo texto UI con `$t('key')`. Datos dinámicos con `localizedField()`.
- RLS obligatorio en tablas nuevas.
- Auth: siempre `serverSupabaseUser(event)` en endpoints protegidos.
- Errores: usar `safeError()` en producción.
- Nunca `innerHTML` sin DOMPurify (`useSanitize`).
- Imports desde composables, nunca lógica duplicada.

**Orden de implementación:**

1. Migración SQL si necesaria (supabase/migrations/00xxx_nombre.sql)
2. Server routes (server/api/)
3. Composables (app/composables/)
4. Páginas y componentes Vue
5. i18n (i18n/es.json, i18n/en.json)
6. Verificar: `npm run build`
7. Commit: formato convencional en español (feat:, fix:, refactor:)

Usa context7 para verificar APIs actualizadas de Nuxt, Supabase y Stripe.

Feature a implementar: $ARGUMENTS
