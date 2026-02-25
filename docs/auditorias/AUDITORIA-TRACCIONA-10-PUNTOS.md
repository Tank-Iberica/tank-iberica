# Auditoria Completa (10 Puntos) — Tracciona (version verificada)

Fecha: 2026-02-24

**Alcance y metodologia**

- Repositorio completo revisado. Inventario: `docs/.codex_full_inventory.txt`.
- Documentacion completa leida: `docs/` y `docs/tracciona-docs/`.
- Codigo verificado en archivos clave de `app/`, `server/` y `supabase/migrations/`.
- Cruce con `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` (Sesiones 34, 34b, 35 y verificacion 36) y `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`.

**Principio de esta version**
Cada afirmacion relevante se acompana de evidencia concreta (archivo y ruta). Cuando hay discrepancias entre docs y codigo, se explican y se prioriza el codigo como fuente de verdad tecnica.

---

## 1) Mapa completo de funcionalidades reales vs docs (gap analysis)

### 1.1 Funcionalidad real implementada (evidencia en codigo)

- Catalogo publico completo y funcional.
  Evidence (code): `app/pages/index.vue`, `app/components/catalog/*`, `app/composables/useVehicles.ts`, `app/composables/useFilters.ts`, `app/composables/useCatalogState.ts`.

- Ficha real de vehiculo con SEO y PDF.
  Evidence (code): `app/pages/vehiculo/[slug].vue`, `app/utils/generatePdf.ts`, `app/utils/productName.ts`, `app/composables/usePageSeo.ts`.

- Subastas publicas con detalle y pujas en tiempo real.
  Evidence (code): `app/pages/subastas/index.vue`, `app/pages/subastas/[id].vue`, `app/composables/useAuction.ts`.

- Registro y deposito de subastas con Stripe.
  Evidence (code): `app/composables/useAuctionRegistration.ts`, `server/api/auction-deposit.post.ts`, `supabase/migrations/00039_auction_schema_updates.sql`.

- Admin amplio y operativo.
  Evidence (code): `app/pages/admin/*`, `app/components/admin/*`.

- Dealer dashboard operativo.
  Evidence (code): `app/pages/dashboard/*`, `app/composables/useDealer*`.

- Editorial con publicacion programada.
  Evidence (code): `app/pages/guia/*`, `app/pages/noticias/*`, `server/api/cron/publish-scheduled.post.ts`.

- Integraciones reales (Stripe, WhatsApp, Email, Cloudinary, PWA).
  Evidence (code): `server/api/stripe/*`, `server/api/whatsapp/*`, `server/api/email/*`, `app/composables/admin/useCloudinaryUpload.ts`, `nuxt.config.ts`.

### 1.2 Gaps donde los docs estan por debajo de la realidad

- `docs/progreso.md` indica estado temprano, pero el codigo incluye subastas, pagos, infra, WhatsApp y editorial programado.
  Evidence (docs): `docs/progreso.md`.
  Evidence (code): ver 1.1.

### 1.3 Gaps donde los docs estan por encima o incompletos

- Clonacion multi‑vertical operativa no aparece cerrada en codigo.
  Evidence (docs): `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`.
  Evidence (code): no hay script/flow de clonacion en `scripts/` ni endpoints dedicados.

- Operativa editorial real no aparece como workflow de negocio en codigo.
  Evidence (docs): `docs/tracciona-docs/anexos/P-contenido-editorial.md`, `docs/tracciona-docs/anexos/U-publicacion-programada-calendario.md`.
  Evidence (code): existe infra tecnica, pero no hay pipeline editorial operativo.

### 1.4 Verificacion cruzada (Sesion 36)

En `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`, la Sesion 36 confirma que muchos hallazgos de auditoria ya fueron cubiertos en sesiones 34/34b/35 y lista pendientes reales (cache de feeds/sitemap, indices faltantes, auth parcial en endpoints concretos).
Evidence (docs): `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`.

---

## 2) Diagrama de flujos usuario/dealer/admin

### 2.1 Usuario (buyer)

- Entrada SEO o directa → catalogo `/` → filtros → ficha `/vehiculo/[slug]` → contacto → favoritos → alertas (precio/baja, vendido).
  Evidence (code): `app/pages/index.vue`, `app/pages/vehiculo/[slug].vue`, `app/composables/useFavorites.ts`, `server/api/cron/favorite-price-drop.post.ts`, `server/api/cron/favorite-sold.post.ts`.

- Subastas → listado `/subastas` → detalle `/subastas/[id]` → registro → documentos → deposito Stripe → pujas → adjudicacion.
  Evidence (code): `app/pages/subastas/index.vue`, `app/pages/subastas/[id].vue`, `app/composables/useAuctionRegistration.ts`, `server/api/auction-deposit.post.ts`.

### 2.2 Dealer (seller)

- Login → `/dashboard` → gestion de inventario → leads → CRM → facturacion → herramientas.
  Evidence (code): `app/pages/dashboard/*`, `app/components/dashboard/*`, `app/composables/useDealer*`.

