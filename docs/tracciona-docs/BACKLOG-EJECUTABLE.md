# Backlog Ejecutable — Tracciona

> **Generado:** 2026-03-12 · **Actualizado:** 2026-03-14 | **Items:** ~404 (122 originales + 39 Plan Maestro + 47 Pre-Launch + 25 DEFERRED + 59 FUTURO + 20 auditoría 1ª + 83 roadmap 100/100 + ~11 done) | **Fuentes:** STATUS.md, ESTRATEGIA-NEGOCIO.md, PROYECTO-CONTEXTO.md, AUDITORIA-26-FEBRERO.md, FLUJOS-OPERATIVOS.md, CRON-JOBS.md, PLAN-MAESTRO-10-DE-10.md, auditoría IA externa (14-mar-2026), roadmap 100/100 (14-mar-2026)
>
> **Leyenda esfuerzo:** S = 1 sesion (~2h) | M = 2-3 sesiones | L = 4-6 sesiones | XL = 7+ sesiones
>
> **Leyenda tipo:** Code = implementacion | Config = dashboard/infra | Founder = tarea humana no-codigo
>
> **Criterio de prioridad:** Impacto en revenue x urgencia de seguridad x desbloqueo de otras features

---

## Fase 1 — Seguridad + Cimientos de Revenue (Semanas 1-3)

### Bloque 0: Errores Activos (P0-P2)

Criterio: Resolver antes de cualquier feature nueva. Seguridad y estabilidad.

| #   | Item                                                  | Esfuerzo | Tipo           | Depende de | Hecho cuando...                                                                                                                     |
| --- | ----------------------------------------------------- | -------- | -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rate limiting en produccion — reglas CF WAF           | S        | Config/Founder | —          | CF WAF dashboard tiene reglas activas, test con curl devuelve 429 tras umbral                                                       |
| 2   | `/api/verify-document` sin validacion ownership       | S        | Code           | ✅ done    | checkVehicleAccess() verifica dealer_id==session.user.dealer OR role=admin; 403 si no coincide                                      |
| 3   | 5 server routes exponen nombres servicio en error     | S        | Code           | ✅ agent-c | merchant-feed.get.ts + embed/[dealer-slug].get.ts: error.message → logger.error + generic text; safeError ya cubre el resto en prod |
| 4   | 10 errores TypeScript restantes                       | M        | Code           | ✅ done    | `npm run typecheck` = 0 errores                                                                                                     |
| 5   | 2 test stubs en useVehicles.test.ts                   | S        | Code           | ✅ done    | Tests implementados o marcados `it.skip()` con TODO                                                                                 |
| 6   | exceljs no incluido en manualChunks                   | S        | Code           | ✅ done    | `npm run build` muestra chunk `vendor-excel` separado                                                                               |
| 209 | validateBody expone errores Zod al cliente            | S        | Code           | —          | `validateBody.ts` usa safeError() o mensaje genérico "Datos inválidos"; detalle solo en logger                                      |
| 210 | eslint.config.mjs no ignora .claude/\*\* ni worktrees | S        | Code           | —          | `.claude/**`, `Tracciona-agent-c/**`, `.claude/worktrees/**`, `.pdf-build/**` añadidos a ignores                                    |

**Total Bloque 0:** ~5 sesiones | **Desbloquea:** Nada (higiene)

---

### Bloque 1: Cimiento Monetizacion (creditos + suscripciones)

Criterio: Sin esto, ningun feature de pago funciona. Prerequisito de Bloque 2.

| #   | Item                                                         | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                  |
| --- | ------------------------------------------------------------ | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| 7   | Actualizar seed credit_packs (5 packs nuevos con bonus)      | S        | Code | —          | `credit_packs` en BD tiene 5 filas con amounts correctos (1/3/10+1/25+3/50+10)                                   |
| 8   | Tiers Classic EUR19 / Premium EUR39 con Stripe subscriptions | L        | Code | —          | Tabla `subscription_tiers` con 3 filas, Stripe Products creados, checkout funciona, webhook actualiza tier en BD |
| 17  | Frontend pagina compra creditos completa                     | M        | Code | #7         | Pagina `/precios` muestra 5 packs, click abre Stripe Checkout, vuelta con success actualiza balance              |

**Total Bloque 1:** ~7 sesiones | **Desbloquea:** Bloque 2 completo

---

### Bloque 3: Motor SEO Landings (trafico organico)

Criterio: Sin landings, 0 trafico organico. No depende de monetizacion.

| #   | Item                                                 | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                             |
| --- | ---------------------------------------------------- | -------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| 62  | Motor recalculo active_landings — cron/edge function | L        | Code | —          | Cron semanal ejecuta, `active_landings` tiene >0 filas, combinaciones con vehiculos se activan, sin vehiculos se desactivan |
| 63  | Catalogo real en landing pages [...slug].vue         | M        | Code | #62        | Landing `/camiones-segunda-mano-madrid` muestra VehicleGrid filtrado con vehiculos reales                                   |
| 64  | Schema Vehicle JSON-LD en fichas                     | S        | Code | —          | `<script type="application/ld+json">` usa `@type: Vehicle` con brand, model, mileageFromOdometer                            |

**Total Bloque 3:** ~7 sesiones | **Desbloquea:** Indexacion Google, trafico organico

---

## Fase 2 — Features de Revenue (Semanas 3-6)

### Bloque 2: Features que consumen creditos

Criterio: Cada uno genera revenue directo. Requiere Bloque 1.

| #   | Item                                                  | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                            |
| --- | ----------------------------------------------------- | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 9   | vehicle_unlocks — desbloqueo early access (1 credito) | M        | Code | #7, #8     | Click "Desbloquear" deduce 1 credito, INSERT en vehicle_unlocks, vehiculo visible sin esperar visible_from |
| 10  | Anuncio Protegido (2 creditos)                        | M        | Code | #7         | Flag `is_protected` en vehiculo, inmune a Reserva Prioritaria, salta delay oculto                          |
| 11  | Reserva Prioritaria completa (2 creditos)             | L        | Code | #7, #10    | Buyer paga 2 creditos, anuncio pausado 48h, refund automatico si vendedor no responde, Premium inmune      |
| 12  | Enforcement tier en alertas busqueda                  | M        | Code | #8         | Cron search-alerts envia: Basic=semanal, Classic=diario, Premium=inmediato                                 |
| 13  | Enforcement tier en price-drop                        | S        | Code | #8, #12    | Mismo patron que #12 aplicado a price-drop-alerts                                                          |
| 14  | Auto-renovar y auto-destacar (Premium toggle)         | M        | Code | #8         | Toggle en dashboard dealer, cron descuenta 1 credito por ejecucion, vehiculo renovado/destacado            |
| 15  | Color/fondo/marco especial anuncios (2 creditos)      | M        | Code | #7         | Dealer selecciona estilo, paga 2 creditos, VehicleCard renderiza con estilo especial                       |
| 16  | Exportar catalogo gated por creditos                  | S        | Code | #7, #8     | Basic/Classic paga 1 credito, Premium incluido. Descarga CSV/XLSX                                          |

**Total Bloque 2:** ~11 sesiones | **Desbloquea:** Revenue directo

### Bloque 2b: Combos y Lotes (producto)

Criterio: Revenue adicional por venta conjunta. Infraestructura de vehicle_groups (migration 00155) ya existe con group_type='lot'.

| #   | Item                                                      | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                                                                                                            |
| --- | --------------------------------------------------------- | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 211 | Sistema Combos producto (cabeza tractora + semirremolque) | L        | Code | #7         | Dealer crea combo (2+ vehículos vinculados), precio conjunto con descuento, ficha pública muestra combo completo, búsqueda filtrable por "combos disponibles", analytics de conversión combo vs individual |

**Total Bloque 2b:** ~5 sesiones | **Desbloquea:** Revenue por bundles

---

### Bloque 6a: Data Capture Rapido (quick wins)

Criterio: Cada uno es S, datos valiosos para futuro. Sin dependencias.

| #   | Item                                                         | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                |
| --- | ------------------------------------------------------------ | -------- | ---- | ---------- | ------------------------------------------------------------------------------ |
| 35  | Sale price obligatorio en SoldModal                          | S        | Code | —          | Modal no permite cerrar sin precio real. Campo guardado en BD                  |
| 36  | Precio negociado/descuento en lead                           | S        | Code | —          | Campo `negotiated_price` en leads, visible al cerrar lead                      |
| 37  | Motivo de no-venta al retirar vehiculo                       | S        | Code | —          | Select "Por que retiras?" con opciones, guardado en BD                         |
| 41  | Busquedas sin resultados — log + dashboard admin             | M        | Code | —          | search_logs guarda results_count=0, admin ve "Top 20 busquedas sin resultados" |
| 42  | UTM attribution en analytics_events                          | S        | Code | —          | utm_source/medium/campaign capturados en metadata de eventos                   |
| 47  | Device/platform en eventos                                   | S        | Code | —          | userAgent parseado y guardado en analytics_events                              |
| 48  | Velocidad onboarding — tiempo registro a primera publicacion | S        | Code | —          | Metrica calculable desde timestamps existentes en BD                           |

**Total Bloque 6a:** ~7 sesiones | **Desbloquea:** Datos para Bloque 9

---

## Fase 3 — Confianza y Reputacion (Semanas 6-9)

### Bloque 4: Anti-Fraude Silent Safety

Criterio: Trust Score es prerequisito de badges, alertas, y reputacion publica.

| #   | Item                                                  | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                                                                                                       |
| --- | ----------------------------------------------------- | -------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30  | Trust Score 0-100 calculo automatico                  | L        | Code | —          | ✅ agent-c — 9 criterios, cron diario, composable, 50 tests                                                                                                                                           |
| 31  | Badges publicos (sin/<60, Verificado 60-79, Top >=80) | M        | Code | #30        | ✅ agent-c — DealerTrustBadge component, VehicleCard + DetailSeller, 9 tests                                                                                                                          |
| 32  | Guia "Mejora tu puntuacion" en dashboard              | S        | Code | #30        | ✅ agent-c — /dashboard/herramientas/puntuacion, progress bar, criteria list, i18n ES+EN                                                                                                              |
| 33  | Alertas contextuales al comprador                     | M        | Code | #30        | ✅ agent-c — DealerTrustAlert component, new account/low trust/few photos alerts, 10 tests                                                                                                            |
| 27  | Phone verification SMS OTP                            | M        | Code | —          | ⏳ Fundadores — requiere cuenta Twilio + API key. Cuando esté configurado: al crear primera publicacion, dealer recibe SMS con codigo, verificado queda en profile                                    |
| 28  | Duplicate detection (hash imagenes + titulo)          | L        | Code | —          | Al publicar, sistema detecta duplicados potenciales, admin ve lista, seller recibe aviso                                                                                                              |
| 29  | IP/device fingerprint (background)                    | M        | Code | ✅ agent-c | migration 00138 (user_fingerprints + duplicate_device_users view + upsert_user_fingerprint RPC); recordFingerprint.ts fire-and-forget util; /api/auth/fp endpoint; AdminFingerprintFlags.vue; 8 tests |
| 34  | Excepcion fleet companies rate limit                  | S        | Code | #1         | ⏳ Fundadores — depende de #1 (CF WAF rules activas). Cuando #1 esté hecho: subscription_tier >= basic o verificado manual → rate limit 500/hora                                                      |

