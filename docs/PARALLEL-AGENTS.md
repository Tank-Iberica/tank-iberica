# Plan de Ejecución Paralela — 5+1 Agentes

> **Creado:** 2026-03-13 | **Duración estimada:** 12 semanas | **Agentes:** 5 simultáneos + 1 diferido (W8)
>
> **Instrucción de inicio/continuación para cada terminal de Claude Code:**
>
> ```
> Lee docs/PARALLEL-AGENTS.md. Eres el Agente [X]. Continúa por donde está tu sección de progreso.
> ```
>
> **Backlog detallado:** `docs/tracciona-docs/BACKLOG-EJECUTABLE.md` — items con ✅ ya están completados.

---

## Reglas de Coordinación

### Migraciones SQL

- **UN SOLO agente crea migraciones a la vez** — ver `MIGRATION_LOCK.md` para números reservados
- Tras cada migración: `npx supabase gen types typescript > types/supabase.ts` + commit
- Último número existente: **00114**

### i18n Keys

Cada agente usa prefijo propio para evitar conflictos en `i18n/es.json` e `i18n/en.json`:

| Agente | Prefijo keys                                      |
| ------ | ------------------------------------------------- |
| A      | `credits.`, `tiers.`, `monetization.`             |
| B      | `seo.`, `landing.`, `content.`, `polish.`         |
| C      | `trust.`, `security.`, `data.capture.`            |
| D      | `dealer.`, `newsletter.`, `lifecycle.`, `audit.`  |
| E      | `product.`, `quality.`, `analytics.`, `platform.` |
| F      | `i18n.`, `auto.`                                  |

### Git Branches

- Formato: `agent-[letra]/bloque-[N]` (ej: `agent-b/bloque-23`)
- Merge a main al completar cada bloque (no al final)
- **`git pull` antes de cada sesión** — los otros agentes habrán mergeado cambios
- Si merge conflict en i18n → resolver aceptando ambos (keys con prefijos distintos)

### Archivos Compartidos (alto riesgo conflicto)

| Archivo                                 | Dueño                 | Otros pueden                   |
| --------------------------------------- | --------------------- | ------------------------------ |
| `nuxt.config.ts`                        | Ninguno               | Solo añadir, no reorganizar    |
| `i18n/es.json` / `i18n/en.json`         | Todos (con prefijos)  | Añadir keys con prefijo propio |
| `types/supabase.ts`                     | Regenerado automático | No editar a mano               |
| `package.json`                          | Ninguno               | Solo añadir deps necesarias    |
| `app/pages/[...slug].vue` (landings)    | **B**                 | E coordina si necesita         |
| `app/pages/vehiculo/[slug].vue`         | **E**                 | B coordina si necesita         |
| `server/services/notifications.ts`      | **D**                 | C coordina si necesita         |
| `server/middleware/security-headers.ts` | **C**                 | Nadie más toca                 |
| `server/middleware/rate-limit.ts`       | **C**                 | Nadie más toca                 |

### Tests

- Cada agente escribe tests para SU código (>80% coverage)
- CI corre TODOS los tests en merge a main
- Coverage gate: **nunca bajar del 74.8% actual**
- Si test de otro agente rompe → el que rompió arregla

### Commits

- Commits **AUTORIZADOS** al completar cada item (no preguntar cada vez)
- Formato: `feat(agent-X): #NNN descripción breve`
- Seguir `CONTRIBUTING.md` para convenciones generales

### Gestión de Memoria (Node)

Con 5+ agentes abiertos, Node consume toda la RAM del sistema. Reglas obligatorias:

1. **Kill Node al cambiar de item:** Antes de empezar cada nuevo item del backlog:
   ```bash
   taskkill /F /IM node.exe 2>nul
   ```
2. **No levantar dev server salvo necesidad:** La mayoría de tareas (escribir código, tests, migraciones) NO necesitan `npm run dev`. Solo levantarlo para verificación visual en navegador.
3. **Máximo 1 dev server simultáneo:** Si necesitas dev server, verifica que ningún otro agente lo tiene corriendo. Los demás trabajan en modo "cold" (edit + test unitario).
4. **Limitar heap por proceso:** Cuando sí necesites Node (dev/build):
   ```bash
   NODE_OPTIONS="--max-old-space-size=512" npm run dev
   NODE_OPTIONS="--max-old-space-size=1024" npm run build
   ```
5. **Tests en single-run, nunca watch:**
   ```bash
   npx vitest run tests/unit/archivo.test.ts
   ```
   Nunca `npx vitest` sin `run` (queda en watch mode consumiendo memoria).
