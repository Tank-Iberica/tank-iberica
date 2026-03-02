# STATUS — Tracciona

**Última actualización:** 2026-03-12 — BACKLOG-EJECUTABLE.md (116 items), eliminado BACKLOG.md, optimizado flujo docs (lectura inteligente por tipo de tarea)
**Sesiones completadas:** 0–64 + Iter 1–16 auditoría + sesiones ad-hoc hasta 08-mar
**Puntuación global:** ~83/100 (auditoría corregida mar-26) · Historial completo: `git log STATUS.md`

---

## Métricas reales del proyecto

| Módulo           | Real (verificado 28-feb)                         |
| ---------------- | ------------------------------------------------ |
| Páginas Vue      | 125                                              |
| Componentes Vue  | 418                                              |
| Composables      | 147                                              |
| Endpoints API    | 62                                               |
| Servicios server | 8                                                |
| Migraciones SQL  | 80 (00001-00066 + 14 timestamped)                |
| Tablas BD        | 92                                               |
| Tests totales    | 34 (12 E2E + 5 seg + 11 unit + 3 comp + 3 setup) |
| CI/CD workflows  | 7                                                |

---

## Errores activos

| ID   | Severidad | Problema                                                                                  | Acción                                              |
| ---- | --------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| P0-3 | 🔴 P0     | Rate limiting deshabilitado en producción (in-memory no funciona en CF Workers stateless) | Configurar reglas CF WAF (fundadores)               |
| P0-4 | 🟠 P1     | `/api/verify-document` sin validación de ownership (dealer puede ver docs de otro)        | Añadir check `dealer_id === session.user.dealer_id` |
| P0-5 | 🟠 P1     | 5 server routes exponen nombres de servicio en mensajes de error                          | Sanitizar errores con `safeError()`                 |
| P1-4 | 🟡 P2     | 10 errores TypeScript restantes (CatalogEmptyState, VehicleGrid, useVehicles, etc.)       | Corregir tipos                                      |
| P1-5 | 🟡 P2     | 2 test stubs en `useVehicles.test.ts:264,278` (`expect(true).toBe(true)`)                 | Implementar tests reales o `it.skip()`              |
| P1-6 | 🟡 P2     | `exceljs` no incluido en `manualChunks` de nuxt.config.ts                                 | Añadir chunk `vendor-excel`                         |

> Errores anteriores (P0-1/2, P1-1/2/3, P2-1/2/3, S-01, S-03) resueltos. Ver `git log STATUS.md`.

---

## Changelog de sesiones

| Fecha         | Resumen                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 12-mar        | BACKLOG-EJECUTABLE.md (116 items, 6 fases). Eliminado BACKLOG.md. Lectura inteligente por tipo de tarea en CLAUDE.md. STATUS.md limpio (sin duplicados). MANUAL-CORPORATIVO marcado snapshot. Cross-references en PROYECTO-CONTEXTO. |
| 10-mar        | Manual Corporativo (2.214L). Auditoría docs (4 refs, 11 consolidados). INSTRUCCIONES-MAESTRAS→legacy. Split PROYECTO-CONTEXTO (1597→495L) + ESTRATEGIA-NEGOCIO + IDEAS-A-REVISAR. ~15.400L eliminadas/reorganizadas.                 |
| 09-mar        | Estrategia marketing (§3.5 Google Ads, §3.16 AdSense). PromoCards + early access + geo-fallback + similar searches + demand card + location pills. Split card UX.                                                                    |
| 06–08-mar     | Sistema créditos (BD+Stripe+UI), accesibilidad completa (HC/dark/reduced-motion), localización automática (IP→idioma), chat buyer-seller response time badge.                                                                        |
| 01–05-mar     | Dealer portal branding, UX forms (autocomplete 26 forms, aria), auditoría #7 completada (16 iteraciones), estrategia datos §2.11-§2.12.                                                                                              |
| 28-feb–04-mar | Auth fixes, RLS 96 policies fix, UserPanel role-aware, CLAUDE.md restructura, hooks automáticos, auditoría 79→83/100.                                                                                                                |

> **Próximas acciones:** Ver `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` (Fase 1, Bloques 0-1-3)

CLOSING_SESSION
