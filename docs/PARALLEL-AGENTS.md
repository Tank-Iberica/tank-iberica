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

### Al terminar cada sesión

1. Actualizar la sección "Progreso" de TU agente en ESTE archivo
2. Actualizar STATUS.md si corresponde
3. Commit + push a main (o a tu feature branch)

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

- **Siguiente item:** #3 (5 server routes exponen service names en errores — wrap en safeError)
- **Último commit:** feat(agent-a): #2 tests ownership validation verify-document 11/11 pass
- **Bloques completados:** —
- **Items completados:** #2 ✅
- **Notas:** #2 ya tenía el código de ownership implementado; faltaba el test file. Creado `tests/unit/server/api-verify-document.test.ts` con 11 tests cubriendo 401, 403 (2 casos), 200 owner, 200 admin, 404 vehicle, 404 doc, AI match, AI mismatch, AI fallback, 500 update.

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

- **Siguiente item:** #167 (Schema ItemList en catálogo)
- **Último commit:** `5d7eef5` feat(agent-b): #166 inject FAQPage schema in [...slug].vue landing pages
- **Bloques completados:** Bloque 3
- **Notas:** #164 ✅ cron intro_text ES/EN (45 tests). #165 ✅ Merchant feed gate. #166 ✅ buildFaqPageSchema pure util + useJsonLd inject (15 tests).

---

## Agente C — Trust + Data + Security

**Dominio:** Seguridad, anti-fraude, trust score, data capture avanzado, auditorías seguridad.

### Bloques (en orden)

| Bloque                     | Items         | Estado                                               | Sesiones est. |
| -------------------------- | ------------- | ---------------------------------------------------- | ------------- |
| 4 (Anti-Fraude)            | #28–#34       | ✅ (solo #27 deferred — Twilio)                      | 0             |
| 5 (Reviews)                | #50–#55       | ✅ COMPLETADO                                        | 0             |
| 6a (Data Capture Rápido)   | #35–#48       | ✅ COMPLETADO                                        | 0             |
| 6b (Data Capture Avanzado) | #38, #39, #40 | Pendiente (#43 ✅, #44 ✅, #45 ✅, #46/#49 deferred) | ~3            |
| 13 (Retargeting)           | #72, #73      | Pendiente                                            | ~2            |
| 22 (Seguridad 5 Pilares)   | #159          | Pendiente (item grande — L)                          | ~5            |
| 29 (Seguridad + Legal)     | #217–#224     | Pendiente (8 items)                                  | ~7            |

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

- **Siguiente item:** #39 (tiempo en página por vehículo)
- **Último commit:** `34aedce` feat(agent-c): #38 buyer geo origin
- **Bloques completados:** 4, 5, 6a
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

- **Siguiente item:** #208 (slugs traducidos + hreflang) o #212 (alertas instantáneas Pro)
- **Último commit:** —
- **Bloques completados:** —
- **Notas:** No iniciar hasta semana 8.

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
