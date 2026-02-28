> ⚠️ **[LEGACY]** Documento histórico — solo referencia. No modificar ni usar como fuente de verdad. Ver `docs/tracciona-docs/` para documentación activa.

# DOCUMENTO 3 — Documento de apoyo: estrategia, negocio y recomendaciones

**Generado:** 25 febrero 2026
**Fuente:** Auditoría baseline + recomendaciones 100/100 + análisis integral de mejoras

---

## ÍNDICE

1. [Resultados de la auditoría baseline](#1-resultados-de-la-auditoría-baseline)
2. [Roadmap hacia 100/100 por dimensión](#2-roadmap-hacia-100100-por-dimensión)
3. [Estrategia de producto](#3-estrategia-de-producto)
4. [Estrategia de monetización](#4-estrategia-de-monetización)
5. [Estrategia competitiva](#5-estrategia-competitiva)
6. [Organización y procesos](#6-organización-y-procesos)
7. [Rentabilidad y breakeven](#7-rentabilidad-y-breakeven)
8. [Atractivo para dealers e inversores](#8-atractivo-para-dealers-e-inversores)
9. [Propiedad intelectual a largo plazo](#9-propiedad-intelectual-a-largo-plazo)
10. [Legal y compliance a largo plazo](#10-legal-y-compliance-a-largo-plazo)
11. [Pitch y comunicación](#11-pitch-y-comunicación)
12. [La acción de mayor impacto](#12-la-acción-de-mayor-impacto)

---

## 1. Resultados de la auditoría baseline

### Puntuación por dimensión (25 febrero 2026)

| #   | Dimensión              | Puntuación | Nota clave                                                             |
| --- | ---------------------- | ---------- | ---------------------------------------------------------------------- |
| 1   | Seguridad              | **80/100** | CSP, RLS, Semgrep. Falta DAST y rate limiting en producción            |
| 2   | Código y arquitectura  | **78/100** | aiProvider y siteConfig creados. whatsapp/process monolítico           |
| 3   | Base de datos          | **76/100** | 62 migraciones. vehicles sin columna vertical (blocker multi-vertical) |
| 4   | Infraestructura        | **79/100** | Backup multi-tier, daily audit, Sentry. Coste ~0€                      |
| 5   | Rendimiento y UX       | **70/100** | PWA configurada. Sin métricas Lighthouse reales                        |
| 6   | Negocio y monetización | **55/100** | Pre-revenue. 16 canales diseñados, 0 activos                           |
| 7   | Legal y compliance     | **50/100** | Páginas legales existen. GDPR sin auditar. Sin RAT                     |
| 8   | Documentación          | **82/100** | Excepcional para la fase. 5.700+ líneas INSTRUCCIONES-MAESTRAS         |
| 9   | Equipo y procesos      | **60/100** | 2 personas + Claude Code. Bus factor = 1 para dev                      |
| 10  | Estrategia y mercado   | **68/100** | Business Bible existe. Sin validación con datos reales                 |
| 11  | Resiliencia            | **75/100** | Backup multi-tier + DR documentado. Restore nunca probado              |
| 12  | Propiedad intelectual  | **45/100** | Solo dominio .com. Marca no registrada                                 |
|     | **MEDIA**              | **74/100** |                                                                        |

### Hallazgos críticos

- **C1:** vehicles no tiene columna `vertical` — blocker para multi-vertical
- **C2:** Tests de vertical-isolation son placeholders (`expect(true).toBe(true)`)
- **C3:** Marca "Tracciona" no registrada en OEPM — riesgo real
- **C4:** 0 ingresos. Modelo no validado con ningún cliente pagando

### Hallazgos importantes

- **I1:** `whatsapp/process.post.ts` monolítico (18KB) sin failover AI
- **I2:** DAST (OWASP ZAP + Nuclei) no implementado
- **I3:** Cobertura de tests ~5-10% (objetivo año 1: >40%)
- **I4:** Rate limiting deshabilitado en producción
- **I5:** Supabase project ref hardcodeado en nuxt.config.ts
- **I6:** Páginas legales probablemente son stubs
- **I7:** social/generate-posts no usa callAI()

### Hallazgos menores

- `NUL` file en raíz (artifact Windows)
- `lighthouserc.js` duplicado
- `backup-weekly.sh` obsoleto
- `infraAlertEmail` default incorrecto (tankiberica@gmail.com)
- `.env.example` expone project ref real
- `scrape-competitors.ts` posiblemente deprecado

### Hallazgos adicionales (segunda pasada)

- Auth middleware no verifica rol admin — cualquier usuario autenticado podría acceder a `/admin/*` si conoce la URL
- 12 cron endpoints sin scheduler documentado — posiblemente no se ejecutan
- `verify-document.post.ts` usa SDK Anthropic directo (sin failover)
- PWA icons no verificados en `/public`
- `datos.vue` página suelta sin verificar
- Prebid configurado pero probablemente inactivo

### Estado de ejecución de sesiones 45-46

| Parte                    | Estado                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| 45A (Daily audit)        | ✅ Hecho                                                            |
| 45B (Backups multi-tier) | ✅ Hecho                                                            |
| 45C (Vertical isolation) | ⚠️ Parcial (middleware ok, tests placeholder, vehicles sin columna) |
| 45D (De-hardcode)        | ⚠️ Parcial (aiConfig/siteConfig ok, dns-prefetch hardcoded)         |
| 45E (Modularización)     | ❌ No hecho                                                         |
| 45F (AI failover)        | ✅ Hecho                                                            |
| 46 (DAST completa)       | ❌ No hecho                                                         |

---

## 2. Roadmap hacia 100/100 por dimensión

### Dimensión 1 — Seguridad (80 → 100)

| Acción                                   | Quién                   | Impacto | Esfuerzo     |
| ---------------------------------------- | ----------------------- | ------- | ------------ |
| WAF rate limiting Cloudflare             | Fundadores              | +5      | 30 min       |
| HSTS header                              | Claude Code (S50)       | +2      | 10 min       |
| DAST OWASP ZAP + Nuclei                  | Claude Code (S49)       | +4      | 2-3h         |
| Tests seguridad reales (IDOR, info leak) | Claude Code (S49)       | +3      | 2h           |
| CORS explícito                           | Claude Code (S50)       | +1      | 30 min       |
| Rotación de secretos documentada         | Claude Code (S50)       | +1      | 1h           |
| Nonce-based CSP (si viable)              | Claude Code (S59-60)    | +2      | 3-4h         |
| CSP violation reporting                  | Claude Code (S59)       | +1      | 1h           |
| Pentest humano externo                   | Futuro (cuando revenue) | +1      | €1.500-3.000 |

### Dimensión 2 — Código (78 → 100)

| Acción                              | Quién             | Impacto | Esfuerzo |
| ----------------------------------- | ----------------- | ------- | -------- |
| Modularizar whatsapp/process        | Claude Code (S48) | +5      | 3-4h     |
| Coverage >40% + gate en CI          | Claude Code (S51) | +6      | 4-6h     |
| E2E 8 user journeys                 | Claude Code (S51) | +4      | 4-5h     |
| Limpiar archivos basura             | Claude Code (S47) | +1      | 10 min   |
| Event bus + feature flags           | Claude Code (S56) | +3      | 3-4h     |
| social/generate-posts → callAI      | Claude Code (S47) | +1      | 30 min   |
| ADR (Architecture Decision Records) | Claude Code (S54) | +1      | 2h       |
| Code review obligatorio             | Fundadores        | +1      | Proceso  |

### Dimensión 3 — Base de datos (76 → 100)

| Acción                           | Quién             | Impacto | Esfuerzo  |
| -------------------------------- | ----------------- | ------- | --------- |
| Columna vertical en vehicles     | Claude Code (S47) | +8      | 1h        |
| Tests integridad de datos        | Claude Code (S53) | +4      | 2h        |
| Probar restore de backup         | Fundadores        | +4      | 30-60 min |
| ERD actualizado                  | Claude Code (S53) | +3      | 1-2h      |
| Monitorización queries lentas    | Claude Code (S53) | +2      | 1h        |
| Script consistencia automatizado | Claude Code (S53) | +2      | 1h        |
| Política de archivado            | Claude Code (S53) | +1      | 1h        |

### Dimensión 4 — Infraestructura (79 → 100)

| Acción                          | Quién             | Impacto | Esfuerzo |
| ------------------------------- | ----------------- | ------- | -------- |
| UptimeRobot                     | Fundadores        | +5      | 10 min   |
| Lighthouse CI workflow          | Claude Code (S52) | +4      | 1h       |
| SECURITY-TESTING.md             | Claude Code (S49) | +3      | 1h       |
| Alertas de coste                | Fundadores/CC     | +2      | 1h       |
| Verificar rollback CF Pages     | Fundadores        | +2      | 5 min    |
| Verificar cache hit ratio CF    | Fundadores        | +2      | 15 min   |
| Zero-downtime deploy verificado | Fundadores        | +2      | 15 min   |

### Dimensión 5 — Rendimiento y UX (70 → 100)

| Acción                        | Quién             | Impacto | Esfuerzo |
| ----------------------------- | ----------------- | ------- | -------- |
| Lighthouse scores reales      | Fundadores        | +6      | 30 min   |
| Web Vitals reporting          | Claude Code (S52) | +5      | 1h       |
| Accesibilidad (axe-core)      | Claude Code (S52) | +5      | 1-2h     |
| E2E user journeys             | Claude Code (S51) | +4      | 4-5h     |
| PWA verificada en dispositivo | Fundadores        | +3      | 20 min   |
| Test mobile 360px real        | Fundadores        | +3      | 20 min   |
| i18n verificación EN completa | Fundadores/CC     | +2      | 1h       |
| RUM (Real User Metrics)       | Claude Code (S52) | +2      | 1h       |

### Dimensión 6 — Negocio (55 → 100)

| Acción                       | Quién                    | Impacto | Esfuerzo            |
| ---------------------------- | ------------------------ | ------- | ------------------- |
| Primer dealer pagando        | Fundadores               | +15     | Semanas             |
| Tank Ibérica como dealer     | Fundadores               | +5      | 2-3h                |
| Contactar 50 dealers         | Fundadores               | +5      | 2-3h                |
| Activar canal suscripción    | Fundadores               | +5      | Ya implementado     |
| Activar canal DGT reports    | Claude Code + Fundadores | +3      | Variable            |
| Activar canal destacados     | Claude Code + Fundadores | +3      | Pocas horas         |
| Dashboard métricas semanales | Fundadores               | +3      | Spreadsheet         |
| Unit economics reales        | Fundadores               | +3      | Cuando haya datos   |
| Pricing validado             | Fundadores               | +3      | Cuando haya dealers |

### Dimensión 7 — Legal (50 → 100)

| Acción                            | Quién              | Impacto | Esfuerzo     |
| --------------------------------- | ------------------ | ------- | ------------ |
| Política privacidad REAL          | Fundadores         | +15     | 2-4h         |
| RAT                               | Fundadores         | +10     | 1-2h         |
| Aviso legal con datos mercantiles | Fundadores         | +5      | 30 min       |
| Verificar banner cookies          | Fundadores         | +5      | 15 min       |
| ToS actualizados                  | Fundadores/abogado | +5      | Variable     |
| Contrato tipo Founding Dealer     | Fundadores/abogado | +3      | Variable     |
| DPO justificación documentada     | Fundadores         | +2      | 30 min       |
| Facturación SII verificada        | Fundadores/gestor  | +3      | Variable     |
| Asesor fiscal UK/ES               | Fundadores         | +2      | €100-300/mes |

### Dimensión 8 — Documentación (82 → 100)

| Acción                              | Quién                        | Impacto | Esfuerzo |
| ----------------------------------- | ---------------------------- | ------- | -------- |
| CHANGELOG actualizado               | Claude Code (S54)            | +4      | 1h       |
| ERD Mermaid                         | Claude Code (S53)            | +4      | 1-2h     |
| Documentar crons                    | Claude Code/Fundadores (S54) | +3      | 1h       |
| ESTADO-REAL regenerado              | Claude Code (S54)            | +2      | 30 min   |
| Banners docs históricos             | Claude Code (S54)            | +2      | 30 min   |
| Onboarding test con persona externa | Fundadores                   | +3      | Variable |

### Dimensión 9 — Equipo (60 → 100)

| Acción                         | Quién       | Impacto | Esfuerzo      |
| ------------------------------ | ----------- | ------- | ------------- |
| INCIDENT-RESPONSE.md           | Claude Code | +10     | 1h            |
| UptimeRobot alertas a ambos    | Fundadores  | +5      | 10 min        |
| Sprint planning semanal        | Fundadores  | +8      | 15 min/semana |
| Métricas semanales compartidas | Fundadores  | +5      | 30 min setup  |
| Bus factor documentado         | Fundadores  | +5      | 1h            |
| Roles formalizados             | Fundadores  | +3      | 30 min        |
| Plan de contratación definido  | Fundadores  | +4      | 1h            |
| QA checklist pre-deploy        | Claude Code | +5      | 30 min        |

### Dimensión 10 — Estrategia (68 → 100)

| Acción                            | Quién      | Impacto | Esfuerzo  |
| --------------------------------- | ---------- | ------- | --------- |
| Contactar 50 dealers (validación) | Fundadores | +10     | 2-3h      |
| Google Analytics verificado       | Fundadores | +5      | 15-30 min |
| Análisis competitivo actualizado  | Fundadores | +4      | 2-3h      |
| DAFO con datos reales             | Fundadores | +4      | 1-2h      |
| TAM/SAM/SOM con fuentes           | Fundadores | +4      | 2-4h      |
| Feedback de 5+ dealers reales     | Fundadores | +5      | Semanas   |

### Dimensión 11 — Resiliencia (75 → 100)

| Acción                        | Quién             | Impacto | Esfuerzo  |
| ----------------------------- | ----------------- | ------- | --------- |
| Test restore real             | Fundadores        | +8      | 30-60 min |
| Mirror repo Bitbucket         | Claude Code (S55) | +5      | 1h        |
| Third-party deps documentadas | Claude Code (S55) | +4      | 1h        |
| RTO/RPO formalizados          | Claude Code (S55) | +3      | 30 min    |
| Plan backup imágenes          | Claude Code (S55) | +2      | 1h        |
| Copia offline documentación   | Fundadores        | +2      | 15 min    |
| DR drill documentado          | Fundadores        | +1      | Anual     |

### Dimensión 12 — IP (45 → 100)

| Acción                            | Quién              | Impacto | Esfuerzo      |
| --------------------------------- | ------------------ | ------- | ------------- |
| Marca OEPM (España)               | Fundadores         | +20     | 30 min + 150€ |
| Dominio tracciona.es              | Fundadores         | +5      | 5 min + 10€   |
| Auditoría licencias npm           | Claude Code (S59)  | +5      | 1h            |
| Marca EUIPO (EU) — futuro         | Fundadores         | +8      | 850€          |
| Marca UKIPO (UK) — futuro         | Fundadores         | +3      | 170£          |
| Dominios verticales — futuro      | Fundadores         | +5      | ~50€ total    |
| Logo registrado — futuro          | Fundadores         | +2      | Variable      |
| Datos como activo en ToS          | Fundadores/abogado | +4      | En ToS        |
| Dominios defensivos (.eu, .co.uk) | Fundadores         | +3      | ~20€/año      |

---

## 3. Estrategia de producto

### El problema actual

Tracciona es técnicamente completo pero no ha validado que alguien lo quiera usar. Es un marketplace con 0 dealers y 0 compradores. El chicken-and-egg problem es real.

### Propuesta: cambiar el posicionamiento

No posicionar Tracciona como "marketplace" (que requiere masa crítica). Posicionar como **"herramienta de gestión de stock para dealers de vehículos industriales"** que además les da visibilidad en un marketplace.

El dealer obtiene valor inmediato:

- Sube stock por WhatsApp (IA hace el resto)
- Obtiene descripciones SEO automáticas
- Obtiene informes DGT
- Obtiene comparativa de precios vs mercado
- Gestiona su inventario en un dashboard moderno

Que eso además lo publique en un marketplace es un bonus, no la propuesta principal.

### El flujo WhatsApp como arma diferencial

Lo que Mascus, MachineryZone, TruckScout24 NO tienen: un dealer envía 4 fotos por WhatsApp → en 2 minutos tiene un listing con título SEO, descripción bilingüe, categorización automática, y fotos procesadas.

Esto debe ser:

- Lo primero en la landing page
- Lo primero en el pitch a dealers
- Lo primero en el onboarding
- Lo primero que demuestra el vídeo de 60 segundos

No es una feature — es EL producto.

### Demo mode (reducir fricción)

Un botón "Prueba gratis ahora" que permita a un dealer subir 1 vehículo sin registrarse (o con registro mínimo — solo email). Que vea el resultado inmediatamente. Si le gusta, se registra. Si no, no hemos perdido nada.

### Valor inmediato sin efecto red

Servicios que funcionan con 1 solo dealer:

- Informes DGT (5-15€/informe)
- Generación de descripciones IA (incluido en suscripción)
- Fotos procesadas automáticamente (incluido)
- Market intelligence (comparativa de precios)
- Widget embebible para web propia del dealer

### Importador de stock con consentimiento

Si un dealer ya tiene 50 vehículos en Mascus, ofrecerle importarlos automáticamente a Tracciona. El dealer da su URL de Mascus, el script scrapea su perfil público y crea drafts. El dealer revisa y publica. Onboarding inmediato.

---

## 4. Estrategia de monetización

### Los 3 primeros canales (en orden)

**Canal 1 — Suscripción Founding Dealer**

- Ya implementado con Stripe
- Precio founding: 9-19€/mes (objetivo: validación, no ingresos)
- 10 dealers × 19€ = 190€ MRR = modelo validado
- Compromiso: precio congelado 24 meses si entran ahora

**Canal 2 — Informes DGT**

- 5-15€ por informe
- Valor inmediato, no depende del marketplace
- Endpoint `/api/dgt-report` ya existe
- Margen alto si la consulta DGT tiene coste bajo

**Canal 3 — Destacados / boost**

- 5€/vehículo/7 días para aparecer primero en catálogo
- Modelo probado en todos los clasificados
- Solo un flag `is_featured` + fecha expiración + sort

Los otros 13 canales esperan hasta tener tracción real.

### Pricing con anclaje psicológico

En vez de un solo precio, presentar 3 planes:

|                     | Básico   | Profesional | Premium      |
| ------------------- | -------- | ----------- | ------------ |
| Precio              | 9€/mes   | 49€/mes     | 99€/mes      |
| Vehículos           | 10       | 50          | Ilimitados   |
| WhatsApp flow       | ✅       | ✅          | ✅           |
| Descripciones IA    | 5/mes    | 30/mes      | Ilimitadas   |
| DGT reports         | +5€ cada | 3 incluidos | 10 incluidos |
| Destacados          | +5€ cada | 2 incluidos | 5 incluidos  |
| Market intelligence | ❌       | ✅          | ✅           |
| Soporte prioritario | ❌       | ❌          | ✅           |

El plan de 9€ es gancho, el de 99€ es ancla, el de 49€ es el que se quiere vender.

### Cobrar por valor, no por acceso

A largo plazo, el modelo más rentable es transaccional:

- Comisión sobre ventas (2-5% o fee fijo)
- Comisión sobre transporte contratado
- Comisión sobre financiación
- Los marketplaces más exitosos (Airbnb, Uber) cobran por transacción

La suscripción funciona al principio como puerta de entrada.

---

## 5. Estrategia competitiva

### Ventajas sobre Mascus (difíciles de copiar)

1. **IA integrada** — Claude Vision, generación de contenido, verificación automática. Mascus tiene legacy tech de 20 años
2. **WhatsApp-first** — Los dealers españoles viven en WhatsApp. Mascus usa formularios web
3. **Servicios integrados** — Mascus es tablón de anuncios. Tracciona acompaña la transacción: DGT, transporte, financiación, verificación
4. **Nicho ibérico** — Mascus es global. Tracciona es el experto local con informes DGT, normativa española, soporte en español

### Market Intelligence como servicio

Ya existe `market-report.get.ts` y `useMarketData`. Si se ofrece a los dealers un informe mensual de "tu Scania R450 2019 se vende a una media de X€, tu precio está un 12% por encima", eso es valor único que ningún competidor ofrece.

### Comparador público de precios (Kelley Blue Book de industriales)

La página `/valoracion.vue` existe. Si un comprador puede poner "Scania R450 2019 200.000km" y obtener un rango de precio de mercado, eso genera tráfico orgánico masivo. Cada visita es un lead potencial.

### Contenido editorial SEO

Con Claude generando borradores y un humano revisando:

- "Guía completa de compra de semirremolques frigoríficos en 2026"
- "Normativa ITV para cabezas tractoras: lo que todo transportista debe saber"
- "Comparativa: MAN vs Scania vs Volvo para transporte de larga distancia"

2-4 artículos/semana con coste casi 0. Esto genera tráfico orgánico cualificado que los competidores no tienen.

---

## 6. Organización y procesos

### Separar "construir" de "vender"

El patrón más común en startups de 2 fundadores técnicos: 95% construyendo, 5% vendiendo. Debería ser 50/50 ahora. Uno cierra gaps técnicos, el otro habla con dealers.

### Sprint planning mínimo

- **Lunes:** 15 min. Elegir 3 tareas de la semana. Solo 3
- **Viernes:** 10 min. ¿Se hicieron?
- Sin Jira, sin Trello, sin ceremonias. Un spreadsheet compartido

### 5 métricas semanales

1. Dealers contactados (acumulado)
2. Dealers registrados (acumulado)
3. Dealers pagando (acumulado)
4. Vehículos activos en catálogo
5. Visitas únicas semanales

Si no suben en 2 semanas, cambiar estrategia.

### No contratar hasta que duela

El plan dice "mes 8-10 comercial a comisión". Pero si los fundadores no pueden convencer a 10 dealers personalmente, un comercial externo tampoco podrá. Primero validar la venta, luego escalarla.

---

## 7. Rentabilidad y breakeven

### Estructura de costes actual

| Servicio      | Coste actual    | Coste año 1      | Coste año 3       |
| ------------- | --------------- | ---------------- | ----------------- |
| Supabase      | 0€ (free)       | 25€/mes          | 75€/mes           |
| Cloudflare    | 0€              | 0-5€/mes         | 20€/mes           |
| Cloudinary    | 0€              | 0€               | 45€/mes           |
| Resend        | 0€              | 0-20€/mes        | 20€/mes           |
| Anthropic API | ~5-10€/mes      | ~20-50€/mes      | ~100-200€/mes     |
| Dominios      | ~15€/año        | ~30€/año         | ~100€/año         |
| **TOTAL**     | **~10-15€/mes** | **~60-100€/mes** | **~350-500€/mes** |

### Breakeven

Con costes de ~100€/mes en año 1:

- **6 dealers × 19€/mes = 114€ MRR** → breakeven operativo
- **20 dealers × 49€/mes = 980€ MRR** → margen saludable
- **50 dealers × 49€/mes = 2.450€ MRR** → puede pagar un comercial

Con modelo transaccional añadido (DGT reports, destacados):

- **50 informes DGT/mes × 10€ = 500€** adicionales
- **20 destacados/mes × 5€ = 100€** adicionales

### Tank Ibérica como primer cliente cautivo

Si Tank Ibérica ya tiene stock, debería ser el primer dealer. Beneficios:

- Contenido real en catálogo desde el día 1
- Prueba end-to-end del flujo completo
- Caso de uso real para pitch a otros dealers
- Dogfooding genuino que identifica problemas

---

## 8. Atractivo para dealers e inversores

### Landing page que vende

Para un dealer nuevo, la landing debería mostrar:

- **Hero:** "Sube tu stock por WhatsApp. Vende más rápido."
- **Demo:** Vídeo de 30 segundos del flujo WhatsApp → listing publicado
- **Social proof:** "X vehículos activos. X dealers confían en Tracciona"
- **CTA:** "Prueba gratis" (demo mode) o "Envía tus fotos al +34 XXX"
- **Comparativa:** Tabla Tracciona vs Mascus vs "hacerlo manual"
- **Pricing:** 3 planes con ancla

### Onboarding guiado

`useOnboarding.ts` existe. Si es un wizard real paso a paso, es diferencial. La primera experiencia determina si el dealer se queda:

1. Bienvenida (30s)
2. Sube tu primer vehículo por WhatsApp (el "wow moment")
3. Personaliza tu perfil de dealer
4. Conecta tu cuenta de Stripe (para cobros)
5. Invita a tu equipo (si aplica)

### Dashboard que genere adicción

El dealer abre su dashboard cada mañana para ver:

- Visitas a sus vehículos (hoy vs ayer)
- Leads recibidos
- Health score de su stock (precios vs mercado)
- Sugerencias de IA ("Tu DAF XF tiene 30 días sin vistas. ¿Bajar precio un 5%?")
- Posición en ranking de dealers

`useDealerHealthScore.ts`, `useDealerStats.ts`, `useDealerLeads.ts` existen como composables. Verificar que están integrados en un dashboard que realmente enganche.

### Para inversores

Lo que impresiona a un inversor de primera ronda:

- **Tracción:** "X dealers activos, X€ MRR, creciendo X% mes a mes"
- **Diferenciación técnica:** "Somos el único marketplace de industriales con IA integrada y onboarding por WhatsApp"
- **Mercado grande:** TAM de vehículos industriales en Europa (documentado en Business Bible)
- **Equipo frugal:** "Hemos construido esto con 2 personas y ~100€/mes"
- **Expansión clara:** "7 verticales, cada una replica el modelo"

Lo que NO impresiona: features sin usuarios, documentación sin clientes, código sin ingresos.

---

## 9. Propiedad intelectual a largo plazo

### Fase 1 — Ahora (0-6 meses)

| Acción                                   | Coste    | Protección            |
| ---------------------------------------- | -------- | --------------------- |
| Marca OEPM "Tracciona" (clase 35 y/o 42) | 150-300€ | España, 10 años       |
| Dominio tracciona.es                     | 10€/año  | Dominio defensivo     |
| Auditoría licencias npm                  | 0€       | Verificar no copyleft |

### Fase 2 — Con revenue (6-18 meses)

| Acción                                                            | Coste      | Protección               |
| ----------------------------------------------------------------- | ---------- | ------------------------ |
| Marca EUIPO "Tracciona"                                           | ~850€      | Toda la UE, 10 años      |
| Marca UKIPO "Tracciona"                                           | ~170£      | UK, 10 años              |
| Dominios verticales (municipiante.com, campoindustrial.com, etc.) | ~50€ total | Reservar antes que nadie |
| Dominios defensivos (.eu, .co.uk)                                 | ~20€/año   | Protección               |
| Datos como activo en ToS                                          | En ToS     | Legal                    |

### Fase 3 — Con escala (18+ meses)

| Acción                                                 | Coste       | Protección          |
| ------------------------------------------------------ | ----------- | ------------------- |
| Marca TradeBase (grupo)                                | ~850€ EUIPO | Marca paraguas      |
| Patentes (si hay innovación técnica en IA/marketplace) | Variable    | 20 años             |
| Valoración de intangibles                              | Consultoría | Para inversores/M&A |
| Registro de logo/branding                              | Variable    | Protección visual   |

---

## 10. Legal y compliance a largo plazo

### Fase 1 — Ahora

- Política de privacidad real (plantilla AEPD gratuita)
- RAT básico (spreadsheet)
- Banner de cookies funcional (que bloquee de verdad)
- Aviso legal con datos mercantiles de Tank Ibérica SL

### Fase 2 — Con clientes pagando

- ToS específicos por servicio (subastas, transporte)
- Contrato tipo Founding Dealer
- DPO externo o justificación documentada
- Facturación SII-compliant verificada

### Fase 3 — Con escala

- Abogado mercantil recurrente
- Compliance officer (externo)
- Auditoría GDPR formal
- Seguro RC profesional
- Transfer pricing documentado (Tank Ibérica ↔ TradeBase)

### Fase 4 — Madurez

- Departamento legal interno
- SOC 2 (si clientes enterprise)
- Regulatory affairs (Digital Services Act, etc.)
- Ciber-seguro

---

## 11. Pitch y comunicación

### Elevator pitch (30 segundos)

> "Tracciona es la plataforma que permite a dealers de vehículos industriales gestionar y vender su stock enviando fotos por WhatsApp. Nuestra IA se encarga de todo: clasifica el vehículo, genera descripciones SEO en dos idiomas, verifica documentos, y lo publica automáticamente. Somos el Idealista de los vehículos industriales, con la inteligencia artificial como ventaja competitiva."

### Pitch para dealer (60 segundos)

> "¿Cuánto tiempo pierdes cada semana subiendo vehículos a Mascus? ¿Escribiendo descripciones? ¿Traduciendo? Con Tracciona, envías las fotos por WhatsApp y en 2 minutos tu vehículo está publicado con descripción profesional, fotos optimizadas, y visible para compradores de toda Europa. Además te damos informes de precios de mercado para que vendas más rápido. Estamos buscando 10 dealers fundadores que paguen solo 19€/mes (precio congelado 2 años). ¿Te interesa probarlo?"

### Pitch para inversor (2 minutos)

> "El mercado europeo de vehículos industriales de segunda mano mueve [X]€ al año. Los dealers actuales usan plataformas de los años 2000 — Mascus, TruckScout24 — que son tablones de anuncios sin servicios. Tracciona es el primer marketplace de industriales con IA integrada. Un dealer envía fotos por WhatsApp y en 2 minutos tiene un listing profesional. Pero no solo eso: también ofrecemos verificación de documentos con visión artificial, informes DGT, comparativa de precios de mercado, y gestión de transporte. Nuestro modelo: suscripción + transacción. Hemos construido todo con 2 personas y ~100€/mes de infraestructura. Tenemos [X] dealers activos, [X]€ MRR, creciendo [X]% mensual. Y esto es solo la primera vertical: el plan incluye 7 verticales industriales bajo la marca TradeBase, cada una replicando el modelo."

### Comparativa para dealers

|                         | Mascus      | Wallapop               | Excel/WhatsApp      | **Tracciona**    |
| ----------------------- | ----------- | ---------------------- | ------------------- | ---------------- |
| Publicar por WhatsApp   | ❌          | ❌                     | Manual              | ✅ IA automática |
| Descripción automática  | ❌          | ❌                     | Manual              | ✅ IA bilingüe   |
| Verificación documentos | ❌          | ❌                     | Manual              | ✅ IA Vision     |
| Informes DGT            | ❌          | ❌                     | Hay que ir a la DGT | ✅ Integrado     |
| Precios de mercado      | ❌          | ❌                     | Intuición           | ✅ Datos reales  |
| Widget para tu web      | ❌          | ❌                     | ❌                  | ✅               |
| Soporte en español      | Limitado    | Genérico               | N/A                 | ✅ Dedicado      |
| Coste                   | 50-200€/mes | Gratis (pero genérico) | 0€ (pero horas)     | **Desde 9€/mes** |

---

## 12. La acción de mayor impacto

Si hubiera que elegir UNA sola acción que tuviera más impacto que todo lo demás junto:

**Grabar un vídeo de 60 segundos del flujo WhatsApp, enviarlo por WhatsApp a 50 dealers de vehículos industriales en España, y pedirles feedback.**

No requiere código. No requiere que el producto esté perfecto. Pero dice en 48 horas si la hipótesis central es correcta.

Si 5 de 50 dicen "¿cuándo puedo probarlo?" → validación + primeros Founding Dealers.
Si 0 responden → hay que cambiar el enfoque antes de escribir más código.

Todo lo técnico discutido en 46+ sesiones importa. Pero importa menos que esta pregunta: **¿alguien quiere esto lo suficiente como para pagar?**

---

_Documento de apoyo v1.0 — Complementa DOC1 (sesiones Claude Code) y DOC2 (tareas fundadores)._