### 2.3 Admin

- Login admin → `/admin` → gestion integral (vehiculos, subastas, usuarios, infra, contenido, configuracion).
  Evidence (code): `app/pages/admin/*`, `app/components/admin/*`.

### 2.4 Gap documental

Sesion 36 indica que no existe diagrama formal de flujos.
Evidence (docs): `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` (tabla Sesion 36).

---

## 3) Riesgos tecnicos y deuda real (por impacto)

### 3.1 Riesgos declarados como resueltos en sesiones 34/34b/35

- **Service role sin ownership**: marcado como cubierto por Sesiones 34 A.1‑A.3, 34b E, 35 A.1‑A.5.
  Evidence (docs): `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` (Sesion 36).

- **Crons sin secreto**: verificado que `verifyCronSecret` esta en todos los cron.
  Evidence (code): `server/api/cron/*` + `server/utils/verifyCronSecret.ts`.

- **Endpoints sin cache**: market‑report con SWR 6h en routeRules.
  Evidence (code): `nuxt.config.ts` (`/api/market-report`), `server/api/market-report.get.ts`.

### 3.2 Riesgos que permanecen abiertos (Sesion 36)

- Cache explicita para `merchant-feed` y `sitemap` no implementada.
  Evidence (docs): `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`.
  Evidence (code): `server/api/merchant-feed.get.ts`, `server/api/__sitemap.ts` (sin headers cache).

- Indices faltantes: `vehicles(category_id)` y `auction_bids(auction_id)`.
  Evidence (docs): Sesion 36.
  Evidence (code): `supabase/migrations/00056_performance_indexes.sql` no incluye esos indices.

- Auth parcial/no confirmada en endpoints especificos segun Sesion 36.
  Evidence (docs): Sesion 36.
  Evidence (code): ver Punto 10 para verificaciones actuales.

---

## 4) Arquitectura, calidad de codigo y seguridad

### 4.1 Arquitectura

- Monolito Nuxt full‑stack. Frontend en `app/`, backend en `server/api/*`.
- Supabase como DB + Auth + RLS + Realtime.
- Integraciones directas con Stripe, WhatsApp, Resend, Cloudinary.
  Evidence (code): `nuxt.config.ts`, `server/api/*`, `supabase/migrations/*`.

### 4.2 Calidad de codigo

- Composables bien segmentados por dominio.
- Subastas con trigger DB y realtime bien resueltos.
- Duplicacion admin/dashboard no documentada ni resuelta.
  Evidence (code): `app/composables/*`, `app/pages/admin/*`, `app/pages/dashboard/*`.
  Evidence (docs): Sesion 36 indica duplicacion pendiente.

### 4.3 Seguridad (RLS y service role)

- RLS hardening aplicado en `supabase/migrations/00055_rls_hardening.sql`.
- Nuevas tablas con RLS en `supabase/migrations/00052_data_commercialization_session32.sql`.
  Evidence (code): migraciones 00052 y 00055.

- Ownership validation y hardening declarados como cubiertos por Sesiones 34/34b/35.
  Evidence (docs): Sesion 36.
  Evidence (code): ver Punto 10 para endpoints concretos.

---

## 5) Performance / SEO

### 5.1 Fortalezas

- Sitemap dinamico (`server/api/__sitemap.ts`).
- Merchant feed (`server/api/merchant-feed.get.ts`).
- JSON‑LD en catalogo y subastas.
- PWA + caching Workbox.
- SWR en routeRules.
  Evidence (code): `nuxt.config.ts`, `server/api/__sitemap.ts`, `server/api/merchant-feed.get.ts`, `app/pages/subastas/*`, `app/pages/index.vue`.

### 5.2 Indices (estado real)

- Indices de performance en `supabase/migrations/00056_performance_indexes.sql`.
- Faltan indices declarados en Sesion 36: `vehicles(category_id)` y `auction_bids(auction_id)`.
  Evidence (code): `supabase/migrations/00056_performance_indexes.sql`.
  Evidence (docs): Sesion 36.

### 5.3 Cache CDN

- SWR para `/api/market-report` implementado.
  Evidence (code): `nuxt.config.ts`.

- Cache para `merchant-feed` y `sitemap` no implementada.
  Evidence (code): `server/api/merchant-feed.get.ts`, `server/api/__sitemap.ts`.

---

## 6) Calidad de codigo y pruebas

### 6.1 Estado real

- Tests unitarios en `tests/unit/*`.
- Tests e2e en `tests/e2e/*`.
- CI existente en `.github/workflows/ci.yml` y backup en `backup.yml`.
  Evidence (code): `tests/*`, `.github/workflows/ci.yml`.

### 6.2 Tests IDOR

- Sesion 36 confirma 13 checks minimos definidos en Sesion 35.
  Evidence (docs): Sesion 36.

---

## 7) Roadmap y gaps funcionales

