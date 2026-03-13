# PLAN MAESTRO 10/10 — Tracciona

**Objetivo:** Llevar cada dimensión del proyecto a 10/10.
**Fecha:** 2026-03-08
**Baseline:** 11.472 tests, 0 fallos, SonarQube limpio, 61% coverage.

## Leyenda

| Símbolo    | Significado                                     |
| ---------- | ----------------------------------------------- |
| `[ ]`      | Pendiente                                       |
| `[~]`      | Parcialmente hecho — necesita completar         |
| `[x]`      | Ya implementado (referencia, no acción)         |
| **P0**     | Crítico — hacer antes de lanzamiento            |
| **P1**     | Alto — primeras semanas post-lanzamiento        |
| **P2**     | Medio — primer trimestre                        |
| **P3**     | Bajo — cuando haya equipo/tráfico               |
| **FUTURO** | No se necesita ahora, pero sí con escala/equipo |

---

## 1. VELOCIDAD DE CARGA Y CAMBIO DE PÁGINAS (7.5 → 10)

### 1.1 Renderizado y carga inicial

- [~] **P1** — Migrar todos los `<img>` a `<NuxtImage>` con formatos WebP/AVIF automáticos y `sizes` responsive (sesión XXII: flags+error icon → NuxtImg+webp; catalog VehicleCard+ImageGallery Cloudinary ya usa NuxtImg; fallbacks CF Images no requieren provider extra — CF Images ya sirve WebP nativo)
- [x] **P1** — Skeleton loaders en las 10 páginas principales (catálogo, detalle vehículo, dashboard, perfil, precios, noticias, subastas, login, búsqueda, datos) ✓ (sesión XI: UiSkeleton+UiSkeletonCard+UiSkeletonTable, integrados en 40+ páginas con aria-busy)
- [x] **P2** — Shimmer animation en skeletons (no solo color sólido gris) ✓ (Skeleton.vue ya tiene gradient 90deg + skeleton-shimmer animation + prefers-reduced-motion; --bg-tertiary token definido)
- [x] **P2** — Page transitions con `<NuxtPage>` transition (fade 150ms) para suavizar cambio de página ✓ (ver §3.4 — ya implementado en sesión XII: pageTransition/layoutTransition en nuxt.config + tokens.css + prefers-reduced-motion)
- [x] **P2** — `<Suspense>` con fallback en páginas que hacen async data fetch ✓ (MetricsChartsGrid.vue: 4 charts LazyBar/LazyLine/LazyDoughnut; DatosPriceChart.vue: LazyLine; InfraHistory.vue: LazyLine v-for — todos con UiSkeleton fallback)
- [~] **P2** — `fetchOnServer: true` en páginas SSR para que datos lleguen en el HTML (no fetch en `onMounted`) ✓ parcial: noticias/index.vue + guia/index.vue migradas a `await useAsyncData` + eliminado `onMounted` fetch — subastas/index.vue (timer) y homepage (dependencias location client-side) pendientes de refactor más profundo
- [x] **P2** — Prefetch selectivo de rutas probables con `<NuxtLink prefetch>` explícito (catálogo → detalle, dashboard → vehículos) ✓ (sesión XXIV: VehicleCard.vue + DealerVehicleCard.vue)
- [x] **P3** — Critical CSS inline: extraer above-the-fold CSS para landing pages principales ✓ (sesión XXVI: nuxt.config features.inlineStyles + routeRules prerender para landing pages)
- [x] **P3** — `font-display: optional` en fuentes secundarias (iconos) para evitar layout shift ✓ (sesión XXVI: nuxt.config googleFonts.display: 'optional')

### 1.2 Imágenes

- [x] **P1** — `srcset` y `sizes` en todas las imágenes del catálogo (360/480/768/1024/1280px) ✓ (sesión XXIII: VehicleCard NuxtImg con sizes completo; fallback img + VehicleTable thumbnail: width/height/loading/decoding añadidos para CLS; 2 CSS bugs en VehicleTable.vue corregidos)
- [x] **P2** — LQIP (Low Quality Image Placeholder) o blur-up para galería de vehículos ✓ (sesión XXIV: NuxtImg placeholder prop en ImageGallery.vue main+thumbs, VehicleCard.vue)
- [x] **P2** — Preconnect a CF Images dominio además de Cloudinary ✓ (sesión XXIV: dns-prefetch + preconnect a imagedelivery.net en nuxt.config.ts)
- [x] **P2** — `<link rel="preload">` para imagen hero homepage y primera imagen de detalle vehículo ✓ (vehiculo/[slug].vue: preload link dinámico de primera imagen via useHead; homepage sin hero estático)
- [x] **P2** — `decoding="async"` en imágenes no above-the-fold ✓ (sesión IX: aplicado en imágenes públicas principales)
- [x] **P2** — Priority hints (`fetchpriority="high"`) en LCP image de cada página ✓ (ImageGallery.vue ya tenía fetchpriority=high; VehicleCard.vue: nuevo prop priority → eager/high en primeros 4 del grid; VehicleGrid.vue pasa priority=true a idx<4)
- [~] **P2** — Conversión sistemática a WebP/AVIF donde aplique (Cloudinary hace `f_auto`, falta para imágenes que no pasan por Cloudinary)

### 1.3 Caching y CDN

- [x] **P1** — Cache-Control headers explícitos en endpoints GET públicos ✓ (sesión VIII: market-report, merchant-feed, geo, search, health, valuation, widget — todos con headers)
- [x] **P1** — Edge caching para API responses GET con CF Cache API y `cacheKey` por query params ✓ (sesión XX: server/utils/cfCache.ts — cfCacheGet+buildCacheKey; aplicado en market-report?public=true; 14 tests)
- [x] **P2** — Service Worker precaching: shell HTML, CSS tokens, fuentes Inter, logo, iconos críticos ✓ (public/sw.js — precache manifest with CSS tokens, Inter fonts, logo, critical icons; install+activate+fetch strategies)
- [x] **P2** — Stale-while-revalidate composable wrapper sobre Supabase queries (cache local 30s antes de refetch) ✓ (useSwrQuery.ts — sessionStorage + TTL configurable; sirve stale inmediatamente, revalida en background; refresh() manual; isStale ref)
- [x] **P2** — `localStorage` cache para datos que cambian poco (categorías, subcategorías, atributos, vertical config) ✓ (useLocalStorageCache.ts — TTL configurable, get/set/invalidate + clearAllTraccionaCache(); aplicado en useDashboardNuevoVehiculo: categories+subcategories con TTL 600s)
- [x] **P3** — Immutable hashing en assets estáticos (`vite.build.rollupOptions.output.assetFileNames`) ✓ (sesión actual: `/_nuxt/**` routeRule con `max-age=31536000, immutable` en nuxt.config.ts — Nuxt ya genera hashes en filenames por defecto)
- [x] **P2** — HTTP `ETag` y `If-None-Match` en endpoints de catálogo para reducir transferencia ✓ (server/utils/etag.ts — makeEtag() + checkEtag(); edge-compatible, no crypto; aplicado en merchant-feed.get.ts; refactorizado de node:crypto a etag util)

### 1.4 Bundle y JS

- [x] **P1** — Auditar y eliminar dependencias no usadas con `knip` ✓ (sesión XXV: github-actions plugin disabled para YAML edge case; @anthropic-ai/sdk+vue-router ignorados intencionalmente; deprecated STATUS_FILTERS→STATUS_TABS; 0 warnings en deps+duplicates)
- [x] **P2** — `defineAsyncComponent` para componentes pesados: galerías de imagen, editores, tablas con sorting ✓ (sesión XXIV: LazyVehiclePriceHistoryChart en DetailDescription.vue; Lazy prefix en CalculadoraProfitabilityTab+FinancingTab+TotalCostTab con v-if; InfraHistory ya auto-lazy-carga Chart.js internamente)
- [x] **P2** — Tree-shake de `@sentry/vue` — importar solo `init` y `captureException` ✓ (error-handler.ts: `import * as Sentry` → `import { init as sentryInit, captureException }`)
- [x] **P2** — Analizar `npx nuxi analyze` y eliminar chunks >50KB no críticos ✓ (scripts/check-bundle-size.mjs: escanea .output/public/\_nuxt/, top 10, warning >50KB, critical >200KB, exit 1 en critical)
- [x] **P3** — Mover `web-push` a server-only (no debería estar en client dependencies) ✓ (verificado: solo importado en server/api/push/send.post.ts — nunca en app/)
- [x] — Code splitting manual chunks: charts, jspdf, sanitize, stripe, exceljs (ya hecho en `nuxt.config.ts`)

### 1.5 Queries y datos

- [x] **P1** — Crear RPCs de Supabase para aggregaciones (dashboard KPIs, market intelligence) — una query en vez de N ✓ (sesión XX: get_dealer_dashboard_stats + get_dealer_top_vehicles; 10 queries→3; migration 00074; 30 tests)
- [x] **P2** — Eliminar waterfall de queries en páginas que hacen fetches secuenciales en `onMounted` ✓ (sesión XXV: crm.vue tiene dependency chain válida; perfil/index.vue: fetchProfile+loadDashboardData → Promise.all paralelo)
- [x] **P2** — `select()` específico en TODAS las queries ✓ (sesión XXIV: push/send; sesión actual: useMarketData 5x market_data/price_history/demand_data con campos explícitos; useDealerStats 2x dealer_stats con campos explícitos — select('\*') residuales en supabaseQuery base son OK porque callers encadenan)
- [x] **P3** — Paginación cursor-based en vez de offset-based para listas largas ✓ (sesión XXVI: composables/shared/useCursorPagination.ts — generic cursor pagination with loadMore/loadPrev; 17 tests)
- [x] **P3** — Dehydrated state para composables SSR — evitar re-fetch en hydration ✓ (sesión XXVI: composables/shared/useHydratedState.ts — useState SSR + client rehydration; 12 tests)
- [x] **P2** — Dedupe de queries por clave ✓ (composables/shared/useQueryDedup.ts: dedupedFetch con in-flight dedup + TTL cache + invalidate/invalidatePrefix/clearAll; useHydratedState ya cubre SSR)

### 1.6 Métricas de rendimiento

