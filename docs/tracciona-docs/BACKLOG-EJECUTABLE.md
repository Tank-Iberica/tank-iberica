# Backlog Ejecutable — Tracciona

> **Generado:** 2026-03-12 · **Actualizado:** 2026-03-13 | **Items:** ~220 (122 originales + Plan Maestro pendientes + Pre-Launch Checklist + DEFERRED + FUTURO) | **Fuentes:** STATUS.md, ESTRATEGIA-NEGOCIO.md, PROYECTO-CONTEXTO.md, AUDITORIA-26-FEBRERO.md, FLUJOS-OPERATIVOS.md, CRON-JOBS.md, PLAN-MAESTRO-10-DE-10.md
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

| #   | Item                                              | Esfuerzo | Tipo           | Depende de | Hecho cuando...                                                                |
| --- | ------------------------------------------------- | -------- | -------------- | ---------- | ------------------------------------------------------------------------------ |
| 1   | Rate limiting en produccion — reglas CF WAF       | S        | Config/Founder | —          | CF WAF dashboard tiene reglas activas, test con curl devuelve 429 tras umbral  |
| 2   | `/api/verify-document` sin validacion ownership   | S        | Code           | —          | Endpoint devuelve 403 si dealer_id != session.user.dealer_id                   |
| 3   | 5 server routes exponen nombres servicio en error | S        | Code           | —          | Todos los catch usan `safeError()`, ningun nombre de servicio en response body |
| 4   | 10 errores TypeScript restantes                   | M        | Code           | —          | `npm run typecheck` = 0 errores                                                |
| 5   | 2 test stubs en useVehicles.test.ts               | S        | Code           | —          | Tests implementados o marcados `it.skip()` con TODO                            |
| 6   | exceljs no incluido en manualChunks               | S        | Code           | —          | `npm run build` muestra chunk `vendor-excel` separado                          |

**Total Bloque 0:** ~4 sesiones | **Desbloquea:** Nada (higiene)

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

| #   | Item                                                  | Esfuerzo | Tipo | Depende de | Hecho cuando...                                                                                        |
| --- | ----------------------------------------------------- | -------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------ |
| 30  | Trust Score 0-100 calculo automatico                  | L        | Code | —          | Funcion calcula score segun 9 criterios, actualiza dealer profile, recalculo diario via cron           |
| 31  | Badges publicos (sin/<60, Verificado 60-79, Top >=80) | M        | Code | #30        | Badge visible en VehicleCard y perfil dealer, tooltip explica criterio                                 |
| 32  | Guia "Mejora tu puntuacion" en dashboard              | S        | Code | #30        | Pagina muestra criterios cumplidos/pendientes, enlace a acciones                                       |
| 33  | Alertas contextuales al comprador                     | M        | Code | #30        | Banner suave si: dealer sin verificar + precio bajo, cuenta <7d, pocas fotos, precio >30% bajo mercado |
| 27  | Phone verification SMS OTP                            | M        | Code | —          | Al crear primera publicacion, dealer recibe SMS con codigo, verificado queda en profile                |
| 28  | Duplicate detection (hash imagenes + titulo)          | L        | Code | —          | Al publicar, sistema detecta duplicados potenciales, admin ve lista, seller recibe aviso               |
| 29  | IP/device fingerprint (background)                    | M        | Code | —          | Fingerprint guardado en BD, admin ve flag si multiples cuentas desde mismo dispositivo                 |
| 34  | Excepcion fleet companies rate limit                  | S        | Code | #1         | Si subscription_tier >= basic o verificado manual, rate limit sube a 500/hora                          |

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

