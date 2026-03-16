# 🛣️ Roadmap Autónomo — Tracciona 16-mar-2026

**Estado:** Activo — Trabajo sin dependencias externas
**Última revisión:** 2026-03-16
**Generado por:** Auditoría BACKLOG-EJECUTABLE.md

---

## Resumen ejecutivo

**Total:** 21 items sin dependencias externas (Stripe, Billin, Twilio, APIs keys)
**Estimado:** ~50–60 horas
**Estructura:** 4 fases secuenciales
**Bloqueos internos:** Mínimos (2 items esperan otro)
**Modelo:** Código puro + BD + Tests. **Cero intervención usuario requerida.**

---

## ⚡ FASE 1: Quick Wins (8–10h) — AHORA

Items pequeños (Size S), sin bloqueantes, valor inmediato. **Limpia deuda técnica.**

| #       | Título                                | Size |   Est. | Descripción                                                                                                                                   |
| ------- | ------------------------------------- | ---- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **209** | validateBody expone errores Zod       | S    | 1–1.5h | Fix `server/utils/validateBody.ts`: usar `safeError()` o mensaje genérico "Datos inválidos". Detalle solo en logger. **Entregable:** 4 tests. |
| **210** | eslint.config.mjs ignora .claude/\*\* | S    |   0.5h | Agregar a `ignorePatterns`: `.claude/**`, `Tracciona-agent-c/**`, `.claude/worktrees/**`, `.pdf-build/**`. **Entregable:** 1 commit lint.     |
| **7**   | Actualizar seed credit_packs          | S    |     1h | Seed SQL: 5 packs con bonos (1, 3, 10+1, 25+3, 50+10). Fixture. **Entregable:** 3 tests.                                                      |
| **64**  | JSON-LD Vehicle schema                | S    |   1.5h | Componente `/components/SEO/StructuredData.vue`. @type:Vehicle + brand/model/mileage. **Entregable:** 2 tests.                                |
| **35**  | Sale price obligatorio                | S    |   1.5h | `SoldModal.vue`: no cierra sin `sale_price`. Campo `vehicles.last_sale_price` en BD. **Entregable:** 3 tests.                                 |
| **36**  | Precio negociado en leads             | S    |     1h | Campo `negotiated_price` tabla `leads`. LeadDetailModal. **Entregable:** 2 tests.                                                             |
| **37**  | Motivo no-venta                       | S    |     1h | Select RetireModal: opciones, campo `vehicles.withdrawal_reason`. **Entregable:** 2 tests.                                                    |
| **42**  | UTM attribution                       | S    |   1.5h | Capturar `utm_*` en composable, guardar en `analytics_events.metadata`. **Entregable:** 3 tests.                                              |
| **47**  | Device/platform en eventos            | S    |     1h | userAgent parse (mobile/tablet/desktop) en `useAnalytics.ts`. **Entregable:** 2 tests.                                                        |
| **48**  | Velocidad onboarding                  | S    |     1h | Query: `ttfp = first_publication_at - created_at`. Métrica pura BD. **Entregable:** 1 test.                                                   |
| **72**  | GTM container config                  | S    |     1h | Plugin Nuxt con 3 tags (Meta Pixel, GA, LinkedIn). GTM ID en env. **Entregable:** 1 test.                                                     |

**Subtotal Fase 1:** ~12–13h
**Entregables:** 4 migrations BD, 2 componentes Vue, 7 utils server, 24 tests
**Parallelizable:** Todos independientes. Hacer juntos.

---

## 🧠 FASE 2: Core Logic (18–22h) — SEMANA 1

Backend con impacto real. **Todas independientes o débiles bloqueantes.**

| #      | Título                   | Size | Est. | Descripción                                                                                                                                            | Bloqueantes |
| ------ | ------------------------ | ---- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **50** | Backend seller_reviews   | M    |   6h | Tabla `seller_reviews` (reviewer, dealer, rating, comment, dimensions JSONB). RLS policies. 3 routes (create/list/moderate). **Entregable:** 12 tests. | —           |
| **41** | Búsquedas sin resultados | M    |   5h | Insert `search_logs` con `results_count`. Cron diario → "Top 20 búsquedas sin resultados". Admin dashboard. **Entregable:** 5 tests.                   | —           |
| **77** | Modularizar endpoints    | M    |   8h | Extraer 4 endpoints largos a `server/services/`: imageUploader, vehicleCreator, whatsappProcessor, notifications. **Entregable:** 8 tests.             | —           |
| **78** | Deshardcodear configs    | M    |   6h | Centralizar: `server/utils/aiConfig.ts`, `server/utils/siteConfig.ts`, prompts de BD, Supabase ref → secrets. **Entregable:** 6 tests.                 | —           |