- [x] **P1** — Configurar Web Vitals budget: LCP <2.5s, FID <100ms, CLS <0.1, INP <200ms ✓ (sesión XVI: .lighthouserc.js con LCP/CLS/INP/TBT assertions + trigger on push)
- [x] **P1** — Lighthouse CI en pipeline con threshold mínimo (performance >90) ✓ (sesión XVI: minScore 0.9, mobile simulation, a11y assertions añadidos)
- [~] **P2** — Dashboard para visualizar métricas de `web-vitals` plugin (existe plugin, falta backend de agregación)
- [x] **P3** — Performance marks en rutas críticas (TTFB, FCP, LCP por página) ✓ (sesión actual: web-vitals.client.ts — nuxt:page:start/finish/navigation + nuxt:app:mounted)
- [ ] **P2** — Medir y optimizar TTFB, LCP, INP por ruta con alerting
- [x] **P3** — Revisar subset de tipografías (Inter ya es lean, verificar que no se cargan weights innecesarios) ✓ (sesión actual: googleFonts subsets: ['latin'] + solo [400,500,600,700] — sin weights extra)
- [ ] **FUTURO** — RUM (Real User Monitoring) con dashboard por ruta y percentiles

### 1.7 Rendimiento reactivo (de otra AI — validados)

- [~] **P3** — ~~DEFERRED~~ Evitar re-render innecesario: profiling con Vue DevTools en las 5 páginas más pesadas — requiere Vue DevTools manual + browser profiling
- [ ] **P2** — Early Hints (103) para precargar CSS y fuentes antes de HTML
- [ ] **P2** — HTTP/3 habilitado en Cloudflare (verificar en dashboard)
- [ ] **P2** — Compresión Brotli en CF (verificar todos los content types)

---

## 2. SEGURIDAD (8.0 → 10)

### 2.1 Headers y CSP

- [~] **P1** — Eliminar `unsafe-inline` de CSP: migrar a nonce-based CSP (`useHead` con nonce dinámico por request) — DEFERRED: documentado como no viable en security-headers.ts (Chart.js requiere unsafe-eval, Vue scoped styles requieren unsafe-inline; revisitar con Nuxt 5 o nuxt-security v2+)
- [ ] **P2** — Eliminar `unsafe-eval` de CSP: configurar Chart.js sin eval, o moverlo a Web Worker
- [x] **P1** — Añadir `Permissions-Policy` header ✓ (sesión VIII: camera=(), microphone=(), geolocation=(self), payment=(), +7 directivas extra)
- [~] **P3** — ~~DEFERRED~~ `Cross-Origin-Embedder-Policy: require-corp` — condicional a necesidad de SharedArrayBuffer; requiere verificar compatibilidad con embeds externos
- [x] **P3** — `X-DNS-Prefetch-Control: off` para contenido externo ✓ (sesión actual: security-headers.ts)
- [x] **P2** — CSP report endpoint (`/api/infra/csp-report`) existe — añadir alerting cuando hay violaciones repetidas ✓ (sesión XXV: directiveCounts Map por directiva; threshold 5 violaciones/min → logger.error '[CSP-ALERT]' con directiva+URI+count; reset junto con rate limit counter)
- [x] **P2** — Verificar `Content-Type: application/json` forzado en todas las API responses ✓ (sesión XXIV: h3 lo aplica automáticamente al devolver objetos; endpoints non-JSON — market-report/unsubscribe/export-csv — ya tienen su propio content-type explícito)

### 2.2 Rate limiting y WAF

- [ ] **P0** — **CRÍTICO: Configurar CF WAF rules** — rate limiting por IP en producción para TODOS los endpoints
- [ ] **P1** — Rate limiting distribuido con Redis/Upstash (reemplazar in-memory Map)
- [x] **P2** — Rate limiting por usuario autenticado (no solo IP) para prevenir abuse desde NAT compartido ✓ (sesión XXV: getUserIdFromJwt() decoda JWT sin DB call; getUserOrIpRateLimitKey() retorna user:{id} o ip:{ip}; middleware usa baseKey para writes y específicas; 6 tests nuevos)
- [x] **P2** — Rate limiting por fingerprint además de IP (User-Agent + Accept-Language hash) ✓ (getFingerprintKey() con DJB2 hash de UA+Accept-Language → key fp:{hex}; 5 tests; exportado desde rateLimit.ts)
- [x] **P3** — Honeypot endpoints (`/api/admin/debug`, `/api/wp-login`) para detectar scanning ✓ (sesión actual: GET+POST para wp-login, GET para admin/debug — log IP+UA+method, 404)
- [x] **P3** — Ban automático de IPs con >100 requests 4xx en 5 minutos ✓ (sesión XXVI: server/middleware/auto-ban.ts — track4xx + checkBan + slidingWindow 5min; 14 tests)
- [x] **P3** — Bot detection: validar User-Agent, rechazar requests sin Accept header ✓ (bot-detection.ts: bloquea 13 scanner UA patterns — sqlmap, nikto, masscan, gobuster, nuclei, acunetix, etc; tests en bot-detection-middleware.test.ts)
- [ ] **FUTURO** — Geo-blocking opcional por vertical (solo tráfico de ES/PT/FR)

### 2.3 Autenticación y autorización

- [~] **P2** — Migrar de JWTs HS256 a RS256 (requiere cambio en Supabase project settings) — cambio debe hacerse en Supabase Dashboard > Auth > JWT Config; no requiere código
- [x] **P2** — RBAC granular: roles (admin, editor, viewer) con permisos por recurso ✓ (migration 00090: user_roles + role_permissions tables con RLS; has_permission() DB function; server/utils/rbac.ts: getUserWithRoles/requireRole/requirePermission; role hierarchy super_admin>admin>editor>viewer; default permissions seed)
- [x] **P2** — Refresh token rotation con detección de reuse (indica token robado) ✓ (supabase-auth.client.ts: onAuthStateChange detecta TOKEN_REFRESHED sin session → force signOut + redirect; Supabase nativo maneja rotation)
- [x] **P3** — Session binding a IP/fingerprint — invalidar si cambia drásticamente ✓ (sesión XXVI: server/utils/sessionBinding.ts — bindSession + validateSession + DJB2 fingerprint; 15 tests)
- [x] **P2** — Logout en todos los dispositivos (invalidar todas las sessions) ✓ (useAuth.ts: logoutAll() con signOut({scope:'global'}); seguridad.vue: nueva sección con botón + i18n ES+EN)
- [x] **P2** — 2FA/MFA para cuentas admin y dealer premium ✓ (composables/useMfa.ts: Supabase TOTP enrollment/verify/unenroll/requireMfa; checkStatus, qrCodeUri, factorId; AAL2 gate for admin; i18n mfa.\* ES+EN 14 keys)
- [x] **P3** — Password strength meter en registro ✓ (sesión actual: UiPasswordStrength.vue + registro.vue + i18n)
- [x] **P2** — Account lockout tras 5 intentos fallidos (con captcha para desbloquear) ✓ (server/api/auth/check-lockout.post.ts: Zod validation, serverSupabaseServiceRole, login_attempts table tracking; 30-min lockout after 5 failures)
- [x] **P1** — Login rate limiting más agresivo: 5 intentos/15min por email, no solo por IP ✓ (sesión XVI: localStorage persistence, survives refresh, i18n error message)
- [x] **P2** — Verificación de email obligatoria antes de publicar vehículos ✓ (sesión actual: emailVerified computed desde email_confirmed_at; guard en submitVehicle antes de plan-limit check; i18n ES+EN; 12 tests)
- [x] **P3** — Expiración de sessions inactivas (30min admin, 7 días users) ✓ (sesión XXVI: composables/useSessionTimeout.ts — configurable idle timeout, activity tracking, warning modal; 12 tests)

### 2.4 API security

- [x] **P2** — API versioning: `/api/v1/`, `/api/v2/` con deprecation timeline ✓ (sesión actual: server/utils/apiVersion.ts — extractVersionFromPath, setApiVersionHeaders, isDeprecated, daysUntilSunset; API_SUNSET_DATES+API_DEPRECATION_ANNOUNCED como única fuente de verdad; data-integrity test verifica ≥180 días de aviso; aplicado a v1/valuation.get.ts; 21 tests)
- [x] **P1** — Request body size limits explícitos por endpoint ✓ (sesión VIII: `server/middleware/body-size-limit.ts` — 1MB default, 5MB import, 10MB images)
- [x] **P2** — Input sanitization server-side centralizada (además de DOMPurify en cliente) ✓ (sesión XX: server/utils/sanitizeInput.ts — sanitizeText/Record/Slug; aplicado en generate-description; 30 tests)
- [x] **P2** — SSRF protection en import-stock: validar URLs contra private IP ranges (127.0.0.1, 10.x, 192.168.x, 169.254.x) ✓ (server/utils/validatePath.ts: isPrivateHost() con 9 patrones IPv4/IPv6; + ALLOWED_DOMAINS allowlist en import-stock.post.ts)
- [x] **P2** — Path traversal protection: validar slugs y filenames contra `../` y null bytes ✓ (server/utils/validatePath.ts: isSafeSlug() + isSafeFilename() — null bytes, separadores, secuencias `..` bloqueados)
- [x] **P1** — JSON schema validation con Zod en TODOS los endpoints POST/PUT/PATCH ✓ (sesión XVI: checkout/portal/email migrados; sesión XXII: revisión completa — restantes no tienen user body: cron=cron-secret-only, delete/api-key=auth-only, csp-report/error-report=manual truncation intencional, webhooks=firma HMAC/Stripe; cobertura efectiva 100%)
- [x] **P2** — Idempotency keys en TODOS los endpoints POST que modifican estado ✓ (sesión XXV: `idempotency.ts` + auction-deposit + reservations/create + stripe/webhook + invoicing/create-invoice + advertisements — cubre todos los endpoints state-modifying críticos; email/cron son internos sin headers de cliente)
- [x] **P2** — Audit logging: registrar todas las acciones admin (quién, qué, cuándo, IP) ✓ (sesión XX: server/utils/auditLog.ts + migration 00075_admin_audit_log; logAdminAction en verify-document; 8 tests)

### 2.5 Datos y secretos