| #   | Item                                        | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                      |
| --- | ------------------------------------------- | -------- | ------ | ---------- | -------------------------------------------------------------------- |
| 82  | ~115 strings admin sin i18n                 | M        | Code   | —          | Todos los strings en admin usan $t(), archivos i18n actualizados     |
| 83  | CSP unsafe-inline/unsafe-eval               | M        | Code   | —          | CSP nonce-based (cuando Nuxt 4 estable) + reporting endpoint         |
| 84  | HEALTH_TOKEN no configurado                 | S        | Config | —          | Variable en .env + Cloudflare, health endpoint protegido             |
| 85  | infra_alerts no existe en types/supabase.ts | S        | Code   | —          | `npx supabase gen types` ejecutado, tipos regenerados                |
| 86  | CHECK constraints limitados                 | S        | Code   | —          | Migracion anade CHECK a balance, payments, auction_bids              |
| 87  | VARCHAR statuses a ENUMs                    | M        | Code   | —          | Migracion convierte statuses frecuentes a ENUM types                 |
| 88  | sizes en imagenes responsive (NuxtImg)      | M        | Code   | —          | Todas las NuxtImg tienen atributo `sizes` apropiado                  |
| 89  | Libreria validacion forms (Zod/VeeValidate) | L        | Code   | —          | Formularios criticos usan validacion con mensajes descriptivos       |
| 90  | ARIA live regions contenido dinamico        | M        | Code   | —          | Regiones dinamicas (catalogo, chat, notificaciones) tienen aria-live |
| 91  | Virtual scroll en listas grandes            | M        | Code   | —          | Catalogos >100 items usan virtual scroll, DOM <50 nodos visibles     |
| 92  | Backup originales imagenes documentado      | S        | Config | —          | Proceso documentado en DISASTER-RECOVERY.md                          |
| 93  | OpenAPI/Swagger spec                        | L        | Code   | —          | Spec generada automaticamente o mantenida, accesible en /api/docs    |
| 94  | JSDoc incompleto en composables             | M        | Code   | —          | Composables publicos tienen JSDoc con @param y @returns              |
| 95  | Snyk en CI                                  | S        | Config | —          | GitHub Action ejecuta `snyk test` en cada PR                         |

**Total Bloque 11:** ~14 sesiones

---

### Bloque 12: Backlog Tecnico

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 74  | Tests seguridad expandidos (IDOR, rate limit, info leak)   | M        | Code   | —          | Tests verifican: dealer no ve datos de otro, 429 tras umbral, sin info leak. **Entregables:** `tests/security/idor-protection.test.ts`, `rate-limiting.test.ts`, `information-leakage.test.ts`, `referencia/RATE-LIMITING-RULES.md` |
| 75  | CSP nonce-based + reporting + auditoria licencias          | M        | Code   | #83        | Resolver junto con #83. **Entregables:** editar `security-headers.ts`, crear `csp-report.post.ts`, `scripts/audit-licenses.mjs`. **Dep:** Nuxt 4 estable                                                                            |
| 76  | Test restore backup en BD temporal (Neon) + mirror repo    | M        | Config | —          | Restore ejecutado en Neon free, datos verificados, documentado. **Entregables:** `scripts/test-restore.sh` (ampliar), `.github/workflows/mirror.yml`. **Prereq humano:** crear cuenta Neon + Bitbucket + GitHub Secrets             |
| 77  | Modularizacion endpoints largos restantes                  | M        | Code   | —          | Ningun endpoint >200 lineas, logica extraida a services/. **Entregables:** 4 archivos en `server/services/` (imageUploader, vehicleCreator, whatsappProcessor, notifications) — whatsapp/process ya hecho, verificar otros          |
| 78  | Deshardcodear: aiConfig, siteConfig, Supabase ref, prompts | M        | Code   | —          | Configuracion centralizada en archivos config, no dispersa en codigo. **Entregables:** `server/utils/aiConfig.ts`, `server/utils/siteConfig.ts`, mover Supabase project ref a secret, categorias prompt Claude desde BD             |
| 79  | Cobertura tests 15% a 40% + coverage gate CI               | L        | Code   | #77        | `npm run test -- --coverage` >= 40%, CI falla si baja. **Entregables:** ~12 archivos test (servicios server: aiProvider, billing, rateLimit, safeError + composables: useAuth, useSubscriptionPlan), editar `ci.yml` threshold 40%  |
| 80  | E2E Playwright: 5 user journeys                            | L        | Code   | #79        | 5 tests E2E: visitor search, dealer publish, subscription, buyer fav, admin approve. **Entregables:** 5 specs en `tests/e2e/journeys/`                                                                                              |
| 81  | Market Intelligence dashboard dealer                       | L        | Code   | —          | Dashboard "tu stock vs mercado": precio medio, posicion, dias en venta. **Entregables:** ampliar `marketReport.ts`, crear `useMarketIntelligence.ts`, completar `/valoracion`                                                       |

**Total Bloque 12:** ~13 sesiones

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

