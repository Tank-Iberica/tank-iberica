# STATUS — Tracciona

**Última actualización:** 2026-03-13 — Policy Engine auditado y reforzado. ENTORNO-DESARROLLO.md creado.
**Sesiones completadas:** 0–64 + Iter 1–16 auditoría + sesiones ad-hoc hasta 13-mar
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

| Fecha         | Resumen                                                                                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14-mar (2)    | Auditoría final policy engine: audit-final.mjs creado y pasado 42/42. Fix DRY_RUN en script de auditoría. Sistema cerrado: 8 DENY · 8 WARN · 4 ASK · 43+42/43+42 tests.                                                                                                                  |
| 14-mar        | SonarQube cont.: S6551 ✅ (15 arch. supabaseUrl type fix), S2871 ✅ (14 sort comparators), S3358 ✅ (3 ternaries→map). Broken S7721 extractions revertidas (useDashboardIndex, useConversation, useAdminVerificaciones). 0 errores TS nuevos.                                            |
| 13-mar        | Policy Engine auditado y cerrado: fix falso positivo `.environment.ts`, DENY→ASK en `--no-verify` y `reset --hard` (explicación lenguaje claro), `.prettierignore` (Prettier rompía regex), `policy-status --brief` al inicio, `ENTORNO-DESARROLLO.md`. 8 DENY · 8 WARN · 4 ASK · 43/43. |
| 03-mar        | Policy Engine: PreToolUse hook activo. 10 DENY + 8 WARN + 2 ASK. 43/43 tests. Auto-compila en clone. Preflight anti-secretos en git push/commit.                                                                                                                                         |
| 03-mar        | SonarQube Fase 4 pospuestas: S7781 ✅ (59 archivos) S7764 ✅ (52 window→globalThis) S7735 ✅ S6582 ✅ S1135 ✅. ~140 issues adicionales resueltos (total sesión: ~500+).                                                                                                                 |
| 03-mar        | SonarQube Fase 4 COMPLETA: S7763 (35) ✅ S6598 (65) ✅ S7744 (12) ✅ S7778 (23) ✅ S4325 (61) ✅ S7721 (153) ✅ — 344 issues resueltos, 0 errores TypeScript.                                                                                                                            |
| 13-mar        | SonarQube Fases 1-2 ✅ (13 bugs + 3 blocker/critical). Fase 4 parcial: S7755 ✅, S7764 ✅, S1135 ✅, S6582 ✅, S7781 parcial ✅ (23 fixes simples), S7735 parcial ✅ (7 fixes). Commit `9ffff67` (74 archivos).                                                                          |
| 02-mar        | SonarQube S7721 fixes (150+ funciones a module scope), coverage generado (39%), Quality Gate custom "Tracciona", plan 10 fases (805 issues → 0, 16-24 sesiones). Plan integrado en BACKLOG-EJECUTABLE.md.                                                                                |
| 12-mar        | BACKLOG-EJECUTABLE.md (116 items, 6 fases). Eliminado BACKLOG.md. Lectura inteligente por tipo de tarea en CLAUDE.md. STATUS.md limpio (sin duplicados). MANUAL-CORPORATIVO marcado snapshot. Cross-references en PROYECTO-CONTEXTO.                                                     |
| 10-mar        | Manual Corporativo (2.214L). Auditoría docs (4 refs, 11 consolidados). INSTRUCCIONES-MAESTRAS→legacy. Split PROYECTO-CONTEXTO (1597→495L) + ESTRATEGIA-NEGOCIO + IDEAS-A-REVISAR. ~15.400L eliminadas/reorganizadas.                                                                     |
| 09-mar        | Estrategia marketing (§3.5 Google Ads, §3.16 AdSense). PromoCards + early access + geo-fallback + similar searches + demand card + location pills. Split card UX.                                                                                                                        |
| 06–08-mar     | Sistema créditos (BD+Stripe+UI), accesibilidad completa (HC/dark/reduced-motion), localización automática (IP→idioma), chat buyer-seller response time badge.                                                                                                                            |
| 01–05-mar     | Dealer portal branding, UX forms (autocomplete 26 forms, aria), auditoría #7 completada (16 iteraciones), estrategia datos §2.11-§2.12.                                                                                                                                                  |
| 28-feb–04-mar | Auth fixes, RLS 96 policies fix, UserPanel role-aware, CLAUDE.md restructura, hooks automáticos, auditoría 79→83/100.                                                                                                                                                                    |

> **SonarQube (13-mar→03-mar):** Fase 4 completa. ~344 issues mecánicos resueltos. Próximo scan pendiente.
> **Próximas acciones:** Fase 3 (cognitive complexity 69 issues) + Fase 5 (S7735 cognitive). Ver `docs/tracciona-docs/AUDITORIA-SONARQUBE-100.md`
> **Prompt para retomar:** "Continúa la auditoría SonarQube Fase 3 (cognitive complexity) + Fase 5. Lee AUDITORIA-SONARQUBE-100.md para el plan completo."