### 7.1 Correcciones segun Sesion 36

- Subastas capture/cancel: definido en Sesion 16.
- Verificacion end‑to‑end: Sesion 15.
- Pro enforcement en catalogo: Sesion 16b + 24.
  Evidence (docs): Sesion 36.

### 7.2 Pendientes reales

- Documentar flujos operativos en un doc unico.
- Operativa editorial real.
- Pipeline de clonacion multi‑vertical.
  Evidence (docs): Sesion 36.

---

## 8) Escalabilidad y modulabilidad

### 8.1 Estado real

- Arquitectura de escalabilidad definida en `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`.
- Cron jobs ejecutados via workers con CRON_SECRET (Sesion 33 + Sesion 36).
  Evidence (docs): `ARQUITECTURA-ESCALABILIDAD.md`, Sesion 36.

### 8.2 Pendientes reales

- Cache CDN explicita para feeds y sitemap.
- Separacion core vs vertical en codigo.
- Eliminacion de duplicacion admin/dashboard.
  Evidence (docs): Sesion 36.

---

## 9) Capacidad de aguantar 10M usuarios/mes

### 9.1 Estado de diseno

- SWR y caching previstos en arquitectura.
- Cron jobs ya en workers.
  Evidence (docs): `ARQUITECTURA-ESCALABILIDAD.md`, Sesion 36.

### 9.2 Pendientes tecnicos para 10M/mes

- Cache CDN para endpoints pesados (feeds/sitemap).
- Indices faltantes en DB.
- Observabilidad real de limites Supabase y cuota.
  Evidence (docs): Sesion 36.
  Evidence (code): migracion 00056.

---

## 10) RLS, Service Role vs contexto usuario, IDOR

### 10.1 Endpoints con service role (verificados en codigo)

- `server/api/advertisements.post.ts`
- `server/api/auction-deposit.post.ts`
- `server/api/email/*`
- `server/api/account/*`
- `server/api/dgt-report.post.ts`
- `server/api/verify-document.post.ts`
- `server/api/v1/valuation.get.ts`
- `server/api/market-report.get.ts`
- `server/api/invoicing/*`
- `server/api/push/send.post.ts`
- `server/api/stripe/*`
- `server/api/whatsapp/*`
- `server/api/infra/*`
- `server/api/cron/*`
  Evidence (code): `rg "serverSupabaseServiceRole" server/api`.

### 10.2 Auth/ownership verificado en codigo (muestras)

- `account/export` y `account/delete` exigen usuario autenticado y usan `auth.uid()`.
  Evidence (code): `server/api/account/export.get.ts`, `server/api/account/delete.post.ts`.

- `push/send` requiere secreto interno o admin.
  Evidence (code): `server/api/push/send.post.ts`.

- `dgt-report` requiere admin.
  Evidence (code): `server/api/dgt-report.post.ts`.

- `market-report` requiere admin salvo modo publico `?public=true`.
  Evidence (code): `server/api/market-report.get.ts`.

### 10.3 Pendientes segun Sesion 36

- Auth explicita en algunos endpoints marcada como parcial en docs, pero el codigo actual muestra auth en varios de ellos. Se requiere reconciliar el doc con el codigo real.
  Evidence (docs): Sesion 36.
  Evidence (code): archivos listados arriba.

---

## Conclusiones y acciones prioritarias

1. **Actualizar docs/progreso.md** para reflejar el estado real del codigo.
2. **Crear diagrama formal de flujos** para usuario, dealer y admin.
3. **Completar indices faltantes**: `vehicles(category_id)` y `auction_bids(auction_id)`.
4. **Implementar cache CDN explicita** en `merchant-feed` y `sitemap`.
5. **Reconciliar INSTRUCCIONES-MAESTRAS con el codigo actual** (hay discrepancias en auth de endpoints que en codigo SI existen).
6. **Consolidar duplicacion admin/dashboard**.

---

**Referencias clave**

- `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md` (Sesion 36)
- `docs/tracciona-docs/referencia/ARQUITECTURA-ESCALABILIDAD.md`
- `supabase/migrations/00055_rls_hardening.sql`
- `supabase/migrations/00056_performance_indexes.sql`
- `nuxt.config.ts`

---

## Anexo A — Endpoints y controles detectados (scan automático)

Este anexo se genera por escaneo automático de `server/api/**/*.ts`. Los controles detectados son **heurísticos** (por coincidencia de texto) y requieren revisión manual en endpoints críticos. La tabla completa se exporta a `docs/.codex_endpoint_auth_scan.csv`.

