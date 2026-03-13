# Backlog Ejecutable — Tracciona

> **Generado:** 2026-03-12 | **Items:** 116 | **Fuentes:** STATUS.md, ESTRATEGIA-NEGOCIO.md, PROYECTO-CONTEXTO.md, AUDITORIA-26-FEBRERO.md, FLUJOS-OPERATIVOS.md, CRON-JOBS.md
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
| 2   | `/api/verify-document` sin validacion ownership   | S        | Code           | ✅ done     | checkVehicleAccess() verifica dealer_id==session.user.dealer OR role=admin; 403 si no coincide |
| 3   | 5 server routes exponen nombres servicio en error | S        | Code           | ✅ agent-c  | merchant-feed.get.ts + embed/[dealer-slug].get.ts: error.message → logger.error + generic text; safeError ya cubre el resto en prod |
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
| 86  | CHECK constraints limitados                 | S        | Code   | ✅ agent-c  | migration 00136: CHECK en auction_bids.amount_cents, payments.amount_cents, payments.status IN(...), balance.importe, balance.coste_asociado |
| 87  | VARCHAR statuses a ENUMs                    | M        | Code   | ✅ agent-c  | migration 00137: 8 ENUM types (payment/lead/subscription/auction/verification/reservation/comment/social_post_status) + types/supabase.ts actualizado |
| 88  | sizes en imagenes responsive (NuxtImg)      | M        | Code   | —          | Todas las NuxtImg tienen atributo `sizes` apropiado                  |
| 89  | Libreria validacion forms (Zod/VeeValidate) | L        | Code   | —          | Formularios criticos usan validacion con mensajes descriptivos       |
| 90  | ARIA live regions contenido dinamico        | M        | Code   | —          | Regiones dinamicas (catalogo, chat, notificaciones) tienen aria-live |
| 91  | Virtual scroll en listas grandes            | M        | Code   | —          | Catalogos >100 items usan virtual scroll, DOM <50 nodos visibles     |
| 92  | Backup originales imagenes documentado      | S        | Config | —          | Proceso documentado en DISASTER-RECOVERY.md                          |
| 93  | OpenAPI/Swagger spec                        | L        | Code   | —          | Spec generada automaticamente o mantenida, accesible en /api/docs    |
| 94  | JSDoc incompleto en composables             | M        | Code   | —          | Composables publicos tienen JSDoc con @param y @returns              |
| 95  | Snyk en CI                                  | S        | Config | ✅ agent-c  | ci.yml: job snyk (opt-in via vars.SNYK_ENABLED=true, --severity-threshold=high --fail-on=all) |

**Total Bloque 11:** ~14 sesiones

---

### Bloque 12: Backlog Tecnico

| #   | Item                                                       | Esfuerzo | Tipo   | Depende de | Hecho cuando...                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 74  | Tests seguridad expandidos (IDOR, rate limit, info leak)   | M        | Code   | ✅ agent-c  | idor-protection.test.ts (270L) + rate-limiting.test.ts + information-leakage.test.ts + referencia/RATE-LIMITING-RULES.md (reglas, CF WAF config, auto-ban, composite key) |
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

## Tareas Fundadores (paralelas, no-codigo)

No bloquean ni son bloqueadas por codigo. Ejecutar cuando sea posible.