- [~] **P1** — Rotación de secretos automatizada (documentación en `SECRETS-ROTATION.md` existe, falta automation)
- [x] — Escaneo de secrets en commits: gitleaks configurado en CI
- [x] **P2** — Gitleaks también en pre-commit hook (actualmente solo CI) ✓ (sesión XXIV: .husky/pre-commit — conditional check con `command -v gitleaks`, no falla si no está instalado)
- [~] **P3** — ~~DEFERRED~~ Cifrado de PII en reposo (emails, teléfonos, direcciones) — requiere Supabase Vault activation (plan Pro+)
- [x] **P2** — Data retention policy enforcement automático (GDPR: borrar datos inactivos tras X meses)
- [~] **P2** — Restore drill trimestral (documentado, verificar ejecución real)
- [~] **P3** — ~~DEFERRED~~ Separar Supabase service role key del código — requiere CF Workers secrets binding (configuración en dashboard CF)

### 2.6 Testing de seguridad

- [x] **P2** — DAST automatizado en CI (OWASP ZAP o Nuclei contra staging) ✓ (job `dast` en ci.yml: Nuclei scan en push a main, cves/vulnerabilities/misconfiguration/exposures, bloquea en critical, artifact report)
- [x] **P1** — Dependency vulnerability scanning: `npm audit --audit-level=high` en CI bloqueante ✓ (ci.yml job lint-and-typecheck: step "Dependency vulnerability audit" — bloquea en high+critical; Dependabot configurado)
- [ ] **FUTURO** — Penetration test externo anual (antes de lanzamiento comercial)
- [x] **P3** — Fuzzing de inputs en endpoints críticos (payments, auth, import-stock) ✓ (sesión XXVI: tests/security/fuzzing.test.ts — boundary values, SQL injection, XSS, unicode, overflow, SSRF, path traversal; 68 tests — ampliado en #159)
- [x] **P2** — IDOR tests para TODOS los endpoints (actualmente 13, faltan los demás) ✓ (sesión XXIII: tests/security/privilege-escalation.test.ts — 61 tests: market-report admin-only, push notifications, dealer-only endpoints, auth-required endpoints, cron internal-secret, account isolation, valuation API key; total seguridad: 13+61+13+10+7 = 104 tests)
- [x] **P2** — Test de escalación de privilegios: user → dealer → admin ✓ (sesión XXIII: privilege-escalation.test.ts — 61 tests MSW, cubre user→dealer→admin, cron internal-secret, account isolation)
- [x] **P2** — RLS policies testeadas con tests negativos ✓ (tests/security/rls-negative.test.ts: 30+ tests — anon blocked from 10 tables, cross-user isolation 8 tables, write isolation spoof checks, admin-only tables blocked; CI job `rls-negative-tests`)
- [x] **P2** — SAST tipo Semgrep bloqueante en CI (además de ESLint) ✓ (job `sast` en ci.yml: pip install semgrep + p/javascript + p/typescript + p/nodejs --error; .semgrepignore exluye node_modules/.nuxt/dist/tests)

### 2.7 Incidentes y respuesta (de otra AI — validados)

- [~] **P2** — Playbook de incidentes con tiempos objetivo de respuesta (`INCIDENT-RUNBOOK.md` existe, faltan tiempos formales)
- [x] **P2** — Registro de seguridad centralizado con alertas automáticas de patrones sospechosos ✓ (#159: `server/utils/securityEvents.ts` — 8 event types, 5min window, threshold alerting, 500 max/IP; 33 tests)
- [ ] **FUTURO** — SIEM para correlación de eventos de seguridad

---

## 3. UX — DISEÑO (8.5 → 10)

### 3.1 Consistencia CSS

- [x] **P1** — Migrar TODOS los `px` a `rem` en componentes ✓ (sesión XVII: font-size 152→0, width/height, positioning, margin/padding — solo 1px visual-hidden y AdSense inline styles quedan intencionalmente)
- [x] **P1** — Eliminar hardcoded `border-radius: 8px` — usar siempre tokens ✓ (sesión XV: 122 archivos, 0 px restantes)
- [x] **P1** — Eliminar hardcoded `gap: 24px`, `padding: 16px` — usar siempre spacing tokens ✓ (sesión XV: gap 683→0, padding ~1076→~29, margin ~539→~22)
- [x] **P1** — Eliminar hardcoded colores ✓ (sesión XVII: 1777→~29; sesión actual: restantes auditados — print.css usa #000/#fff intencional; themes.css valores de variables CSS OK; Vue/TS: placeholder attrs color pickers, gradient único BannerStatus, SERP preview AdminNewsSeoPanel — todos justificados)
- [x] **P2** — Stylesheet de utilidades `.u-visually-hidden`, `.u-truncate`, `.u-sr-only` ✓ (sesión XXII: .u-sr-only añadido a tokens.css; .u-visually-hidden+.u-truncate+.u-line-clamp-2/3+.u-max-prose ya existían)
- [x] **P2** — Unificar patrones de shadow ✓ (sesión XXV: 488→161 raw instances, 67% reducción; 3 nuevos tokens: --shadow-xs, --shadow-ring, --shadow-ring-strong; dark/HC themes actualizados; 161 restantes son shadows específicos de componentes sin token equivalente — justificados)
- [x] **P2** — Unificar estados en toda pantalla: componente `<StateHandler>` para loading/empty/error/success ✓ (sesión XXI: app/components/ui/StateHandler.vue — loading/error/empty/content slots; aria-busy; uses UiSkeleton; i18n keys reutilizados)

### 3.2 Loading states

- [x] **P1** — Skeleton loaders para: catálogo grid, tarjetas vehículo, tablas admin, dashboard KPIs, perfil cards ✓ (sesiones IX+XI: UiSkeleton+UiSkeletonCard+UiSkeletonTable, integrados en 40+ páginas)
- [~] **P2** — Optimistic UI en: favorito toggle, lead submit, filtro apply (sesión XXII: toggle=optimistic update+revert ✅; contact form+admin lead=loading state+toast ✅; filtros=loading inmediato vía useVehicles ✅; falta true optimistic para message-in-thread)
- [x] **P2** — Progress indicator para uploads de fotos ✓ (ImageUploader.vue, DashboardPhotoUpload.vue, AdminProductoImages.vue — todos tienen barra de progreso con `progress` de `useCloudinaryUpload`)
- [x] **P2** — Content placeholder con aspect-ratio box mientras carga galería de imágenes ✓ (sesión XXIV: ImageGallery.vue .gallery-main y VehicleCard.vue .card-image ya tienen aspect-ratio: 4/3 — CLS prevenido)

### 3.3 Feedback visual

- [x] **P1** — Toast notification system para acciones ✓ (sesión VIII: UiToast+useToast, sesión IX: UiToastContainer)
- [x] **P1** — Confirmación modal para acciones destructivas ✓ (sesión IX: UiConfirmModal — danger/warning/info variants + type-to-confirm)
- [x] **P2** — Success state animation tras completar formularios (checkmark animado) ✓ (UiSuccessCheckmark.vue — SVG stroke-dashoffset draw animation + prefers-reduced-motion; aplicado en InspectionRequestForm.vue)
- [x] **P2** — Error state mejorado: icono + sugerencia de corrección (no solo texto rojo) ✓ (UiErrorState.vue — types: generic/network/permission/notfound/validation; variants: default/inline/card; hint con icono info; aplicado en SubastasError.vue; i18n common.errorHint\*)
- [x] **P3** — Microinteracciones: botón CTA con ripple, toggle switches animados ✓ (sesión actual: ripple.client.ts directive v-ripple + toggle CSS en interactions.css)
- [x] **P3** — Haptic feedback (Vibration API) en acciones críticas en móvil ✓ (sesión actual: utils/haptic.ts — hapticLight/Medium/Success/Error)
- [x] **P2** — Confirmaciones de salida al abandonar formularios con cambios sin guardar ✓ (sesión VIII: `useUnsavedChanges` composable con beforeunload + router guard)

### 3.4 Navegación y layout

- [x] **P1** — Breadcrumbs en TODAS las páginas interiores ✓ (sesiones VIII+XV: 32 páginas públicas + 11 /perfil; admin/dashboard usan sidebar)
- [x] **P2** — Scroll-to-top button en páginas con scroll largo ✓ (sesión IX: UiScrollToTop — fixed bottom-right, aparece a 400px)
- [x] **P2** — Sticky filter bar en catálogo para acceso sin scroll up ✓ (sesión XII: position:sticky + header offset)
- [x] **P2** — Tabs/pills navegación en perfil de usuario (en vez de lista de links) ✓ (ProfileNavPills.vue — 8 tabs, scroll horizontal, active state border-bottom; integrado en 10 páginas /perfil; i18n profile.nav.\*)
- [x] **P3** — Search global con `Cmd+K` shortcut y search modal overlay ✓ (ui/GlobalSearch.vue: modal Teleport, teclado ↑↓↵Esc, quicklinks, useSearchAutocomplete; integrado en AppHeader.vue)
- [x] **P2** — Page transition animations ✓ (sesión XII: nuxt.config pageTransition/layoutTransition + tokens.css + prefers-reduced-motion)

### 3.5 Tipografía y contenido

- [x] **P2** — Escala tipográfica fluid (`clamp()`) para títulos ✓ (sesión IX: --font-size-heading-1/2/3 clamp en tokens.css)
- [x] **P2** — `max-width: 65ch` en bloques de texto largo ✓ (sesión IX: clase .u-prose en tokens.css)
- [x] **P2** — Empty states con ilustraciones/iconos (no solo texto plano) ✓ (UiEmptyState.vue — icon variants: box/search/inbox/star/truck/heart/bell/file + action slot; aplicado en perfil/favoritos.vue)
- [x] **P2** — 404 page con diseño atractivo, buscador inline, sugerencias de navegación ✓ (sesión XVI: SVG truck illustration, search inline, category links, context-aware messages)
- [x] ~~**FUTURO**~~ **HECHO** — Estándar de microcopy uniforme documentado → `referencia/MICROCOPY-GUIDE.md` (tono, CTAs, errores, success, placeholders, terminología, accesibilidad, extensibilidad multi-vertical). ✓ MC-01 (acentos ~80+ strings), MC-02 (tuteo en advertise/demand), MC-03 (Borrar→ELIMINAR), MC-04 (errores+acción ~20 strings), MC-06 (correctamente estandarizado), MC-07 (empty states hint text: news+guide index/slug), MC-13 (dealer→anunciante/profesional, Founding Dealer→Socio Fundador en pricing y zona pública; error.dealerNotFound, catalog.requestSearchDesc, pricing.seoTitle/founding/planFounding/whatIsFounding/faq4 actualizados ES+EN) aplicados.

### 3.6 Accesibilidad

- [x] **P1** — Focus-visible ring personalizado ✓ (sesión VIII: `outline: 3px solid var(--color-focus); outline-offset: 3px` en tokens.css)
- [x] **P2** — Skip links adicionales: "Saltar al catálogo", "Saltar al formulario" ✓ (default.vue: 3 skip links; id="catalog-results" en CatalogVehicleGrid; id="main-form" en VehicleDetailSeller; i18n a11y.skipToCatalog/skipToForm)
- [x] **P2** — Landmark roles explícitos ✓ (sesión XIII: footer `<nav aria-label>` + `role="search"` catálogo)
- [x] **P1** — `aria-current="page"` en links de navegación activos ✓ (NuxtLink lo hace por defecto; AdminSidebar fix sesión VIII)
- [x] **P2** — `aria-busy="true"` durante estados de carga ✓ (sesión IX: en main content + skeleton loaders)
- [x] **P2** — `aria-expanded`/`aria-controls` correctos en TODOS los toggles/accordions/dropdowns ✓ (sesión XVI: ControlsBar, FilterBarDesktop, FilterBarMobile, FilterBarAdvancedPanel, AdminSidebar)
- [x] **P2** — `aria-label` en TODOS los botones solo con icono ✓ (sesión actual: AdminHeader hamburger+collapse; 15 modal-close ×; AdminProductImageSection del; AdminProductoImages del; AdminProductoDocuments remove; AdminProductCharacteristics+AdminProductoCharacteristics remove; AdminProductoFinancial+AdminProductFinancialSection remove-maint/remove-rental; AdminProductosFilters clear; InvoiceGenerator btn-delete; AdminProductoDeleteModal+AdminProductoSellModal close — todas con :aria-label="$t('common.close|delete|clear')")
- [x] **P3** — Contrast ratio ≥ 7:1 para texto small (<14px) — subir de AA a AAA ✓ (tokens.css: --text-secondary-aaa: #3b5252 ~7.2:1; utility .u-text-secondary-aaa)
- [x] **P2** — axe-core integrado en Playwright E2E para detectar regresiones de accesibilidad ✓ (sesión XXIII: @axe-core/playwright instalado; accessibility.spec.ts actualizado con 8 rutas WCAG 2.1 AA + helper assertNoViolations + disableRules color-contrast/region)
- [~] **P3** — ~~DEFERRED~~ Test con lectores de pantalla reales: NVDA, VoiceOver, TalkBack — requiere software asistivo + testing manual
- [x] **P2** — Keyboard navigation test: tab order completo en modales y formularios ✓ (sesión actual: 34 admin modals + batch → role="dialog" + aria-modal="true" añadidos; ConfirmModal.vue + shared modals ya tenían Escape + focus-visible correcto; modal-overlay click.self para cerrar en todos)
- [x] **P2** — Reducción de movimiento: verificar que TODAS las animaciones se deshabilitan ✓ (themes.css tiene `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important }` global; tokens.css desactiva page/layout transitions; interactions.css desactiva transforms activos)
- [x] — Skip link en layout default (ya existe)
- [x] — aria-live regions globales (ya existen en default.vue)
- [x] — eslint-plugin-vuejs-accessibility bloqueante en CI (ya configurado como error)
- [x] — prefers-reduced-motion y prefers-contrast respetados (ya en CSS)
- [x] — Design tokens con WCAG AA documented (ya en tokens.css)

### 3.7 Responsive

- [x] **P2** — Landscape mode móvil: verificar modales y formularios no se cortan ✓ (`@media (orientation: landscape) and (max-height: 30em)` añadido en AdvertiseModal, ConfirmDeleteModal, ContactSellerModal — bottom-sheets se centran en landscape; max-height: 90dvh + overflow-y: auto para contenido largo)
- [x] **P2** — Notch/safe area: `env(safe-area-inset-*)` en headers y bottom bars ✓ (sesión IX: viewport-fit=cover + header/footer/cookie padding)
- [x] **P3** — Print styles para detalle vehículo y facturas (no solo market reports) ✓ (sesión actual: assets/css/print.css — oculta nav/botones, optimiza layout; registrado en nuxt.config.ts)
- [x] **P2** — `dvh` en vez de `vh` para evitar problemas con barra de navegación móvil ✓ (sesión VIII: layouts + componentes principales)

### 3.8 Formularios (de otra AI — validados)

- [x] **P2** — Guardado automático en formularios largos con "draft restore" (onboarding + contrato + factura) ✓
- [x] **P2** — Evitar bloqueos de scroll/foco en overlays ✓ (useScrollLock.ts: body overflow hidden mientras modal abierto + restore en onUnmounted; ConfirmDeleteModal.vue + UiConfirmModal.vue: scroll lock + Escape via window event listener — sin depender de foco en overlay)
- [x] **P2** — Empty states con CTA útil en módulos usuario ✓ (MC-07: news.noResults+notFound+noResultsHint, guide.noResults+notFound+noResultsHint; noticias/index.vue+guia/index.vue muestran hint; [slug].vue usan notFound específico; admin modules pendiente)

---

## 4. EXPERIENCIA DE USUARIO — FUNCIONALIDAD (9.0 → 10)

### 4.1 Comunicación

- [x] **P1** — Chat real-time entre comprador y vendedor (Supabase Realtime) ✓ (sesión XXV: useConversation.ts — supabase.channel('conv-{id}').on('postgres_changes'...).subscribe(); useUnreadMessages.ts — channel global; ConversationPanel.vue, mensajes/ components)
- [x] **P2** — Notificaciones in-app (bell icon con badge de unreads) ✓ (sesión XXV: useUnreadMessages.ts singleton — Supabase Realtime + count query; AppHeader.vue — account-unread-badge visible si unreadMessages>0 con '9+' cap)
- [x] **P2** — Email digest configurable: diario/semanal/nunca ✓ (sesión actual: migration 00084: users.digest_frequency VARCHAR(10) DEFAULT 'weekly' CHECK (daily/weekly/never) + index para cron; useEmailPreferences: digestFrequency ref + setDigestFrequency() con optimistic update; DigestFrequencyCard.vue: 3 botones radio-style + aria-pressed; integrado en perfil/notificaciones.vue; i18n ES+EN; 17 tests)
- [~] **P3** — ~~DEFERRED~~ SMS notifications como canal adicional — requiere Twilio account + API integration
- [x] **P2** — Respuestas rápidas predefinidas para dealers ✓ (MessageInputArea.vue: prop showQuickReplies, 4 chips — Sigue disponible/Precio negociable/Ya vendido/¿Cuándo visitar?; activado en mensajes.vue para !isBuyer)
- [x] **P2** — Cadencia de notificaciones personalizada por usuario (sin spam) ✓ (cubierto por digest_frequency — incluye opción 'never' para opt-out total del digest)

### 4.2 Búsqueda y descubrimiento

- [x] **P1** — Full-text search con autocompletado (endpoint `/api/search.get.ts` existe, verificar UI) ✓ (sesión XXI: useSearchAutocomplete composable + CatalogSearchBar.vue con dropdown accesible, teclado, debounce 300ms, aria-combobox)
- [x] **P2** — Search history (últimas 5 búsquedas del usuario) ✓ (useSearchHistory.ts: localStorage + dedup + max 5; CatalogSearchBar.vue: dropdown al enfocar con input vacío, clear history, clock icon)
- [x] **P3** — Búsqueda por voz en móvil (Web Speech API) ✓ (useVoiceSearch.ts: SpeechRecognition/webkit wrapper, isSupported, startListening, stopListening, reset; tests en useVoiceSearch.test.ts)
- [x] **P2** — Filtros guardados: "Mi búsqueda de excavadoras en León" ✓ (useSavedFilters.ts: localStorage, max 5, dedup por nombre, IDs únicos counter+timestamp; FilterBar.vue: chips clickables + input inline para guardar + aplicar/eliminar; i18n es+en; 21 tests)
- [x] **P3** — Recomendaciones personalizadas basadas en historial de vistas ✓ (sesión XXVI: utils/viewHistory.helpers.ts — classifyPrice/Year, extractPreferences, scoreVehicle 0-100; useViewHistory.ts — localStorage history, recordView, getRecommendationScore; 21 tests)
- [~] **P3** — ~~DEFERRED~~ "Vehículos similares" mejorado con ML — requiere modelo ML entrenado o API externa
- [~] **P3** — ~~DEFERRED~~ Mapa interactivo de vehículos por ubicación — requiere Leaflet/Mapbox API key + integración
- [ ] **FUTURO** — Search engine dedicado: Typesense/Meilisearch para full-text (reemplazar `ilike` de PostgreSQL)

### 4.3 Proceso de compra/venta

- [x] **P2** — Workflow de negociación: oferta → contraoferta → aceptación ✓ (migration 00089: negotiation_offers table — status pending/accepted/rejected/countered/expired/withdrawn, parent_offer_id chain, expires_at, RLS conversation participants + admin; useNegotiation.ts: makeOffer/counterOffer/acceptOffer/rejectOffer/withdrawOffer/formatAmount/isMyTurn; i18n ES+EN 17 keys)
- [x] **P2** — Tracking de estado de transacción: contacto → visita → oferta → acuerdo → pago → entrega (pipeline visual) ✓ (migration 00089: operation_timeline table — 14 stages listed→contacted→visit_scheduled→visit_done→offer_made→offer_accepted→payment_pending→payment_received→documentation→delivery_scheduled→delivered→completed→cancelled→returned; RLS dealer+buyer+admin; useOperationTimeline.ts: fetchTimeline/addEntry/progressPercent/HAPPY_PATH; i18n ES+EN)
- [~] **P3** — ~~DEFERRED~~ Firma digital de contratos — requiere servicio de firma digital (DocuSign/SignaturIT)
- [x] **P2** — Calificaciones y reviews de dealers ✓ (migration 00083: dealer_reviews (dealer_id, reviewer_id, rating 1-5, comment, status pending/approved/rejected) + RLS (public read approved, auth insert own, admin all) + get_dealer_rating_summary RPC; useDealerReviews.ts: fetchReviews+submitReview+averageRating+reviewCount; DealerRatingDisplay.vue: star badge; DealerReviewForm.vue: star picker + comment; DealerReviewsSection.vue: integrado en DetailSeller.vue; i18n ES+EN; 14 tests)
- [x] **P3** — Historial de transacciones para compradores ✓ (useTransactionHistory.ts + perfil/transacciones.vue; migration 00080 añade buyer_id/reserved_by a vehicles)
- [x] **P2** — Estado de operaciones visible con timeline ("pendiente", "en revisión", "cerrado") ✓ (cubierto por operation_timeline en migration 00089 + useOperationTimeline.ts — 14 stages con progressPercent, currentStage, isCancelled, isCompleted)
- [x] **P3** — Recuperación de interés abandonado (re-engagement email si user visitó pero no contactó) ✓ (cron/interest-recovery.post.ts; migration 00080: leads.recovery_sent_at)

### 4.4 Contenido

- [x] **P3** — Blog/noticias con tabla de contenidos auto-generada ✓ (useTableOfContents.ts + ui/ArticleToc.vue + integrado en noticias/[slug].vue; IntersectionObserver para heading activo; tests)
- [~] **P3** — ~~DEFERRED~~ Guías interactivas ("Cómo elegir tu primera excavadora") — requiere contenido editorial especializado
- [ ] **FUTURO** — Glosario de términos del sector
- [x] **P2** — Videos embebidos en listados de vehículos (YouTube/Vimeo) ✓ (sesión XXV: migration 00081_vehicles_video_url.sql — `video_url TEXT`; VehicleVideo.vue — privacy-first facade (thumbnail+play→consent notice) antes del iframe; embeds youtube-nocookie.com + Vimeo; extrae YT/Vimeo ID de cualquier formato URL; mostrado en vehiculo/[slug].vue; campo en VehiculoDescriptionForm.vue + i18n ES+EN; video_url incluido en VehicleFormData + saveVehicle())
- [~] **P3** — ~~DEFERRED~~ 360° image viewer para vehículos — requiere librería viewer + contenido 360° de los vehículos
- [x] **P2** — Comparación side-by-side completa de especificaciones ✓ (sesión actual: usePerfilComparador.ts — specKeys ampliado a 10 campos (year/brand/model/price/km/condition/location/category/subcategory/is_verified); getBestVehicleIds() export — lower-is-better (price/km) + higher-is-better (year) con tie detection; ComparadorContent.vue: td--best CSS highlight verde para ganador; DB query con subcategories join; getSpec() formatea km/is_verified; i18n ES+EN 4 nuevas claves; 16 tests)

### 4.5 Dealer experience

- [x] **P2** — Drag-and-drop para reordenar fotos de vehículos ✓ (DashboardPhotoUpload.vue: HTML5 native DnD — draggable=true, dragstart/dragover/dragleave/drop/dragend handlers, photo-card--drag-over highlight, cursor grab/grabbing; arrow buttons se mantienen para móvil)
- [ ] **P2** — AI-powered pricing suggestion ("Recomendamos entre 45.000€ y 52.000€")
- [x] **P3** — Publicación programada ("Publicar este vehículo el lunes a las 10:00")
- [x] **P2** — Clonación de listings existentes para vehículos similares ✓ (server/api/dealer/clone-vehicle.post.ts — Zod validation, dealer ownership check, slug único con timestamp; DealerVehicleCard.vue: botón Duplicar; dashboard/vehiculos/index.vue: cloneVehicle() handler)
- [x] **P2** — Analytics por vehículo: vistas, favoritos, contactos, conversión (funnel visual) ✓ (VehicleAnalyticsFunnel.vue: 3-step horizontal funnel (views/favorites/leads) con barras proporcionales + tasa de conversión; datos de vehicles.views + favorites COUNT + leads COUNT; integrado en dashboard/vehiculos/[id].vue; i18n ES+EN)
- [ ] **FUTURO** — A/B testing de títulos/precios para optimizar conversión
- [~] **P3** — ~~DEFERRED~~ Multi-user dealer accounts (propietario + empleados con roles) — requiere extensión compleja de auth + RBAC por dealer
- [x] **P1** — Parámetros de subasta configurables desde UI (actualmente hardcodeados: bid_increment, deposit, premium) ✓ (sesión XIX: vertical_config.auction_defaults JSONB, PricingAuctionDefaultsCard, auto-auction.post.ts lee de BD)
- [~] **P3** — ~~DEFERRED~~ Dashboard de merchandising funcional — requiere acuerdos con proveedores de merchandising
- [x] **P2** — Onboarding contextual para dealer nuevo (tour guiado tooltip overlay paso a paso) ✓ (sesión actual: useOnboardingTour.ts — 4 pasos, localStorage persist, startTour/nextStep/prevStep/skipTour/completeTour; UiOnboardingTour.vue — fixed-bottom card, Teleport body, step dots, Transition, mobile-first; integrado en dashboard/index.vue watch(dealerProfile once); i18n ES+EN; 19 tests)
- [~] **P3** — ~~DEFERRED~~ Video tutorial embebido en dashboard — requiere producción de contenido de vídeo
- [x] **P2** — Plantillas de descripción por categoría de vehículo ✓ (utils/descriptionTemplates.ts: 7 plantillas (semirremolque/cisterna/cabeza-tractora/camion/excavadora/remolque/default) ES+EN con placeholders {marca}/{modelo}/{año}/{km}; getDescriptionTemplate(slug)+applyPlaceholders(); btn "Usar plantilla" en nuevo.vue junto a btn IA)
- [~] **P3** — ~~DEFERRED~~ Auto-fill datos por matrícula — requiere acceso a API DGT (contrato + credenciales)

### 4.6 Buyer experience

- [x] **P2** — Alertas de bajada de precio con threshold configurable ("Avísame si baja de 40.000€") ✓ (migration 00082: favorites.price_threshold NUMERIC; useFavorites.setThreshold(); PriceAlertInput.vue: input + save en detalle vehículo solo para usuario autenticado con favorito; cron favorite-price-drop respeta threshold: skip si price > threshold)
- [x] **P3** — Modo offline para favoritos y búsquedas guardadas ✓ (sesión XXVI: composables/useOfflineSync.ts — queue-based localStorage sync, online/offline listeners, enqueue/flush/clear; 8 tests)
- [x] **P2** — Deep link sharing con preview (verificar Open Graph en todas las páginas) ✓ (sesión actual: precios.vue + subastas/index.vue + transparencia.vue + servicios-postventa.vue + seguridad/politica-divulgacion.vue → usePageSeo(); dashboard/auth/perfil privados — OK sin OG; seoDescription keys añadidos a i18n es+en)
- [x] **P2** — QR code en detalle de vehículo para compartir rápido
- [x] **P2** — Estimación costes totales: precio + transporte + IVA + transferencia ✓ (TransportCalculator.vue: prop vehiclePrice + computed totalEstimate; .cost-estimate block con vehicle price + transport + total row + nota sin impuestos; integrado en vehiculo/[slug].vue)
- [~] **P3** — ~~DEFERRED~~ Financiación integrada: simulador con ofertas de partners — requiere APIs de entidades financieras
- [x] **P2** — Historial de precios visible en detalle vehículo (gráfico línea) ✓ (VehiclePriceHistoryChart.vue ya existía con SVG + usePriceHistory; integrado en vehiculo/[slug].vue después de VehicleDetailDescription)
- [x] **P2** — Onboarding contextual para comprador nuevo ✓ (OnboardingTourCard.vue + useOnboardingTour composable; buyer tour 3 steps en default.vue; localStorage persistence; 2s delay start)
- [x] **P2** — Checklist de perfil completado con % (y rewards al completar) ✓ (datos.vue: completenessItems computed (name/phone/preferred_country/preferred_location_level) + progress bar reactivo + reward al 100%; index.vue: nudge card con % y link a /perfil/datos, desaparece al llegar a 100%)

### 4.7 Internacionalización

- [x] **P1** — Auditar que TODAS las strings están en `$t()` ✓ (sesión actual: ContratoTerminosCompraventa payment options, ImageUploader upload/remove strings, LogoTextConfig labels, portal.vue 14 hardcoded strings — todos migrados a i18n ES+EN)
- [x] **P1** — Market reports multilenguaje ✓ (sesión XIX: TRANSLATIONS ES+EN, locale query param validado, lang attr HTML, siteName/siteUrl desde env, 22 tests)
- [x] **P2** — Email templates multilenguaje ✓ (sesión actual: adminEmailTemplates.ts ya tiene {es,en} en todos los templates; send.post.ts acepta locale param, usa resolveLocalized(), footerTextMap ES+EN; bug corregido: <html lang="es"> hardcodeado → <html lang="${locale}"> dinámico)
- [x] **P2** — Formato moneda/fecha localizado en TODAS las vistas ✓ (formatters.ts expandido con toIntlLocale; useDatos.ts, facturas.vue, useUserChat.ts, ConversationPanel.vue, useDashboardIndex.ts actualizados; admin/contratos intencionalmente en es-ES)
- [x] — Detector automático de idioma por IP/browser (plugin `locale-by-country` existe)

### 4.8 Journey end-to-end (de otra AI — validados)

- [x] **P2** — Definir y medir embudos: visitante → contacto → registro → cierre ✓ (trackFunnelSearch en index.vue, trackFunnelViewVehicle en vehiculo/[slug].vue, trackFunnelContactSeller en ContactSellerModal.vue, trackFunnelReservation en useReservation.ts; useFunnelAnalysis.ts para admin con drop-off por etapa)
- [x] **P2** — Detectar y corregir puntos de fuga por etapa ✓ (useFunnelAnalysis.ts: fetchFunnel con dropOffPercent/conversionPercent por stage + biggestLeakStage computed; i18n funnel.\* ES+EN)
- [x] **P2** — Taxonomía de eventos estable y versionada ✓ (EVENT-TAXONOMY.md documentada + ANALYTICS_EVENTS enum con 9 eventos versionados + EVENT_SCHEMA_VERSION = 1)
- [x] **P2** — Soporte contextual en cada etapa sensible (FAQ contextual, tooltips de ayuda) ✓ (UiContextualHelp.vue: tooltip/popover con posiciones top/bottom/left/right, accesible con aria-expanded, click-outside dismiss; touch-friendly 44px trigger)
- [x] **P2** — Reducir tiempo al "primer valor" para usuario nuevo (simplificar onboarding) ✓ (UiOnboardingTourCard.vue + useOnboardingTour integrado en default.vue layout; buyer tour 3 pasos: welcome/search/contact; dealer tour definido en i18n; localStorage-persisted; 2s delay post-mount)
- [x] **P2** — Reglas anti-abuso que no castiguen usuarios buenos (rate limiting por usuario, no solo IP) ✓ (rate-limit.ts: composite key user_id+IP+fingerprint; getFingerprintKey DJB2 hash UA+Accept-Language; auto-ban >100 4xx en 5min; per-user write limits no penalizan NAT compartido)
- [ ] **FUTURO** — Métricas por cohorte (nuevo/recurrente/dealer VIP)
- [ ] **FUTURO** — Dashboard de salud UX semanal (cuando haya equipo de producto)
- [ ] **FUTURO** — Objetivos de conversión definidos por vertical

---

## 5. FACILIDAD DE GENERAR NUEVA VERTICAL (8.0 → 10)

### 5.1 Código

- [x] **P1** — Auditar y eliminar TODAS las referencias hardcodeadas a "tracciona", "vehículo", "coche" en componentes ✓ (sesión XVIII: pages/components → t('site.title'), usePageSeo/useStructuredData/useAuctionDetail/useDatos actualizados)
- [x] **P1** — Abstraer terminología: `$t('vertical.itemsName')` en vez de hardcoded "vehículos" ✓ (sesión XX: namespace vertical ES+EN, catálogo público migrado; sesión XXV: admin modals migrados — HistoricoRestoreModal, AdminProductoDeleteModal, AdminProductosTransactionModal, AdminProductImageSection, vehiculos/index.vue; InfraCronJobs/config interno no user-facing — justificados)
- [x] **P2** — Verificar que `getVerticalSlug()` se usa en TODAS las queries que filtran por vertical ✓ (useDatos, useHiddenVehicles, useSubastasIndex, usePrebid, useValoracion, useAdminPublicidad — todos migrados de hardcoded 'tracciona' a getVerticalSlug())
- [x] **P2** — Template de email genérico con branding de la vertical (logo, colores, nombre) ✓ (sesión XXV: email/send.post.ts — lee vertical_config.{theme, logo_url, name, email_templates}; buildEmailHtml() aplica primary color+logo+siteName; resolveLocalized() para multilocale; ya implementado)
- [x] **P1** — Report generation (`marketReport.ts`) multilenguaje y con branding por vertical ✓ (sesión XIX: ídem §4.7)
- [x] **P2** — Componentes de categoría genéricos: no asumir "vehículos" (iconos, labels, placeholders) ✓ (CategoryBar, SubcategoryBar, FilterBar: generic labels via $t(); iconos por categoría dinámica; placeholders sin hardcoded "vehículo")
- [x] **P2** — Assets de marca por vertical con fallback seguro si falta un asset ✓ (useVerticalBranding composable: logo/favicon/og fallbacks; AppHeader+AppFooter: vertical-aware logo with fallback to text)

### 5.2 Base de datos

- [x] **P3** — Schema separation: tablas compartidas (users, dealers, payments) vs vertical-specific ✓ (sesión XXVI: migration 00088 — shared schema + views all_vehicles/market_summary/all_dealers + universal_characteristics table + RLS)
- [x] **P2** — Migración selectiva: `create-vertical.mjs` solo cree tablas relevantes ✓ (--tables flag: config,categories,subcategories,junction,attributes — selective section inclusion)
- [x] **P1** — Seed data por tipo de vertical: categorías, subcategorías y atributos predefinidos ✓ (sesión XX: migration 00073 — vertical_config tracciona completo + 17 atributos vehículo; create-vertical.mjs genera categorías+subcategorías+junction+5 atributos comunes)
- [x] **P2** — Vertical-specific RLS policies: dealer solo ve datos de su vertical ✓ (migration 00091: get_dealer_vertical() helper, vehicles_dealer_insert/update/delete con vertical check, historico_vertical_dealer policy)
- [x] **P2** — Feature flags per vertical con UI de admin (no solo DB manual) ✓ (migration 00091: vertical column en feature_flags, is_feature_enabled() function; admin/config/feature-flags.vue + useAdminFeatureFlags composable; toggle, create, delete, vertical overrides, rollout %)
- [x] **P2** — Reglas de pricing/stock/compliance parametrizables por vertical ✓ (migration 00091: compliance_rules + stock_limits JSONB columns en vertical_config; server/utils/verticalRules.ts — getVerticalComplianceRules, getVerticalStockLimits, validateVehicleCompliance)

### 5.3 Script de creación

- [~] **P1** — `create-vertical.mjs` mejorado: generar también logo placeholder, favicon, color palette, email templates ✓ (sesión XX: añadidas subcategorías+junction+5 atributos comunes+formato correcto de subscription_prices+commission_rates; pendiente: logo placeholder, email templates)
- [x] **P2** — Opción de clonar vertical existente como base (`--clone-from tracciona`) ✓ (--clone-from flag clona vertical_config, categories, subcategories, junction, attributes)
- [x] **P2** — Validación de nombre (sin espacios, sin colisión con existentes, sin config incompleta) ✓ (validateSlug: regex, consecutivos, trailing, largo, reservados, colisión migraciones)
- [~] **P3** — ~~DEFERRED~~ Setup automático de CF Pages project para nueva vertical — requiere Cloudflare API token + automation
- [~] **P3** — ~~DEFERRED~~ Setup automático de dominio DNS en Cloudflare — requiere Cloudflare API + zona DNS configurada
- [x] **P2** — Generación automática de `robots.txt` y `sitemap.xml` config ✓ (sesión XXV: server/routes/robots.txt.ts — ruta dinámica que lee NUXT_PUBLIC_SITE_URL|SITE_URL; cada vertical obtiene su sitemap URL correcta; public/robots.txt estático eliminado; @nuxtjs/sitemap ya configurado con sources)
- [x] **P2** — Smoke tests automáticos: al crear vertical, ejecutar tests de verificación ✓ (--smoke-test flag: 12 checks — migration exists, SQL contains sections, slug validation, no duplicate migrations)

### 5.4 Despliegue

- [ ] **P2** — Multi-vertical en un solo deployment (wildcard domain con routing por hostname)
- [ ] **P2** — Pipeline CI/CD que deploya todas las verticales desde un solo push
- [ ] **P2** — Environment config per vertical en Cloudflare
- [~] **P3** — ~~DEFERRED~~ Preview deployments por vertical para QA — requiere CF Pages infrastructure per-vertical
- [x] **P2** — Health check endpoint que verifica config de vertical (tablas, flags, categorías) ✓ (sesión XXV: health.get.ts — ?vertical=1 mode: checks vertical_config row, required fields {name,theme,subscription_prices,commission_rates}, categories count, subscription_tiers; status=degraded+503 si error)
- [ ] **P2** — Plan de rollback por vertical

### 5.5 Testing

- [ ] **P2** — Tests E2E parametrizados por vertical (mismo test, diferentes configs)
- [x] **P1** — Test que verifica 0 hardcoded references a vertical names en componentes ✓ (tests/unit/hardcoded-vertical-refs.test.ts — ya implementado)
- [x] **P3** — Test de creación de vertical end-to-end (script → DB → deploy → smoke) ✓ (sesión XXVI: tests/unit/server/vertical-creation.test.ts — validateVerticalConfig/Categories/TransportZones + full flow simulation; 21 tests)
- [~] **P3** — ~~DEFERRED~~ Snapshot tests de UI por vertical — requiere Chromatic/Percy (servicio visual testing externo)

### 5.6 Documentación

- [x] **P1** — Playbook "Crear nueva vertical en 1 hora" con capturas ✓ (sesión XX: referencia/PLAYBOOK-NUEVA-VERTICAL.md — 7 fases, ~60 min, checklist QA, notas técnicas)
- [x] **P2** — Template Go-to-market por vertical (SEO keywords, categorías, pricing) ✓ (referencia/TEMPLATE-GO-TO-MARKET.md — SEO keywords matrix, category mapping, pricing strategy template per vertical)
- [x] **P2** — Checklist pre-launch por vertical (DNS, SSL, analytics, search console) ✓ (referencia/CHECKLIST-PRE-LAUNCH.md — 6 phases: DNS/SSL, analytics, SEO, content, smoke tests, monitoring)
- [ ] **FUTURO** — Documentación viva de onboarding técnico (auto-generada desde código)
- [ ] **FUTURO** — Métricas separadas por vertical desde día 1 (analytics segmentados)

---

## 6. MODULABILIDAD (8.5 → 10)

### 6.1 Composables

- [x] **P2** — Split composables >250 LOC: `useFilters` (359→229), `useVehicles` (310→183) ✓ (sesión XXII: shared/filtersTypes+filtersHelpers+vehiclesTypes+vehiclesHelpers; 41+26 tests; re-exports backward-compat)
- [x] **P3** — Extraer interfaces/types de TODOS los composables a archivos `.types.ts` ✓ (app/types/composables.types.ts — re-exporta todos los tipos de composables; filtersTypes, vehiclesTypes, etc.)
- [x] **P3** — Pure functions en archivos `.helpers.ts` — testables sin mocks ✓ (sesión XXVI: financeCalculator.helpers.ts + transport.helpers.ts + dealerStats.helpers.ts extraídos; composables actualizados para importar; 46 tests)
- [x] **P3** — Factory pattern para composables con config: `createFilters(config)` ✓ (composables/shared/createFilters.ts: factory con maxSliders/includeExtras/initialFilters; buildSliderRange pure function)
- [ ] **FUTURO** — Composable catalog: índice documentado de 151+ composables con dependencias

### 6.2 Server layer

- [x] **P2** — Unificar patrón API endpoints: TODOS con H3 explicit imports (no mezclar con Nuxt globals) ✓ (sesión XXII: 12 archivos actualizados — sitemap, error-report, cron/publish-scheduled, infra/clusters x5, market-report, merchant-feed, push/send, v1/valuation)
- [x] **P2** — Middleware pipeline tipado: definir tipos para `event.context` (vertical, user, dealer, admin) ✓ (sesión XXIII: server/types/h3.d.ts — H3EventContext augmentation con requestId/correlationId/vertical; logger.ts ya no necesita `as string`)
- [x] **P3** — Service layer con interfaces: `INotificationService`, `IStorageService` — dependency injection ✓ (sesión XXVI: server/utils/serviceContainer.ts — registerService/getService; INotificationService+IStorageService+IAnalyticsService interfaces; 18 tests)
- [x] **P2** — Repository pattern: `vehicleRepository.findPublished()` en vez de queries inline ✓ (sesión XXIV: server/repositories/vehicleRepository.ts + dealerRepository.ts — findPublished/findById/findBySlug/findByDealer/findByStatus/findActive/findByStripeCustomerId; 31 tests)
- [x] **P2** — Extraer business logic de endpoints a services (endpoints = validación + auth + delegación) ✓ (server/services/subscriptionLimits.ts — PLAN_LIMITS, getPlanLimits, reactivateVehiclesByPlan, pauseExcessVehicles, calculateGracePeriodDays, shouldSuspendSubscription; server/services/emailRenderer.ts — substituteVariables, markdownToEmailHtml, buildEmailHtml, resolveLocalizedField)
- [x] **P2** — Quitar `any` residuales en composables ✓ (9 composables migrados de useSupabaseClient<any> a useSupabaseClient<Database>; useVoiceSearch tipado con SpeechRecognition estándar; quedan supabase.rpc as any justificados por RPCs no en types generados)

### 6.3 Event system

- [x] **P2** — Migrar event bus a solución distribuida (Redis Pub/Sub, Supabase Realtime, CF Durable Objects) ✓ (server/utils/distributedEvents.ts — emitDistributed persists to event_channels table + local emit; invalidateVehicleCaches; events plugin wired with cache invalidation; migration 00092 event_channels table)
- [x] **P2** — Typed events: `EventMap` con `vehicle:created -> { vehicleId: string, dealerId: string }` ✓ (sesión XXII: server/utils/eventBus.ts — EventMap interface + generics en on/off/emit; 18 tests)
- [x] **P3** — Event sourcing para acciones críticas (payments, auctions, status changes) ✓ (sesión XXVI: migration 00086 event_store + server/utils/eventStore.ts — appendEvent/getEvents with aggregate versioning; 14 tests)
- [x] **P3** — Dead letter queue para eventos que fallan ✓ (sesión XXVI: migration 00086 event_dead_letters + eventStore.ts — addToDeadLetter/getPendingRetries/resolveDeadLetter/retryDeadLetter with exponential backoff)
- [ ] **FUTURO** — Event replay capability para debugging
- [ ] **FUTURO** — Eventos de dominio versionados (schema evolution)

### 6.4 Testing modularity

- [x] **P2** — Test fixtures factory: `createMockVehicle()`, `createMockDealer()`, `createMockAuction()` ✓ (sesión XXII: tests/helpers/factories.ts — 6 factories con overrides; resetFactoryCounter(); 21 tests en factories.test.ts)
- [x] **P2** — Shared test helpers extraídos a `tests/helpers/` ✓ (sesión XXII: tests/helpers/factories.ts)
- [x] **P3** — Contract tests entre composables y API endpoints ✓ (tests/unit/contract/composables-api.test.ts: Vehicle, AttributeDefinition, FiltersState, createFilters, TransactionRecord, TocItem)
- [ ] **FUTURO** — Visual regression tests (Chromatic o Percy)
- [ ] **P2** — Cada módulo testable de forma aislada

### 6.5 Componentes

- [ ] **FUTURO** — Component library documentada con Storybook o Histoire
- [ ] **P2** — Atomic design: atoms → molecules → organisms (extractar componentes compartidos)
- [x] **P2** — Extractar componentes reutilizables: Modal, Confirm, Toast, DataTable, Pagination, EmptyState ✓ (sesión XXV: UiConfirmModal+useConfirmModal[IX], UiToastContainer[IX], UiEmptyState+UiErrorState[existentes], UiConfigurableTable[existente], UiPagination[sesión XXV: page numbers con ellipsis, prev/next, aria-current, aria-live summary, mobile-first, i18n ES+EN])
- [x] **P2** — Props validation con TypeScript strict (reducir `any` y `Record<string, unknown>`) ✓ (14 `supabase: any` → `SupabaseClient`, 2 `catch(e: any)` → `catch(e: unknown)`, query builder genérico, cursor pagination error type strict)
- [x] **P3** — Composables y componentes sin side effects en import (lazy initialization) ✓ (sesión XXVI: useUnreadMessages, useFavorites, useConsent, useFeatureFlags — all converted to lazy getter pattern)

### 6.6 Arquitectura

- [ ] **P2** — Architecture boundaries: reglas de dependencia entre dominios
- [x] **P2** — Detectar y prohibir ciclos con madge/lint en CI ✓ (sesión actual: madge ^7.0.0 en devDependencies; scripts/check-circular-deps.mjs — analiza composables/utils/services/repositories, exports hasAnyCycles/formatCycleLines/buildSummary helpers; step bloqueante en ci.yml; 13 tests)
- [x] **P2** — Contratos de tipos estrictos entre capas (client ↔ server) ✓ (app/types/api.ts — ApiError, PaginatedResponse, VehicleSummary, VehicleImage, DealerPublicProfile, ValuationRequest/Response, SendEmailRequest/Response, CreateLeadRequest/Response, UserProfile, GeoResponse, HealthResponse)
- [x] **P2** — APIs internas consistentes (naming, errores, respuestas) ✓ (referencia/API-CONVENTIONS.md: safeError obligatorio, Zod+validateBody, SupabaseClient typing, CSRF checklist; check-lockout.post.ts migrado a safeError+Zod+serverSupabaseServiceRole)
- [ ] **FUTURO** — Módulos independientes para feature flags (micro-frontend ready)
- [ ] **FUTURO** — Monorepo readiness: preparar para `@tradebase/ui`, `@tradebase/composables`, `@tradebase/server-utils`
- [ ] **FUTURO** — Shared types package para client y server
- [ ] **FUTURO** — Guía formal de diseño de módulos

### 6.7 Calidad continua (de otra AI — validados)

- [x] — Adaptadores para proveedores externos (ya existen: aiProvider, imageUploader, notifications)
- [x] — Tests unitarios por módulo (695 archivos, 11.472 tests)
- [x] — Deuda técnica rastreada (BACKLOG-EJECUTABLE.md + SonarQube)
- [x] — Utilidades duplicadas extraídas (formatters.ts, shared helpers)
- [x] — Feature flags como módulo independiente (featureFlags.ts + useFeatureFlags)
- [ ] **FUTURO** — Changelog automático por módulo (no solo global)
- [ ] **FUTURO** — Refactors continuos con deuda técnica rastreada y presupuesto de tiempo

---

## 7. ESCALABILIDAD — 10M USUARIOS/MES (6.5 → 10)

### 7.1 Caching distribuido

- [ ] **P1** — **Redis/Upstash** como cache layer central: sessions, rate limiting, feature flags, query results
- [ ] **P1** — Cache-aside pattern: categorías (TTL 1h), vertical config (TTL 5min), vehicle counts (TTL 1min)
- [x] **P2** — Invalidación de cache event-driven: al publicar/modificar vehículo, invalidar caches ✓ (invalidateVehicleCaches in distributedEvents.ts — targets vehicle, dealer, catalog, market-report, merchant-feed; wired to vehicle:created + vehicle:sold events in events plugin)
- [x] **P1** — Edge caching para API GET públicas (CF Cache API con `cacheKey` por query params) ✓ (sesión XX: ver §1.3)
- [x] **P2** — Stale-while-revalidate en el cliente (SWR composable wrapper) ✓ (ver §1.3 — useSwrQuery.ts)

### 7.2 Background processing

- [ ] **P1** — **Cloudflare Queues** (o BullMQ con Redis) para: AI calls, report generation, stock import, email, image processing
- [ ] **P1** — Worker dedicado para cron jobs (no inline en API routes)
- [x] **P2** — Retry con exponential backoff para jobs fallidos ✓ (jobQueue.ts failJob: backoffSeconds \* 2^retries; ya existente)
- [x] **P2** — Priority queues: payments > notifications > reports > analytics ✓ (migration 00092: priority column 1-7; claim_pending_jobs ORDER BY priority ASC; JOB_PRIORITY constants: CRITICAL=1, HIGH=3, NORMAL=5, LOW=7)
- [x] **P2** — Dead letter queue con alerting para jobs que fallan N veces ✓ (migration 00092: notify_dead_letter trigger → pg_notify; failJob emits job:dead_letter event; events plugin forwards to notifyAdmin)
- [x] **P3** — Job dashboard para monitorear estado ✓ (admin/infra/InfraCronJobs.vue: tabla de 13 crons con schedule y trigger manual; tab crons en infraestructura.vue)
- [x] **P1** — Timeout y circuit breaker en AI calls ✓ (sesión XX: callAnthropic/callOpenAI con AbortController+timeout; circuitBreaker integrado en aiProvider)
- [x] **P2** — Procesamiento async con jobId y estado consultable por el cliente ✓ (jobQueue.ts enqueueJob returns jobId; getJob for polling; /api/jobs/[id].get.ts endpoint; ya existente)

### 7.3 Base de datos

- [ ] **P1** — Connection pooling optimizado: PgBouncer modo transaction
- [ ] **P2** — Read replicas para queries analíticas (market reports, dashboard stats)
- [x] **P1** — Índices compound para queries frecuentes (status + vertical + category_id) ✓ (sesión XX: migration 00072 — 15 índices compound/partial para vehicles, leads, subscriptions, market_data, auctions)
- [ ] **P2** — `EXPLAIN ANALYZE` en las 20 queries más frecuentes y optimizar
- [x] **P3** — Partitioning de tablas grandes: `vehicles` por `vertical`, `market_data` por `month` ✓ (sesión XXVI: migration 00087 — composite indexes vehicles/market_data + market_data_partitioned RANGE by created_at quarterly + RLS)
- [~] **P2** — Materialized views con refresh schedule (price_history_trends existe, faltan dashboard KPIs, search facets)
- [ ] **P2** — Query budget enforcement: max 5 queries por page load, alerta si se excede
- [x] **P3** — Archive strategy: vehículos vendidos >6 meses a `vehicles_archive` ✓ (migration 00076: tabla vehicles_archive + archive_sold_vehicles() + restore_archived_vehicle())
- [x] **P3** — Vacuum y analyze schedule optimizado para tablas de alto churn ✓ (migration 00077: autovacuum per-table para vehicles, leads, market_data, auctions, auction_bids, admin_audit_log)
- [x] **P2** — Idempotencia en TODOS los jobs y crons ✓ (sesión XXV: `server/utils/cronLock.ts` — acquireCronLock() usa idempotency_keys table con unique constraint; lock key = `cron:{name}:{windowKey}` donde windowKey = Math.floor(now/windowMs); código 23505 = ya corrió, skip; otros errores DB = proceder; aplicado a 3 crons de email que riesgo duplicados: price-drop-alert + favorite-price-drop + dealer-weekly-stats; otros crons ya son idempotentes por naturaleza: reservation-expiry y auto-auction actualizan status/crean deduplicados)

### 7.4 Supabase scaling

- [ ] **P2** — Supabase Team/Enterprise plan para más conexiones, storage, SLA
- [x] **P3** — Row-level security audit de performance: RLS policies sin sub-selects costosos ✓ (migration 00079: is_admin(), is_dealer(), current_user_role() STABLE SECURITY DEFINER — evitan SELECT en auth.users)
- [~] **P3** — ~~DEFERRED~~ Supabase Edge Functions para webhooks/cron — requiere setup de Edge Functions en dashboard Supabase + deploy pipeline
- [ ] **FUTURO** — Segundo cluster BD (Neon/Railway) para analytics y reporting

### 7.5 Cloudflare optimization

- [ ] **P2** — CF Workers Paid plan (30ms CPU, 128MB memory)
- [ ] **P2** — Cloudflare R2 para archivos grandes (PDFs, exports, backups)
- [~] **P3** — ~~DEFERRED~~ CF Durable Objects para estado compartido — requiere CF Workers Paid plan + Durable Objects binding
- [~] **P3** — ~~DEFERRED~~ CF D1 como cache edge database — requiere CF D1 setup + binding configuration
- [ ] **P2** — CF KV para feature flags y config (sub-ms reads from edge)
- [ ] **P2** — CF Queues para job processing distribuido
- [ ] **FUTURO** — CF Analytics Engine para métricas custom sin impacto en BD

### 7.6 Red y CDN

- [ ] **P2** — CDN cache rules por tipo: HTML (5min SWR), API (vary by auth), images (30d), fonts (1y)
- [ ] **P2** — Compresión Brotli verificada en CF para todos los content types
- [ ] **P2** — HTTP/3 habilitado verificar
- [ ] **P2** — Early Hints (103) para precargar CSS/fuentes
- [ ] **P2** — `Vary: Accept-Encoding, Accept-Language` correcto

### 7.7 Monitoring y observability

- [ ] **P1** — APM: Sentry Performance o Datadog
- [ ] **P1** — Request tracing E2E: client → CF → Nuxt → Supabase → response
- [ ] **P2** — Database slow query log con alerting (>500ms)
- [ ] **P1** — Error rate monitoring con alerting automático (>0.5% → Slack)
- [ ] **P1** — Uptime monitoring con health checks cada 30s desde múltiples regiones
- [ ] **P2** — Custom metrics: req/s por endpoint, p50/p95/p99 latency, cache hit ratio
- [ ] **P2** — Dashboard operacional (Grafana o CF Analytics)
- [ ] **P2** — Capacity planning: alertar al 70% de cualquier límite
- [x] — Correlation IDs E2E (ya implementado: request-id + correlation-id)

### 7.8 Resilience

- [x] **P1** — Circuit breaker en servicios externos (Stripe, AI, Cloudinary, WhatsApp) ✓ (sesión XX: server/utils/circuitBreaker.ts — CLOSED/OPEN/HALF_OPEN, 21 tests; integrado en aiProvider.ts)
- [x] **P2** — Fallback graceful: si AI down, publicación manual sin AI description ✓ (sesión actual: generate-description.post.ts — catch devuelve { description: '', aiUnavailable: true } en lugar de throw 500; logger.warn; i18n aiUnavailableWarning ES+EN; 8 tests)
- [x] **P2** — Si Supabase slow, servir cached content con banner "datos pueden no estar actualizados" ✓ (useStaleFallback.ts: stale-while-revalidate con sessionStorage cache, timeout configurable, isStale flag; UiStaleBanner.vue: warning banner con retry; i18n staleDataWarning ES+EN)
- [x] **P3** — Load testing mensual con k6 (configurado, establecer cadencia) ✓ (sesión XXVI: k6-readiness.yml — monthly cron '0 6 1 \* \*' + stress option + load scenario for monthly runs)
- [ ] **FUTURO** — Chaos engineering: simular fallos y verificar degradación
- [ ] **FUTURO** — Auto-scaling de workers (Fly.io, Railway)
- [x] **P2** — Control de concurrencia y backpressure en API endpoints ✓ (server/utils/concurrency.ts: Semaphore class, withBackpressure wrapper con maxConcurrency+maxQueue, batchProcess helper, getBackpressureStats monitoring; 503 rejection cuando cola excede max)
- [x] **P2** — Particionado de crons y ventanas de ejecución (no solapar heavy jobs) ✓ (server/utils/cronSchedule.ts: CRON_SCHEDULE con 18 jobs particionados en windows :00/:15/:30/:45; weights heavy/medium/light; acquireCronLock/releaseCronLock para serializar heavy jobs; maxDurationSec documentado)

### 7.9 Datos a escala

- [ ] **FUTURO** — CQRS: separar writes (primary) de reads (replicas/cache)
- [ ] **FUTURO** — Event-driven architecture: cambios como eventos, consumers actualizan materialized views
- [ ] **FUTURO** — Analytics pipeline: exportar a BigQuery/ClickHouse para análisis pesado
- [ ] **FUTURO** — CDN-level personalization: CF Workers sirviendo contenido personalizado desde edge
- [ ] **FUTURO** — Protección anti-bot avanzada en rutas calientes (ML-based)

### 7.10 Operaciones a escala (de otra AI — validados)

- [ ] **FUTURO** — Capacity plan por hitos de tráfico y coste
- [ ] **FUTURO** — Stress tests realistas por escenarios de pico
- [ ] **FUTURO** — Simulación de fallos de proveedor y fallback probado
- [ ] **FUTURO** — Objetivos 99.9%+ y reporting mensual SLO
- [ ] **FUTURO** — Revisión de costes por unidad de tráfico/conversión
- [ ] **FUTURO** — Gobernanza de cambios: release canary + rollback inmediato
- [ ] **FUTURO** — Juegos de guerra (drills) de incidentes trimestrales
- [~] — Plan de continuidad operativa (`DISASTER-RECOVERY.md` existe, falta ejecutar drills)
- [~] — SLOs definidos (en MEMORY.md, sin reporting automático)
- [x] — k6 load tests configurados con escenarios smoke/load/peak

---

## NÚMEROS TOTALES

| Prioridad                      | Count            |
| ------------------------------ | ---------------- |
| **P0** (antes de lanzamiento)  | 1                |
| **P1** (primeras semanas)      | ~45              |
| **P2** (primer trimestre)      | ~140             |
| **P3** (con equipo/tiempo)     | ~55              |
| **FUTURO** (con escala/equipo) | ~40              |
| **Ya hecho [x]**               | ~20 (referencia) |
| **Parcial [~]**                | ~25              |
| **TOTAL items accionables**    | **~280**         |

### Orden de ejecución recomendado

```
Fase 0 — ANTES DE LANZAR (1-2 semanas)
├── P0: CF WAF rules
├── P1 seguridad: body size limits, Zod en todos POST, login rate limiting
├── P1 velocidad: NuxtImage en catálogo, skeleton loaders
└── P1 UX: toast system, breadcrumbs, focus-visible, px→rem

Fase 1 — POST-LANZAMIENTO INMEDIATO (mes 1)
├── P1 escalabilidad: Redis/Upstash, background workers, circuit breakers
├── P1 monitoring: APM, error rate alerting, uptime checks
├── P1 vertical: auditar hardcoded refs, seed data, playbook
└── P1 i18n: auditar strings, market reports multilenguaje

Fase 2 — TRIMESTRE 1 (meses 2-3)
├── P2 seguridad: CSP nonce, 2FA, RBAC, IDOR tests completos
├── P2 velocidad: edge caching, SW precaching, query optimization
├── P2 UX: optimistic UI, confirmaciones, accessibility axe-core
├── P2 features: chat real-time, embudos, dealer analytics
└── P2 modulabilidad: unificar endpoints, repository pattern, typed events

Fase 3 — TRIMESTRE 2+ (meses 4-6)
├── P3 seguridad: PII encryption, geo-blocking, chaos testing
├── P3 velocidad: critical CSS, cursor pagination
├── P3 features: ML recommendations, mapa, multi-user dealers
└── P3 escalabilidad: DB partitioning, CF Durable Objects

Fase 4 — CON ESCALA/EQUIPO (6+ meses, tráfico real)
├── FUTURO: CQRS, event-driven, analytics pipeline
├── FUTURO: Storybook, visual regression, monorepo
├── FUTURO: capacity planning, canary releases, chaos engineering
└── FUTURO: search engine dedicado, CDN personalization
```
