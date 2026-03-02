# Backlog Técnico — Tracciona

> Mejoras planificadas no ejecutadas. Extraído de INSTRUCCIONES-MAESTRAS.md (sesiones 45-64).
> Cuando se complete un item, eliminar la entrada. Git preserva el historial.

---

## Seguridad

### S1 — Auditoría continua automatizada

- **Qué:** GitHub Actions daily (05:00 UTC): Semgrep + npm audit + ESLint + typecheck + extensibility check + build
- **Entregables:** `.github/workflows/daily-audit.yml`, `scripts/audit-report.mjs`, `scripts/send-audit-alert.mjs`
- **Dependencias:** Ninguna
- **Origen:** Sesión 45A

### S2 — DAST: OWASP ZAP + Nuclei

- **Qué:** Escaneo dinámico semanal contra producción (baseline) + mensual (full scan). ZAP (OWASP Top 10), Nuclei (CVEs, SSL, misconfigs)
- **Entregables:** `.github/workflows/dast-scan.yml`, `.zap/rules.tsv`, `docs/tracciona-docs/referencia/SECURITY-TESTING.md`
- **Dependencias:** Ninguna
- **Origen:** Sesiones 46, 49

### S3 — HSTS, CORS explícito, WAF documentado

- **Qué:** HSTS con preload, CORS allowlist (site + Supabase + Stripe), documentar config WAF de Cloudflare
- **Entregables:** Editar `security-headers.ts`, crear `CLOUDFLARE-WAF-CONFIG.md`, crear `SECRETS-ROTATION.md`
- **Dependencias:** Ninguna
- **Origen:** Sesión 50

### S4 — Tests de seguridad expandidos + rate limiting rules

- **Qué:** Tests de IDOR (dealer no ve datos de otro), rate limiting (429 en endpoints sensibles), information leakage (no stack traces, no .env/.git accesibles). Documentar e implementar reglas de rate limiting por endpoint: login 5/min, register 3/min, contact 10/min, API general 30/min, upload 5/min (ref: Cloudflare WAF o server middleware)
- **Entregables:** `tests/security/idor-protection.test.ts`, `rate-limiting.test.ts`, `information-leakage.test.ts`, `referencia/RATE-LIMITING-RULES.md`
- **Dependencias:** Ninguna
- **Origen:** Sesiones 46B, 49B + legacy DOC2-TAREAS-FUNDADORES

### S5 — CSP avanzado + auditoría de licencias

- **Qué:** Investigar nonce-based CSP (Nuxt 4), CSP violation reporting endpoint, auditoría de licencias npm (copyleft)
- **Entregables:** Editar `security-headers.ts`, crear `csp-report.post.ts`, crear `scripts/audit-licenses.mjs`
- **Dependencias:** Nuxt 4 estable
- **Origen:** Sesiones 59, 60

---

## Resiliencia

### R1 — Backups multi-capa (diario/semanal/mensual)

- **Qué:** Backup diario a B2 (retención 7d), semanal (4 semanas), mensual (6 meses). Reemplaza backup semanal actual
- **Entregables:** Reescribir `.github/workflows/backup.yml`, crear `scripts/backup-multi-tier.sh`, crear `DISASTER-RECOVERY.md`
- **Dependencias:** Verificar PITR de Supabase Pro activo
- **Origen:** Sesión 45B

### R2 — Test de restore + mirror + DR drill

- **Qué:** Script que restaura backup en BD temporal (Neon free), verifica conteos, limpia. Mirror repo a Bitbucket
- **Entregables:** `scripts/test-restore.sh` (ampliar), `.github/workflows/mirror.yml`, `THIRD-PARTY-DEPENDENCIES.md`
- **Prerrequisitos humanos:** Crear cuenta Neon, cuenta Bitbucket, configurar GitHub Secrets
- **Origen:** Sesión 55

---

## Arquitectura

### A1 — Columna `vertical` en vehicles/advertisements

- **Qué:** Añadir columna `vertical` a vehicles y advertisements para aislamiento multi-vertical. Actualizar queries
- **Entregables:** Migración SQL, actualizar `supabaseQuery.ts`, tests de aislamiento reales
- **Dependencias:** Ninguna (bloqueante para multi-vertical)
- **Origen:** Sesión 47A-B

### A2 — Modularización de endpoints largos

- **Qué:** Descomponer `whatsapp/process.post.ts` (~450 líneas) en servicios: imageUploader, vehicleCreator, whatsappProcessor, notifications
- **Entregables:** 4 archivos en `server/services/`, endpoint reducido a ~50 líneas
- **Dependencias:** A1
- **Origen:** Sesiones 45E, 48

### A3 — Event bus + feature flags

- **Qué:** Event bus simple con Nitro hooks (vehicle:created, vehicle:sold, dealer:registered, subscription:changed). Feature flags en BD con rollout %
- **Entregables:** `server/utils/eventBus.ts`, migración `feature_flags`, `server/utils/featureFlags.ts`, composable `useFeatureFlag`
- **Dependencias:** A2
- **Origen:** Sesión 56

### A4 — Deshardcodear todo

- **Qué:** Centralizar modelos IA (`aiConfig.ts`), URLs de dominio (`siteConfig.ts`), mover Supabase project ref a secret, categorías del prompt de Claude desde BD
- **Entregables:** `server/utils/aiConfig.ts`, `server/utils/siteConfig.ts`, actualizar endpoints
- **Dependencias:** Ninguna
- **Origen:** Sesión 45D

---

## Testing

### T1 — Subir cobertura de 5% a 40%