| #   | Item                                                      | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                             |
| --- | --------------------------------------------------------- | -------- | ------ | ---------- | ----------------------------------------------------------- |
| 124 | Early Hints (103) precargar CSS y fuentes                 | S        | Config | —          | CF dashboard activa Early Hints, verificado con curl        |
| 125 | HTTP/3 habilitado en Cloudflare                           | S        | Config | —          | curl --http3 confirma H3, CF dashboard activo               |
| 126 | Compresión Brotli verificada en CF                        | S        | Config | —          | curl con Accept-Encoding: br devuelve content-encoding: br  |
| 127 | TTFB/LCP/INP monitoring per-route con alerting            | M        | Code   | —          | Dashboard muestra métricas por ruta, alerta si LCP >2.5s    |
| 128 | fetchOnServer:true en páginas SSR restantes               | S        | Code   | —          | subastas/index.vue y homepage migrados a useAsyncData SSR   |
| 129 | Web Vitals aggregation dashboard (backend)                | M        | Code   | —          | Endpoint recibe web-vitals data, admin ve métricas por ruta |
| 130 | Eliminar unsafe-eval CSP: Chart.js sin eval o Web Worker  | M        | Code   | #83        | CSP sin unsafe-eval, Chart.js funciona correctamente        |
| 131 | WebP/AVIF conversión sistemática (imágenes no-Cloudinary) | S        | Code   | —          | Todas las imágenes estáticas servidas en WebP/AVIF          |

**Total Bloque 30:** ~7 sesiones

---

### Bloque 31: Escalabilidad Infraestructura

| #   | Item                                                                     | Esfuerzo | Tipo        | Depende de | Hecho cuando...                                                 |
| --- | ------------------------------------------------------------------------ | -------- | ----------- | ---------- | --------------------------------------------------------------- |
| 132 | Redis/Upstash como cache layer (rate limiting, sessions, feature flags)  | L        | Code/Config | —          | Upstash configurado, rate limiting usa Redis, latencia <10ms    |
| 133 | CF Queues o BullMQ para background processing (AI, reports, imports)     | L        | Code/Config | #132       | AI calls, reports, imports procesados via queue                 |
| 134 | Worker dedicado para cron jobs (no inline en API routes)                 | M        | Code        | #133       | Crons ejecutan en worker separado, no en request path           |
| 135 | PgBouncer connection pooling modo transaction                            | S        | Config      | —          | Supabase Pooler activado, queries usan pooler URL               |
| 136 | Read replicas para queries analíticas                                    | M        | Config      | —          | Dashboard stats y market reports usan replica                   |
| 137 | EXPLAIN ANALYZE top 20 queries y optimizar                               | M        | Code        | —          | 20 queries más frecuentes analizadas y optimizadas, documentado |
| 138 | Query budget enforcement (max 5 queries por page load)                   | S        | Code        | —          | Composable alerta si page load excede 5 queries                 |
| 139 | CDN cache rules por tipo (HTML 5min SWR, API vary, images 30d, fonts 1y) | S        | Config      | —          | CF Page Rules configuradas, headers verificados con curl        |
| 140 | Custom metrics req/s, p50/p95/p99 latency                                | M        | Code        | —          | Dashboard muestra latency percentiles por endpoint              |
| 141 | Dashboard operacional Grafana/CF Analytics                               | L        | Config      | #140       | Dashboard accesible con métricas en tiempo real                 |
| 142 | Capacity alerting al 70% de límites                                      | S        | Code        | —          | Alerta automática cuando storage/connections/bandwidth >70%     |
| 143 | DB slow query log con alerting (>500ms)                                  | M        | Code        | —          | Queries >500ms logueadas y alertadas                            |
| 144 | Materialized views refresh (dashboard KPIs, search facets)               | M        | Code        | —          | matviews con refresh schedule, dashboard usa matviews           |
| 145 | Vary: Accept-Encoding, Accept-Language correcto                          | S        | Code        | —          | Verificado en todos los endpoints públicos                      |

**Total Bloque 31:** ~15 sesiones

---