**Subtotal Fase 2:** ~25h
**Entregables:** 1 tabla BD, 4 services, 31 tests
**Estrategia:** Paraleliza #50 + #41 (no overlap). Luego #77 + #78 en serie (77 antes para modularidad).

---

## 🎨 FASE 3: Features (24–28h) — SEMANA 2-3

Características con visibilidad pública. **Algunos esperan #50.**

| #      | Título                    | Size | Est. | Descripción                                                                                                     | Bloqueantes | Paralelizable              |
| ------ | ------------------------- | ---- | ---: | --------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------- |
| **73** | DPA feed Meta             | S    |   3h | GET `/api/feed/products.xml`: formato XML compatible Dynamic Product Ads. **Entregable:** 3 tests.              | —           | ✅ Paralleliza con #51-55  |
| **51** | Display reviews en perfil | M    |   5h | Componente `DealerReviewsList.vue`, página `/dealers/[slug]#reviews`. AggregateRating. **Entregable:** 6 tests. | #50         | ✅                         |
| **52** | Dimensiones review JSONB  | S    |   2h | 4 campos (communication, accuracy, condition, logistics) en form + display. **Entregable:** 3 tests.            | #50         | ✅                         |
| **53** | NPS 0-10                  | S    | 1.5h | Campo NPS en formulario. Promedio visible. Badge "Recomendado" si >8. **Entregable:** 2 tests.                  | #50         | ✅                         |
| **54** | Badge Top-Rated           | S    |   2h | Filtro catalogo "Top-Rated" (rating ≥80). Badge VehicleCard. **Entregable:** 2 tests.                           | #50         | ✅                         |
| **55** | Scoreboard Top 100        | M    |   4h | Página `/top-dealers` ranking por rating. Paginación. Meta tags. **Entregable:** 5 tests.                       | #50         | ✅                         |
| **62** | Motor active_landings     | L    |  10h | Cron semanal: evalúa combinaciones vehículos, activa/desactiva filas. Lógica compleja. **Entregable:** 8 tests. | —           | ✅ Paralleliza con reviews |
| **63** | Catalogo landing pages    | M    |   5h | Página `/camiones-segunda-mano-madrid` + 20 ciudades. VehicleGrid filtrado. Meta. **Entregable:** 4 tests.      | #62         | ⏳ Después #62             |
| **71** | Calendario editorial      | L    |   8h | Vue calendar, drag&drop publicaciones. Admin dashboard. **Entregable:** 6 tests.                                | —           | ✅ Paralleliza con #62     |

**Subtotal Fase 3:** ~40.5h
**Entregables:** 1 feed XML, 6 componentes Vue, 37 tests
**Paralelización recomendada:**