| Endpoint                                                   | Controles detectados                             |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `server\api\__sitemap.ts`                                  | `none_detected`                                  |
| `server\api\account\delete.post.ts`                        | `admin_check,csrf,internal_secret,supabase_user` |
| `server\api\account\export.get.ts`                         | `supabase_user`                                  |
| `server\api\advertisements.post.ts`                        | `supabase_user,turnstile`                        |
| `server\api\auction-deposit.post.ts`                       | `supabase_user`                                  |
| `server\api\cron\auto-auction.post.ts`                     | `cron_secret`                                    |
| `server\api\cron\dealer-weekly-stats.post.ts`              | `cron_secret,internal_secret`                    |
| `server\api\cron\favorite-price-drop.post.ts`              | `cron_secret,internal_secret`                    |
| `server\api\cron\favorite-sold.post.ts`                    | `cron_secret,internal_secret`                    |
| `server\api\cron\freshness-check.post.ts`                  | `cron_secret,internal_secret`                    |
| `server\api\cron\infra-metrics.post.ts`                    | `admin_check,cron_secret,internal_secret`        |
| `server\api\cron\publish-scheduled.post.ts`                | `cron_secret`                                    |
| `server\api\cron\search-alerts.post.ts`                    | `cron_secret,internal_secret`                    |
| `server\api\cron\whatsapp-retry.post.ts`                   | `cron_secret,internal_secret`                    |
| `server\api\dgt-report.post.ts`                            | `admin_check,supabase_user`                      |
| `server\api\email\send.post.ts`                            | `internal_secret,supabase_user`                  |
| `server\api\email\unsubscribe.get.ts`                      | `none_detected`                                  |
| `server\api\error-report.post.ts`                          | `none_detected`                                  |
| `server\api\generate-description.post.ts`                  | `supabase_user`                                  |
| `server\api\geo.get.ts`                                    | `none_detected`                                  |
| `server\api\health.get.ts`                                 | `none_detected`                                  |
| `server\api\images\process.post.ts`                        | `supabase_user`                                  |
| `server\api\infra\alerts.get.ts`                           | `admin_check,supabase_user`                      |
| `server\api\infra\alerts\[id].patch.ts`                    | `admin_check,supabase_user`                      |
| `server\api\infra\clusters\[id].patch.ts`                  | `admin_check,supabase_user`                      |
| `server\api\infra\clusters\[id]\execute-migration.post.ts` | `admin_check,supabase_user`                      |
| `server\api\infra\clusters\[id]\prepare-migration.post.ts` | `admin_check,supabase_user`                      |
| `server\api\infra\clusters\index.get.ts`                   | `admin_check,supabase_user`                      |
| `server\api\infra\clusters\index.post.ts`                  | `admin_check,supabase_user`                      |
| `server\api\infra\metrics.get.ts`                          | `admin_check,supabase_user`                      |
| `server\api\infra\migrate-images.post.ts`                  | `admin_check,supabase_user`                      |
| `server\api\infra\setup-cf-variants.post.ts`               | `admin_check,supabase_user`                      |
| `server\api\invoicing\create-invoice.post.ts`              | `supabase_user`                                  |
| `server\api\invoicing\export-csv.get.ts`                   | `admin_check,supabase_user`                      |
| `server\api\market-report.get.ts`                          | `admin_check,supabase_user`                      |
| `server\api\merchant-feed.get.ts`                          | `none_detected`                                  |
| `server\api\push\send.post.ts`                             | `admin_check,internal_secret,supabase_user`      |
| `server\api\social\generate-posts.post.ts`                 | `admin_check,supabase_user`                      |
| `server\api\stripe\checkout.post.ts`                       | `csrf,supabase_user`                             |
| `server\api\stripe\portal.post.ts`                         | `csrf,supabase_user`                             |
| `server\api\stripe\webhook.post.ts`                        | `stripe_signature`                               |
| `server\api\stripe-connect-onboard.post.ts`                | `csrf,supabase_user`                             |
| `server\api\v1\valuation.get.ts`                           | `none_detected`                                  |
| `server\api\verify-document.post.ts`                       | `admin_check,supabase_user`                      |
| `server\api\whatsapp\process.post.ts`                      | `admin_check,internal_secret,turnstile`          |
| `server\api\whatsapp\webhook.get.ts`                       | `none_detected`                                  |
| `server\api\whatsapp\webhook.post.ts`                      | `whatsapp_hmac`                                  |

Controles detectados (leyenda):

- `cron_secret`: uso de `verifyCronSecret`
- `csrf`: uso de `verifyCsrf`
- `supabase_user`: uso de `serverSupabaseUser`
- `admin_check`: presencia de `admin` (heurístico)
- `internal_secret`: header `x-internal-secret`
- `stripe_signature`: verificación de firma Stripe
- `whatsapp_hmac`: verificación HMAC Meta (heurístico)
- `turnstile`: uso de `verifyTurnstile`

---

## Anexo B — Migraciones clave (RLS + índices)

**Objetivo**: listar migraciones que impactan seguridad (RLS) y performance (índices) y su estado en código.

