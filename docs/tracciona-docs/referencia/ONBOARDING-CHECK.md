# Onboarding Check — Tracciona

> Auto-generado por `scripts/generate-onboarding-check.mjs`
> Generado: 2026-03-11

## Resultado: 30/36 checks OK (6 problemas)

### CLI Tools (7/7)

| Check        | Estado | Detalle                              |
| ------------ | ------ | ------------------------------------ |
| Node.js      | OK     | v24.13.0                             |
| npm          | OK     | 11.6.2                               |
| Git          | OK     | git version 2.52.0.windows.1         |
| Docker       | OK     | Docker version 29.2.1, build a5c7197 |
| GitHub CLI   | OK     | gh version 2.87.3 (2026-02-23)       |
| Supabase CLI | OK     | Not installed (optional)             |
| k6           | OK     | Not installed (optional)             |

### Project Structure (12/12)

| Check                             | Estado | Detalle |
| --------------------------------- | ------ | ------- |
| package.json                      | OK     | exists  |
| nuxt.config.ts                    | OK     | exists  |
| app/app.vue                       | OK     | exists  |
| server/utils/eventStore.ts        | OK     | exists  |
| supabase/migrations               | OK     | exists  |
| i18n/es.json                      | OK     | exists  |
| i18n/en.json                      | OK     | exists  |
| CLAUDE.md                         | OK     | exists  |
| CONTRIBUTING.md                   | OK     | exists  |
| .husky/pre-commit                 | OK     | exists  |
| .claude/policy/SECURITY_POLICY.md | OK     | exists  |
| shared/types/index.ts             | OK     | exists  |

### Dependencies (2/2)

| Check             | Estado | Detalle   |
| ----------------- | ------ | --------- |
| node_modules      | OK     | installed |
| package-lock.json | OK     | exists    |

### Environment (4/8)

| Check                     | Estado | Detalle               |
| ------------------------- | ------ | --------------------- |
| .env file                 | OK     | exists                |
| SUPABASE_URL              | OK     | configured            |
| SUPABASE_KEY              | OK     | configured            |
| SUPABASE_SERVICE_ROLE_KEY | FAIL   | KEY MISSING from .env |
| STRIPE_SECRET_KEY         | FAIL   | KEY MISSING from .env |
| STRIPE_WEBHOOK_SECRET     | FAIL   | KEY MISSING from .env |
| RESEND_API_KEY            | FAIL   | KEY MISSING from .env |
| CRON_SECRET               | OK     | configured            |

### Git & Hooks (2/2)

| Check          | Estado | Detalle                |
| -------------- | ------ | ---------------------- |
| Git repository | OK     | initialized            |
| Husky hooks    | OK     | lint-staged configured |

### Policy Engine (1/2)

| Check           | Estado | Detalle                                     |
| --------------- | ------ | ------------------------------------------- |
| Compiled policy | FAIL   | Run: node .claude/policy/compile-policy.mjs |
| Policy source   | OK     | exists                                      |

### Database (1/1)

| Check      | Estado | Detalle            |
| ---------- | ------ | ------------------ |
| Migrations | OK     | 92 migration files |

### Tests (1/2)

| Check            | Estado | Detalle                    |
| ---------------- | ------ | -------------------------- |
| Vitest config    | OK     | vitest.config.ts           |
| Test files exist | FAIL   | could not count test files |

## Acciones necesarias

- **SUPABASE_SERVICE_ROLE_KEY**: KEY MISSING from .env
- **STRIPE_SECRET_KEY**: KEY MISSING from .env
- **STRIPE_WEBHOOK_SECRET**: KEY MISSING from .env
- **RESEND_API_KEY**: KEY MISSING from .env
- **Compiled policy**: Run: node .claude/policy/compile-policy.mjs
- **Test files exist**: could not count test files

## Referencia

Para instrucciones de instalación completas, ver: `docs/tracciona-docs/referencia/ENTORNO-DESARROLLO.md`
