# 🛣️ Roadmap Autónomo — Tracciona 16-mar-2026

**Estado:** Activo — Trabajo sin dependencias externas
**Última revisión:** 2026-03-16
**Generado por:** Auditoría BACKLOG-EJECUTABLE.md

---

## Resumen ejecutivo

**Total:** 36 items sin dependencias externas (Stripe, Billin, Twilio, APIs keys)

- **Core roadmap:** 21 items
- **Bonus items:** 15 items (encontrados en audit, no requieren intervención)

**Estimado:** ~70–80 horas
**Estructura:** 4 fases secuenciales
**Bloqueos internos:** Débiles (4–5 items esperan otro)
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
| **59**  | ref_code column (TRC-001)             | S    |   1.5h | Migration: columna `vehicles.ref_code` + trigger auto-genera TRC-XXXXX. **Entregable:** 2 tests.                                              |
| **38**  | buyer_location tracking               | S    |   1.5h | Campo `buyer_location` obligatorio o inferido IP. Guardado en `analytics_events.metadata`. **Entregable:** 2 tests.                           |
| **39**  | tiempo en página por vehículo         | S    |     1h | Evento `page_duration_seconds` al salir ficha. **Entregable:** 1 test.                                                                        |
| **40**  | Evento comparación (2+ vehículos)     | S    |     1h | Logged cuando user ve vehículos similares. **Entregable:** 1 test.                                                                            |
| **43**  | form abandonment tracking             | S    |   1.5h | Evento `form_abandon` con `step_reached` + `time_spent`. **Entregable:** 2 tests.                                                             |
| **44**  | scroll depth en ficha                 | S    |   1.5h | Evento `scroll_depth` (25/50/75/100%). **Entregable:** 2 tests.                                                                               |
| **22**  | precio drop alerts con umbral         | S    |     1h | Campo `threshold` en alerta. "Avisame cuando baje de EUR 40K". **Entregable:** 2 tests.                                                       |
| **84**  | HEALTH_TOKEN config                   | S    |   0.5h | Variable `.env` + Cloudflare. Health endpoint protegido. **Entregable:** 1 test.                                                              |
| **85**  | infra_alerts types regenerar          | S    |   0.5h | `npx supabase gen types` ejecutado. tipos/supabase.ts actualizado. **Entregable:** 1 commit.                                                  |
| **88**  | NuxtImg sizes responsive              | S    |     2h | Todas NuxtImg con atributo `sizes` apropiado. **Entregable:** 0 tests, verificación manual.                                                   |

**Subtotal Fase 1:** ~18–20h
**Entregables:** 5 migrations BD, 1 componente Vue, 11 utils server, 19 tests
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
| **45** | Price badge mercado      | M    |   2h | Badge "X% sobre/bajo mercado" en ficha. Basado en price_history. **Entregable:** 3 tests.                                                              | —           |

**Subtotal Fase 2:** ~27h
**Entregables:** 1 tabla BD, 4 services, 1 componente, 34 tests
**Estrategia:** Paraleliza #50 + #41 (no overlap). Luego #77 + #78 en serie (77 antes para modularidad). #45 independiente.

---

## 🎨 FASE 3: Features (24–28h) — SEMANA 2-3

Características con visibilidad pública. **Algunos esperan #50.**