6. **Agente pasivo = 0 procesos Node:** Si estás esperando confirmación del usuario o entre tareas, mata todos tus procesos Node.

### Al terminar cada sesión

1. `taskkill /F /IM node.exe 2>nul`
2. Actualizar la sección "Progreso" de TU agente en ESTE archivo
3. Actualizar STATUS.md si corresponde
4. Commit + push a main (o a tu feature branch)

---

## Agente A — Monetización + Revenue

**Dominio:** Pagos, créditos, suscripciones, Stripe, tiers, features de pago.

### Bloques (en orden)

| Bloque                       | Items         | Estado                                        | Sesiones est. |
| ---------------------------- | ------------- | --------------------------------------------- | ------------- |
| 0 (Errores)                  | #2, #3, #4    | Pendiente (#1 founder, #5 ✅, #6 ✅)          | ~2            |
| 1 (Créditos + Suscripciones) | #7, #8, #17   | Pendiente                                     | ~7            |
| 2 (Features créditos)        | #9–#16        | Pendiente (necesita B1)                       | ~11           |
| 10 (DGT Verificación)        | #56–#58, #160 | Pendiente (bloqueado API externa — preguntar) | ~10           |
| 18 (Monetización)            | #142–#145     | Pendiente (#142 necesita #128 de E)           | ~5            |
| 25 (Monetización Extendida)  | #195–#201     | Pendiente (#198 necesita #150 de E)           | ~20           |

### Coordinación

- **Migraciones:** 00115–00124 (overflow: 00175–00184)
- **i18n:** `credits.`, `tiers.`, `monetization.`
- **Branch:** `agent-a/bloque-X`
- **NO tocar:** landings/SEO, trust/reviews, dealers/WhatsApp, producto/calidad

### Sync — Tú entregas

- **#7 y #8** → Agente D los necesita para Bloque 9 (entregar antes de W3)

### Sync — Tú esperas

- **#128** (FeatureGate) del Agente E → para #142 en Bloque 18
- **#150** (inventario datos) del Agente E → para #198 en Bloque 25

### Progreso

- **Siguiente item:** #4 (10 errores TypeScript restantes — npm run typecheck = 0)
- **Último commit:** feat(agent-a): #3 sanitize brokerage error messages + 20 tests
- **Bloques completados:** —
- **Items completados:** #2 ✅, #3 ✅
- **Notas:** #3: 5 brokerage routes exponían error.message de Supabase. Añadido logger + mensaje genérico. Tests: `api-brokerage-routes.test.ts` (20 tests). Pattern thenable chain + h3 mock a nivel módulo.

---

## Agente B — SEO + Content + Polish

**Dominio:** SEO técnico, schema JSON-LD, landings, contenido editorial, UX polish, infra docs.

### Bloques (en orden)

| Bloque                     | Items         | Estado               | Sesiones est. |
| -------------------------- | ------------- | -------------------- | ------------- |
| 3 (SEO Landings)           | #62, #63, #64 | ✅ COMPLETADO        | 0             |
| 23 (SEO Avanzado)          | #164–#183     | Pendiente (20 items) | ~16           |
| 24 (Código + UX Polish)    | #184–#194     | Pendiente (11 items) | ~10           |
| 19 (Marketing + Contenido) | #146–#149     | Pendiente            | ~6            |
| 21 (Operaciones + Calidad) | #153–#158     | Pendiente            | ~6            |
| 14 (Infra + Documentación) | #96–#100      | Pendiente            | ~6            |

### Coordinación

- **Migraciones:** 00125–00134 (overflow: 00185–00194)
- **i18n:** `seo.`, `landing.`, `content.`, `polish.`
- **Branch:** `agent-b/bloque-X`
- **Dueño de:** `[...slug].vue` (landings), `robots.txt`, schema JSON-LD, SEO
- **NO tocar:** monetización/créditos, trust/reviews, dealers/WhatsApp, producto core

### Sync

**Sin dependencias.** Velocidad máxima.
Si necesitas editar `vehiculo/[slug].vue` → coordina con Agente E.

### Progreso

- **Siguiente item:** #164 (texto auto-generado en landings con datos reales)
- **Último commit:** —
- **Bloques completados:** Bloque 3
- **Notas:** —

---

## Agente C — Trust + Data + Security

**Dominio:** Seguridad, anti-fraude, trust score, data capture avanzado, auditorías seguridad.

