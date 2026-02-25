# Contexto global — Tracciona

> Última actualización: 24 febrero 2026
> Este documento es el MAPA del proyecto para Claude Code. Lee esto primero.

---

## Qué es Tracciona

Grupo de marketplaces B2B verticales. Un solo código base, N verticales (vehículos industriales, maquinaria, hostelería...). Cada vertical se configura con `vertical_config` en BD.

**Stack:** Nuxt 3 + Supabase + Cloudflare Pages + Stripe + Cloudinary/CF Images + Resend + WhatsApp Meta Cloud API

---

## Estado actual del proyecto

### Sesiones ejecutadas (código real en el repo)

| Sesiones    | Qué cubren                                                                        | Estado        |
| ----------- | --------------------------------------------------------------------------------- | ------------- |
| 1-13        | Migración base, catálogo, admin, editorial, i18n, deuda técnica                   | ✅ Ejecutadas |
| 14-33       | Post-lanzamiento: verificación, subastas, pagos, WhatsApp, PWA, CRM, datos, infra | ✅ Ejecutadas |
| 34, 34b, 35 | Auditoría de seguridad: auth, RLS, webhooks, CSP, DOMPurify, índices              | ✅ Ejecutadas |

### Sesiones pendientes de ejecución (especificadas en INSTRUCCIONES-MAESTRAS.md)

| Sesión | Título                                                                  | Origen                           | Prioridad |
| ------ | ----------------------------------------------------------------------- | -------------------------------- | --------- |
| **36** | Auditoría cruzada: gaps residuales + alineación docs/realidad           | 4ª auditoría externa             | 🔴 Alta   |
| **37** | Seguridad CI: Semgrep CE + Snyk + tests automatizados + mensajes error  | Recomendaciones 100pts §1        | 🔴 Alta   |
| **38** | Claridad documental: single source of truth + onboarding + convenciones | Recomendaciones 100pts §6        | 🔴 Alta   |
| **39** | UX: accesibilidad, Core Web Vitals, formularios y code-splitting        | Recomendaciones 100pts §7 + §3a  | 🟡 Media  |
| **40** | Monetización avanzada: trials, dunning, métricas, canales nuevos        | Recomendaciones 100pts §4        | 🟡 Media  |
| **41** | Arquitectura: capa servicios, diagrama técnico, umbrales, refactors     | Recomendaciones 100pts §5 + §3   | 🟡 Media  |
| **42** | Testing E2E: 8 user journeys con Playwright                             | Recomendaciones 100pts §7c + §8a | 🟡 Media  |

**Orden de ejecución recomendado:** 36 → 37 → 38 → 39 → 40 → 41 → 42

---

## Mapa de sesiones 36-42 (detalle)

### Sesión 36 — Gaps residuales (8 partes)

- A: 3 índices faltantes (vehicles.category_id, auction_bids.auction_id, articles.status+published_at)
- A-BIS: Cache CDN merchant-feed (12h) + sitemap (6h)
- B: Auth en dgt-report, push/send, account/\*, market-report
- C: docs/ESTADO-REAL-PRODUCTO.md desde código real
- D: docs/FLUJOS-OPERATIVOS.md (diagramas comprador/dealer/admin)
- E: Verificación i18n (\_es/\_en vs JSONB)
- F: Consolidación admin/dashboard → composables/shared/
- G: Lazy-load rutas admin (defineAsyncComponent)
- H: docs/INVENTARIO-ENDPOINTS.md

### Sesión 37 — Seguridad CI (7 partes)

- A: Semgrep CE en GitHub Actions (security.yml) — gratuito, sin límites
- B: Snyk free — monitorizar dependencias (400 tests/mes)
- C: tests/security/auth-endpoints.test.ts — 13 checks automatizados (auth, webhooks, crons)
- D: server/utils/safeError.ts — mensajes error genéricos en producción
- E: security.txt + política divulgación (alternativa gratuita a bug bounty)
- F: Revisión CSP unsafe-inline/eval
- G: .env.example documentado con comentarios

### Sesión 38 — Claridad documental (5 partes)

- A: Fix nombre package.json "tank-iberica" → "tracciona"
- B: README-PROYECTO.md — single source of truth, punto de entrada
- C: Marcar docs históricos con banner "⚠️ HISTÓRICO"
- D: CONTRIBUTING.md — convenciones de código
- E: scripts/generate-estado-real.sh — generador automático de estado

### Sesión 39 — UX (7 partes)

- A: Lighthouse accesibilidad en 5 rutas críticas
- B: Code-splitting: manualChunks en Vite, chunks < 500KB
- C: Formularios críticos: validación, aria, feedback, doble envío
- D: Core Web Vitals: web-vitals plugin + umbrales .lighthouserc
- E: Touch/móvil: verificación 360px
- F: Dividir componentes Vue > 500 líneas
- G: PWA offline.vue mensaje amigable

### Sesión 40 — Monetización avanzada (5 partes)

- A: Trial period 14 días para nuevos dealers
- B: Dunning: handlers invoice.payment_failed + customer.subscription.deleted
- C: Métricas MRR por canal (useRevenueMetrics)
- D: 2 canales nuevos: API valoración con api_keys + widget embebible por dealer
- E: Lead gen cuantificado (useLeadTracking: contactos, fichas, conversión)

### Sesión 41 — Arquitectura (5 partes + bis)