| #      | Título                         | Size | Est. | Descripción                                                                                                     | Bloqueantes | Paralelizable              |
| ------ | ------------------------------ | ---- | ---: | --------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------- |
| **73** | DPA feed Meta                  | S    |   3h | GET `/api/feed/products.xml`: formato XML compatible Dynamic Product Ads. **Entregable:** 3 tests.              | —           | ✅ Paralleliza con #51-55  |
| **51** | Display reviews en perfil      | M    |   5h | Componente `DealerReviewsList.vue`, página `/dealers/[slug]#reviews`. AggregateRating. **Entregable:** 6 tests. | #50         | ✅                         |
| **52** | Dimensiones review JSONB       | S    |   2h | 4 campos (communication, accuracy, condition, logistics) en form + display. **Entregable:** 3 tests.            | #50         | ✅                         |
| **53** | NPS 0-10                       | S    | 1.5h | Campo NPS en formulario. Promedio visible. Badge "Recomendado" si >8. **Entregable:** 2 tests.                  | #50         | ✅                         |
| **54** | Badge Top-Rated                | S    |   2h | Filtro catalogo "Top-Rated" (rating ≥80). Badge VehicleCard. **Entregable:** 2 tests.                           | #50         | ✅                         |
| **55** | Scoreboard Top 100             | M    |   4h | Página `/top-dealers` ranking por rating. Paginación. Meta tags. **Entregable:** 5 tests.                       | #50         | ✅                         |
| **62** | Motor active_landings          | L    |  10h | Cron semanal: evalúa combinaciones vehículos, activa/desactiva filas. Lógica compleja. **Entregable:** 8 tests. | —           | ✅ Paralleliza con reviews |
| **63** | Catalogo landing pages         | M    |   5h | Página `/camiones-segunda-mano-madrid` + 20 ciudades. VehicleGrid filtrado. Meta. **Entregable:** 4 tests.      | #62         | ⏳ Después #62             |
| **71** | Calendario editorial           | L    |   8h | Vue calendar, drag&drop publicaciones. Admin dashboard. **Entregable:** 6 tests.                                | —           | ✅ Paralleliza con #62     |
| **60** | TRC handler WhatsApp           | M    |   3h | Mensaje con "TRC-123" devuelve datos vehículo + enlace ficha. **Entregable:** 3 tests.                          | #59 ✅      | ⏳ Después #59             |
| **61** | Menu interactivo "Qué buscas?" | M    |   3h | "Qué buscas? 1 Camión 2 Excavadora..." con botones interactivos. **Entregable:** 3 tests.                       | #60         | ⏳ Después #60             |
| **19** | Market valuation report        | M    |   3h | "Este vehículo vale EUR X, está X% sobre/bajo". Con datos historico. **Entregable:** 3 tests.                   | —           | ✅ Paralleliza             |
| **20** | Comparador vehículos           | M    |   4h | Página comparar 2-3 vehículos con métricas mercado. Gratis vs Premium con créditos. **Entregable:** 4 tests.    | —           | ✅ Paralleliza             |
| **21** | Historial precio gráfico       | M    |   3h | Gráfico "Empezó EUR 55K, bajó EUR 48K en 3 meses" con datos price_history. **Entregable:** 3 tests.             | —           | ✅ Paralleliza             |
| **23** | IA ficha cobrada (1 cred)      | S    |   2h | Pipeline WhatsApp → cobro 1 crédito al generar ficha. **Entregable:** 2 tests.                                  | #7 ✅       | ✅ Después Fase 1          |
| **25** | IA price recommendation        | M    |   3h | "Basado en 230 similares, precio óptimo EUR 42K-46K". **Entregable:** 3 tests.                                  | —           | ✅ Paralleliza             |
| **26** | PDF certificado + QR           | M    |   3h | PDF generado con QR verificable. Descargable por 1 crédito. **Entregable:** 3 tests.                            | #7 ✅       | ✅ Después Fase 1          |

**Subtotal Fase 3:** ~53h
**Entregables:** 1 feed XML, 6 componentes Vue, 9 componentes análisis/IA, 46 tests
**Paralelización recomendada:**