**Total Bloque 4:** ~12 sesiones | **Desbloquea:** Bloque 5 (reputation)

---

### Bloque 5: Reviews y Reputacion

Criterio: Requiere Trust Score basico (#30) para integracion completa.

| #   | Item                               | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                     |
| --- | ---------------------------------- | -------- | ---- | ---------- | ----------------------------------------------------------------------------------- |
| 50  | Backend seller_reviews completo    | M        | Code | —          | API crear/consultar/moderar reviews funciona, tabla con RLS                         |
| 51  | Display reviews en perfil dealer   | M        | Code | #50        | Lista reviews + AggregateRating en pagina dealer                                    |
| 52  | Reviews con dimensiones JSONB      | S        | Code | #50        | 4 dimensiones (communication, accuracy, condition, logistics) guardadas y mostradas |
| 53  | NPS 0-10 en reviews                | S        | Code | #50        | Campo NPS en formulario review, guardado, promedio visible                          |
| 54  | Badge Top-Rated filtrable          | S        | Code | #50, #30   | Filtro en catalogo "Solo Top-Rated", badge en card                                  |
| 55  | Scoreboard publico Top 100 dealers | M        | Code | #50, #30   | Pagina `/top-dealers` con ranking ordenado por rating                               |

**Total Bloque 5:** ~7 sesiones | **Desbloquea:** Reputacion publica, SEO

---

## Fase 4 — Crecimiento y Contenido (Semanas 9-13)

### Bloque 7: Content & Marketing Automation

| #   | Item                                                  | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                          |
| --- | ----------------------------------------------------- | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------- |
| 65  | Newsletter "El Industrial" — cron semanal             | M        | Code | —          | Cron selecciona 5 vehiculos destacados + 1 dato mercado, envia via Resend a suscriptores |
| 66  | Secuencia emails onboarding dealers (5 emails en 14d) | M        | Code | —          | Trigger post-registro, 5 emails espaciados, cada uno con contenido diferente             |
| 67  | Informe mercado trimestral PDF (lead magnet)          | L        | Code | —          | PDF generado con datos reales, descargable a cambio de email, almacenado en storage      |
| 68  | Social auto-post OAuth2 real                          | L        | Code | —          | OAuth flow para LinkedIn/FB/IG/X, publicacion automatica al aprobar vehiculo             |
| 69  | WhatsApp Channel auto-post                            | M        | Code | —          | INSERT en vehicles dispara mensaje al canal difusion WhatsApp Business                   |
| 70  | Pinterest auto-pin                                    | S        | Code | —          | Cada vehiculo nuevo genera pin via Pinterest API                                         |
| 71  | Calendario editorial visual en admin                  | L        | Code | —          | Vista semanal/mensual de publicaciones planificadas, drag & drop                         |

**Total Bloque 7:** ~13 sesiones

---

### Bloque 8: WhatsApp External Funnel

| #   | Item                                   | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                     |
| --- | -------------------------------------- | -------- | ---- | ---------- | ------------------------------------------------------------------- |
| 59  | Columna ref_code en vehicles (TRC-001) | S        | Code | —          | Migracion anade columna, trigger auto-genera codigo unico al INSERT |
| 60  | Handler TRC-XXX en webhook WhatsApp    | M        | Code | #59        | Mensaje con "TRC-123" devuelve datos vehiculo + enlace ficha        |
| 61  | Menu interactivo si no hay ref_code    | M        | Code | #60        | "Que buscas? 1 Camion 2 Excavadora..." con botones interactivos     |

**Total Bloque 8:** ~4 sesiones

---

### Bloque 13: Retargeting

| #   | Item                                                           | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                    |
| --- | -------------------------------------------------------------- | -------- | ------ | ---------- | ---------------------------------------------------------------------------------- |
| 72  | GTM como contenedor unico (Meta Pixel + Google Tag + LinkedIn) | S        | Config | —          | GTM container con 3 tags configurados y disparando                                 |
| 73  | Feed DPA compatible con Meta                                   | S        | Code   | —          | `/api/feed/products.xml` genera formato compatible con Dynamic Product Ads de Meta |

**Total Bloque 13:** ~2 sesiones

---

## Fase 5 — Datos Avanzados y Monetizacion Premium (Semanas 13-18)

### Bloque 6b: Data Capture Avanzado

| #   | Item                                             | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                 |
| --- | ------------------------------------------------ | -------- | ---- | ---------- | --------------------------------------------------------------- |
| 38  | Origen geografico comprador                      | S        | Code | —          | buyer_location obligatorio o inferido de IP, guardado en evento |
| 39  | Tiempo en pagina por vehiculo                    | S        | Code | —          | Evento con page_duration_seconds al salir de ficha              |
| 40  | Comparaciones (2+ vehiculos similares en sesion) | S        | Code | —          | Evento logged cuando user ve vehiculos similares                |
| 43  | Form abandonment                                 | S        | Code | —          | Evento form_abandon con step_reached y time_spent               |
| 44  | Scroll depth en ficha                            | S        | Code | —          | Evento scroll_depth con porcentaje (25/50/75/100)               |
| 45  | Precio relativo al mercado (badge/indicador)     | M        | Code | —          | Badge "X% por encima/debajo del mercado" en ficha vehiculo      |
| 46  | Compradores cross-vertical                       | S        | Code | —          | user_id trackeado entre verticales TradeBase (futuro)           |
| 49  | Network graph / supply chain intelligence        | XL       | Code | —          | buyer_company_type ENUM, analisis flujos (mes 5-6+)             |

**Total Bloque 6b:** ~8 sesiones

---

### Bloque 9: Monetizacion "A definir"

Criterio: Requieren masa critica de datos y transacciones para ser utiles.

| #   | Item                                        | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                          |
| --- | ------------------------------------------- | -------- | ---- | ---------- | ---------------------------------------------------------------------------------------- |
| 18  | Alerta premium personalizada (granular)     | M        | Code | #8         | Config granular (marca/modelo/anyo/km/zona/precio) guardada, alertas enviadas segun tier |
| 19  | Informe valoracion de mercado               | M        | Code | —          | "Este vehiculo vale EUR X segun historico, esta X% por encima/debajo" con datos reales   |
| 20  | Comparador vehiculos premium                | M        | Code | —          | Pagina comparar 2-3 vehiculos con metricas mercado, basico gratis, avanzado con creditos |
| 21  | Historial precio vehiculo                   | M        | Code | —          | Grafico "Empezo a EUR 55K, bajo a EUR 48K en 3 meses" con datos price_history            |
| 22  | Alertas bajada con umbral                   | S        | Code | —          | "Avisame cuando ESTE vehiculo baje de EUR 40K" — campo threshold en alerta               |
| 23  | Generacion IA ficha cobrada (1 credito)     | S        | Code | #7         | Pipeline WhatsApp existe, cobro de 1 credito al generar ficha                            |
| 24  | Estadisticas rendimiento anuncio detalladas | M        | Code | #8         | Dashboard con comparativa mercado + recomendaciones precio                               |
| 25  | Recomendacion precio IA                     | M        | Code | —          | "Basado en 230 vehiculos similares, precio optimo EUR 42K-EUR 46K"                       |
| 26  | Certificado publicacion PDF con QR          | M        | Code | #7         | PDF generado con QR verificable, descargable por 1 credito                               |

**Total Bloque 9:** ~12 sesiones

---

### Bloque 10: DGT y Verificacion Real

| #   | Item                                             | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                     |
| --- | ------------------------------------------------ | -------- | ---- | ---------- | ------------------------------------------------------------------- |
| 56  | Conectar API real (InfoCar/CarVertical)          | L        | Code | —          | dgt-report.post.ts usa API real, devuelve datos reales de matricula |
| 57  | Km Score badge con logica real (ITVs)            | M        | Code | #56        | KmScoreBadge calcula progresion real de ITV, no mock                |
| 58  | Compliance tracking (Euro standard, ITV, cargas) | M        | Code | #56        | Datos parseados de documento tecnico, mostrados en ficha            |

**Total Bloque 10:** ~8 sesiones

---

## Fase 6 — Pulido Tecnico (Semanas 18-22)

### Bloque 11: Hallazgos Auditoria

| #   | Item                                        | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                       |
| --- | ------------------------------------------- | -------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 82  | ~115 strings admin sin i18n                 | M        | Code   | —          | Todos los strings en admin usan $t(), archivos i18n actualizados                                                                                      |
| 83  | CSP unsafe-inline/unsafe-eval               | M        | Code   | —          | CSP nonce-based (cuando Nuxt 4 estable) + reporting endpoint                                                                                          |
| 84  | HEALTH_TOKEN no configurado                 | S        | Config | —          | Variable en .env + Cloudflare, health endpoint protegido                                                                                              |
| 85  | infra_alerts no existe en types/supabase.ts | S        | Code   | —          | `npx supabase gen types` ejecutado, tipos regenerados                                                                                                 |
| 86  | CHECK constraints limitados                 | S        | Code   | ✅ agent-c | migration 00136: CHECK en auction_bids.amount_cents, payments.amount_cents, payments.status IN(...), balance.importe, balance.coste_asociado          |
| 87  | VARCHAR statuses a ENUMs                    | M        | Code   | ✅ agent-c | migration 00137: 8 ENUM types (payment/lead/subscription/auction/verification/reservation/comment/social_post_status) + types/supabase.ts actualizado |
| 88  | sizes en imagenes responsive (NuxtImg)      | M        | Code   | —          | Todas las NuxtImg tienen atributo `sizes` apropiado                                                                                                   |
| 89  | Libreria validacion forms (Zod/VeeValidate) | L        | Code   | —          | Formularios criticos usan validacion con mensajes descriptivos                                                                                        |
| 90  | ARIA live regions contenido dinamico        | M        | Code   | —          | Regiones dinamicas (catalogo, chat, notificaciones) tienen aria-live                                                                                  |
| 91  | Virtual scroll en listas grandes            | M        | Code   | —          | Catalogos >100 items usan virtual scroll, DOM <50 nodos visibles                                                                                      |
| 92  | Backup originales imagenes documentado      | S        | Config | —          | Proceso documentado en DISASTER-RECOVERY.md                                                                                                           |
| 93  | OpenAPI/Swagger spec                        | L        | Code   | —          | Spec generada automaticamente o mantenida, accesible en /api/docs                                                                                     |
| 94  | JSDoc incompleto en composables             | M        | Code   | —          | Composables publicos tienen JSDoc con @param y @returns                                                                                               |
| 95  | Snyk en CI                                  | S        | Config | ✅ agent-c | ci.yml: job snyk (opt-in via vars.SNYK_ENABLED=true, --severity-threshold=high --fail-on=all)                                                         |

**Total Bloque 11:** ~14 sesiones

---

### Bloque 12: Backlog Tecnico

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 74  | Tests seguridad expandidos (IDOR, rate limit, info leak)   | M        | Code   | ✅ agent-c | idor-protection.test.ts (270L) + rate-limiting.test.ts + information-leakage.test.ts + referencia/RATE-LIMITING-RULES.md (reglas, CF WAF config, auto-ban, composite key)                                                                                                                       |
| 75  | CSP nonce-based + reporting + auditoria licencias          | M        | Code   | #83        | Resolver junto con #83. **Entregables:** editar `security-headers.ts`, crear `csp-report.post.ts`, `scripts/audit-licenses.mjs`. **Dep:** Nuxt 4 estable                                                                                                                                        |
| 76  | Test restore backup en BD temporal (Neon) + mirror repo    | M        | Config | —          | Restore ejecutado en Neon free, datos verificados, documentado. **Entregables:** `scripts/test-restore.sh` (ampliar), `.github/workflows/mirror.yml`. **Prereq humano:** crear cuenta Neon + Bitbucket + GitHub Secrets                                                                         |
| 77  | Modularizacion endpoints largos restantes                  | M        | Code   | —          | Ningun endpoint >200 lineas, logica extraida a services/. **Entregables:** 4 archivos en `server/services/` (imageUploader, vehicleCreator, whatsappProcessor, notifications) — whatsapp/process ya hecho, verificar otros                                                                      |
| 78  | Deshardcodear: aiConfig, siteConfig, Supabase ref, prompts | M        | Code   | —          | Configuracion centralizada en archivos config, no dispersa en codigo. **Entregables:** `server/utils/aiConfig.ts`, `server/utils/siteConfig.ts`, mover Supabase project ref a secret, categorias prompt Claude desde BD                                                                         |
| 79  | Cobertura tests 15% a 40% + coverage gate CI               | L        | Code   | #77        | `npm run test -- --coverage` >= 40%, CI falla si baja. **Entregables:** ~12 archivos test (servicios server: aiProvider, billing, rateLimit, safeError + composables: useAuth, useSubscriptionPlan), editar `ci.yml` threshold 40%                                                              |
| 80  | E2E Playwright: 7 user journeys                            | L        | Code   | #79        | 7 tests E2E: visitor search, dealer publish, subscription, buyer fav, admin approve, **subasta completa** (crear→pujar→anti-sniping→ganador→depósito), **reserva completa** (solicitar→depósito→vendedor responde→confirmar/cancelar→refund). **Entregables:** 7 specs en `tests/e2e/journeys/` |
| 81  | Market Intelligence dashboard dealer                       | L        | Code   | —          | Dashboard "tu stock vs mercado": precio medio, posicion, dias en venta. **Entregables:** ampliar `marketReport.ts`, crear `useMarketIntelligence.ts`, completar `/valoracion`                                                                                                                   |
| 212 | estadisticas.vue: rellenar views por vehículo              | S        | Code   | —          | `vehicleStats[].views` consulta `analytics_events` o `user_vehicle_views` agrupado por vehicle_id; actualmente siempre 0                                                                                                                                                                        |
| 213 | perfil/suscripcion.vue: conectar "Gestionar plan" a Stripe | S        | Code   | —          | Botón `@click` invoca `portal.post.ts`, abre Stripe Customer Portal; actualmente `<button>` sin handler                                                                                                                                                                                         |
| 214 | dashboard/suscripcion.vue: integrar Stripe portal          | S        | Code   | —          | "Gestionar facturación" invoca `portal.post.ts` en vez de NuxtLink a `/precios`                                                                                                                                                                                                                 |
| 215 | GDPR export completo                                       | S        | Code   | —          | `useUserProfile.exportData` incluye messages, search_alerts, reservations, transactions, email_preferences (actualmente solo profile/favorites/leads/views)                                                                                                                                     |
| 216 | Admin vehicle images: implementar upload Cloudinary        | M        | Code   | —          | `useAdminVehicleDetail.ts:468` placeholder reemplazado por upload real vía Cloudinary API; preview + reorder                                                                                                                                                                                    |
| 217 | Dealer portal: flujo creación perfil si no existe          | S        | Code   | —          | Si no hay fila en `dealers`, ofrecer crear perfil (INSERT) en vez de error "No se encontró tu perfil"                                                                                                                                                                                           |
| 218 | MFA/2FA en perfil/seguridad.vue                            | M        | Code   | —          | Integrar `useMfa.ts` existente: toggle activar/desactivar, QR setup, verificación código. Actualmente la UI no expone MFA                                                                                                                                                                       |
| 229 | Internal linking automatizado (artículos↔fichas↔landings)  | M        | Code   | #62        | Artículo menciona modelo → link a ficha; ficha sugiere artículos relacionados; landing enlaza fichas                                                                                                                                                                                            |
| 230 | Referral program (dealer invita dealer)                    | M        | Code   | #8         | Código referral único por dealer, invitado + referidor reciben créditos bonus al primer pago                                                                                                                                                                                                    |
| 231 | Wizard paso a paso primer vehículo (onboarding guiado)     | M        | Code   | —          | Onboarding 5 pasos (fotos→datos→precio→preview→publicar); WhatsApp-first como alternativa                                                                                                                                                                                                       |
| 232 | "Modo simple" dealer (auto-renovar sin CRM avanzado)       | S        | Code   | —          | Toggle en perfil dealer: sin dashboard analytics, auto-renovar ON, publicar y olvidar                                                                                                                                                                                                           |

**Total Bloque 12:** ~24 sesiones

---

### Bloque 14: Infra y Documentacion

| #   | Item                                   | Esfuerzo | Tipo    | Depende de | Hecho cuando...                                                            |
| --- | -------------------------------------- | -------- | ------- | ---------- | -------------------------------------------------------------------------- |
| 96  | Regenerar ESTADO-REAL-PRODUCTO.md      | S        | Code    | —          | Script ejecuta y genera doc actualizado                                    |
| 97  | RAT GDPR formalizado                   | S        | Founder | —          | Documento revisado por asesor legal, firmado                               |
| 98  | Script infra_metrics                   | M        | Code    | —          | Script recolecta metricas Supabase/CF/Cloudinary, inserta en infra_metrics |
| 99  | Rotacion secrets automatizada          | M        | Config  | —          | Schedule documentado Y automatizado (GitHub Actions o similar)             |
| 100 | DR drill (simulacro disaster recovery) | M        | Config  | —          | Simulacro ejecutado, tiempos documentados, gaps identificados y resueltos  |

**Total Bloque 14:** ~6 sesiones

---

## Fase 7 — Escalabilidad y Deployment (Plan Maestro pendientes)

> Items extraídos del Plan Maestro 10/10 que NO están ya en Fases 1-6. Los ~180 items completados del Plan Maestro están documentados en STATUS.md changelog.

### Bloque 30: Rendimiento Web

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 124 | Early Hints (103) precargar CSS y fuentes                  | S        | Config | —          | CF dashboard activa Early Hints, verificado con curl                                                                                                                                                                                                                                                                                                 |
| 125 | HTTP/3 habilitado en Cloudflare                            | S        | Config | —          | curl --http3 confirma H3, CF dashboard activo                                                                                                                                                                                                                                                                                                        |
| 126 | Compresión Brotli verificada en CF                         | S        | Config | —          | curl con Accept-Encoding: br devuelve content-encoding: br                                                                                                                                                                                                                                                                                           |
| 127 | TTFB/LCP/INP monitoring per-route con alerting             | M        | Code   | —          | Dashboard muestra métricas por ruta, alerta si LCP >2.5s                                                                                                                                                                                                                                                                                             |
| 128 | fetchOnServer:true en páginas SSR restantes                | S        | Code   | —          | subastas/index.vue y homepage migrados a useAsyncData SSR                                                                                                                                                                                                                                                                                            |
| 129 | Web Vitals aggregation dashboard (backend)                 | M        | Code   | —          | Endpoint recibe web-vitals data, admin ve métricas por ruta                                                                                                                                                                                                                                                                                          |
| 130 | Eliminar unsafe-eval CSP: Chart.js sin eval o Web Worker   | M        | Code   | #83        | CSP sin unsafe-eval, Chart.js funciona correctamente                                                                                                                                                                                                                                                                                                 |
| 131 | WebP/AVIF conversión sistemática (imágenes no-Cloudinary)  | S        | Code   | —          | Todas las imágenes estáticas servidas en WebP/AVIF                                                                                                                                                                                                                                                                                                   |
| 219 | VehicleCard.vue: eliminar reflow loop adjustTitleSize      | S        | Code   | —          | Reemplazar `while(scrollWidth > clientWidth)` por CSS `text-overflow: ellipsis` o `clamp()`. Actualmente causa reflow síncrono por cada card                                                                                                                                                                                                         |
| 220 | useVehicles.ts: select columnas específicas en buildQuery  | S        | Code   | —          | `select('*,vehicle_images(*),subcategories(*,...)')` → solo columnas necesarias para card (id,brand,model,year,price,slug,location\_\*,featured,sort_boost + images url/position + subcategory id/name)                                                                                                                                              |
| 221 | select('\*') cleanup ronda 2 (~25 queries residuales)      | M        | Code   | —          | Eliminar `select('*')` en: useUserProfile, useDashboardCrm, valoracionHelpers, useVerticalConfig, admin/useAdminAdvertisements, useAdminDashboard, useAdminContacts, useAdminDemands, useAdminFeatureFlags, useAdminNews, useAdminSubscriptions, useAdminSidebar, useValoracion, useRevenueMetrics, useAdminBrokerage. Ronda 1 (24 queries) ya hecha |
| 233 | Bundle size medido y budget por ruta                       | S        | Code   | —          | Documentar en STATUS.md: página pública ≤200KB JS, ≤50KB CSS. CI job que mide y compara                                                                                                                                                                                                                                                              |
| 234 | PurgeCSS: audit y eliminar CSS no utilizado                | S        | Code   | —          | Análisis con PurgeCSS/UnCSS, eliminar variables y reglas huérfanas de tokens.css                                                                                                                                                                                                                                                                     |
| 235 | ISR fichas de vehículo (Incremental Static Regeneration)   | M        | Code   | —          | routeRules `/vehiculo/**` con ISR: genera HTML estático, invalida al editar vehículo                                                                                                                                                                                                                                                                 |
| 236 | CDN purge API (vehicle edit → purge URL automático)        | M        | Code   | —          | Al editar vehículo: purge CF cache de ficha + catálogo + landings donde aparece                                                                                                                                                                                                                                                                      |
| 237 | Prerender top 50 landings SEO en build time                | S        | Code   | #62        | nitro.prerender.routes incluye las 50 landings con más tráfico (query analytics)                                                                                                                                                                                                                                                                     |
| 238 | fetchpriority="high" en hero image fichas                  | S        | Code   | —          | `<NuxtImg fetchpriority="high">` en imagen principal de VehicleDetailGallery                                                                                                                                                                                                                                                                         |
| 239 | Lighthouse CI blocking PRs con thresholds                  | S        | Code   | —          | lighthouse-ci.yml con assertions: LCP<2.5s, CLS<0.1, INP<200ms, perf>85. Bloquea PR si falla                                                                                                                                                                                                                                                         |
| 240 | Performance regression test (comparar deploys)             | M        | Code   | #239       | Cada deploy genera métricas, CI compara con anterior, alerta si degrada >10%                                                                                                                                                                                                                                                                         |
| 241 | Dividir tokens.css en módulos por dominio                  | S        | Code   | —          | tokens/colors.css, tokens/spacing.css, tokens/typography.css, tokens/shadows.css                                                                                                                                                                                                                                                                     |
| 242 | modulepreload para chunks JS críticos                      | S        | Code   | —          | `<link rel="modulepreload">` inyectado para chunks de catálogo, ficha, layout                                                                                                                                                                                                                                                                        |
| 307 | Tree-shaking audit JS (imports parciales)                  | S        | Code   | —          | Verificar que no se importan módulos enteros (date-fns, lodash si existe). Cada import solo lo necesario                                                                                                                                                                                                                                             |
| 308 | Lazy load i18n locales (en.json no carga para usuarios ES) | S        | Code   | —          | Verificar que locale no activo no se incluye en bundle. Split i18n por locale con dynamic import                                                                                                                                                                                                                                                     |
| 309 | Service Worker precache top 5 páginas historial usuario    | S        | Code   | —          | Workbox runtime caching precachea las 5 páginas más visitadas por el usuario (basado en historial local)                                                                                                                                                                                                                                             |

**Total Bloque 30:** ~23 sesiones

---

### Bloque 31: Escalabilidad Infraestructura

| #   | Item                                                                     | Esfuerzo | Tipo        | Depende de | Hecho cuando...                                                                    |
| --- | ------------------------------------------------------------------------ | -------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| 132 | Redis/Upstash como cache layer (rate limiting, sessions, feature flags)  | L        | Code/Config | —          | Upstash configurado, rate limiting usa Redis, latencia <10ms                       |
| 133 | CF Queues o BullMQ para background processing (AI, reports, imports)     | L        | Code/Config | #132       | AI calls, reports, imports procesados via queue                                    |
| 134 | Worker dedicado para cron jobs (no inline en API routes)                 | M        | Code        | #133       | Crons ejecutan en worker separado, no en request path                              |
| 135 | PgBouncer connection pooling modo transaction                            | S        | Config      | —          | Supabase Pooler activado, queries usan pooler URL                                  |
| 136 | Read replicas para queries analíticas                                    | M        | Config      | —          | Dashboard stats y market reports usan replica                                      |
| 137 | EXPLAIN ANALYZE top 20 queries y optimizar                               | M        | Code        | —          | 20 queries más frecuentes analizadas y optimizadas, documentado                    |
| 138 | Query budget enforcement (max 5 queries por page load)                   | S        | Code        | —          | Composable alerta si page load excede 5 queries                                    |
| 139 | CDN cache rules por tipo (HTML 5min SWR, API vary, images 30d, fonts 1y) | S        | Config      | —          | CF Page Rules configuradas, headers verificados con curl                           |
| 140 | Custom metrics req/s, p50/p95/p99 latency                                | M        | Code        | —          | Dashboard muestra latency percentiles por endpoint                                 |
| 141 | Dashboard operacional Grafana/CF Analytics                               | L        | Config      | #140       | Dashboard accesible con métricas en tiempo real                                    |
| 142 | Capacity alerting al 70% de límites                                      | S        | Code        | —          | Alerta automática cuando storage/connections/bandwidth >70%                        |
| 143 | DB slow query log con alerting (>500ms)                                  | M        | Code        | —          | Queries >500ms logueadas y alertadas                                               |
| 144 | Materialized views refresh (dashboard KPIs, search facets)               | M        | Code        | —          | matviews con refresh schedule, dashboard usa matviews                              |
| 145 | Vary: Accept-Encoding, Accept-Language correcto                          | S        | Code        | —          | Verificado en todos los endpoints públicos                                         |
| 243 | Batch writes analytics_events (buffer 10s, flush batch)                  | M        | Code        | —          | Buffer client-side acumula eventos 10s, flush con batch INSERT. Reduce writes ~90% |
| 244 | Write-behind cache leads/mensajes (cache → BD async)                     | M        | Code        | —          | Lead se escribe en cache inmediato, sync a BD async con retry. UX instantáneo      |
| 245 | Prepared statements queries frecuentes (RPCs)                            | S        | Code        | —          | RPCs PostgreSQL para top 10 queries (catálogo, ficha, dashboard). Menos parsing    |
| 246 | APM Sentry Performance (sampling configurable)                           | S        | Code        | #198       | tracesSampleRate por env: 100% staging/load tests, 10% prod. Tracing e2e           |
| 247 | BD metrics dashboard (connections, cache hit, index usage)               | M        | Code        | —          | Admin /admin/infra-metrics con gráficos PostgreSQL en tiempo real                  |

**Total Bloque 31:** ~20 sesiones

---

### Bloque 32: Multi-Vertical Deployment

| #   | Item                                                          | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------- | -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 146 | Multi-vertical single deployment (wildcard domain routing)    | L        | Code   | —          | \*.tradebase.com routing por hostname funciona                                                                                                                                                                                                                                             |
| 147 | CI/CD pipeline para todas las verticales desde un push        | M        | Config | #146       | Un push deploya todas las verticales activas                                                                                                                                                                                                                                               |
| 148 | Environment config per vertical en Cloudflare                 | S        | Config | #146       | Cada vertical tiene sus env vars en CF                                                                                                                                                                                                                                                     |
| 149 | Plan de rollback per vertical                                 | S        | Config | #146       | Documentado y probado: rollback <5 min                                                                                                                                                                                                                                                     |
| 150 | E2E tests parametrizados por vertical                         | M        | Code   | #146       | Mismo test corre con config de cada vertical                                                                                                                                                                                                                                               |
| 151 | create-vertical.mjs: logo placeholder + email templates       | S        | Code   | —          | Script genera logo placeholder y templates email al crear                                                                                                                                                                                                                                  |
| 222 | recalculate-landings: parametrizar vertical                   | S        | Code   | —          | `vertical: 'tracciona'` (4 hardcodes) → `process.env.NUXT_PUBLIC_VERTICAL`. Textos intro "En Tracciona..." y "across Spain" → leídos de vertical_config o i18n                                                                                                                             |
| 223 | Crons: deshardcodear email/dominio                            | S        | Code   | —          | `hola@tracciona.com` en freshness-check (×2) y post-sale-outreach → `getSiteEmail()` helper. `tracciona.es` en expire-listings → `getSiteUrl()`                                                                                                                                            |
| 224 | Eliminar CONTACT const deprecated en contact.ts               | S        | Code   | —          | Borrar `export const CONTACT` (línea 15-19). Verificar 0 imports residuales. `getContact()` ya es la API activa                                                                                                                                                                            |
| 227 | Deshardcodear 'tracciona.com' en utils/composables cliente    | S        | Code   | —          | `adminProductosExport.ts` (×4: título PDF, URL vehículo, footer), `useSiteConfig.ts` (×2: fallback URL), `widget.vue` (×1) → usar `useSiteUrl()` o `getSiteUrl()`                                                                                                                          |
| 228 | Deshardcodear 'Tracciona' en server/api rutas no-cron         | S        | Code   | —          | 8 archivos sin env fallback: `generate-article` + `generate-description` (prompts IA), `generate-posts` (hashtags), `unsubscribe.get` (HTML), `valuation.get:192` (.eq vertical), `create-invoice` (tag), `export.get` (filename), `process.post` (metadata) → leer de `getSiteName()`/env |
| 248 | i18n genérica: "vehículo" → término configurable por vertical | M        | Code   | —          | Reemplazar i18n keys hardcoded "vehículo/vehicle" por `product.singular`/`product.plural` leídos de vertical_config. Verificar 131 páginas                                                                                                                                                 |
| 249 | localizedTerm('product') composable desde vertical_config     | S        | Code   | #248       | Composable retorna término del vertical: "vehículo", "equipo", "inmueble". Usa JSONB terms de vertical_config                                                                                                                                                                              |
| 250 | Selector vertical en admin panel header                       | S        | Code   | —          | Dropdown en header admin para cambiar entre verticales (Tracciona, Horecaria...)                                                                                                                                                                                                           |
| 251 | Dashboard admin cross-vertical + desglose                     | M        | Code   | #250       | Métricas agregadas (total listings, leads, revenue) + desglose por vertical en tabla                                                                                                                                                                                                       |
| 252 | Gestión verticals desde admin (crear, editar config, activar) | L        | Code   | #250       | CRUD de vertical_config desde UI admin. Crear vertical = INSERT + deploy CF Pages                                                                                                                                                                                                          |
| 253 | E2E test crear vertical Horecaria completa                    | M        | Code   | —          | Test automatizado: crear vertical → publicar producto → buscar → contactar → verificar aislamiento datos + SEO per-vertical (sitemap, meta, OG) + PWA manifest per-vertical + emails con marca correcta + logs filtrables por vertical                                                     |
| 254 | Verificar aislamiento datos inter-vertical (RLS)              | S        | Code   | —          | Tests confirman: dealer Tracciona NO ve datos Horecaria; queries filtradas por vertical; RLS enforced                                                                                                                                                                                      |

**Total Bloque 32:** ~18 sesiones

---

### Bloque 33: Arquitectura y Calidad

| #   | Item                                                          | Esfuerzo | Tipo    | Depende de | Hecho cuando...                                                                                                                                     |
| --- | ------------------------------------------------------------- | -------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 152 | Architecture boundaries: reglas de dependencia entre dominios | M        | Code    | —          | Lint rule impide imports cross-domain no permitidos                                                                                                 |
| 153 | Atomic design: extraer atoms / molecules / organisms          | L        | Code    | —          | Componentes reorganizados, nueva estructura documentada                                                                                             |
| 154 | Cada módulo testable de forma aislada                         | M        | Code    | —          | Tests de cada módulo corren sin dependencias externas                                                                                               |
| 155 | Registro seguridad centralizado con alertas automáticas       | M        | Code    | —          | Log centralizado, patrones sospechosos generan alerta automática                                                                                    |
| 156 | RS256 JWT migration (Supabase Dashboard)                      | S        | Config  | —          | JWT firmado con RS256, aplicación funciona correctamente                                                                                            |
| 157 | Incident playbook con tiempos formales de respuesta (SLAs)    | S        | Founder | —          | INCIDENT-RUNBOOK.md tiene SLAs por severidad P0-P3                                                                                                  |
| 225 | error-rate.get.ts: reemplazar placeholder totalCount          | S        | Code    | —          | `totalCount = 100 // placeholder` → contar requests reales (analytics_events totales o middleware request counter en ventana)                       |
| 226 | verifyCsrf: evaluar y documentar decisión CSRF                | S        | Code    | —          | Si se mantiene X-Requested-With (suficiente con SameSite+CORS): documentar en SECURITY-DECISIONS.md. Si se mejora: implementar double-submit cookie |
| 255 | SRI (Subresource Integrity) scripts terceros                  | S        | Code    | —          | `integrity` attribute en `<script>` de Stripe.js, GTM, Turnstile. Verificar no rompe CSP/cache                                                      |
| 256 | DNSSEC verificado todos los dominios                          | S        | Config  | —          | DNSSEC activo en tracciona.com + tracciona.es, verificado con dnsviz.net                                                                            |
| 257 | Certificate Transparency monitoring                           | S        | Config  | —          | Alerta si alguien emite cert para tracciona.com (crt.sh monitor o CF CT Alerts)                                                                     |
| 258 | Reporting-Endpoints header (nuevo estándar CSP)               | S        | Code    | —          | `Reporting-Endpoints: csp="/api/infra/csp-report"` en security-headers.ts (reemplaza report-uri deprecated)                                         |
| 259 | Rate limiting por usuario autenticado (no solo IP)            | M        | Code    | #1         | Composite key user_id+action con límites por acción. Previene account takeover                                                                      |
| 260 | Brute force protection login server-side                      | S        | Code    | —          | Lockout temporal tras 5 intentos fallidos por email. Backoff exponencial (1min→5min→30min)                                                          |
| 261 | Audit log acceso a secrets                                    | M        | Code    | —          | Log inmutable: quién accedió a qué secret, cuándo, desde qué IP. Visible en /admin/security                                                         |
| 262 | CSS Layers (@layer base, tokens, components, utilities)       | S        | Code    | —          | Controlar especificidad sin !important. @layer: base → tokens → components → utilities                                                              |
| 263 | Middleware chain configurable por ruta                        | M        | Code    | —          | Config declarativa qué middlewares aplican por patrón de ruta (no if/else en cada middleware)                                                       |

**Total Bloque 33:** ~15 sesiones

---

### Bloque 34: Infra Config (Plan/Cuenta necesarios)

| #   | Item                                                         | Esfuerzo | Tipo           | Depende de | Hecho cuando...                            |
| --- | ------------------------------------------------------------ | -------- | -------------- | ---------- | ------------------------------------------ |
| 158 | Supabase Team/Enterprise plan (más conexiones, storage, SLA) | S        | Config/Founder | —          | Plan Team activo en Supabase dashboard     |
| 159 | CF Workers Paid plan (30ms CPU, 128MB memory)                | S        | Config/Founder | —          | Plan Paid activo en Cloudflare dashboard   |
| 160 | CF R2 para archivos grandes (PDFs, exports, backups)         | S        | Config         | #159       | R2 bucket creado, upload/download funciona |
| 161 | CF KV para feature flags (sub-ms reads from edge)            | M        | Code           | #159       | Feature flags servidos desde CF KV, <1ms   |

**Total Bloque 34:** ~4 sesiones

**Total Fase 7:** ~73 sesiones

---

## Fase 7b — Validación UX y Conversión

### Bloque 35: User Testing & Validación Real

Criterio: Sin validación con usuarios reales, todo es teoría. Requiere dealers reales.

| #   | Item                                                            | Esfuerzo | Tipo         | Depende de | Hecho cuando...                                                                                         |
| --- | --------------------------------------------------------------- | -------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| 264 | User testing presencial 5-10 dealers reales (sesiones grabadas) | L        | Founder/Code | —          | 5+ sesiones grabadas: publicar vehículo, gestionar lead, comprar créditos. Puntos fricción documentados |
| 265 | Test usabilidad pipeline WhatsApp con dealers reales            | M        | Founder      | —          | 5+ dealers envían fotos reales → ficha generada → validar que es correcta y útil                        |
| 266 | Encuesta NPS + iteración UI/UX post-testing (2 rondas)          | L        | Founder/Code | #264       | NPS >40, 2 rondas de iteración aplicadas, mejoras documentadas                                          |
| 267 | Widget feedback in-app (thumbs up/down + comentario)            | S        | Code         | —          | Componente "¿Te ha sido útil?" en páginas clave, datos guardados en analytics_events                    |

**Total Bloque 35:** ~8 sesiones

---

### Bloque 36: A/B Testing & Conversion Analytics

Criterio: Sin métricas de conversión, no se puede optimizar el funnel. Base para decisiones data-driven.

| #   | Item                                                             | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                          |
| --- | ---------------------------------------------------------------- | -------- | ------ | ---------- | ---------------------------------------------------------------------------------------- |
| 268 | A/B testing infrastructure (feature flags + analytics)           | L        | Code   | —          | Poder probar 2 variantes de CTA/layout/flujo, medir conversión por variante              |
| 269 | Funnel analytics dashboard (visit→register→publish→lead→sale)    | M        | Code   | —          | Dashboard muestra dónde abandonan usuarios en cada paso del funnel                       |
| 270 | Heatmaps/session recordings (Clarity/Sentry Replay)              | S        | Config | —          | Microsoft Clarity o Sentry Replay integrado en páginas clave (catálogo, ficha, checkout) |
| 271 | GA4 conversions configuradas (registro, publicación, lead, pago) | S        | Config | —          | Eventos de conversión definidos en GA4, visibles en dashboard Google                     |
| 272 | Google Ads conversion tracking e2e verificado                    | S        | Config | #271       | Conversiones de Google Ads rastreadas end-to-end, atribución visible                     |
| 273 | Revenue metrics admin dashboard (MRR, churn, ARPU)               | M        | Code   | #8         | Admin ve: MRR actual, churn mensual, ARPU por tier, gráfico tendencia                    |
| 274 | Admin panel suscripciones (ver activas, cancelar, ajustar)       | M        | Code   | #8         | Admin lista subs activas con estado Stripe, puede cancelar/ajustar desde UI              |

**Total Bloque 36:** ~10 sesiones

---

### Bloque 37: Design System & Accesibilidad

Criterio: Design system documentado + accesibilidad real = UX profesional. WCAG 2.1 AA completo.

| #   | Item                                                     | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                                       |
| --- | -------------------------------------------------------- | -------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 275 | /admin/design-system page — showcase 26 componentes UI   | M        | Code | —          | Página muestra cada componente con variantes, props, slots, estados (loading, error, empty, disabled)                 |
| 276 | Keyboard navigation audit 10 páginas principales         | M        | Code | —          | Tab/Enter/Escape alcanza todo en: home, catálogo, ficha, login, registro, dashboard, perfil, checkout, landing, admin |
| 277 | axe-core/pa11y integrado en CI (bloquear PRs)            | S        | Code | —          | CI job ejecuta axe-core en 10 URLs, falla si hay errores A11y level A o AA                                            |
| 278 | Focus trap verificado en todos los modales               | S        | Code | —          | ConfirmModal, todos los modales custom: Tab no escapa del modal, Escape cierra                                        |
| 279 | aria-describedby para mensajes error en formularios      | S        | Code | —          | Todos los inputs con error tienen aria-describedby apuntando al mensaje de error                                      |
| 280 | UiSubmitButton.vue (loading state unificado)             | S        | Code | —          | Componente reutilizable: spinner cuando loading, disabled cuando submitting, texto configurable                       |
| 281 | Auto-save formularios largos (localStorage draft 30s)    | M        | Code | —          | Formularios de publicar vehículo y perfil auto-guardan borrador cada 30s. Restaurar al volver                         |
| 282 | Loading states unificados para acciones (submit buttons) | S        | Code | #280       | Todos los botones de acción usan UiSubmitButton con feedback visual durante la operación                              |
| 283 | Offline states PWA claros                                | S        | Code | —          | Banner "Sin conexión — los cambios se sincronizarán" con cola offline-first                                           |
| 284 | Progress indicator uploads imágenes (% completado)       | S        | Code | —          | Barra de progreso real durante upload de imágenes (onUploadProgress de axios/fetch)                                   |
| 285 | List transitions animadas (favoritos, comparador)        | S        | Code | —          | `<TransitionGroup>` al añadir/eliminar elementos de listas dinámicas                                                  |
| 304 | UiFormField.vue (label + input + error + hint + aria)    | M        | Code | —          | Componente reutilizable: label+input+error msg+hint text+aria-describedby integrado. Reemplaza forms ad-hoc           |
| 305 | autocomplete attributes en TODOS los inputs formulario   | S        | Code | —          | Verificar y añadir `autocomplete` correcto (name, email, tel, address, cc-\*) en todos los formularios                |
| 306 | Success states con siguiente acción sugerida             | S        | Code | —          | Tras acción exitosa: mensaje + CTA contextual ("Vehículo publicado → Ver ficha / Publicar otro")                      |

**Total Bloque 37:** ~15 sesiones

---

## Fase 7c — Escala Extrema y Validación de Carga

### Bloque 38: Load Testing

Criterio: Sin load testing real, las estimaciones de escalabilidad son teóricas. k6 readiness workflow existe, falta ejecutar.

| #   | Item                                                         | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                      |
| --- | ------------------------------------------------------------ | -------- | ---- | ---------- | -------------------------------------------------------------------- |
| 286 | k6 load test: 1000 concurrent leyendo catálogo               | M        | Code | —          | SWR absorbe 98%, p95<200ms, error rate<0.1%. Resultados documentados |
| 287 | k6 stress test: rampa 100→5000→10000 usuarios en 10min       | M        | Code | #286       | Punto de quiebre identificado, latencia p50/p95/p99 documentada      |
| 288 | k6 spike test: 0→10000 usuarios instantáneo                  | S        | Code | #286       | Simular artículo viral. Recovery time medido. Edge absorbe spike     |
| 289 | k6 soak test: 500 usuarios constantes 2h                     | M        | Code | #286       | Memory leaks detectados (si los hay), BD connections estables        |
| 290 | Test escrituras concurrentes: 100 dealers publicando simult. | M        | Code | #286       | 100 INSERTs simultáneos sin deadlocks, latencia write <500ms         |
| 291 | Test subastas concurrentes: 50 bidders misma subasta         | M        | Code | #286       | 50 pujas simultáneas resueltas correctamente, anti-sniping funciona  |
| 292 | Documentar bottlenecks reales + plan acción post-tests       | S        | Code | #286       | Documento con: bottlenecks, solución propuesta, coste, prioridad     |

**Total Bloque 38:** ~10 sesiones

---

### Bloque 39: 10M Scale Readiness

Criterio: Preparar la infraestructura para 10M usuarios/mes. Writes a escala + BD a escala + observabilidad.

| #   | Item                                                       | Esfuerzo | Tipo        | Depende de | Hecho cuando...                                                                                           |
| --- | ---------------------------------------------------------- | -------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| 293 | Table partitioning analytics_events por mes                | M        | Code        | —          | Migration activa partitioning (readiness en 00087). Queries automáticos por partición                     |
| 294 | Incremental matview refresh (no full refresh nocturno)     | M        | Code        | —          | Matviews de mercado/KPIs actualizadas incrementalmente, no DROP+CREATE cada noche                         |
| 295 | Email batching (weekly report en batches de 50 con delay)  | S        | Code        | —          | Newsletter/reports no envían 10K emails de golpe; batches 50 con 5s delay entre batches                   |
| 296 | Supabase Realtime capacity evaluation (1000+ concurrent)   | M        | Code        | —          | Test con 1000 suscriptores simultáneos en canal subasta. Documentar límites reales                        |
| 297 | Presence system ("X usuarios viendo este vehículo")        | M        | Code        | —          | Badge en tiempo real: "12 personas viendo ahora". Supabase Presence o alternativa                         |
| 298 | Archival strategy datos >1 año → cold storage              | M        | Code        | —          | analytics_events, activity_logs >1 año migrados a tabla partición fría o R2/B2                            |
| 299 | Index maintenance (rebuild periódico índices fragmentados) | S        | Config      | —          | Script/cron que ejecuta REINDEX en índices con bloat >30%. Documentar schedule                            |
| 300 | Tiered caching L1 edge → L2 regional → L3 origin           | M        | Config      | —          | CF cache tiering configurado, headers verificados, hit ratio medido por tier                              |
| 301 | Static asset CDN hit ratio >95% verificado                 | S        | Config      | —          | CF Analytics confirma: imágenes, fonts, JS servidos desde edge >95% hit rate                              |
| 302 | Distributed tracing e2e (browser→edge→worker→BD)           | L        | Code        | #246       | Trace ID propagado end-to-end, visible en Sentry/admin para debugging                                     |
| 303 | Staging environment funcional con datos de prueba          | M        | Config/Code | —          | Staging deploy con datos sintéticos, flujos E2E verificables sin afectar producción                       |
| 310 | VACUUM/ANALYZE verified + schedule PostgreSQL              | S        | Config      | —          | Verificar frecuencia auto-VACUUM en Supabase. Script/cron ANALYZE en tablas grandes post-bulk. Documentar |

**Total Bloque 39:** ~15 sesiones

**Total Fase 7b:** ~30 sesiones
**Total Fase 7c:** ~24 sesiones

---

## Tareas Fundadores (paralelas, no-codigo)

No bloquean ni son bloqueadas por codigo. Ejecutar cuando sea posible.

| #   | Item                                          | Esfuerzo | Urgencia | Hecho cuando...                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27  | Twilio — cuenta + API key para SMS OTP        | S        | MEDIA    | Cuenta Twilio creada, TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM configurados en .env y GitHub Secrets. Desbloquea: item #27 código (ya implementable)                                                                                                                                                                                                |
| 34  | CF WAF activo (#1) → activar fleet rate limit | S        | BAJA     | Tras completar #1 (CF WAF): indicar a Claude "activa excepción fleet" — 30 min de código                                                                                                                                                                                                                                                                        |
| 101 | Configurar reglas CF WAF (rate limiting)      | S        | ALTA     | Reglas activas en dashboard CF                                                                                                                                                                                                                                                                                                                                  |
| 123 | Configurar GitHub Secrets (crons + k6 + CI)   | S        | ALTA     | 6 secrets añadidos: `CRON_SECRET` (generar con `openssl rand -hex 32`) + `SUPABASE_URL` + `SUPABASE_ANON_KEY` (ambos de Supabase Dashboard → Project Settings → API) + `RESEND_API_KEY` (tras tarea #21) + `INFRA_ALERT_EMAIL` = tankiberica@gmail.com. Variable: `APP_URL` = https://tracciona.com. GitHub → repo → Settings → Secrets and variables → Actions |
| 102 | DMARC + SPF + DKIM en Cloudflare DNS          | S        | ALTA     | Records DNS configurados, DMARC report sin fallos                                                                                                                                                                                                                                                                                                               |
| 103 | Verificar Google Search Console               | S        | ALTA     | site:tracciona.com devuelve resultados                                                                                                                                                                                                                                                                                                                          |
| 104 | Registrar marca Tracciona OEPM                | S        | MEDIA    | Solicitud presentada en OEPM Clase 35                                                                                                                                                                                                                                                                                                                           |
| 105 | Registrar marca TradeBase OEPM                | S        | MEDIA    | Solicitud presentada en OEPM                                                                                                                                                                                                                                                                                                                                    |
| 106 | Registrar tracciona.es (redireccion 301)      | S        | MEDIA    | Dominio registrado, 301 a tracciona.com                                                                                                                                                                                                                                                                                                                         |
| 107 | Dominios defensivos (.eu)                     | S        | BAJA     | Registrados si presupuesto permite                                                                                                                                                                                                                                                                                                                              |
| 108 | Google Business Profile (campa Onzonilla)     | S        | MEDIA    | Perfil creado y verificado                                                                                                                                                                                                                                                                                                                                      |
| 109 | Contactar primeros 10 Founding Dealers        | M        | ALTA     | 10 dealers contactados, >= 3 comprometidos                                                                                                                                                                                                                                                                                                                      |
| 110 | Configurar UptimeRobot                        | S        | MEDIA    | Monitor activo, alertas configuradas                                                                                                                                                                                                                                                                                                                            |
| 111 | Test manual movil (dispositivo real)          | M        | ALTA     | Checklist completado en 3+ dispositivos                                                                                                                                                                                                                                                                                                                         |
| 112 | PromoCards densidad (decision)                | S        | BAJA     | Decision tomada y documentada                                                                                                                                                                                                                                                                                                                                   |
| 113 | Sesiones dealer acquisition / growth loops    | M        | MEDIA    | Al menos 2 sesiones ejecutadas, aprendizajes documentados                                                                                                                                                                                                                                                                                                       |
| 114 | Crear cuenta Neon (pre-requisito test backup) | S        | BAJA     | Cuenta creada, free tier activo                                                                                                                                                                                                                                                                                                                                 |
| 115 | Constituir TradeBase SL                       | L        | MEDIA    | Sociedad registrada en Registro Mercantil                                                                                                                                                                                                                                                                                                                       |
| 116 | Constituir IberHaul SL                        | L        | MEDIA    | Sociedad registrada en Registro Mercantil                                                                                                                                                                                                                                                                                                                       |
| 311 | Evaluar Resend Pro plan (escala 10M emails)   | S        | MEDIA    | Con 10M usuarios: miles de emails/día (alertas, reports, onboarding). Evaluar Resend Pro ($20/mes) o Business. Documentar límites y coste                                                                                                                                                                                                                       |

---

## Pre-Launch Setup Checklist (Config/Dashboard — no-código)

> Tareas de configuración en dashboards externos. No requieren código (salvo #198 y #199). Ejecutar cuando se tenga acceso a cada servicio.

### Cloudflare

| #   | Item                                                         | Hecho cuando...                                                                                                                                                                |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 162 | WAF Managed Rules (Managed + OWASP + Leaked Credentials)     | 3 rulesets activos en CF Dashboard → Security → WAF → Managed rules                                                                                                            |
| 163 | Bot Fight Mode activado                                      | CF Dashboard → Security → Bots → Bot Fight Mode ON                                                                                                                             |
| 164 | SSL/TLS en modo Full (Strict) + Always Use HTTPS             | CF Dashboard → SSL/TLS → Full (strict) + Edge Certificates                                                                                                                     |
| 165 | DDoS Protection verificado                                   | CF Dashboard → Security → DDoS → reglas activas                                                                                                                                |
| 166 | WAF exceptions para webhooks (Stripe, WhatsApp, Stripe UA)   | Skip WAF para /api/stripe/webhook + /api/whatsapp/webhook + Skip rate limit para User-Agent Stripe/                                                                            |
| 167 | Turnstile (CAPTCHA) obtenido para formularios críticos       | Site key + secret key generados en CF Dashboard → Turnstile                                                                                                                    |
| 168 | CF Images configurado (account ID + API token + 4 variantes) | CF Images habilitado, variantes thumbnail/medium/large/hero creadas, env vars CF_IMAGES_ACCOUNT_ID + CF_IMAGES_API_TOKEN                                                       |
| 200 | 6 reglas Rate Limiting en CF WAF                             | 6 reglas creadas en orden: Account delete (2/min), Lead forms (5/min), Email send (10/min), Stripe (20/min), API writes (30/min), API reads (200/min) — todas Block 60s per IP |
| 201 | Segundo deploy CF Pages para Horecaria                       | CF Pages → nuevo proyecto "horecaria" conectado al repo, NUXT_PUBLIC_VERTICAL=horecaria, custom domain horecaria.com                                                           |

### Supabase

| #   | Item                                                  | Hecho cuando...                                              |
| --- | ----------------------------------------------------- | ------------------------------------------------------------ |
| 169 | Auth Rate Limiting configurado en dashboard           | Dashboard → Auth → Rate Limits ajustados                     |
| 170 | Verificar backup automático diario + retention policy | Dashboard → Database → Backups → daily activo, retention 7d+ |
| 171 | Auth Logging habilitado para auditoría                | Dashboard → Auth → Logs → auth hook logging activo           |

### Stripe

| #   | Item                                                        | Hecho cuando...                                                                                |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 172 | Activar modo Live (salir de Test mode)                      | Stripe Dashboard → modo Live activo, KYC completado                                            |
| 173 | Webhook endpoint registrado para producción                 | Webhook apunta a https://tracciona.com/api/stripe/webhook, events OK                           |
| 174 | Stripe Connect Express configurado (si se usa para dealers) | Connected accounts habilitado en Stripe Dashboard                                              |
| 202 | Crear productos y precios en Stripe Dashboard               | "Tracciona Basic" 29€/mes + "Tracciona Premium" 79€/mes creados, Price IDs copiados a env vars |

### WhatsApp / Meta

| #   | Item                                         | Hecho cuando...                                             |
| --- | -------------------------------------------- | ----------------------------------------------------------- |
| 175 | Crear app en Meta Business Suite             | App creada, WhatsApp Business API habilitada                |
| 176 | Configurar webhook URL para producción       | Webhook apunta a https://tracciona.com/api/whatsapp/webhook |
| 177 | Obtener permanent token (sustituir temporal) | Token permanente generado, configurado en env               |

### Email / Resend

| #   | Item                                         | Hecho cuando...                                      |
| --- | -------------------------------------------- | ---------------------------------------------------- |
| 178 | Verificar dominio en Resend + DKIM/SPF/DMARC | DNS records configurados, Resend verifica dominio OK |

### Monitoring / Analytics

| #   | Item                                               | Hecho cuando...                                                                                                             |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 179 | Sentry DSN de producción configurado               | Sentry project creado, DSN en env, errores llegan                                                                           |
| 180 | Google Analytics 4 (GA4) property creada           | GA4 property activa, datos de tráfico visibles                                                                              |
| 181 | Google Search Console verificado y sitemap enviado | site:tracciona.com indexa, sitemap procesado                                                                                |
| 182 | Google Merchant Center (si aplica)                 | Feed de productos enviado, productos aprobados                                                                              |
| 203 | Google Rich Results Test verificado                | URLs principales + ficha vehículo pasan test en search.google.com/test/rich-results (Vehicle, Organization, BreadcrumbList) |

### Publicidad

| #   | Item                       | Hecho cuando...                             |
| --- | -------------------------- | ------------------------------------------- |
| 183 | Google AdSense (si aplica) | AdSense cuenta aprobada, ads.txt en /public |
| 184 | Google Ads cuenta creada   | Cuenta lista para campañas SEM              |

### Backup / Infra

| #   | Item                                         | Hecho cuando...                                                                                          |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 185 | Backblaze B2 bucket para backup offsite      | Bucket creado, test de upload funciona                                                                   |
| 186 | VAPID keys generadas para push notifications | Keys generadas, configuradas en env                                                                      |
| 187 | Bitbucket mirror repo creado (backup git)    | Mirror activo, push automático tras cada commit a main                                                   |
| 204 | Test restore backup en BD temporal           | Backup descargado de Supabase/B2, restaurado en Neon con pg_restore, tablas verificadas, RTO documentado |

### Legal / Compliance

| #   | Item                                           | Hecho cuando...                             |
| --- | ---------------------------------------------- | ------------------------------------------- |
| 188 | Alta en OSS de la AEAT (obligaciones fiscales) | Alta completada en sede electrónica AEAT    |
| 189 | Registro ICO UK (si mercado UK)                | Registro completado si aplica, o descartado |

### OAuth / Social

| #   | Item                                           | Hecho cuando...                                      |
| --- | ---------------------------------------------- | ---------------------------------------------------- |
| 190 | LinkedIn OAuth app (para social auto-post)     | App creada, client ID + secret en env                |
| 191 | Facebook/Instagram app (para social auto-post) | App creada, permisos aprobados                       |
| 192 | Facebook Sharing Debugger: verificar OG tags   | Todas las URLs principales muestran preview correcto |

### API Keys Externas

| #   | Item                                 | Hecho cuando...                                                               |
| --- | ------------------------------------ | ----------------------------------------------------------------------------- |
| 193 | Anthropic API key de producción      | Key generada, configurada en env, test funciona                               |
| 194 | OpenAI API key (fallback)            | Key generada, configurada en env                                              |
| 205 | Contratar InfoCar API (informes DGT) | Acceso contratado, INFOCAR_API_KEY + INFOCAR_API_URL en env, test consulta OK |

### Facturación

| #   | Item                                       | Hecho cuando...                        |
| --- | ------------------------------------------ | -------------------------------------- |
| 195 | Quaderno o Billin para TicketBAI/Verifactu | Cuenta activa, integración configurada |

### DevOps / CI

| #   | Item                                         | Hecho cuando...                                  |
| --- | -------------------------------------------- | ------------------------------------------------ |
| 196 | Dependabot activo con revisión semanal       | `.github/dependabot.yml` configurado, PRs llegan |
| 197 | Migraciones Supabase aplicadas en producción | `supabase db push` exitoso, 0 errores            |
| 206 | Conectar Snyk (análisis vulnerabilidades)    | app.snyk.io importa repo, notificaciones activas |

### Code (post-setup)

| #   | Item                                                      | Esfuerzo | Tipo | Hecho cuando...                                               |
| --- | --------------------------------------------------------- | -------- | ---- | ------------------------------------------------------------- |
| 198 | Integrar Sentry SDK en producción (DSN real, source maps) | S        | Code | Source maps subidos a Sentry, stack traces resueltos          |
| 199 | Fix docker-compose para desarrollo local                  | S        | Code | `docker compose up` arranca todos los servicios sin errores   |
| 207 | Verificar lint, tests y build post-agentes                | S        | Code | `npm run lint` + `npm run test` + `npm run build` = 0 errores |
| 208 | Commit y push de todo lo pendiente                        | S        | Code | `git status` limpio, todo en main, RAT GDPR incluido          |

### Notas Operativas

- Las referencias a "tank-iberica" en `fileNaming.ts` y `useCloudinaryUpload.ts` son rutas Cloudinary históricas — NO cambiar (rompe URLs existentes)
- CSP usa `unsafe-inline` (Nuxt SSR hydration + Vue scoped) y `unsafe-eval` (Chart.js) — documentado en `security-headers.ts`, revisar con Nuxt 5 / Chart.js v5
- Security tests (`tests/security/`) requieren servidor corriendo: `npx nuxi preview` en terminal 1, luego tests en terminal 2. En CI se levantan automáticamente
- `package-lock.json` debe estar siempre en el commit (CI lo necesita). Si conflictos merge → `npm install` regenera limpio

---

## Fase 8 — Items DEFERRED (requieren servicios externos o decisiones)

> Items identificados en el Plan Maestro pero aplazados por requerir contratos, APIs externas, hardware, o decisiones estratégicas pendientes. Reactivar cuando se cumplan los prerequisitos.

| ID  | Item                                                      | Prerequisito                                                      |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| D1  | SMS notifications via Twilio                              | Cuenta Twilio + API key + presupuesto SMS                         |
| D2  | Recomendaciones ML-based ("Vehículos similares" mejorado) | Modelo ML entrenado o API externa                                 |
| D3  | Auto-fill datos por matrícula (API DGT)                   | Contrato DGT + credenciales API                                   |
| D4  | Mapa interactivo de vehículos (Leaflet/Mapbox)            | API key Mapbox o Leaflet + geodatos en BD                         |
| D5  | Firma digital de contratos (DocuSign/SignaturIT)          | Cuenta servicio de firma digital                                  |
| D6  | CF Durable Objects para estado compartido                 | CF Workers Paid plan + Durable Objects binding                    |
| D7  | CF D1 como cache edge database                            | CF D1 setup + binding configuration                               |
| D8  | Cifrado PII en reposo (Supabase Vault)                    | Supabase Pro+ plan con Vault habilitado                           |
| D9  | Supabase Edge Functions para webhooks/cron                | Setup Edge Functions en dashboard Supabase                        |
| D10 | Screen reader testing real (NVDA, VoiceOver, TalkBack)    | Software asistivo + testing manual con usuarios                   |
| D11 | Video tutorials en dashboard                              | Producción de contenido de vídeo                                  |
| D12 | Merchandising dashboard funcional                         | Acuerdos con proveedores de merchandising                         |
| D13 | CF Pages project automático per-vertical                  | CF API token + automation pipeline                                |
| D14 | CF DNS automático per-vertical                            | CF API + zona DNS configurada                                     |
| D15 | Visual snapshot tests (Chromatic/Percy)                   | Suscripción servicio visual testing                               |
| D16 | Preview deployments per-vertical                          | CF Pages infra per-vertical                                       |
| D17 | Multi-user dealer accounts (propietario + empleados)      | Extensión compleja de auth + RBAC por dealer                      |
| D18 | Guías interactivas sector ("Cómo elegir tu excavadora")   | Contenido editorial especializado                                 |
| D19 | 360° image viewer para vehículos                          | Librería viewer + contenido 360° de vehículos                     |
| D20 | COEP: Cross-Origin-Embedder-Policy require-corp           | Verificar compatibilidad con embeds externos                      |
| D21 | Separar Supabase service role key (CF Workers secrets)    | CF Workers secrets binding en dashboard                           |
| D22 | Vue DevTools profiling de 5 páginas más pesadas           | Vue DevTools + browser profiling manual                           |
| D23 | handleTranslateAll: motor traducción real (DeepL/GPT)     | API key DeepL o integración IA + decisión workflow humano/auto    |
| D24 | Dark/high contrast mode test automático 131 páginas       | Visual regression test suite (Percy/Chromatic) + CI pipeline      |
| D25 | Zoom 200% + viewport 320px test WCAG                      | WCAG 2.1 testing framework + 320px breakpoint validation pipeline |

---

## Fase 9 — Items FUTURO (con escala/equipo/tráfico)

> No se necesitan ahora. Activar cuando haya equipo, tráfico real, o necesidad de escala.

| ID  | Item                                                                | Cuándo activar                        |
| --- | ------------------------------------------------------------------- | ------------------------------------- |
| F1  | RUM (Real User Monitoring) con dashboard por ruta y percentiles     | Tráfico >10K usuarios/mes             |
| F2  | Geo-blocking opcional por vertical                                  | Expansión a múltiples mercados        |
| F3  | Penetration test externo anual                                      | Pre-lanzamiento comercial             |
| F4  | SIEM para correlación de eventos de seguridad                       | Equipo de seguridad dedicado          |
| F5  | Glosario de términos del sector integrado                           | Contenido editorial disponible        |
| F6  | Search engine dedicado (Typesense/Meilisearch)                      | Full-text ilike insuficiente          |
| F7  | A/B testing de títulos/precios para conversión                      | Tráfico suficiente para significancia |
| F8  | Métricas por cohorte (nuevo/recurrente/dealer VIP)                  | Equipo de producto                    |
| F9  | Dashboard salud UX semanal                                          | Equipo de producto                    |
| F10 | Objetivos de conversión por vertical                                | Múltiples verticales activas          |
| F11 | Composable catalog documentado (151+ composables con dependencias)  | Equipo de desarrollo >2 personas      |
| F12 | Event replay capability para debugging                              | Incidentes que lo justifiquen         |
| F13 | Eventos de dominio versionados (schema evolution)                   | Múltiples consumers de eventos        |
| F14 | Visual regression tests (Chromatic/Percy)                           | Equipo QA                             |
| F15 | Component library Storybook/Histoire                                | Equipo de diseño                      |
| F16 | Changelog automático por módulo                                     | Múltiples módulos/verticales          |
| F17 | Refactors continuos con presupuesto de tiempo                       | Sprints formales                      |
| F18 | Módulos independientes feature flags (micro-frontend ready)         | Arquitectura micro-frontend           |
| F19 | Monorepo readiness (@tradebase/ui, @tradebase/composables)          | Equipo >3 personas                    |
| F20 | Shared types package client/server                                  | Monorepo activo                       |
| F21 | Guía formal de diseño de módulos                                    | Onboarding de nuevos devs             |
| F22 | CQRS: separar writes de reads                                       | >100K queries/día                     |
| F23 | Event-driven architecture (consumers + materialized views)          | Múltiples servicios/workers           |
| F24 | Analytics pipeline BigQuery/ClickHouse                              | Datos >1M rows para análisis pesado   |
| F25 | CDN-level personalization (CF Workers edge)                         | Tráfico >50K/mes                      |
| F26 | Anti-bot ML-based en rutas calientes                                | Bot traffic significativo             |
| F27 | Capacity plan por hitos de tráfico y coste                          | Scaling activo                        |
| F28 | Stress tests realistas por escenarios de pico                       | Eventos/campañas previstos            |
| F29 | Simulación fallos proveedor + fallback probado                      | SLAs con clientes                     |
| F30 | SLOs 99.9%+ con reporting mensual                                   | Clientes enterprise                   |
| F31 | Costes por unidad tráfico/conversión                                | Optimización financiera               |
| F32 | Canary releases + rollback inmediato                                | Deploys >1/semana                     |
| F33 | Drills de incidentes trimestrales (war games)                       | Equipo operaciones                    |
| F34 | Chaos engineering (simulación de fallos)                            | Equipo SRE                            |
| F35 | Auto-scaling workers (Fly.io/Railway)                               | Picos de tráfico predecibles          |
| F36 | CF Analytics Engine métricas custom                                 | Métricas complejas sin impacto BD     |
| F37 | Documentación viva auto-generada desde código                       | Equipo >3 personas                    |
| F38 | Métricas separadas por vertical desde día 1                         | Múltiples verticales en producción    |
| F39 | admin/registro.vue: gestión documental real (facturas, contratos)   | Módulo de documentos definido         |
| F40 | admin/cartera.vue: pipeline CRM real (ojeados, negociando)          | Estrategia CRM definida               |
| F41 | Gestión sesiones activas/dispositivos en perfil/seguridad.vue       | Supabase session listing API o custom |
| F42 | Board feature requests público (Canny/Nolt o similar)               | Decisión de herramienta + setup       |
| F43 | Bug bounty program informal (reportar bug → créditos + camiseta)    | Lanzamiento público + presupuesto     |
| F44 | Inventario composables documentado (254 composables + dependencias) | Equipo >2 personas                    |
| F45 | Dependency graph composables visual (interactive)                   | F44 completado                        |
| F46 | Plugin registry/hooks system por vertical                           | 3+ verticales activas                 |
| F47 | Vertical-specific components dinámicos (components/verticals/X/)    | 3+ verticales activas                 |
| F48 | Coupling metrics (afferent/efferent) por módulo                     | Refactoring profundo                  |
| F49 | Supabase Dedicated evaluation (cuando writes >100/seg sostenido)    | Tráfico >5M usuarios/mes              |
| F50 | Email marketing: campaña lanzamiento preparada                      | Pre-lanzamiento comercial             |
| F51 | Custom fields JSONB system por vertical (sin migraciones)           | 3+ verticales con campos divergentes  |
| F52 | Runbooks operacionales por alerta de infra                          | Equipo operaciones >1 persona         |
| F53 | Incident response plan (on-call, escalation, quién a las 3am)       | SLAs con clientes enterprise          |
| F54 | WebSocket connection limits documentación y plan B                  | Subastas con >500 concurrent bidders  |
| F55 | Customer support system (FAQ dinámico, ticketing, email soporte)    | Pre-lanzamiento comercial             |
| F56 | DI real en client composables (no solo serviceContainer server)     | Refactoring profundo                  |
| F57 | Second Supabase cluster operativo + cross-cluster queries           | 3+ verticales o >5M usuarios/mes      |
| F58 | ESI/fragment caching (edge-side includes por componente)            | Tráfico >50K/mes + SSR bottleneck     |
| F59 | require-trusted-types-for 'script' CSP                              | Cuando browser adoption >80%          |

---

## Resumen por Fase

| Fase         | Bloques                | Sesiones est.     | Semanas         | Que desbloquea                                       |
| ------------ | ---------------------- | ----------------- | --------------- | ---------------------------------------------------- |
| 1            | 0 + 1 + 3              | ~19               | 1-3             | Seguridad, pagos funcionales, SEO organico           |
| 2            | 2 + 2b + 6a            | ~23               | 3-6             | Revenue directo por creditos, combos, datos basicos  |
| 3            | 4 + 5                  | ~19               | 6-9             | Confianza publica, reputacion, anti-fraude           |
| 4            | 7 + 8 + 13             | ~19               | 9-13            | Marketing automatizado, WhatsApp funnel, retargeting |
| 5            | 6b + 9 + 10            | ~28               | 13-18           | Datos avanzados, monetizacion premium, DGT real      |
| 6            | 11 + 12 + 14           | ~44               | 18-22           | Pulido tecnico, cobertura tests, infra               |
| 7            | 30 + 31 + 32 + 33 + 34 | ~73               | 22-30           | Escalabilidad, multi-vertical deploy, arquitectura   |
| 7b           | 35 + 36 + 37           | ~30               | 30-36           | Validación UX real, A/B testing, accesibilidad       |
| 7c           | 38 + 39                | ~25               | 36-40           | Load testing real, escala 10M, staging               |
| Founders     | Paralelo               | ~17               | Continuo        | Marcas, DNS, dealers, legal                          |
| Pre-Launch   | Config/Dashboard       | ~12               | Pre-launch      | Servicios externos configurados (47 items)           |
| 8 (DEFERRED) | 25 items               | —                 | Cuando prereqs  | Servicios externos, contratos                        |
| 9 (FUTURO)   | 59 items               | —                 | Con escala      | Escala, equipo, tráfico                              |
| **TOTAL**    | **26 bloques**         | **~316 sesiones** | **~40 semanas** | —                                                    |

---

## Mapa de Dependencias

```
Bloque 0 (errores)
    |
    v
Bloque 1 (creditos + suscripciones)
    |
    +--------> Bloque 2 (features de creditos)
    |               |
    |               +---> #12,#13 (tier enforcement)
    |               +---> #9 (unlocks) ---> #10 (protegido) ---> #11 (reserva)
    |
    +--------> Bloque 2b (combos tractor+semirremolque)
    |               +---> #211 (combos producto) ---> depende de vehicle_groups infra (ya existe)
    |
    v
Bloque 3 (SEO landings) -----> [independiente, hacer en paralelo con Bloque 1]
    |
    +---> #62 (motor) ---> #63 (catalogo real)

Bloque 4 (anti-fraude)
    |
    +---> #30 (Trust Score) ---> #31 (badges) ---> #32 (guia)
    |                       |---> #33 (alertas buyer)
    |                       |---> Bloque 5 (#54, #55)
    |
    +---> #27 (SMS OTP) [independiente]
    +---> #28 (duplicates) [independiente]
    +---> #29 (fingerprint) [independiente]

Bloque 5 (reviews)
    +---> #50 (backend) ---> #51 (display) ---> #52,#53 (detalles)
    |                                      |---> #54 (badge) + #55 (scoreboard)

Bloque 8 (WhatsApp funnel)
    +---> #59 (ref_code) ---> #60 (handler) ---> #61 (menu)

Bloque 35 (user testing) -----> [independiente, requiere dealers reales]
    +---> #264 (testing presencial) ---> #266 (NPS + iteración)

Bloque 36 (A/B + analytics)
    +---> #268 (A/B infra) ---> #269 (funnel dashboard)
    +---> #273 (revenue metrics) + #274 (admin subs) ---> dependen de #8

Bloque 37 (design system + a11y) -----> [independiente]
    +---> #275 (showcase) [independiente]
    +---> #277 (axe-core CI) [independiente]
    +---> #280 (UiSubmitButton) ---> #282 (loading states)

Bloque 38 (load testing) -----> [independiente, k6 readiness workflow existe]
    +---> #286 (load test) ---> #287-#291 (stress/spike/soak/writes/auctions)
    +---> #292 (documentar bottlenecks)

Bloque 39 (10M readiness) -----> [requiere resultados de Bloque 38]
    +---> #293 (partitioning) + #294 (matviews) [independientes]
    +---> #302 (distributed tracing) ---> depende de #246 (APM Sentry)
```

---

## Auditoría SonarQube 100%

**Documento completo:** `docs/tracciona-docs/AUDITORIA-SONARQUBE-100.md`

**Estado:** 805 issues abiertos (13 bugs + 792 code smells + 21 hotspots)

**Objetivo:** Quality Gate "Sonar way" en PASSED (0 violations, ≥80% coverage, ≤3% duplicados)

**Fases:** 10 fases, 16-24 sesiones, ~80-110 horas, sin hacks ni atajos

**Orden recomendado:**

1. Fase 1-2 (Bugs + Blockers, 4h)
2. Fase 4 (Mechanical fixes, 6-9h)
3. Fase 3 (Cognitive complexity, 15-20h)
4. Fases 5-9 (Quality + coverage + tests, 40-50h)
5. Fase 10 (Final verification, 2h)

**Próximo paso:** Mandar mensaje "auditoría SonarQube fase 1" para empezar.

---

## Items Bloqueados — Agente Coverage (desbloqueo automático)

> **Estado:** Bloqueados mientras el agente de coverage escribe tests para estos archivos/composables.
> **Desbloqueo:** Cuando el agente de coverage termine (prompt: "siguiente lote de tests de coverage" hasta 100%).
> **Estos items NO se pueden ejecutar en paralelo con el agente** porque modifican los mismos composables que está cubriendo.

| #   | Plan ID | Item                                                              | Esfuerzo | Tipo | Bloqueo                                            | Hecho cuando...                                                                                     |
| --- | ------- | ----------------------------------------------------------------- | -------- | ---- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 117 | U2      | Optimistic UI en acciones frecuentes (favoritos, reservas, pujas) | M        | Code | Agente coverage cubre useReservation, useFavorites | Actualización visual inmediata sin esperar respuesta servidor; rollback en error                    |
| 118 | O1      | Structured logs con nivel + contexto en server/services           | S        | Code | Agente coverage cubre server/services              | Todos los `console.log/error` reemplazados por logger estructurado (`[service][level] msg context`) |
| 119 | O2      | Weekly report cron — KPIs clave via email                         | S        | Code | Agente coverage cubre composables de métricas      | Cron lunes 07:00 UTC envia email con: nuevos vehículos, dealers activos, leads, revenue semana      |
| 120 | N1      | Script scaffold para nueva vertical                               | M        | Code | Agente coverage termina (no modificar utils)       | `node scripts/new-vertical.mjs --slug maquinaria` crea vertical_config row + i18n keys + README     |
| 121 | D1      | Split composables >500 líneas                                     | M        | Code | Agente coverage cubre composables grandes          | Cada composable ≤500 líneas; funciones extraídas a utils/ o sub-composables con tests propios       |
| 122 | S7      | Coverage gate en CI (quality gate automático)                     | S        | Code | Agente coverage termina (~100% alcanzado)          | CI job `coverage-gate` falla si coverage cae por debajo del último baseline registrado              |

**Desbloqueo parcial:** U2, O1, O2 se pueden hacer una vez el agente cubra los composables relevantes (no hay que esperar el 100%).
**Desbloqueo total:** D1 y S7 requieren que el agente haya terminado completamente.

---

## Como usar este backlog

1. **Al inicio de sesion:** Dime "siguiente bloque" o "bloque X" y trabajamos en orden
2. **Cada item completado:** Lo marco como hecho aqui y en STATUS.md
3. **Si cambian prioridades:** Reordeno bloques sin perder items
4. **Founder tasks:** Las haces tu fuera de sesion, me avisas cuando esten hechas para actualizar
5. **Auditoría SonarQube:** Paralela al backlog normal. Mandar "auditoría fase X" cuando quieras empezar

> Este documento es la **única fuente de verdad** para trabajo pendiente. `PLAN-MAESTRO-10-DE-10.md` redirige aquí (sus ~180 items completados están en STATUS.md changelog). `IDEAS-A-REVISAR.md` es banco de ideas separado (brainstorming, NO backlog).
