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

| Bloque                       | Items         | Estado                                                        | Sesiones est. |
| ---------------------------- | ------------- | ------------------------------------------------------------- | ------------- |
| 0 (Errores)                  | #2, #3, #4    | ✅ COMPLETADO (#1 founder, #5 ✅, #6 ✅, #3 hecho por B)     | 0             |
| 1 (Créditos + Suscripciones) | #7, #8, #17   | ✅ COMPLETADO (#17 hecho por B)                              | 0             |
| 2 (Features créditos)        | #9–#16        | ⏳ Disponible — B1 completado, puede iniciar                  | ~11           |
| 10 (DGT Verificación)        | #56–#58, #160 | ⚠️ BLOQUEADO — API externa (preguntar fundadores)             | ~10           |
| 18 (Monetización)            | #142–#145     | ⏳ Disponible — #128 de E entregado ✅                        | ~5            |
| 25 (Monetización Extendida)  | #195–#201     | ⏳ Disponible — #150 de E entregado ✅                        | ~20           |

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

- **Siguiente item:** #9 (Bloque 2 — Features créditos, ahora desbloqueado)
- **Último commit:** `117b767` fix(C4): guard dev-only console.error
- **Bloques completados:** Bloque 0 ✅, Bloque 1 ✅ — **2/6 bloques (~27%)**
- **Items completados:** #2 ✅, #3 ✅ (por B), #4 ✅ · #7 ✅, #8 ✅, #17 ✅ (por B) = 6 items
- **Pendiente:** Bloque 2 (#9-#16, 8 items) · Bloque 10 (#56-#58+#160, 4 items, bloqueado API) · Bloque 18 (#142-#145, 4 items) · Bloque 25 (#195-#201, 7 items) = 23 items
- **Notas:** Sync crítico entregado: #7/#8 ✅ (D puede iniciar Bloque 9). B hizo A's #3 y #17 en paralelo. Branch `agent-a/bloque-1` NO mergeado.

---

## Agente B — SEO + Content + Polish

**Dominio:** SEO técnico, schema JSON-LD, landings, contenido editorial, UX polish, infra docs.

### Bloques (en orden)

| Bloque                     | Items         | Estado                                           | Sesiones est. |
| -------------------------- | ------------- | ------------------------------------------------ | ------------- |
| 3 (SEO Landings)           | #62, #63, #64 | ✅ COMPLETADO                                    | 0             |
| 23 (SEO Avanzado)          | #164–#183     | ✅ COMPLETADO                                    | 0             |
| 24 (Código + UX Polish)    | #184–#194     | ✅ COMPLETADO (+ A's #3 y #17 por overflow)      | 0             |
| 19 (Marketing + Contenido) | #146–#149     | ⏳ Pendiente                                     | ~6            |
| 21 (Operaciones + Calidad) | #153–#158     | ⏳ Pendiente                                     | ~6            |
| 14 (Infra + Documentación) | #96–#100      | ⏳ Pendiente                                     | ~6            |

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

- **Siguiente item:** #146 (Bloque 19 — Marketing + Contenido)
- **Último commit:** `25192ea` chore: mark Bloque 24 COMPLETADO in PARALLEL-AGENTS.md
- **Bloques completados:** Bloque 3 ✅, 23 ✅, 24 ✅ — **3/6 bloques (~68%)**
- **Items completados:** #62–#64 · #164–#183 (20 items) · #184–#194 (11 items) + A's #3, #17 overflow = 36 items
- **Pendiente:** Bloque 19 (#146-#149, 4 items) · Bloque 21 (#153-#158, 6 items) · Bloque 14 (#96-#100, 5 items) = 15 items
- **Notas:** B completó Bloques 23 y 24 por encima de lo previsto. Hizo overflow de A (#3, #17). Branch `agent-b/bloque-23` NO mergeado.

---

## Agente C — Trust + Data + Security

**Dominio:** Seguridad, anti-fraude, trust score, data capture avanzado, auditorías seguridad.

### Bloques (en orden)

| Bloque                     | Items         | Estado                                               | Sesiones est. |
| -------------------------- | ------------- | ---------------------------------------------------- | ------------- |
| 4 (Anti-Fraude)            | #27–#34       | ✅ (#27 ⏳ Fundadores — Twilio · #34 ⏳ Fundadores — CF WAF #1) | 0             |
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

- **Siguiente item:** Sin items propios. Disponible para overflow de otro agente si el usuario lo solicita.
- **Último commit:** `ba2326c` chore(agent-c): session close
- **Bloques completados:** 4, 5, 6a, 6b, 13, 22, 29 — **TODOS LOS BLOQUES ASIGNADOS COMPLETOS**
- **Overflow completado:** #87 · #2/#3 · #29 · #30 (Trust Score 0-100, 50 tests) · #31 (DealerTrustBadge) · #33 (DealerTrustAlert) · #32 (/dashboard/herramientas/puntuacion) · **#121 ✅ (7 composables >500 líneas divididos — 5 nuevos archivos)**
- **Notas:** Migraciones pendientes `supabase db push`: 00135 (buyer_country), 00137 (ENUM types), 00138 (user_fingerprints), 00139 (trust_score)
- **Pendiente Fundadores:** #27 (Twilio: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM) · #34 (necesita CF WAF activo primero = #1)

---

## Agente D — Dealers + Marketing + Lifecycle

**Dominio:** Dealers, newsletters, onboarding emails, WhatsApp, ciclo de vida, auditoría hallazgos.

### Bloques (en orden)

| Bloque                       | Items           | Estado                                              | Sesiones est. |
| ---------------------------- | --------------- | --------------------------------------------------- | ------------- |
| 7 (Content + Marketing)      | #65–#71         | ✅ COMPLETADO                                       | 0             |
| 8 (WhatsApp Funnel)          | #59–#61         | ✅ COMPLETADO                                       | 0             |
| 9 (Monetización "A Definir") | #18–#26         | ⚠️ BLOQUEADO — espera #7/#8 de Agente A             | ~12           |
| 17 (Dealers)                 | #136–#141, #163 | ✅ COMPLETADO                                       | 0             |
| 26 (Ciclo Vida + Post-Venta) | #202–#207       | ✅ COMPLETADO (#135 de E recibido ✅)               | 0             |
| 11 (Hallazgos Auditoría)     | #82–#95         | ⏳ NO INICIADO (branch vacío)                       | ~14           |

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

- **Siguiente item:** #82 (Bloque 11 — Hallazgos Auditoría) · Bloque 9 ⚠️ bloqueado hasta que A entregue #7/#8
- **Último commit:** `357367c` feat(lifecycle): Bloque 26 — Ciclo Vida + Post-Venta (#202-#207)
- **Bloques completados:** Bloque 7 ✅, 8 ✅, 17 ✅, 26 ✅ — **4/6 bloques (50%)**
- **Items completados:** #65–#71 · #59–#61 · #136–#141 · #163 · #202–#207 (23 items)
- **Pendiente:** Bloque 9 (#18–#26, 9 items — bloqueado por A) · Bloque 11 (#82–#95, 14 items — no iniciado)
- **Notas:** D siguió skip-ahead correcto: saltó Bloque 9 (bloqueado) → hizo 17+26 primero. Sin trabajo prematuro. Branch `agent-d/bloque-26` NO mergeado a main.

---

## Agente E — Producto + Data + Tests

**Dominio:** Producto core, vehicle_groups, calidad anuncios, analytics stack, backlog técnico.

### Bloques (en orden)

| Bloque                    | Items                 | Estado                                            | Sesiones est. |
| ------------------------- | --------------------- | ------------------------------------------------- | ------------- |
| 15 (Plataforma Core)      | #124–#128             | ✅ COMPLETADO                                     | 0             |
| 16 (Producto Marketplace) | #129–#135, #161, #162 | ✅ COMPLETADO                                     | 0             |
| 20 (Data + Analytics)     | #150–#152             | ✅ COMPLETADO                                     | 0             |
| 12 (Backlog Técnico)      | #74–#78, #80          | ✅ COMPLETADO (pre-existing)                      | 0             |
| Bloqueados                | #117–#122             | ✅ COMPLETO — #117 ✅ · #118 pre-existing · #119/#120/#122 fuera dominio · #121 ✅ (por C overflow) | 0 |

### Coordinación

- **Migraciones:** 00155–00164 (overflow: 00215–00224)
- **i18n:** `product.`, `quality.`, `analytics.`, `platform.`
- **Branch:** `agent-e/bloque-12` (42 commits, NO mergeado a main)
- **Dueño de:** producto core, vehicle_groups, calidad anuncios, analytics stack
- **NO tocar:** monetización/créditos, SEO/landings, trust/security, dealers/WhatsApp

### Sync — Entregados ✅

- **#128** FeatureGate.vue → entregado. Agente A puede usar.
- **#135** ciclo vida anuncio → entregado. Agente D puede usar.
- **#150** inventario datos → entregado. Agente A puede usar.

### Progreso

- **Siguiente item:** — (todos los items completos)
- **Último commit:** `07264ba` chore: update STATUS.md — Agent E session 3 complete
- **Bloques completados:** 15 ✅, 16 ✅, 20 ✅, 12 ✅ — **TODOS LOS BLOQUES ASIGNADOS COMPLETOS**
- **Items completados:** #124–#128 · #129–#135 · #161 · #162 · #150–#152 · #74–#78 · #80 (pre-existing) · #117 · #118 (pre-existing) · #121 (hecho por C overflow)
- **Pendiente:** —
- **Notas:** E trabajó en orden correcto y entregó los 3 sync críticos (#128/#135/#150). #121 completado por C como overflow: 7 composables >500 líneas divididos, 5 nuevos archivos creados. Branch `agent-e/bloque-12` listo para merge.

---

## Agente F — i18n + Automatización (empieza W8)

**Dominio:** Internacionalización, traducción automática, automatización avanzada.

### Bloques (en orden)

| Bloque                       | Items     | Estado        | Sesiones est. |
| ---------------------------- | --------- | ------------- | ------------- |
| 27 (Internacionalización)    | #208–#211 | ✅ COMPLETADO                                     | 0             |
| 28 (Automatización Avanzada) | #212–#216 | ✅ COMPLETADO                                     | 0             |

### Coordinación

- **Migraciones:** 00165–00174 (overflow: 00225–00234)
- **i18n:** `i18n.`, `auto.`
- **Branch:** `agent-f/bloque-28` (listo para merge)

### Progreso

- **Siguiente item:** — (todos los bloques completos)
- **Último commit:** `4bc701c` docs: all blocks complete — 9/9 items done
- **Bloques completados:** Bloque 27 ✅, Bloque 28 ✅ — **TODOS LOS BLOQUES COMPLETOS**
- **Items completados:**
  - #208 ✅ prefix_except_default + hreflang
  - #209 ✅ translate-batch `vehicles`+`articles` — D Bloque 7 revisado: no añade tipos con `pending_translations`, market_reports ya es per-locale nativo
  - #210 ✅ FTS multilang search function + migration 00166
  - #211 ✅ default_currency + migration 00165 + getCurrency helper
  - #212 ✅ alertas instantáneas Pro (ya implementado)
  - #213 ✅ auto-invoicing: dynamic VAT, Quaderno, export + 47 tests
  - #214 ✅ ad export 5 platforms (ya implementado, 31 tests)
  - #215 ✅ scheduled publishing (verificado + 11 tests + i18n)
  - #216 ✅ AI editorial generation (verificado + 7 tests + i18n)
- **Notas:** ~80 tests nuevos. Migraciones 00165+00166 pendientes `supabase db push`. Bloque 27 queda abierto hasta que D complete Bloque 7.

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

| Agente    | Sesiones restantes | Estado                                                                                        |
| --------- | ------------------ | --------------------------------------------------------------------------------------------- |
| A         | ~36                | **~27% completo** — Bloques 0+1 ✅ · Bloque 2 desbloqueado · Bloques 18+25 disponibles       |
| B         | ~18                | **~68% completo** — Bloques 3+23+24 ✅ · Bloques 19+21+14 pendientes                        |
| **C**     | **0**              | **✅ COMPLETO** — merge pendiente                                                             |
| D         | ~26                | **~50% completo** — Bloques 7/8/17/26 ✅ · Bloque 9 ⚠️ bloqueado (A) · Bloque 11 ⏳ no iniciado |
| **E**     | **0**              | **✅ COMPLETO** — #121 completado por C overflow · merge pendiente                           |
| **F**     | **0**              | **✅ COMPLETO** — merge pendiente                                                            |
| **Total** | **~82**            | —                                                         |