### Bloque 32: Multi-Vertical Deployment

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                           |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------- | --------------------------------------------------------- |
| 146 | Multi-vertical single deployment (wildcard domain routing) | L        | Code   | —          | \*.tradebase.com routing por hostname funciona            |
| 147 | CI/CD pipeline para todas las verticales desde un push     | M        | Config | #146       | Un push deploya todas las verticales activas              |
| 148 | Environment config per vertical en Cloudflare              | S        | Config | #146       | Cada vertical tiene sus env vars en CF                    |
| 149 | Plan de rollback per vertical                              | S        | Config | #146       | Documentado y probado: rollback <5 min                    |
| 150 | E2E tests parametrizados por vertical                      | M        | Code   | #146       | Mismo test corre con config de cada vertical              |
| 151 | create-vertical.mjs: logo placeholder + email templates    | S        | Code   | —          | Script genera logo placeholder y templates email al crear |

**Total Bloque 32:** ~7 sesiones

---

### Bloque 33: Arquitectura y Calidad

| #   | Item                                                          | Esfuerzo | Tipo    | Depende de | Hecho cuando...                                                  |
| --- | ------------------------------------------------------------- | -------- | ------- | ---------- | ---------------------------------------------------------------- |
| 152 | Architecture boundaries: reglas de dependencia entre dominios | M        | Code    | —          | Lint rule impide imports cross-domain no permitidos              |
| 153 | Atomic design: extraer atoms / molecules / organisms          | L        | Code    | —          | Componentes reorganizados, nueva estructura documentada          |
| 154 | Cada módulo testable de forma aislada                         | M        | Code    | —          | Tests de cada módulo corren sin dependencias externas            |
| 155 | Registro seguridad centralizado con alertas automáticas       | M        | Code    | —          | Log centralizado, patrones sospechosos generan alerta automática |
| 156 | RS256 JWT migration (Supabase Dashboard)                      | S        | Config  | —          | JWT firmado con RS256, aplicación funciona correctamente         |
| 157 | Incident playbook con tiempos formales de respuesta (SLAs)    | S        | Founder | —          | INCIDENT-RUNBOOK.md tiene SLAs por severidad P0-P3               |

**Total Bloque 33:** ~7 sesiones

---

### Bloque 34: Infra Config (Plan/Cuenta necesarios)

| #   | Item                                                         | Esfuerzo | Tipo           | Depende de | Hecho cuando...                            |
| --- | ------------------------------------------------------------ | -------- | -------------- | ---------- | ------------------------------------------ |
| 158 | Supabase Team/Enterprise plan (más conexiones, storage, SLA) | S        | Config/Founder | —          | Plan Team activo en Supabase dashboard     |
| 159 | CF Workers Paid plan (30ms CPU, 128MB memory)                | S        | Config/Founder | —          | Plan Paid activo en Cloudflare dashboard   |
| 160 | CF R2 para archivos grandes (PDFs, exports, backups)         | S        | Config         | #159       | R2 bucket creado, upload/download funciona |
| 161 | CF KV para feature flags (sub-ms reads from edge)            | M        | Code           | #159       | Feature flags servidos desde CF KV, <1ms   |

**Total Bloque 34:** ~4 sesiones

**Total Fase 7:** ~40 sesiones

---

## Tareas Fundadores (paralelas, no-codigo)

No bloquean ni son bloqueadas por codigo. Ejecutar cuando sea posible.

| #   | Item                                          | Esfuerzo | Urgencia | Hecho cuando...                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

---

## Pre-Launch Setup Checklist (Config/Dashboard — no-código)