- **Qué:** Tests unitarios de servicios server (aiProvider, billing, rateLimit, safeError), composables críticos (useAuth, useSubscriptionPlan), coverage gate en CI
- **Entregables:** ~12 archivos de test, editar `ci.yml` para threshold 40%
- **Dependencias:** A2 (servicios extraídos facilitan testing)
- **Origen:** Sesión 51

### T2 — E2E con Playwright (5 user journeys)

- **Qué:** Visitor search, dealer publish, dealer subscription, buyer favorite, admin approve
- **Entregables:** 5 specs en `tests/e2e/journeys/`
- **Dependencias:** T1
- **Origen:** Sesión 51D

---

## Rendimiento

### P1 — Lighthouse CI + Web Vitals

- **Qué:** Lighthouse semanal en CI contra 5 rutas críticas (home, ficha, noticias, subastas, dashboard). Web Vitals reporting a GA4
- **Entregables:** `.github/workflows/lighthouse.yml`, `app/plugins/web-vitals.client.ts`, test de accesibilidad con axe-core
- **Thresholds:** Performance ≥0.8, A11y ≥0.9, Best Practices ≥0.9, SEO ≥0.9
- **Dependencias:** Ninguna
- **Origen:** Sesión 52

---

## Base de datos

### D1 — Integridad, ERD, archivado

- **Qué:** Script de verificación de integridad (FKs huérfanas, datos inconsistentes, datos de test en prod). ERD Mermaid del esquema actual. Política de retención de datos
- **Entregables:** `scripts/db-integrity-check.mjs`, `referencia/ERD.md`, `referencia/DATA-RETENTION.md`, `server/api/infra/slow-queries.get.ts`
- **Dependencias:** A1 (columna vertical)
- **Origen:** Sesión 53

---

## Producto

### PR1 — Demo mode para dealers

- **Qué:** Página `/demo` donde un dealer prueba la generación IA de listado sin registrarse. Rate limited 3/día por IP. No guarda en BD
- **Entregables:** `server/api/demo/try-vehicle.post.ts`, `app/pages/demo.vue`
- **Dependencias:** Ninguna (callAI ya implementado)
- **Origen:** Sesión 57A

### PR2 — Widget embebible

- **Qué:** Snippet HTML/JS que un dealer pega en su web para mostrar sus vehículos. Personalizable (tema, layout, cantidad). "Powered by Tracciona"
- **Entregables:** Completar `server/api/widget/`, `app/pages/widget.vue`
- **Dependencias:** Ninguna
- **Origen:** Sesión 57B

### PR3 — Market Intelligence + comparador

- **Qué:** Dashboard dealer con "tu stock vs mercado" (precio medio, posición, días en venta). Comparador público `/valoracion` (rango de precio estimado)
- **Entregables:** Ampliar `marketReport.ts`, `useMarketIntelligence.ts`, completar `/valoracion`
- **Dependencias:** Datos suficientes en BD
- **Origen:** Sesión 58

---

## SEO

### SEO1 — Fundamentos SEO técnicos

- **Qué:** Sitemap XML dinámico, robots.txt, meta tags únicos por página, OG + Twitter Cards, hreflang, canonicals
- **Entregables:** Configurar `@nuxtjs/sitemap`, `public/robots.txt`, `useSeoMeta()` en todas las páginas
- **Dependencias:** Ninguna
- **Origen:** Sesión 61

### SEO2 — Error pages + HTML semántico

- **Qué:** 404 personalizada con buscador, 500/503 con branding, redirecciones 301, auditoría de HTML semántico (h1 único, nav, main, article), skip-to-content, alt text audit
- **Entregables:** `error.vue`, `server/middleware/redirects.ts`, correcciones semánticas en layouts
- **Dependencias:** Ninguna
- **Origen:** Sesión 62

### SEO3 — Schema.org + compartir

- **Qué:** JSON-LD para Vehicle, Organization, BreadcrumbList, WebSite SearchAction. Botones compartir (WhatsApp, LinkedIn, email, copiar enlace) sin SDKs externos. Incluye Schema FAQPage en landing pages y Schema ItemList en catálogo/home (ideas S6, S7 de IDEAS-A-REVISAR)
- **Entregables:** `composables/useStructuredData.ts`, `components/ui/ShareButtons.vue`
- **Dependencias:** SEO1
- **Origen:** Sesión 63 + legacy migracion-03-roadmap-post

### SEO4 — Slugs SEO + internal linking

- **Qué:** URLs descriptivas `/vehiculos/mercedes-actros-1845-a7f3` en vez de `/vehiculos/12345`. Redirección 301 de IDs antiguos. "Vehículos similares" al final de ficha. SEO audit en CI
- **Entregables:** Migración slug en vehicles, `utils/generateSlug.ts`, `RelatedVehicles.vue`, `scripts/seo-check.mjs`
- **Dependencias:** A1
- **Origen:** Sesión 64

---

## Documentación

### DOC1 — Crons, CHANGELOG, onboarding

- **Qué:** Documentar los 12 cron endpoints (quién los llama, frecuencia, si están configurados). CHANGELOG.md retroactivo. Marcar anexos obsoletos con banner
- **Entregables:** `referencia/CRON-JOBS.md`, `CHANGELOG.md`, banners en anexos
- **Dependencias:** Ninguna
- **Origen:** Sesión 54

### DOC2 — API pública documentada

- **Qué:** Documentar endpoints públicos existentes en formato OpenAPI-like. Preparación para integraciones ERP
- **Entregables:** `referencia/API-PUBLIC.md`
- **Dependencias:** Ninguna
- **Origen:** Sesión 59D