### Bloques (en orden)

| Bloque                     | Items         | Estado                                               | Sesiones est. |
| -------------------------- | ------------- | ---------------------------------------------------- | ------------- |
| 4 (Anti-Fraude)            | #28–#34       | ✅ (solo #27 deferred — Twilio)                      | 0             |
| 5 (Reviews)                | #50–#55       | ✅ COMPLETADO                                        | 0             |
| 6a (Data Capture Rápido)   | #35–#48       | ✅ COMPLETADO                                        | 0             |
| 6b (Data Capture Avanzado) | #38, #39, #40 | ✅ COMPLETADO                                        | 0             |
| 13 (Retargeting)           | #72, #73      | ✅ COMPLETADO (#73 ya existía)                       | 0             |
| 22 (Seguridad 5 Pilares)   | #159          | ✅ COMPLETADO (179 tests, securityEvents.ts)          | 0             |
| 29 (Seguridad + Legal)     | #217–#224     | ✅ COMPLETADO (security.txt, GDPR, securityEvents integration, admin API) | 0 |

### Coordinación

- **Migraciones:** 00135–00144 (overflow: 00195–00204)
- **i18n:** `trust.`, `security.`, `data.capture.`
- **Branch:** `agent-c/bloque-X`
- **Dueño de:** `security-headers.ts`, `rate-limit.ts`, archivos de seguridad
- **NO tocar:** monetización/créditos, SEO/landings, dealers/WhatsApp, producto core
- Si necesitas editar `notifications.ts` → coordina con Agente D

### Sync

**Sin dependencias.** Muchos bloques ya completados — irás rápido.
**Cuando termines (~W10):** avisa al usuario para recibir overflow de otro agente.

### Progreso

- **Siguiente item:** Pedir overflow de otro agente o siguiente bloque asignado
- **Último commit:** `de80cc0` feat(agent-c): #218-#222 Block 29 Seguridad+Legal
- **Bloques completados:** 4, 5, 6a, 6b, 13, 22, 29 — **TODOS LOS BLOQUES ASIGNADOS COMPLETOS**
- **Notas:** Migration 00135 (buyer_country en analytics_events) — pendiente `supabase db push`

---

## Agente D — Dealers + Marketing + Lifecycle

**Dominio:** Dealers, newsletters, onboarding emails, WhatsApp, ciclo de vida, auditoría hallazgos.

### Bloques (en orden)

| Bloque                       | Items           | Estado                              | Sesiones est. |
| ---------------------------- | --------------- | ----------------------------------- | ------------- |
| 7 (Content + Marketing)      | #65–#71         | Pendiente                           | ~13           |
| 8 (WhatsApp Funnel)          | #59–#61         | ✅ COMPLETADO                       | 0             |
| 9 (Monetización "A Definir") | #18–#26         | Pendiente ⚠️ (necesita #7/#8 de A)  | ~12           |
| 17 (Dealers)                 | #136–#141, #163 | Pendiente                           | ~10           |
| 26 (Ciclo Vida + Post-Venta) | #202–#207       | Pendiente (#205 necesita #135 de E) | ~6            |
| 11 (Hallazgos Auditoría)     | #82–#95         | Pendiente                           | ~14           |

### Coordinación

- **Migraciones:** 00145–00154 (overflow: 00205–00214)
- **i18n:** `dealer.`, `newsletter.`, `lifecycle.`, `audit.`
- **Branch:** `agent-d/bloque-X`
- **Dueño de:** dealers, WhatsApp, newsletters, portal dealer
- **NO tocar:** monetización core/créditos, SEO/landings, trust/security, producto core
- Si necesitas editar `notifications.ts` → coordina con Agente C

### Sync — Tú esperas

- **#7, #8** del Agente A → para Bloque 9. **Si no están → salta a Bloque 17** y vuelve después.
- **#135** (ciclo vida) del Agente E → para #205 en Bloque 26.

### Progreso

- **Siguiente item:** #65 (Newsletter "El Industrial" — cron semanal)
- **Último commit:** —
- **Bloques completados:** Bloque 8
- **Notas:** —

---

## Agente E — Producto + Data + Tests

**Dominio:** Producto core, vehicle_groups, calidad anuncios, analytics stack, backlog técnico.

### Bloques (en orden)

