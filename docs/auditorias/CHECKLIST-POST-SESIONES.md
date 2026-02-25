# Checklist: Pendientes post-Session 42

Items accionables encontrados en las auditorias que NO estan cubiertos por las sesiones 39-42.
Generado cruzando los 5 documentos de auditoria contra el contenido de cada sesion.

## P0 — Antes de produccion

- [ ] **Pentest externo**: contratar auditoria de penetracion o bug bounty limitado
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Seguridad_
  - _Accion: buscar proveedor (Cobalt, HackerOne, freelance)_

## P1 — Primera semana post-lanzamiento

- [ ] **Trials 14 dias gratis**: UI en pagina de pricing para dealers nuevos
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Monetizacion_
  - _Accion: banner en /precios, logica en useSubscription, Stripe trial_period_days_

- [ ] **Dunning emails**: 2 templates (pago-fallido-soft, pago-fallido-urgente) + banner en dashboard
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Monetizacion_
  - _Accion: templates en email_templates BD, webhook invoice.payment_failed_

- [ ] **Downgrade workflow**: definir que pasa al cancelar suscripcion (limites, visibilidad listings)
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Monetizacion_
  - _Accion: documentar reglas, implementar en webhook customer.subscription.deleted_

- [ ] **Consolidar admin/dashboard**: extraer componentes compartidos para reducir duplicacion
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Modulabilidad_
  - _Ejemplos: VehicleListTable, VehicleFormBasicInfo, useVehicleList(scope)_
  - _Esfuerzo estimado: 2 semanas_

- [ ] **Suite de tests de seguridad**: 13 checks minimos (auth endpoints, webhooks, IDOR, CRON_SECRET)
  - _Origen: AUDITORIA-TRACCIONA-10-PUNTOS.md, Anexo A7_
  - _Accion: ampliar tests/security/ con checks sistematicos_

## P2 — Primer mes post-lanzamiento

- [ ] **PWA offline.vue**: pagina amigable cuando no hay conexion
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion UX_
  - _Accion: crear app/pages/offline.vue con mensaje y boton reintentar_

- [ ] **Diagrama Mermaid de flujos**: buyer journey, dealer journey, admin journey
  - _Origen: ISSUES-AUDITORIA.md, seccion P2_
  - _Accion: crear docs/tracciona-docs/referencia/FLUJOS-USUARIO.md con diagramas_

- [ ] **Actualizar docs/progreso.md**: reflejar estado real post-Session 42
  - _Origen: ISSUES-AUDITORIA.md, seccion P2_
  - _Accion: regenerar con scripts/generate-estado-real.sh + resumen manual_

- [ ] **Auditoria de PII/logs**: verificar que no se loguean passwords, tokens, datos de pago
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Seguridad_
  - _Accion: grep console.log/warn en server/, revisar Sentry breadcrumbs_

- [ ] **Documentar decisiones de modulos pospuestos**: landing pages builder (POSPONER), OAuth social (MINIMO)
  - _Origen: RECOMENDACIONES-100-PUNTOS.md, seccion Proyeccion_
  - _Accion: agregar seccion en ESTADO-REAL-PRODUCTO.md_

## Referencia: documentos fuente

| Documento                                                            | Contenido                                |
| -------------------------------------------------------------------- | ---------------------------------------- |
| [RECOMENDACIONES-100-PUNTOS.md](RECOMENDACIONES-100-PUNTOS.md)       | 100 recomendaciones priorizadas por area |
| [VALORACION-PROYECTO-1-100.md](VALORACION-PROYECTO-1-100.md)         | Puntuacion del proyecto por dimension    |
| [AUDITORIA-INTEGRAL-2026-02.md](AUDITORIA-INTEGRAL-2026-02.md)       | Auditoria tecnica completa (feb 2026)    |
| [ISSUES-AUDITORIA.md](ISSUES-AUDITORIA.md)                           | Issues especificos con prioridad         |
| [AUDITORIA-TRACCIONA-10-PUNTOS.md](AUDITORIA-TRACCIONA-10-PUNTOS.md) | Auditoria resumida 10 puntos             |