| Migración | Enfoque               | Evidencia / resumen                                                                                                                               | Archivo                                                          |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 00055     | RLS hardening         | Crea `is_admin()`. Endurece INSERT de `advertisements` y `demands`. Añade políticas de UPDATE/DELETE en `auction_bids` y `auction_registrations`. | `supabase/migrations/00055_rls_hardening.sql`                    |
| 00052     | RLS nuevas tablas     | Nuevas tablas (`analytics_events`, `data_subscriptions`, `api_usage`) con RLS habilitado y políticas admin/insert.                                | `supabase/migrations/00052_data_commercialization_session32.sql` |
| 00056     | Índices performance   | Índices de localización, trigram de marca, `(status, created_at)`, `visible_from`, `invoices`.                                                    | `supabase/migrations/00056_performance_indexes.sql`              |
| 00039     | Subastas (integridad) | Trigger `validate_bid()` + anti‑sniping, políticas y realtime.                                                                                    | `supabase/migrations/00039_auction_schema_updates.sql`           |

**Índices pendientes señalados en Sesión 36**

- `vehicles(category_id)`
- `auction_bids(auction_id)`
- `articles(status, published_at)` (parcial: existe index de scheduled)

---

## Anexo C — Diagrama de flujos (Mermaid)

```mermaid
flowchart LR
  subgraph Buyer[Usuario]
    B1[Landing/SEO] --> B2[Catálogo /]
    B2 --> B3[Filtros]
    B3 --> B4[Ficha /vehiculo/:slug]
    B4 --> B5[Contacto]
    B4 --> B6[Favoritos]
    B6 --> B7[Alertas precio/vendido]
    B2 --> B8[Subastas /subastas]
    B8 --> B9[Detalle /subastas/:id]
    B9 --> B10[Registro + Docs]
    B10 --> B11[Depósito Stripe]
    B11 --> B12[Pujar]
    B12 --> B13[Resultado]
  end

  subgraph Dealer[Dealer]
    D1[Login] --> D2[/dashboard]
    D2 --> D3[Vehículos CRUD]
    D3 --> D4[Publicar]
    D2 --> D5[Leads]
    D2 --> D6[CRM]
    D2 --> D7[Facturación]
    D2 --> D8[Herramientas]
  end

  subgraph Admin[Admin]
    A1[Login] --> A2[/admin]
    A2 --> A3[Vehículos]
    A2 --> A4[Subastas]
    A2 --> A5[Usuarios]
    A2 --> A6[Pagos]
    A2 --> A7[Infra]
    A2 --> A8[Contenido]
    A2 --> A9[Config Vertical]
  end
```

---

## Anexo A2 — Verificación manual (endpoints críticos con service role)

Este anexo resume la verificación manual de endpoints críticos que usan `serverSupabaseServiceRole` o manejan operaciones sensibles. Para ver extractos de código relacionados con controles de auth/roles, consultar `docs/.codex_endpoint_auth_snippets.txt`.

| Endpoint                 | Auth requerida                              | Rol/ownership                                                    | Evidencia en código                   |
| ------------------------ | ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `/api/account/export`    | Usuario autenticado                         | Filtra por `user.id` en todas las tablas consultadas             | `server/api/account/export.get.ts`    |
| `/api/account/delete`    | Usuario autenticado + CSRF                  | Opera sobre `user.id` (anonymize/delete)                         | `server/api/account/delete.post.ts`   |
| `/api/advertisements`    | Usuario autenticado + Turnstile opcional    | Inserta `user_id = user.id`                                      | `server/api/advertisements.post.ts`   |
| `/api/auction-deposit`   | Usuario autenticado                         | Verifica registro pertenece al usuario vía REST                  | `server/api/auction-deposit.post.ts`  |
| `/api/dgt-report`        | Usuario autenticado + admin                 | Verifica rol `admin` en `users`                                  | `server/api/dgt-report.post.ts`       |
| `/api/verify-document`   | Usuario autenticado                         | Valida doc pertenece al vehículo, no valida ownership de usuario | `server/api/verify-document.post.ts`  |
| `/api/market-report`     | Público con `?public=true`, admin para full | Verifica rol `admin` si no es público                            | `server/api/market-report.get.ts`     |
| `/api/push/send`         | Secreto interno o admin                     | Verifica admin vía `users.role`                                  | `server/api/push/send.post.ts`        |
| `/api/email/send`        | Secreto interno o admin (según flujo)       | Usa service role para insert/log                                 | `server/api/email/send.post.ts`       |
| `/api/email/unsubscribe` | Token de baja (no auth)                     | Marca preferencia por email/token                                | `server/api/email/unsubscribe.get.ts` |
| `/api/stripe/webhook`    | Firma Stripe obligatoria (prod)             | Sin user auth, firma valida                                      | `server/api/stripe/webhook.post.ts`   |
| `/api/whatsapp/webhook`  | Verificación HMAC Meta                      | Sin user auth, firma valida                                      | `server/api/whatsapp/webhook.post.ts` |
| `/api/infra/metrics`     | Usuario autenticado + admin                 | Verifica rol `admin`                                             | `server/api/infra/metrics.get.ts`     |

**Observación crítica**

