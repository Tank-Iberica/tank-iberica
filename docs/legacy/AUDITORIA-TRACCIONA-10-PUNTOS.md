> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

﻿# Auditoria Completa (10 Puntos) — Tracciona (version verificada)

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

| Endpoint                         | Controles detectados                             |
| -------------------------------- | ------------------------------------------------ |
| `serverpi\__sitemap.ts`          | `none_detected`                                  |
| `serverpiccount\delete.post.ts`  | `admin_check,csrf,internal_secret,supabase_user` |
| `serverpiccountxport.get.ts`     | `supabase_user`                                  |
| `serverpidvertisements.post.ts`  | `supabase_user,turnstile`                        |
| `serverpiuction-deposit.post.ts` | `supabase_user`                                  |

| `serverpi
