# Issues de auditoría — Tracciona (tareas técnicas)

Fecha: 2026-02-24

## P0 (seguridad/abuso)

- [ ] Añadir ownership en `/api/verify-document` (dealer/admin).
  - Tarea: validar que el `vehicle_id` pertenece al dealer del `auth.uid()` o rol admin.
  - Archivo: `server/api/verify-document.post.ts`.
  - Prueba: intento de verificación con usuario no dueño debe fallar (403).
- [ ] Añadir rate limit perimetral (WAF/CF) a `/api/error-report`.
  - Tarea: regla Cloudflare (request rate) + opcional token interno.
  - Archivo: `server/api/error-report.post.ts`.
- [ ] Restringir `/api/health`.
  - Tarea: requerir token interno o allowlist IP en CF.
  - Archivo: `server/api/health.get.ts`.

## P1 (performance/escala)

- [ ] Cache CDN explícita para `/api/merchant-feed`.
  - Tarea: añadir `Cache-Control` + ETag, configurar CF Cache Rules.
  - Archivo: `server/api/merchant-feed.get.ts`.
- [ ] Cache CDN explícita para `/api/__sitemap`.
  - Tarea: `Cache-Control` + ETag, CF Cache Rules.
  - Archivo: `server/api/__sitemap.ts`.
- [ ] Añadir índice `vehicles(category_id)`.
  - Tarea: migración nueva en `supabase/migrations`.
- [ ] Añadir índice `auction_bids(auction_id)`.
  - Tarea: migración nueva en `supabase/migrations`.

## P2 (documentación/consistencia)

- [ ] Reconciliar `INSTRUCCIONES-MAESTRAS.md` con código actual.
  - Tarea: actualizar tabla Sesión 36 donde el código ya cubre auth real.
- [ ] Actualizar `docs/progreso.md` con estado real.
  - Tarea: listar módulos reales y fechas.
- [ ] Documentar flujos operativos (buyer/dealer/admin).
  - Tarea: añadir diagrama Mermaid en docs.

## P3 (mejoras)

- [ ] Limitar abuso en `/api/email/send`.
  - Tarea: rate limit por user + logging de envíos.
  - Archivo: `server/api/email/send.post.ts`.
- [ ] Evaluar ETag/Cache-Control en endpoints públicos adicionales.
  - Tarea: revisar `/api/geo`, `/api/health`, `/api/merchant-feed`, `/api/__sitemap`.