| #   | Item                                          | Esfuerzo | Urgencia | Hecho cuando...                                           |
| --- | --------------------------------------------- | -------- | -------- | --------------------------------------------------------- |
| 101 | Configurar reglas CF WAF (rate limiting)      | S        | ALTA     | Reglas activas en dashboard CF                            |
| 123 | Configurar GitHub Secrets (crons + k6 + CI)   | S        | ALTA     | 6 secrets añadidos: `CRON_SECRET` (generar con `openssl rand -hex 32`) + `SUPABASE_URL` + `SUPABASE_ANON_KEY` (ambos de Supabase Dashboard → Project Settings → API) + `RESEND_API_KEY` (tras tarea #21) + `INFRA_ALERT_EMAIL` = tankiberica@gmail.com. Variable: `APP_URL` = https://tracciona.com. GitHub → repo → Settings → Secrets and variables → Actions |
| 102 | DMARC + SPF + DKIM en Cloudflare DNS          | S        | ALTA     | Records DNS configurados, DMARC report sin fallos         |
| 103 | Verificar Google Search Console               | S        | ALTA     | site:tracciona.com devuelve resultados                    |
| 104 | Registrar marca Tracciona OEPM                | S        | MEDIA    | Solicitud presentada en OEPM Clase 35                     |
| 105 | Registrar marca TradeBase OEPM                | S        | MEDIA    | Solicitud presentada en OEPM                              |
| 106 | Registrar tracciona.es (redireccion 301)      | S        | MEDIA    | Dominio registrado, 301 a tracciona.com                   |
| 107 | Dominios defensivos (.eu)                     | S        | BAJA     | Registrados si presupuesto permite                        |
| 108 | Google Business Profile (campa Onzonilla)     | S        | MEDIA    | Perfil creado y verificado                                |
| 109 | Contactar primeros 10 Founding Dealers        | M        | ALTA     | 10 dealers contactados, >= 3 comprometidos                |
| 110 | Configurar UptimeRobot                        | S        | MEDIA    | Monitor activo, alertas configuradas                      |
| 111 | Test manual movil (dispositivo real)          | M        | ALTA     | Checklist completado en 3+ dispositivos                   |
| 112 | PromoCards densidad (decision)                | S        | BAJA     | Decision tomada y documentada                             |
| 113 | Sesiones dealer acquisition / growth loops    | M        | MEDIA    | Al menos 2 sesiones ejecutadas, aprendizajes documentados |
| 114 | Crear cuenta Neon (pre-requisito test backup) | S        | BAJA     | Cuenta creada, free tier activo                           |
| 115 | Constituir TradeBase SL                       | L        | MEDIA    | Sociedad registrada en Registro Mercantil                 |
| 116 | Constituir IberHaul SL                        | L        | MEDIA    | Sociedad registrada en Registro Mercantil                 |

---

## Resumen por Fase

| Fase      | Bloques        | Sesiones est.     | Semanas         | Que desbloquea                                       |
| --------- | -------------- | ----------------- | --------------- | ---------------------------------------------------- |
| 1         | 0 + 1 + 3      | ~18               | 1-3             | Seguridad, pagos funcionales, SEO organico           |
| 2         | 2 + 6a         | ~18               | 3-6             | Revenue directo por creditos, datos basicos          |
| 3         | 4 + 5          | ~19               | 6-9             | Confianza publica, reputacion, anti-fraude           |
| 4         | 7 + 8 + 13     | ~19               | 9-13            | Marketing automatizado, WhatsApp funnel, retargeting |
| 5         | 6b + 9 + 10    | ~28               | 13-18           | Datos avanzados, monetizacion premium, DGT real      |
| 6         | 11 + 12 + 14   | ~33               | 18-22           | Pulido tecnico, cobertura tests, infra               |
| Founders  | Paralelo       | ~16               | Continuo        | Marcas, DNS, dealers, legal                          |
| **TOTAL** | **15 bloques** | **~151 sesiones** | **~22 semanas** | —                                                    |

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

| #   | Plan ID | Item                                                              | Esfuerzo | Tipo | Bloqueo                                          | Hecho cuando...                                                                 |
| --- | ------- | ----------------------------------------------------------------- | -------- | ---- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 117 | U2      | Optimistic UI en acciones frecuentes (favoritos, reservas, pujas) | M        | Code | Agente coverage cubre useReservation, useFavorites | Actualización visual inmediata sin esperar respuesta servidor; rollback en error |
| 118 | O1      | Structured logs con nivel + contexto en server/services           | S        | Code | Agente coverage cubre server/services            | Todos los `console.log/error` reemplazados por logger estructurado (`[service][level] msg context`) |
| 119 | O2      | Weekly report cron — KPIs clave via email                         | S        | Code | Agente coverage cubre composables de métricas    | Cron lunes 07:00 UTC envia email con: nuevos vehículos, dealers activos, leads, revenue semana |
| 120 | N1      | Script scaffold para nueva vertical                               | M        | Code | Agente coverage termina (no modificar utils)     | `node scripts/new-vertical.mjs --slug maquinaria` crea vertical_config row + i18n keys + README |
| 121 | D1      | Split composables >500 líneas                                     | M        | Code | Agente coverage cubre composables grandes        | Cada composable ≤500 líneas; funciones extraídas a utils/ o sub-composables con tests propios |
| 122 | S7      | Coverage gate en CI (quality gate automático)                     | S        | Code | Agente coverage termina (~100% alcanzado)        | CI job `coverage-gate` falla si coverage cae por debajo del último baseline registrado |

**Desbloqueo parcial:** U2, O1, O2 se pueden hacer una vez el agente cubra los composables relevantes (no hay que esperar el 100%).
**Desbloqueo total:** D1 y S7 requieren que el agente haya terminado completamente.

---

## Como usar este backlog

1. **Al inicio de sesion:** Dime "siguiente bloque" o "bloque X" y trabajamos en orden
2. **Cada item completado:** Lo marco como hecho aqui y en STATUS.md
3. **Si cambian prioridades:** Reordeno bloques sin perder items
4. **Founder tasks:** Las haces tu fuera de sesion, me avisas cuando esten hechas para actualizar
5. **Auditoría SonarQube:** Paralela al backlog normal. Mandar "auditoría fase X" cuando quieras empezar

> Este documento es la **unica fuente de verdad** para trabajo pendiente (excepto IDEAS-A-REVISAR.md que es banco de ideas separado).