- A: server/services/ — extraer lógica de endpoints >200 líneas
- B: Diagrama de arquitectura ASCII en ARQUITECTURA-ESCALABILIDAD.md
- C: Umbrales y alertas formales (BD, API, Cloudinary, error rate, Stripe)
- C-BIS: Documentar rate limit y WAF en ARQUITECTURA-ESCALABILIDAD
- D: scripts/verify-extensibility.sh — verificar que extensión es "solo datos"
- E: Decisiones módulos parciales (landing builder: posponer, OAuth: mínimo)

### Sesión 42 — Testing E2E (3 partes)

- A: 8 user journeys definidos (anónimo, comprador, dealer, admin, subasta, SEO)
- B: Implementación con Playwright (tests/e2e/journeys/)
- C: Integración en CI (GitHub Actions)

---

## Auditorías realizadas

| #                 | Tipo                                      | Resultado                         | Sesiones que remedian |
| ----------------- | ----------------------------------------- | --------------------------------- | --------------------- |
| 1ª                | Técnica (endpoints, auth)                 | Gaps en auth y RLS                | 34, 34b               |
| 2ª                | Técnica (RLS, índices, cache)             | Gaps en BD y performance          | 35                    |
| 3ª                | Técnica (XSS, CSP, dependencias)          | DOMPurify, CSP, headers           | 34b, 35               |
| 4ª                | Estratégica/organizativa (docs vs código) | Desalineación, flujos incompletos | 36                    |
| Valoración 100pts | 8 dimensiones (77/100 media)              | Recomendaciones por dimensión     | 37-42                 |

---

## Migraciones BD (últimas relevantes)

| Migración                      | Sesión | Contenido                            |
| ------------------------------ | ------ | ------------------------------------ |
| 00055_rls_hardening.sql        | 35     | is_admin(), RLS endurecido           |
| 00056_performance_indexes.sql  | 35     | 8 índices de rendimiento             |
| 00057_rls_standardization.sql  | 35     | Estandarización RLS todas las tablas |
| (pendiente) Añadir a 00056     | 36-A   | 3 índices faltantes                  |
| (pendiente) 00058_api_keys.sql | 40-D   | Tabla api_keys para API valoración   |

---

## Archivos clave de seguridad (ya en el repo)

| Archivo                               | Sesión | Propósito                  |
| ------------------------------------- | ------ | -------------------------- |
| server/utils/verifyCronSecret.ts      | 34     | Proteger crons             |
| server/utils/verifyCsrf.ts            | 34     | CSRF en endpoints mutantes |
| server/utils/isAllowedUrl.ts          | 34     | Validar URLs de redirect   |
| server/utils/supabaseAdmin.ts         | 34     | Wrapper service role       |
| server/utils/sanitizeLog.ts           | 34b    | Limpiar PII de logs        |
| server/utils/logger.ts                | 34b    | Logger estructurado        |
| server/utils/fetchWithRetry.ts        | 34b    | Fetch con reintentos       |
| server/utils/batchProcessor.ts        | 34b    | Procesar lotes grandes     |
| server/middleware/security-headers.ts | 35     | CSP + X-Frame + HSTS       |
| server/middleware/request-id.ts       | 34b    | Trazabilidad sin PII       |
| server/middleware/rate-limit.ts       | 34     | Rate limiting por IP       |
| app/composables/useSanitize.ts        | 35     | DOMPurify wrapper          |

---

## Herramientas de seguridad CI (sesión 37, pendiente)

| Herramienta               | Coste                 | Qué hace                                     |
| ------------------------- | --------------------- | -------------------------------------------- |
| **Semgrep CE**            | Gratis siempre        | Análisis estático SAST en cada PR            |
| **Snyk free**             | Gratis (≤10 devs)     | Monitorizar vulnerabilidades en dependencias |
| **npm audit**             | Gratis (incluido npm) | Detectar dependencias vulnerables            |
| **Vitest security tests** | Gratis                | Tests automatizados auth/webhooks/crons      |
| **security.txt**          | Gratis                | Política de divulgación responsable          |

---

## Cómo ejecutar una sesión

1. El usuario dice "ejecuta la sesión N"
2. Claude Code abre `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`
3. Busca `## SESIÓN N`
4. Lee la sección "Leer" → abre esos archivos
5. Ejecuta la sección "Hacer" parte por parte
6. Al final: `npm run build` + verificar tests mínimos de la sesión
7. Commit con mensaje descriptivo

**Regla crítica:** Cada sesión es independiente. Si Claude Code pierde contexto, abrir nuevo chat y decir "ejecuta la sesión N".

---

## Documentos de referencia

| Documento                     | Ubicación                       | Propósito                                |
| ----------------------------- | ------------------------------- | ---------------------------------------- |
| INSTRUCCIONES-MAESTRAS.md     | docs/tracciona-docs/            | Sesiones 1-42 completas                  |
| CLAUDE.md                     | raíz                            | Instrucciones rápidas para Claude Code   |
| contexto-global.md            | docs/tracciona-docs/            | **Este archivo** — mapa del proyecto     |
| ARQUITECTURA-ESCALABILIDAD.md | docs/tracciona-docs/referencia/ | Diseño multi-cluster, costes             |
| ESTADO-REAL-PRODUCTO.md       | docs/                           | Estado real de cada módulo               |
| RECOMENDACIONES-100-PUNTOS.md | docs/                           | Recomendaciones para llegar a 100/100    |
| VALORACION-PROYECTO-1-100.md  | docs/                           | Puntuación actual por dimensión (77/100) |
| Anexos A-X                    | docs/tracciona-docs/anexos/     | Especificaciones detalladas por módulo   |