- `#50 completo` → desbloquea #51-54-55 (ejecutar juntos)
- `#62` independiente (ejecutar mientras #51-55)
- `#63` espera #62
- `#71` independiente (ejecutar mientras todo)

---

## 🔧 FASE 4: Infrastructure & Quality (8–10h) — SEMANA 3

Polish, robustez, coverage.

| #      | Título               | Size |  Est. | Descripción                                                                                                                                                                                                        | Bloqueantes        |
| ------ | -------------------- | ---- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| **79** | Coverage tests → 40% | L    | 8–10h | Escribir ~12 test files para servicios (`aiProvider`, `billing`, `rateLimit`, `safeError`) + composables (`useAuth`, `useSubscriptionPlan`). CI gate en `ci.yml`. **Entregable:** 12 archivos test, coverage ≥40%. | #77 (modularizado) |

**Subtotal Fase 4:** ~8–10h
**Entregables:** 12 archivos test, CI config actualizado

---

## 📈 Totales consolidados

| Métrica                  |                                                       Valor |
| ------------------------ | ----------------------------------------------------------: |
| **Total items**          |                                                          21 |
| **Horas estimadas**      |                                                     ~50–60h |
| **Semanas (40h/week)**   |                                                         2–3 |
|                          |                                                             |
| **Migrations BD nuevas** |                                                           4 |
| **Componentes Vue**      |                                                           9 |
| **Server services**      |                                                           4 |
| **Tests nuevos**         |                                                        ~100 |
| **Coverage esperado**    | ~40% (desde actual ~74.8% statements, pero nuevos archivos) |

---

## 🎯 Ejecución recomendada

### Orden secuencial (sin overlap)

```
SEMANA 1:
  ├─ Fase 1 (12h) → Quick wins
  ├─ Fase 2 en paralelo:
  │  ├─ #50 + #41 simultáneo (11h)
  │  └─ #77 + #78 en serie (14h)

SEMANA 2:
  ├─ #62 (10h) → Motor active_landings
  ├─ #51-54-55 en paralelo (16h) → Esperan #50 (ya hecho)
  ├─ #73 (3h) → DPA feed
  └─ #71 (8h) → Calendario

SEMANA 3:
  ├─ #63 (5h) → Esperan #62 (ya hecho)
  └─ #79 (10h) → Coverage tests
```

### Alternativa: Máximo paralelismo

**Fase 1** → **Fase 2A** (#50 + #41) + **Fase 2B** (#77 + #78) en paralelo → **Fase 3** (todo paralelizado) → **Fase 4**

Resultado: ~2.5 semanas si trabajo 24/7, ~3 semanas si 40h/week.

---

## ✅ Checklist por fase

### Fase 1

- [ ] #209: validateBody fix + tests
- [ ] #210: eslint ignores
- [ ] #7: seed credit_packs
- [ ] #64: JSON-LD schema
- [ ] #35: Sale price modal
- [ ] #36: negotiated_price
- [ ] #37: withdrawal_reason
- [ ] #42: UTM tracking
- [ ] #47: Device tracking
- [ ] #48: Onboarding speed query
- [ ] #72: GTM config
- [ ] **Verify:** `npm run typecheck && npm run lint && npm run test --coverage`

### Fase 2

- [ ] #50: seller_reviews backend
- [ ] #41: search_logs + admin
- [ ] #77: modularizar endpoints
- [ ] #78: deshardcodear configs
- [ ] **Verify:** Coverage no cae, todos tests pasan

### Fase 3

- [ ] #62: active_landings motor
- [ ] #51-55: Reviews display completo
- [ ] #73: DPA feed
- [ ] #71: Calendario editorial
- [ ] #63: Landing pages catálogo
- [ ] **Verify:** `npm run build` sin errores, no hay console warnings

### Fase 4

- [ ] #79: Coverage tests
- [ ] CI gate activado (≥40%)
- [ ] **Verify:** `npm run test --coverage` ≥40%

---

## 🚀 Comandos de referencia

```bash
# Desarrollo
npm run dev
npm run typecheck
npm run lint
npm run test -- --coverage

# Build
npm run build
npm run preview

# Cleanup
taskkill /F /IM node.exe 2>nul
```

---

## 📝 Notas críticas

1. **#62 (active_landings)** — 10 horas, lógica combinatoria. **Aislar bien con tests.**
2. **#77 (modularizar)** — **Debe hacerse ANTES de #79.** Permite testear servicios en isolación.
3. **Fase 1 es CRÍTICA** — #209/#210 previenen CI issues después.
4. **#50-55 (Reviews)** — 5 items que se encadenan. Hacer juntos. #50 desbloquea los otros 4.
5. **Todos asumen** schema BD en place. **Verificar**: `types/supabase.ts` línea ~4664 para nuevas columnas.
6. **Cero dependencias externas.** No necesitas: Stripe, Billin, Twilio, Resend, OAuth, keys. Solo código + BD + tests.

---

## 🔗 Referencias

- **BACKLOG-EJECUTABLE.md** — Fuente canónica
- **STATUS.md** — Estado actual proyecto
- **CLAUDE.md** — Protocolo ejecución
- **types/supabase.ts** — Schema BD generado
- **vitest.config.ts** — Test configuration

---

## 📅 Próximas sesiones

Para próximas sesiones, usar este roadmap como:

1. **Punto de partida:** "Continuar con Fase 1, item #X"
2. **Paralelización:** "Ejecutar items #50 + #41 en paralelo"
3. **Estado:** Marcar items como ✅ conforme se completanMarkdown

**Última actualización:** 2026-03-16
**Generado para:** Claude Code autonomous execution