> Tareas de configuración en dashboards externos. No requieren código (salvo #198 y #199). Ejecutar cuando se tenga acceso a cada servicio.

### Cloudflare

| #   | Item                                                   | Hecho cuando...                                             |
| --- | ------------------------------------------------------ | ----------------------------------------------------------- |
| 162 | WAF Managed Rules activas (OWASP Core Ruleset)         | Rules activas en CF Dashboard → Security → WAF              |
| 163 | Bot Fight Mode activado                                | CF Dashboard → Security → Bots → Bot Fight Mode ON          |
| 164 | SSL/TLS en modo Full (Strict) + Always Use HTTPS       | CF Dashboard → SSL/TLS → Full (strict) + Edge Certificates  |
| 165 | DDoS Protection verificado                             | CF Dashboard → Security → DDoS → reglas activas             |
| 166 | WAF exceptions para endpoints internos (crons, health) | Custom rules excluyen /api/cron/\* y /api/health del WAF    |
| 167 | Turnstile (CAPTCHA) obtenido para formularios críticos | Site key + secret key generados en CF Dashboard → Turnstile |
| 168 | CF Images configurado (si se migra de Cloudinary)      | CF Images habilitado, test de upload funciona               |

### Supabase

| #   | Item                                                  | Hecho cuando...                                              |
| --- | ----------------------------------------------------- | ------------------------------------------------------------ |
| 169 | Auth Rate Limiting configurado en dashboard           | Dashboard → Auth → Rate Limits ajustados                     |
| 170 | Verificar backup automático diario + retention policy | Dashboard → Database → Backups → daily activo, retention 7d+ |
| 171 | Auth Logging habilitado para auditoría                | Dashboard → Auth → Logs → auth hook logging activo           |

### Stripe

| #   | Item                                                        | Hecho cuando...                                                      |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| 172 | Activar modo Live (salir de Test mode)                      | Stripe Dashboard → modo Live activo, KYC completado                  |
| 173 | Webhook endpoint registrado para producción                 | Webhook apunta a https://tracciona.com/api/stripe/webhook, events OK |
| 174 | Stripe Connect Express configurado (si se usa para dealers) | Connected accounts habilitado en Stripe Dashboard                    |

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

| #   | Item                                               | Hecho cuando...                                   |
| --- | -------------------------------------------------- | ------------------------------------------------- |
| 179 | Sentry DSN de producción configurado               | Sentry project creado, DSN en env, errores llegan |
| 180 | Google Analytics 4 (GA4) property creada           | GA4 property activa, datos de tráfico visibles    |
| 181 | Google Search Console verificado y sitemap enviado | site:tracciona.com indexa, sitemap procesado      |
| 182 | Google Merchant Center (si aplica)                 | Feed de productos enviado, productos aprobados    |

### Publicidad

| #   | Item                       | Hecho cuando...                             |
| --- | -------------------------- | ------------------------------------------- |
| 183 | Google AdSense (si aplica) | AdSense cuenta aprobada, ads.txt en /public |
| 184 | Google Ads cuenta creada   | Cuenta lista para campañas SEM              |

### Backup / Infra

| #   | Item                                         | Hecho cuando...                                        |
| --- | -------------------------------------------- | ------------------------------------------------------ |
| 185 | Backblaze B2 bucket para backup offsite      | Bucket creado, test de upload funciona                 |
| 186 | VAPID keys generadas para push notifications | Keys generadas, configuradas en env                    |
| 187 | Bitbucket mirror repo creado (backup git)    | Mirror activo, push automático tras cada commit a main |

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

| #   | Item                            | Hecho cuando...                                 |
| --- | ------------------------------- | ----------------------------------------------- |
| 193 | Anthropic API key de producción | Key generada, configurada en env, test funciona |
| 194 | OpenAI API key (fallback)       | Key generada, configurada en env                |

### Facturación

| #   | Item                                       | Hecho cuando...                        |
| --- | ------------------------------------------ | -------------------------------------- |
| 195 | Quaderno o Billin para TicketBAI/Verifactu | Cuenta activa, integración configurada |

### DevOps / CI

| #   | Item                                         | Hecho cuando...                                  |
| --- | -------------------------------------------- | ------------------------------------------------ |
| 196 | Dependabot activo con revisión semanal       | `.github/dependabot.yml` configurado, PRs llegan |
| 197 | Migraciones Supabase aplicadas en producción | `supabase db push` exitoso, 0 errores            |

### Code (post-setup)

| #   | Item                                                      | Esfuerzo | Tipo | Hecho cuando...                                             |
| --- | --------------------------------------------------------- | -------- | ---- | ----------------------------------------------------------- |
| 198 | Integrar Sentry SDK en producción (DSN real, source maps) | S        | Code | Source maps subidos a Sentry, stack traces resueltos        |
| 199 | Fix docker-compose para desarrollo local                  | S        | Code | `docker compose up` arranca todos los servicios sin errores |

### Notas Operativas

- Las referencias a "tank-iberica" en código legacy son alias históricos — migrar gradualmente a "tracciona"
- CSP: mantener revisión periódica cuando se añadan nuevos third-party scripts
- Security tests: ejecutar DAST (Nuclei) antes de cada release mayor
- `package-lock.json` debe estar siempre en el commit (CI lo necesita)

---

## Fase 8 — Items DEFERRED (requieren servicios externos o decisiones)

> Items identificados en el Plan Maestro pero aplazados por requerir contratos, APIs externas, hardware, o decisiones estratégicas pendientes. Reactivar cuando se cumplan los prerequisitos.

| ID  | Item                                                      | Prerequisito                                    |
| --- | --------------------------------------------------------- | ----------------------------------------------- |
| D1  | SMS notifications via Twilio                              | Cuenta Twilio + API key + presupuesto SMS       |
| D2  | Recomendaciones ML-based ("Vehículos similares" mejorado) | Modelo ML entrenado o API externa               |
| D3  | Auto-fill datos por matrícula (API DGT)                   | Contrato DGT + credenciales API                 |
| D4  | Mapa interactivo de vehículos (Leaflet/Mapbox)            | API key Mapbox o Leaflet + geodatos en BD       |
| D5  | Firma digital de contratos (DocuSign/SignaturIT)          | Cuenta servicio de firma digital                |
| D6  | CF Durable Objects para estado compartido                 | CF Workers Paid plan + Durable Objects binding  |
| D7  | CF D1 como cache edge database                            | CF D1 setup + binding configuration             |
| D8  | Cifrado PII en reposo (Supabase Vault)                    | Supabase Pro+ plan con Vault habilitado         |
| D9  | Supabase Edge Functions para webhooks/cron                | Setup Edge Functions en dashboard Supabase      |
| D10 | Screen reader testing real (NVDA, VoiceOver, TalkBack)    | Software asistivo + testing manual con usuarios |
| D11 | Video tutorials en dashboard                              | Producción de contenido de vídeo                |
| D12 | Merchandising dashboard funcional                         | Acuerdos con proveedores de merchandising       |
| D13 | CF Pages project automático per-vertical                  | CF API token + automation pipeline              |
| D14 | CF DNS automático per-vertical                            | CF API + zona DNS configurada                   |
| D15 | Visual snapshot tests (Chromatic/Percy)                   | Suscripción servicio visual testing             |
| D16 | Preview deployments per-vertical                          | CF Pages infra per-vertical                     |
| D17 | Multi-user dealer accounts (propietario + empleados)      | Extensión compleja de auth + RBAC por dealer    |
| D18 | Guías interactivas sector ("Cómo elegir tu excavadora")   | Contenido editorial especializado               |
| D19 | 360° image viewer para vehículos                          | Librería viewer + contenido 360° de vehículos   |
| D20 | COEP: Cross-Origin-Embedder-Policy require-corp           | Verificar compatibilidad con embeds externos    |
| D21 | Separar Supabase service role key (CF Workers secrets)    | CF Workers secrets binding en dashboard         |
| D22 | Vue DevTools profiling de 5 páginas más pesadas           | Vue DevTools + browser profiling manual         |

---

## Fase 9 — Items FUTURO (con escala/equipo/tráfico)

> No se necesitan ahora. Activar cuando haya equipo, tráfico real, o necesidad de escala.

| ID  | Item                                                               | Cuándo activar                        |
| --- | ------------------------------------------------------------------ | ------------------------------------- |
| F1  | RUM (Real User Monitoring) con dashboard por ruta y percentiles    | Tráfico >10K usuarios/mes             |
| F2  | Geo-blocking opcional por vertical                                 | Expansión a múltiples mercados        |
| F3  | Penetration test externo anual                                     | Pre-lanzamiento comercial             |
| F4  | SIEM para correlación de eventos de seguridad                      | Equipo de seguridad dedicado          |
| F5  | Glosario de términos del sector integrado                          | Contenido editorial disponible        |
| F6  | Search engine dedicado (Typesense/Meilisearch)                     | Full-text ilike insuficiente          |
| F7  | A/B testing de títulos/precios para conversión                     | Tráfico suficiente para significancia |
| F8  | Métricas por cohorte (nuevo/recurrente/dealer VIP)                 | Equipo de producto                    |
| F9  | Dashboard salud UX semanal                                         | Equipo de producto                    |
| F10 | Objetivos de conversión por vertical                               | Múltiples verticales activas          |
| F11 | Composable catalog documentado (151+ composables con dependencias) | Equipo de desarrollo >2 personas      |
| F12 | Event replay capability para debugging                             | Incidentes que lo justifiquen         |
| F13 | Eventos de dominio versionados (schema evolution)                  | Múltiples consumers de eventos        |
| F14 | Visual regression tests (Chromatic/Percy)                          | Equipo QA                             |
| F15 | Component library Storybook/Histoire                               | Equipo de diseño                      |
| F16 | Changelog automático por módulo                                    | Múltiples módulos/verticales          |
| F17 | Refactors continuos con presupuesto de tiempo                      | Sprints formales                      |
| F18 | Módulos independientes feature flags (micro-frontend ready)        | Arquitectura micro-frontend           |
| F19 | Monorepo readiness (@tradebase/ui, @tradebase/composables)         | Equipo >3 personas                    |
| F20 | Shared types package client/server                                 | Monorepo activo                       |
| F21 | Guía formal de diseño de módulos                                   | Onboarding de nuevos devs             |
| F22 | CQRS: separar writes de reads                                      | >100K queries/día                     |
| F23 | Event-driven architecture (consumers + materialized views)         | Múltiples servicios/workers           |
| F24 | Analytics pipeline BigQuery/ClickHouse                             | Datos >1M rows para análisis pesado   |
| F25 | CDN-level personalization (CF Workers edge)                        | Tráfico >50K/mes                      |
| F26 | Anti-bot ML-based en rutas calientes                               | Bot traffic significativo             |
| F27 | Capacity plan por hitos de tráfico y coste                         | Scaling activo                        |
| F28 | Stress tests realistas por escenarios de pico                      | Eventos/campañas previstos            |
| F29 | Simulación fallos proveedor + fallback probado                     | SLAs con clientes                     |
| F30 | SLOs 99.9%+ con reporting mensual                                  | Clientes enterprise                   |
| F31 | Costes por unidad tráfico/conversión                               | Optimización financiera               |
| F32 | Canary releases + rollback inmediato                               | Deploys >1/semana                     |
| F33 | Drills de incidentes trimestrales (war games)                      | Equipo operaciones                    |
| F34 | Chaos engineering (simulación de fallos)                           | Equipo SRE                            |
| F35 | Auto-scaling workers (Fly.io/Railway)                              | Picos de tráfico predecibles          |
| F36 | CF Analytics Engine métricas custom                                | Métricas complejas sin impacto BD     |
| F37 | Documentación viva auto-generada desde código                      | Equipo >3 personas                    |
| F38 | Métricas separadas por vertical desde día 1                        | Múltiples verticales en producción    |

---

## Resumen por Fase

| Fase         | Bloques                | Sesiones est.     | Semanas         | Que desbloquea                                       |
| ------------ | ---------------------- | ----------------- | --------------- | ---------------------------------------------------- |
| 1            | 0 + 1 + 3              | ~18               | 1-3             | Seguridad, pagos funcionales, SEO organico           |
| 2            | 2 + 6a                 | ~18               | 3-6             | Revenue directo por creditos, datos basicos          |
| 3            | 4 + 5                  | ~19               | 6-9             | Confianza publica, reputacion, anti-fraude           |
| 4            | 7 + 8 + 13             | ~19               | 9-13            | Marketing automatizado, WhatsApp funnel, retargeting |
| 5            | 6b + 9 + 10            | ~28               | 13-18           | Datos avanzados, monetizacion premium, DGT real      |
| 6            | 11 + 12 + 14           | ~33               | 18-22           | Pulido tecnico, cobertura tests, infra               |
| 7            | 30 + 31 + 32 + 33 + 34 | ~40               | 22-30           | Escalabilidad, multi-vertical deploy, arquitectura   |
| Founders     | Paralelo               | ~16               | Continuo        | Marcas, DNS, dealers, legal                          |
| Pre-Launch   | Config/Dashboard       | ~10               | Pre-launch      | Servicios externos configurados                      |
| 8 (DEFERRED) | 22 items               | —                 | Cuando prereqs  | Servicios externos, contratos                        |
| 9 (FUTURO)   | 38 items               | —                 | Con escala      | Escala, equipo, tráfico                              |
| **TOTAL**    | **20 bloques**         | **~191 sesiones** | **~30 semanas** | —                                                    |

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