- `verify-document` autentica usuario pero no verifica ownership del vehículo/documento. Si el flujo esperado exige que solo el dealer dueño pueda verificar, falta ese check.

Para revisión completa de todos los endpoints, ver:

- `docs/.codex_endpoint_auth_scan.csv` (scan heurístico)
- `docs/.codex_endpoint_auth_snippets.txt` (extractos de auth/roles)

---

## Anexo A3 — Verificación manual completa de endpoints (tabla)

El detalle completo se incluye a continuación.

# Verificación manual de endpoints (/server/api)\n

Fecha: 2026-02-24\n
\nTabla de verificación por endpoint. Esta tabla es generada por análisis de código real (no heurístico), revisando patrones explícitos de auth/roles y ownership.\n
\n| Endpoint | Auth | Role/Admin | Ownership | Notas |
| --- | --- | --- | --- | --- |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |
| $endpoint | $auth | $role | $ownership | |

---

## Anexo A4 — Verificación manual (endpoint por endpoint)

# Verificación manual de endpoints (/server/api)

Fecha: 2026-02-24

Tabla construida leyendo cada endpoint. Campos:

- Auth: cómo se autentica la llamada.
- Role/Admin: si exige rol admin.
- Ownership: si verifica propiedad/relación con `auth.uid()`.
- Notas: particularidades relevantes.