| Bloque                    | Items                 | Estado                     | Sesiones est. |
| ------------------------- | --------------------- | -------------------------- | ------------- |
| 15 (Plataforma Core)      | #124–#128             | Pendiente                  | ~7            |
| 16 (Producto Marketplace) | #129–#135, #161, #162 | Pendiente                  | ~16           |
| 20 (Data + Analytics)     | #150–#152             | Pendiente                  | ~14           |
| 12 (Backlog Técnico)      | #74–#78, #80          | Pendiente (#79 ✅, #81 ✅) | ~11           |
| Bloqueados                | #117–#122             | Al final                   | ~6            |

### Coordinación

- **Migraciones:** 00155–00164 (overflow: 00215–00224)
- **i18n:** `product.`, `quality.`, `analytics.`, `platform.`
- **Branch:** `agent-e/bloque-X`
- **Dueño de:** producto core, vehicle_groups, calidad anuncios, analytics stack
- **NO tocar:** monetización/créditos, SEO/landings, trust/security, dealers/WhatsApp
- Si necesitas editar `vehiculo/[slug].vue` → coordina con Agente B

### Sync — Tú entregas (¡PRIORIZA estos items!)

- **#128** (FeatureGate.vue) → Agente A lo necesita para Bloque 18. **Hazlo PRONTO en Bloque 15.**
- **#135** (ciclo vida anuncio) → Agente D lo necesita para Bloque 26. **Hazlo en Bloque 16.**
- **#150** (inventario datos) → Agente A lo necesita para #198 en Bloque 25.

### Progreso

- **Siguiente item:** #124 (auditoría hardcoding — 4 capas de impacto)
- **Último commit:** —
- **Bloques completados:** —
- **Notas:** —

---

## Agente F — i18n + Automatización (empieza W8)

**Dominio:** Internacionalización, traducción automática, automatización avanzada.

### Bloques (en orden)

| Bloque                       | Items     | Estado    | Sesiones est. |
| ---------------------------- | --------- | --------- | ------------- |
| 27 (Internacionalización)    | #208–#211 | Pendiente | ~8            |
| 28 (Automatización Avanzada) | #212–#216 | Pendiente | ~10           |

### Coordinación

- **Migraciones:** 00165–00174 (overflow: 00225–00234)
- **i18n:** `i18n.`, `auto.`
- **Branch:** `agent-f/bloque-X`
- **Prerequisito:** UI estable (Agentes B, C, D deben haber terminado cambios principales)
- Si UI no estable → empezar por **Bloque 28** (automatización, menos dependencia UI)

### Progreso

- **Siguiente item:** #213 (facturación automática Stripe + software contable)
- **Último commit:** feat(agent-f): #212 instant Pro alerts (3315eba)
- **Bloques completados:** —
- **Items completados:** #212 ✅
- **Notas:** Empezado por Bloque 28 (automatización). Migration 00165 pendiente de `supabase db push`.

---

## Puntos de Sincronización

| Sync | Quién espera  | Qué necesita     | Quién entrega | Cuándo | Margen       |
| ---- | ------------- | ---------------- | ------------- | ------ | ------------ |
| S1   | A (Bloque 18) | #128 FeatureGate | E (Bloque 15) | ~W2    | ~5 semanas   |
| S2   | D (Bloque 9)  | #7, #8 créditos  | A (Bloque 1)  | ~W2.2  | ~1 semana    |
| S3   | D (Bloque 26) | #135 ciclo vida  | E (Bloque 16) | ~W5    | ~3 semanas   |
| S4   | A (Bloque 25) | #150 inventario  | E (Bloque 20) | ~W5.5  | ~2.5 semanas |
| S5   | F (Bloque 27) | UI estable       | B, C, D       | W8+    | Variable     |

---

## Checkpoint W6

En la semana 6 evaluar:

1. ¿Quién va adelantado? → Toma overflow del más lento
2. ¿Quién va retrasado? → Recibe ayuda del más libre
3. ¿Bloques ya no necesarios? → Eliminar y redistribuir
4. ¿Nuevas dependencias? → Reasignar

**Candidato a terminar primero:** Agente C (muchos bloques ya hechos, ~17 sesiones restantes).

---

## Resumen

| Agente    | Sesiones restantes | Semanas est. | Primer item |
| --------- | ------------------ | ------------ | ----------- |
| A         | ~55                | ~11          | #2          |
| B         | ~44                | ~9           | #164        |
| C         | ~17                | ~3.5         | #38         |
| D         | ~55                | ~11          | #65         |
| E         | ~54                | ~11          | #124        |
| F         | ~18                | ~3.5         | W8          |
| **Total** | **~243**           | **~12**      | —           |