- `#50 completo` → desbloquea #51-54-55 (ejecutar juntos)
- `#62` independiente (ejecutar mientras #51-55)
- `#63` espera #62
- `#71` independiente (ejecutar mientras todo)
- `#59 completo` → desbloquea #60-61 (chain de 2)
- `#19-21, #25` parallelizables (mercado/recomendaciones)
- `#23, #26` pueden hacerse paralelo a cualquier cosa (dependen #7 de Fase 1)

---

## 🔧 FASE 4: Infrastructure & Quality (15–18h) — SEMANA 3-4

Polish, robustez, coverage, accesibilidad.

| #      | Título               | Size |  Est. | Descripción                                                                                                                                                                                                        | Bloqueantes        |
| ------ | -------------------- | ---- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| **79** | Coverage tests → 40% | L    | 8–10h | Escribir ~12 test files para servicios (`aiProvider`, `billing`, `rateLimit`, `safeError`) + composables (`useAuth`, `useSubscriptionPlan`). CI gate en `ci.yml`. **Entregable:** 12 archivos test, coverage ≥40%. | #77 (modularizado) |
| **89** | Form validation lib  | L    |  6–8h | Biblioteca validación forms (Zod/VeeValidate) en formularios críticos. Mensajes descriptivos. **Entregable:** 8 tests, 5 formularios refactorizados.                                                               | —                  |

**Subtotal Fase 4:** ~14–18h
**Entregables:** 12 archivos test, CI config, 8 tests validación, 5 forms refactorizados

---

## 📈 Totales consolidados

| Métrica                  |                                                       Valor |
| ------------------------ | ----------------------------------------------------------: |
| **Total items**          |                                                          36 |
| **Items core**           |                                                          21 |
| **Items bonus**          |                                                          15 |
| **Horas estimadas**      |                                                     ~70–80h |
| **Semanas (40h/week)**   |                                                      ~2–2.5 |
|                          |                                                             |
| **Migrations BD nuevas** |                                                           5 |
| **Componentes Vue**      |                                                           9 |
| **Componentes análisis** |                                                           6 |
| **Server services**      |                                                           4 |
| **Tests nuevos**         |                                                        ~120 |
| **Coverage esperado**    | ~40% (desde actual ~74.8% statements, pero nuevos archivos) |

---

## 🎯 Ejecución recomendada

### Orden secuencial (sin overlap)

```
SEMANA 1:
  ├─ Fase 1 (18-20h) → Quick wins + bonus analytics
  └─ Fase 2 PARALELO:
     ├─ #50 + #41 simultáneo (11h)
     ├─ #77 + #78 en serie (14h)
     └─ #45 mercado badge (2h)

SEMANA 2:
  ├─ Fase 1 bonus continuación (#59-88, resto de S)
  ├─ Fase 3 PARALELO:
  │  ├─ #62 (10h) → Motor active_landings
  │  ├─ #51-54-55 en paralelo (16h) → Esperan #50 (ya hecho)
  │  ├─ #19-21, #25 (mercado/IA, 13h) → Independientes
  │  ├─ #59-60-61 (ref_code pipeline, 6h) → Chain pequeña
  │  ├─ #23, #26 (IA + PDF, 5h) → Dependen #7 (ya hecho)
  │  ├─ #73 (3h) → DPA feed
  │  └─ #71 (8h) → Calendario editorial

SEMANA 2-3:
  ├─ #63 (5h) → Esperan #62 (ya hecho)
  └─ Fase 4:
     ├─ #79 (10h) → Coverage tests
     └─ #89 (6-8h) → Form validation

```

### Alternativa: Máximo paralelismo

**Fase 1** → **Fase 2 paralelo** (#50/#41/#77/#78/#45) → **Fase 3 paralelo masivo** → **Fase 4 paralelo**

Resultado: ~2–2.5 semanas si trabajo 24/7, ~2–2.5 semanas si 40h/week (Fase 3 es ancha).

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
- [ ] **BONUS:** #59: ref_code column
- [ ] **BONUS:** #38: buyer_location
- [ ] **BONUS:** #39: time on page
- [ ] **BONUS:** #40: comparisons event
- [ ] **BONUS:** #43: form abandonment
- [ ] **BONUS:** #44: scroll depth
- [ ] **BONUS:** #22: price drop alerts
- [ ] **BONUS:** #84: HEALTH_TOKEN
- [ ] **BONUS:** #85: infra_alerts types
- [ ] **BONUS:** #88: NuxtImg sizes
- [ ] **Verify:** `npm run typecheck && npm run lint && npm run test --coverage`

### Fase 2

- [ ] #50: seller_reviews backend
- [ ] #41: search_logs + admin
- [ ] #77: modularizar endpoints
- [ ] #78: deshardcodear configs
- [ ] **BONUS:** #45: Price badge mercado
- [ ] **Verify:** Coverage no cae, todos tests pasan

### Fase 3

- [ ] #62: active_landings motor
- [ ] #51-55: Reviews display completo
- [ ] #73: DPA feed
- [ ] #71: Calendario editorial
- [ ] #63: Landing pages catálogo
- [ ] **BONUS:** #60: TRC handler WhatsApp
- [ ] **BONUS:** #61: Interactive menu
- [ ] **BONUS:** #19: Market valuation report
- [ ] **BONUS:** #20: Vehicle comparator
- [ ] **BONUS:** #21: Price history chart
- [ ] **BONUS:** #23: IA ficha cobrada
- [ ] **BONUS:** #25: IA price recommendation
- [ ] **BONUS:** #26: PDF certificado + QR
- [ ] **Verify:** `npm run build` sin errores, no hay console warnings

### Fase 4

- [ ] #79: Coverage tests
- [ ] **BONUS:** #89: Form validation library
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
