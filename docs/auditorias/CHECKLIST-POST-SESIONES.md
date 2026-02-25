# Checklist: Pendientes post-Session 43

Items accionables encontrados en las auditorias que NO estan cubiertos por las sesiones 1-43.
Generado cruzando los 5 documentos de auditoria contra el contenido de cada sesion.

_Ultima actualizacion: 2026-02-25_

## P0 — Antes de produccion

- [ ] **Pentest externo**: contratar auditoria de penetracion o bug bounty limitado
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Seguridad_
  - _Accion: buscar proveedor (Cobalt, HackerOne, freelance)_

## P1 — Primera semana post-lanzamiento

- [x] **Trials 14 dias gratis**: UI en pagina de pricing para dealers nuevos
  - _Resuelto: Sesion 40 — checkout.post.ts (trial_period_days: 14), precios.vue (trial badge)_

- [x] **Dunning emails**: 2 templates (pago-fallido-soft, pago-fallido-urgente) + banner en dashboard
  - _Resuelto: Sesion 40 — webhook.post.ts (invoice.payment_failed + cancellation emails via billing.ts)_

- [x] **Downgrade workflow**: definir que pasa al cancelar suscripcion (limites, visibilidad listings)
  - _Resuelto: Sesion 40 — webhook.post.ts (customer.subscription.deleted → plan: free + email)_

- [ ] **Consolidar admin/dashboard**: extraer componentes compartidos para reducir duplicacion
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Modulabilidad_
  - _Ejemplos: VehicleListTable, VehicleFormBasicInfo, useVehicleList(scope)_
  - _Esfuerzo estimado: 2 semanas_
  - _Estado: Solo dateHelpers.ts en composables/shared/. Pospuesto por alto esfuerzo._

- [x] **Suite de tests de seguridad**: 13 checks minimos (auth endpoints, webhooks, IDOR, CRON_SECRET)
  - _Resuelto: Sesion 37 — tests/security/auth-endpoints.test.ts (17 checks: auth, webhooks, crons, headers)_

## P2 — Primer mes post-lanzamiento

- [x] **PWA offline.vue**: pagina amigable cuando no hay conexion
  - _Resuelto: Sesion 39 — app/pages/offline.vue (i18n, retry, mobile-first)_

- [ ] **Diagrama Mermaid de flujos**: buyer journey, dealer journey, admin journey
  - _Origen: ISSUES-AUDITORIA.md, seccion P2_
  - _Estado: FLUJOS-OPERATIVOS.md ya tiene diagramas ASCII. Mermaid es mejora opcional._

- [x] **Actualizar docs/progreso.md**: reflejar estado real post-Session 43
  - _Resuelto: Sesion 43 — progreso.md reescrito con 43 sesiones, 22 modulos_

- [x] **Auditoria de PII/logs**: verificar que no se loguean passwords, tokens, datos de pago
  - _Resuelto: Post-sesion 43 — auditoria de console.\* en server/, limpieza con logger estructurado_

- [x] **Documentar decisiones de modulos pospuestos**: landing pages builder, OAuth social, Prebid
  - _Resuelto: Sesiones 41+43 — ESTADO-REAL-PRODUCTO.md seccion "Decisiones sobre modulos parciales"_

## Resumen

| Prioridad | Total  | Resueltos | Pendientes |
| --------- | ------ | --------- | ---------- |
| P0        | 1      | 0         | 1          |
| P1        | 5      | 4         | 1          |
| P2        | 5      | 5         | 0          |
| **Total** | **11** | **9**     | **2**      |

### Pendientes restantes

1. **Pentest externo** (P0) — Requiere accion del usuario: contratar proveedor externo
2. **Consolidar admin/dashboard** (P1) — Alto esfuerzo (~2 semanas), pospuesto

## Referencia: documentos fuente

| Documento                                                            | Contenido                                |
| -------------------------------------------------------------------- | ---------------------------------------- |
| [RECOMENDACIONES-100-PUNTOS.md](RECOMENDACIONES-100-PUNTOS.md)       | 100 recomendaciones priorizadas por area |
| [VALORACION-PROYECTO-1-100.md](VALORACION-PROYECTO-1-100.md)         | Puntuacion del proyecto por dimension    |
| [AUDITORIA-INTEGRAL-2026-02.md](AUDITORIA-INTEGRAL-2026-02.md)       | Auditoria tecnica completa (feb 2026)    |
| [ISSUES-AUDITORIA.md](ISSUES-AUDITORIA.md)                           | Issues especificos con prioridad         |
| [AUDITORIA-TRACCIONA-10-PUNTOS.md](AUDITORIA-TRACCIONA-10-PUNTOS.md) | Auditoria resumida 10 puntos             |