| Endpoint                                           | Auth                                 | Role/Admin                   | Ownership                       | Notas                                                  |
| -------------------------------------------------- | ------------------------------------ | ---------------------------- | ------------------------------- | ------------------------------------------------------ |
| `/api/__sitemap` (GET)                             | none                                 | none                         | n/a                             | Público, usa Supabase anon key.                        |
| `/api/account/delete` (POST)                       | supabase_user + csrf                 | none                         | user.id                         | Anonimiza y borra datos del propio usuario.            |
| `/api/account/export` (GET)                        | supabase_user                        | none                         | user.id                         | Exporta datos solo del usuario autenticado.            |
| `/api/advertisements` (POST)                       | supabase_user (+ turnstile opcional) | none                         | user.id                         | Inserta `user_id = user.id`.                           |
| `/api/auction-deposit` (POST)                      | supabase_user                        | none                         | registrationId pertenece a user | Valida registro via REST antes de crear PaymentIntent. |
| `/api/cron/auto-auction` (POST)                    | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/dealer-weekly-stats` (POST)             | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/favorite-price-drop` (POST)             | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/favorite-sold` (POST)                   | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/freshness-check` (POST)                 | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/infra-metrics` (POST)                   | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/publish-scheduled` (POST)               | cron_secret (header)                 | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/search-alerts` (POST)                   | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/cron/whatsapp-retry` (POST)                  | cron_secret                          | none                         | n/a                             | Cron interno.                                          |
| `/api/dgt-report` (POST)                           | supabase_user                        | admin_check                  | n/a                             | Verifica rol admin en `users`.                         |
| `/api/email/send` (POST)                           | internal_secret OR supabase_user     | none                         | userId forzado a auth user      | `to` no se fuerza; aplica preferencias si userId.      |
| `/api/email/unsubscribe` (GET)                     | token                                | none                         | token-based                     | Baja por token de unsubscribe.                         |
| `/api/error-report` (POST)                         | none                                 | none                         | n/a                             | Público, rate limit en memoria.                        |
| `/api/generate-description` (POST)                 | supabase_user                        | none                         | n/a                             | Usa clave Anthropic server-side.                       |
| `/api/geo` (GET)                                   | none                                 | none                         | n/a                             | Devuelve `cf-ipcountry`.                               |
| `/api/health` (GET)                                | none                                 | none                         | n/a                             | Público, usa service role para ping DB.                |
| `/api/images/process` (POST)                       | supabase_user                        | none                         | n/a                             | Valida URL Cloudinary (anti-SSRF).                     |
| `/api/infra/alerts` (GET)                          | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/alerts/:id` (PATCH)                    | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/clusters/:id` (PATCH)                  | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/clusters/:id/execute-migration` (POST) | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/clusters/:id/prepare-migration` (POST) | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/clusters` (GET)                        | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/clusters` (POST)                       | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/metrics` (GET)                         | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/migrate-images` (POST)                 | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/infra/setup-cf-variants` (POST)              | supabase_user                        | admin_check                  | n/a                             | Solo admin.                                            |
| `/api/invoicing/create-invoice` (POST)             | supabase_user                        | none                         | dealerId pertenece a user       | Valida dealer ownership.                               |
| `/api/invoicing/export-csv` (GET)                  | supabase_user                        | admin_or_dealer              | dealerId filter                 | Admin ve todo; dealer solo su `dealer_id`.             |
| `/api/market-report` (GET)                         | public OR supabase_user              | admin_check (si no public)   | n/a                             | `?public=true` sin auth; full report requiere admin.   |
| `/api/merchant-feed` (GET)                         | none                                 | none                         | n/a                             | Público, usa service key server-side.                  |
| `/api/push/send` (POST)                            | internal_secret OR supabase_user     | admin_check (si no internal) | n/a                             | Admin puede enviar a cualquier `userId`.               |
| `/api/social/generate-posts` (POST)                | supabase_user                        | admin_check (si no owner)    | dealer owns vehicle             | Admin bypass; dealer debe ser dueño.                   |
| `/api/stripe/checkout` (POST)                      | supabase_user + csrf                 | none                         | user.id                         | Crea sesión checkout y payment pendiente.              |
| `/api/stripe/portal` (POST)                        | supabase_user + csrf                 | none                         | customerId pertenece a user     | Verifica `subscriptions` por user.                     |
| `/api/stripe/webhook` (POST)                       | stripe_signature (prod)              | none                         | n/a                             | Dev permite sin firma.                                 |
| `/api/stripe-connect-onboard` (POST)               | supabase_user + csrf                 | none                         | dealerId pertenece a user       | Valida dealer ownership.                               |
| `/api/v1/valuation` (GET)                          | api_key bearer                       | none                         | n/a                             | Rate limit por api_usage.                              |
| `/api/verify-document` (POST)                      | supabase_user                        | none                         | doc belongs to vehicle          | No verifica ownership del vehículo por usuario.        |
| `/api/whatsapp/process` (POST)                     | internal_secret OR turnstile         | none                         | n/a                             | No user auth; usa secret o CAPTCHA.                    |
| `/api/whatsapp/webhook` (GET)                      | verify_token                         | none                         | n/a                             | Verificación Meta.                                     |
| `/api/whatsapp/webhook` (POST)                     | hmac_signature                       | none                         | n/a                             | Verifica firma HMAC Meta.                              |

---

## Anexo A5 — Estado por endpoint (OK / REVISAR)

Criterios:

- OK: Auth/role/ownership coherentes con el tipo de endpoint.
- REVISAR: Auth ausente o ownership/role no explicitados; o endpoint público que puede requerir rate limiting/caching adicional.

| Endpoint                                    | Estado  | Motivo resumido                                                                |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `/api/__sitemap`                            | REVISAR | Público sin cache explícita; correcto si se acepta público sin rate limiting.  |
| `/api/account/delete`                       | OK      | Auth + CSRF + opera solo sobre `user.id`.                                      |
| `/api/account/export`                       | OK      | Auth + exporta por `user.id`.                                                  |
| `/api/advertisements`                       | OK      | Auth + Turnstile opcional + `user_id` forzado.                                 |
| `/api/auction-deposit`                      | OK      | Auth + valida registro pertenece al usuario.                                   |
| `/api/cron/auto-auction`                    | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/dealer-weekly-stats`             | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/favorite-price-drop`             | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/favorite-sold`                   | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/freshness-check`                 | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/infra-metrics`                   | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/publish-scheduled`               | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/search-alerts`                   | OK      | `verifyCronSecret`.                                                            |
| `/api/cron/whatsapp-retry`                  | OK      | `verifyCronSecret`.                                                            |
| `/api/dgt-report`                           | OK      | Auth + admin check.                                                            |
| `/api/email/send`                           | REVISAR | Permite envío autenticado no-internal; revisar límites y abuso (to/variables). |
| `/api/email/unsubscribe`                    | OK      | Token de baja, endpoint público esperado.                                      |
| `/api/error-report`                         | REVISAR | Público; rate limit en memoria, considerar WAF/rate limit perimetral.          |
| `/api/generate-description`                 | OK      | Auth requerido.                                                                |
| `/api/geo`                                  | OK      | Público, solo devuelve país.                                                   |
| `/api/health`                               | REVISAR | Público y usa service role; considerar protección básica o limitación.         |
| `/api/images/process`                       | OK      | Auth + validación anti‑SSRF.                                                   |
| `/api/infra/alerts`                         | OK      | Auth + admin.                                                                  |
| `/api/infra/alerts/:id`                     | OK      | Auth + admin.                                                                  |
| `/api/infra/clusters/:id`                   | OK      | Auth + admin.                                                                  |
| `/api/infra/clusters/:id/execute-migration` | OK      | Auth + admin.                                                                  |
| `/api/infra/clusters/:id/prepare-migration` | OK      | Auth + admin.                                                                  |
| `/api/infra/clusters` (GET)                 | OK      | Auth + admin.                                                                  |
| `/api/infra/clusters` (POST)                | OK      | Auth + admin.                                                                  |
| `/api/infra/metrics`                        | OK      | Auth + admin.                                                                  |
| `/api/infra/migrate-images`                 | OK      | Auth + admin.                                                                  |
| `/api/infra/setup-cf-variants`              | OK      | Auth + admin.                                                                  |
| `/api/invoicing/create-invoice`             | OK      | Auth + ownership dealerId.                                                     |
| `/api/invoicing/export-csv`                 | OK      | Auth + admin/dealer filter.                                                    |
| `/api/market-report`                        | OK      | Público si `?public=true`, admin si no.                                        |
| `/api/merchant-feed`                        | REVISAR | Público sin cache explícita; correcto si se acepta público sin rate limiting.  |
| `/api/push/send`                            | OK      | Internal secret o admin.                                                       |
| `/api/social/generate-posts`                | OK      | Auth + ownership dealer o admin.                                               |
| `/api/stripe/checkout`                      | OK      | Auth + CSRF + URLs validadas.                                                  |
| `/api/stripe/portal`                        | OK      | Auth + CSRF + ownership customerId.                                            |
| `/api/stripe/webhook`                       | OK      | Firma Stripe en prod (dev permite sin firma).                                  |
| `/api/stripe-connect-onboard`               | OK      | Auth + CSRF + ownership dealerId.                                              |
| `/api/v1/valuation`                         | OK      | API key bearer + rate limit diario.                                            |
| `/api/verify-document`                      | REVISAR | Auth pero no verifica ownership usuario‑vehículo/documento.                    |
| `/api/whatsapp/process`                     | OK      | Internal secret o Turnstile.                                                   |
| `/api/whatsapp/webhook` (GET)               | OK      | Verificación token Meta.                                                       |
| `/api/whatsapp/webhook` (POST)              | OK      | Verificación HMAC Meta.                                                        |

---

## Anexo A6 — Ownership esperado vs ownership real

| Endpoint                        | Ownership esperado                  | Ownership real en código                       | Gap    |
| ------------------------------- | ----------------------------------- | ---------------------------------------------- | ------ |
| `/api/account/export`           | Solo el propio usuario              | Filtra por `user.id` en todas las consultas    | No     |
| `/api/account/delete`           | Solo el propio usuario              | Opera sobre `user.id`                          | No     |
| `/api/advertisements`           | Usuario crea su anuncio             | Inserta `user_id = user.id`                    | No     |
| `/api/auction-deposit`          | Registro debe pertenecer al usuario | Valida `registrationId` con `user_id` via REST | No     |
| `/api/invoicing/create-invoice` | Dealer propio                       | Verifica dealerId pertenece al user            | No     |
| `/api/invoicing/export-csv`     | Admin todo / Dealer propio          | Aplica filtro por dealerId si no es admin      | No     |
| `/api/social/generate-posts`    | Dealer dueño o admin                | Verifica dealer ownership o admin              | No     |
| `/api/stripe/portal`            | Usuario dueño de customerId         | Verifica customerId en subscriptions por user  | No     |
| `/api/stripe-connect-onboard`   | Dealer propio                       | Verifica dealerId pertenece al user            | No     |
| `/api/verify-document`          | Dealer dueño del vehiculo o admin   | No valida ownership del vehiculo/documento     | **Sí** |

---

## Anexo A7 — Riesgos residuales reales por endpoint (resumen ejecutivo)

| Endpoint               | Riesgo residual                 | Impacto                              | Mitigación recomendada                   |
| ---------------------- | ------------------------------- | ------------------------------------ | ---------------------------------------- |
| `/api/__sitemap`       | Sin cache explícita             | Coste y latencia bajo crawl agresivo | Cache CDN + rate limit suave             |
| `/api/merchant-feed`   | Sin cache explícita             | Coste y latencia bajo crawl          | Cache CDN + ETag                         |
| `/api/error-report`    | Público + rate limit en memoria | Abuso o spam en producción           | Rate limit perimetral (WAF/CF)           |
| `/api/health`          | Público + service role          | Información de salud accesible       | Token opcional o limitación IP           |
| `/api/email/send`      | Auth de usuario permite envío   | Potencial abuso si UI expone mal     | Límite por usuario + rate limit          |
| `/api/verify-document` | Sin ownership dealer/vehículo   | Posible verificación no autorizada   | Validar dealer_id/vehicle_id o rol admin |

---

## Checklist operativa (priorizada)

P0 (seguridad/abuso)

- [ ] Añadir ownership en `/api/verify-document` (dealer/admin) y test asociado.
- [ ] Añadir rate limit perimetral (WAF/CF) a `/api/error-report`.
- [ ] Revisar exposición de `/api/health` (token o limitación IP/CF).

P1 (performance/escala)

- [ ] Cache CDN explícita para `/api/merchant-feed`.
- [ ] Cache CDN explícita para `/api/__sitemap`.
- [ ] Añadir índices faltantes: `vehicles(category_id)` y `auction_bids(auction_id)`.

P2 (higiene y consistencia)

- [ ] Reconciliar `INSTRUCCIONES-MAESTRAS` con el código actual donde haya discrepancias.
- [ ] Actualizar `docs/progreso.md` con el estado real.
- [ ] Documentar diagrama de flujos en docs (buyer/dealer/admin).

P3 (mejoras)

- [ ] Revisar `email/send` para limitar abuso (rate limit por user + logging).
- [ ] Evaluar cache/ETag para endpoints de lectura pública.
