# Auditoría y Análisis del Proyecto — TradeBase / Tracciona

**Fecha:** 13 de marzo de 2026  
**Alcance:** Workspace TradeBase (raíz) + aplicación Tracciona (producto principal)  
**Referencia previa:** [AUDITORIA-26-FEBRERO.md](Tracciona/docs/auditorias/AUDITORIA-26-FEBRERO.md)

---

## 1. Resumen ejecutivo

| Aspecto                          | Valoración             | Comentario breve                                                                                  |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Estado global**                | **Sólido, producción** | App desplegada (tracciona.com), 4.000+ vehículos, 500+ dealers, 1.200+ transacciones              |
| **Puntuación técnica (12 dim.)** | **~83/100**            | Mejora respecto a 79 (feb); SonarQube 0 bugs · 0 vulns · 0 smells                                 |
| **Cobertura tests**              | **~74,8%**             | 747 archivos, 13.862+ tests, 0 fallos; crítico (server, auth, pagos) cubierto                     |
| **Deuda técnica**                | **Moderada**           | Typecheck con fallo de tooling (vue-router/volar); imports duplicados; rate limiting P0 pendiente |

**Conclusión:** El proyecto está en buen estado para producción, con documentación muy completa, seguridad bien trabajada (RLS, webhooks, CSP) y un plan de mejora (Plan Maestro, BACKLOG-EJECUTABLE) ya trazado. Los principales riesgos son operativos (rate limiting en CF, secretos) y de mantenibilidad (archivos muy grandes, typecheck).

---

## 2. Estructura del workspace (TradeBase)

```
c:\TradeBase\
├── Tracciona/                 # Aplicación principal (Nuxt 3 + Supabase)
├── archivo/                   # Documentación estratégica (mapas, planes)
├── subvenciones-biblia/       # Documentación de subvenciones (PDFs + MD)
├── node_modules/             # Dependencias (raíz; posiblemente compartido)
├── TradeBase-*.md|.pdf        # Dossier, investment memo, one-pager, monetización
├── CONSEJO-MULTI-AI, DECISIONES-FINANCIERAS, MODELO-INGRESOS, PRESUPUESTOS
├── SUBVENCIONES*, README-documental
└── AUDITORIA-ANALISIS-PROYECTO.md  (este documento)
```

- **TradeBase** = plataforma SaaS que genera N marketplaces B2B verticales (mismo codebase, configuración por vertical).
- **Tracciona** = primera vertical en producción: vehículos industriales (compra, venta, subastas).

---

## 3. Análisis de la aplicación Tracciona

### 3.1 Stack y arquitectura

| Capa         | Tecnología                                  |
| ------------ | ------------------------------------------- |
| Frontend     | Nuxt 4 (Nuxt 3 family), Vue 3.5, TypeScript |
| Backend      | Nitro (server routes) → Cloudflare Workers  |
| BD           | Supabase (PostgreSQL, RLS, Realtime)        |
| Pagos        | Stripe (suscripciones, depósitos, checkout) |
| Imágenes     | Cloudinary → CF Images (pipeline híbrido)   |
| Email        | Resend                                      |
| Comunicación | WhatsApp (Meta Cloud API), Claude Vision    |
| i18n         | ES + EN (@nuxtjs/i18n)                      |
| CI/CD        | GitHub Actions → Cloudflare Pages           |

- **Modulos Nuxt:** Supabase, i18n, Image, Sitemap, Google Fonts, PWA (@vite-pwa/nuxt), Color Mode.
- **Seguridad:** CSP (Report-Only), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy; cabeceras en `routeRules` y middleware.

### 3.2 Métricas de código (STATUS.md)

| Métrica          | Valor                                     |
| ---------------- | ----------------------------------------- |
| Páginas Vue      | 126                                       |
| Componentes Vue  | 424                                       |
| Composables      | 151                                       |
| Endpoints API    | ~65 (95 archivos en server/api)           |
| Servicios server | 8                                         |
| Migraciones SQL  | 88+ (108 archivos en supabase/migrations) |
| Tablas BD        | 97                                        |
| Tests            | 747 archivos, 13.862+ tests, 0 fallos     |
| Cobertura        | ~74,8% (statements); SonarQube 72,7%      |
| CI/CD workflows  | 8                                         |

### 3.3 Base de datos

- **Migraciones:** Numeradas (00001–00165+), secuenciales, con RLS, índices compuestos y de rendimiento, event store, particionado (readiness), RPCs para dashboard.
- **RLS:** 89 tablas con RLS; función `is_admin()` (SECURITY DEFINER) estandarizada.
- **ERD:** 97 tablas en `public` (incl. 5 brokerage); documentado en `docs/tracciona-docs/referencia/ERD.md`.
- **Vertical isolation:** Consultas con `.eq('vertical', getVerticalSlug())`; soporte multi-vertical en schema y config.

### 3.4 API y server

- **Endpoints:** Auth (check-lockout, fp), cron (trust-score, expire-listings, search-alerts, newsletter, data-retention, etc.), Stripe (webhook, checkout, portal), WhatsApp (webhook, process, broadcast), reservas, market-report, infra (csp-report, clusters, execute-migration), admin (security-events, dealers/health-scores), etc.
- **Crons:** Protegidos con `verifyCronSecret()`; documentados en CRON-JOBS.md.
- **Webhooks:** Stripe con `constructEvent()`; WhatsApp con HMAC-SHA256 + `timingSafeEqual()`.
- **Validación:** Zod en varios endpoints; auditoría §2.4 dejó exentos crons/webhooks sin body.

### 3.5 Calidad y convenciones

- **ESLint:** @nuxt/eslint-config + vuejs-accessibility; en server `no-console` (solo `info`); tests con reglas relajadas; k6 excluido.
- **Lint:** `npm run lint` sin errores (según documentación).
- **TypeScript:** `npm run typecheck` falla por **tooling** (vue-router/volar subpath no exportado), no por errores de tipos en lógica de negocio. La auditoría de febrero citaba 50 errores en admin/balance; parte puede estar resuelta o enmascarada por el fallo actual.
- **Imports duplicados:** Varios WARN en typecheck (Nuxt unifica orígenes): `acquireCronLock`, `DomainEvent`/`StoredEvent`/`ReplayHandler`/`ReplayOptions`, `isFeatureEnabled`, tipos desde composables vs utils (PriceHistoryRow, useSiteName/useSiteUrl, etc.). Recomendable consolidar en módulos canónicos (shared/types, server/utils).
- **Ruta duplicada:** `[...slug].vue` y `[slug].vue` generan el mismo nombre de ruta; conviene `definePageMeta` para desambiguar.
- **Límites de tamaño (CONTRIBUTING):** Componentes &lt;500 líneas, server routes &lt;200 líneas. Siguen existiendo archivos &gt;500 líneas (FilterBar.vue ~1.999 en auditoría feb).

### 3.6 Tests

- **Unit:** Vitest (happy-dom); cobertura alta en server routes críticos (stripe webhook, auth, reservas, subastas, search-alerts, valuation, execute-migration).
- **E2E:** Playwright; axe-core accesibilidad.
- **Carga:** k6 (k6-full.js; escenarios smoke/peak).
- **Seguridad:** Tests de auth, IDOR, information-leakage, rate-limit, vertical-isolation, fuzzing.

### 3.7 Documentación

- **Fuentes canónicas:** README.md, STATUS.md, docs/README.md, PROYECTO-CONTEXTO.md, BACKLOG-EJECUTABLE.md, CLAUDE.md, CONTRIBUTING.md, CHANGELOG.md.
- **Referencia técnica:** ARQUITECTURA-ESCALABILIDAD, INVENTARIO-ENDPOINTS, ERD, FLUJOS-OPERATIVOS, CRON-JOBS, SECURITY-TESTING, DISASTER-RECOVERY, CLOUDFLARE-WAF-CONFIG, DATA-RETENTION, INCIDENT-RESPONSE, PLAN-MAESTRO-10-DE-10, etc.
- **Auditorías:** AUDITORIA-26-FEBRERO.md (12 dimensiones), AUDIT-METHODOLOGY.md.
- **Legal:** RAT-BORRADOR (GDPR), DATA-CLASSIFICATION.

---

## 4. Riesgos y errores activos

| ID   | Severidad | Descripción                                                      | Acción                                                                                          |
| ---- | --------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| P0-3 | P0        | Rate limiting deshabilitado en producción (CF Workers stateless) | Configurar reglas Cloudflare WAF (fundadores)                                                   |
| —    | Alta      | Typecheck no pasa por vue-router/volar (tooling)                 | Actualizar vue-router/volar o config; o ejecutar typecheck en entorno con versiones compatibles |
| —    | Media     | Imports duplicados (tipos/utils)                                 | Consolidar en shared/types y server/utils; reducir re-export desde composables                  |
| —    | Media     | Ruta `[...slug].vue` vs `[slug].vue` mismo nombre                | definePageMeta con name distinto                                                                |
| —    | Baja      | 2 stubs en useVehicles.test.ts                                   | Implementar o marcar it.skip con TODO                                                           |
| —    | Baja      | exceljs no en manualChunks                                       | Añadir a manualChunks en nuxt.config (ya existe vendor-excel en config; verificar build)        |

---

## 5. Fortalezas

1. **Seguridad:** RLS en 89 tablas, webhooks verificados, CSP completo, secretos en runtimeConfig, logger estructurado, CORS restrictivo.
2. **Base de datos:** Migraciones ordenadas, índices y RPCs para rendimiento, event store y preparación para particionado.
3. **Infraestructura:** 8 workflows CI/CD, backups documentados, PWA, Sentry, health/error-rate endpoints.
4. **Tests:** Suite grande y estable (747 archivos, 13.862+ tests), cobertura >74% y crítica cubierta.
5. **Documentación:** Muy completa (docs/, STATUS, BACKLOG-EJECUTABLE, Plan Maestro, auditoría 12 dimensiones).
6. **Negocio:** Modelo de ingresos definido (5 capas, 12 canales externos), dossier y presupuestos a 3 años, foco subvenciones 2026 claro.
7. **Multi-vertical:** Diseño TradeBase listo para más verticales sin duplicar código.
8. **i18n y accesibilidad:** ES+EN, vuejs-accessibility, tokens CSS, breadcrumbs, landmarks.

---

## 6. Debilidades y deuda

1. **Rate limiting en producción:** Pendiente de WAF (Cloudflare); in-memory no sirve en Workers.
2. **Typecheck:** Fallo por dependencia/tooling (vue-router/volar); posiblemente errores residuales en admin/balance.
3. **Archivos muy grandes:** Varios componentes/páginas admin &gt;500 líneas (FilterBar, admin subastas/noticias/captacion/whatsapp, etc.); refactor progresivo.
4. **Imports duplicados:** Tipos y helpers re-exportados en varios sitios; consolidar para evitar WARN y confusión.
5. **Secretos:** RESEND*API_KEY y STAGING_SUPABASE*\* pendientes de configurar en GitHub (según STATUS).
6. **Cobertura pendiente:** Principalmente componentes Vue y páginas; aceptable hasta feature freeze.

---

## 7. Recomendaciones prioritarias

| Prioridad | Acción                                                                   | Responsable         |
| --------- | ------------------------------------------------------------------------ | ------------------- |
| 1         | Activar rate limiting en producción (CF WAF)                             | Fundadores / DevOps |
| 2         | Resolver typecheck: actualizar vue-router/volar o aislar ejecución en CI | Desarrollo          |
| 3         | Consolidar tipos/imports duplicados (shared/types, server/utils)         | Desarrollo          |
| 4         | Completar GitHub Secrets (RESEND*API_KEY, STAGING*\*)                    | Fundadores          |
| 5         | Plan de refactor de archivos &gt;500 líneas (FilterBar y páginas admin)  | Producto/Desarrollo |
| 6         | Seguir BACKLOG-EJECUTABLE y Plan Maestro (bloques 0, 1, 2, 6a, etc.)     | Equipo              |

---

## 8. Referencias rápidas

| Documento                  | Ruta                                                   |
| -------------------------- | ------------------------------------------------------ |
| Estado operativo           | Tracciona/STATUS.md                                    |
| Backlog ejecutable         | Tracciona/docs/tracciona-docs/BACKLOG-EJECUTABLE.md    |
| Auditoría 26 feb (12 dim.) | Tracciona/docs/auditorias/AUDITORIA-26-FEBRERO.md      |
| Mapa documentación         | Tracciona/docs/README.md                               |
| Dossier ejecutivo          | TradeBase-dossier-ejecutivo.md                         |
| Plan Maestro               | Tracciona/docs/tracciona-docs/PLAN-MAESTRO-10-DE-10.md |

---

## 9. Qué es cada punto (explicación breve)

### Resumen ejecutivo (sección 1)

- **Estado global “sólido, producción”:** La app está en vivo (tracciona.com), con datos reales (vehículos, dealers, transacciones). No es solo un prototipo.
- **Puntuación técnica ~83/100:** Nota media en 12 dimensiones (seguridad, código, BD, infra, rendimiento, negocio, legal, documentación, etc.). SonarQube sin bugs ni vulnerabilidades.
- **Cobertura tests ~74,8%:** Porcentaje del código que está cubierto por tests automáticos. Lo crítico (servidor, auth, pagos) está bien cubierto.
- **Deuda técnica moderada:** Hay cosas por arreglar (typecheck, imports duplicados, rate limiting) pero no bloquean el día a día.

---

### Estructura del workspace (sección 2)

- **TradeBase:** Nombre de la plataforma: un mismo producto de software que puede dar lugar a varios marketplaces (Tracciona es el primero).
- **Tracciona:** La primera “vertical” en producción: marketplace de vehículos industriales.
- **archivo / subvenciones-biblia / TradeBase-\*.md:** Documentos de negocio, subvenciones y presentación (dossier, memo de inversión, etc.), no código de la app.

---

### Stack y arquitectura (sección 3.1)

- **Nuxt / Vue / TypeScript:** Framework y lenguaje con los que está hecha la parte que ve el usuario (frontend).
- **Nitro → Cloudflare Workers:** El “backend” de la app son rutas de servidor que se ejecutan en Cloudflare (sin servidor propio).
- **Supabase (PostgreSQL, RLS, Realtime):** Base de datos en la nube; RLS = reglas para que cada usuario solo acceda a sus datos; Realtime = actualizaciones en vivo.
- **Stripe:** Pagos (suscripciones, depósitos, checkout).
- **Cloudinary / CF Images:** Servicio de imágenes (subida, transformaciones, entrega).
- **Resend:** Envío de emails transaccionales.
- **WhatsApp (Meta + Claude):** Integración con WhatsApp para comunicación; Claude se usa para visión/IA.
- **i18n ES + EN:** La app está en español e inglés.
- **CSP, X-Frame-Options, etc.:** Cabeceras de seguridad del navegador (evitar ataques XSS, clickjacking, etc.).

---

### Métricas de código (sección 3.2)

- **Páginas Vue / Componentes / Composables:** Número de pantallas, bloques reutilizables de interfaz y funciones reutilizables de lógica.
- **Endpoints API:** Rutas del servidor que la app o terceros llaman (ej. `/api/stripe/webhook`, `/api/search`).
- **Migraciones SQL / Tablas:** Cambios versionados de la base de datos y número de tablas.
- **Tests / Cobertura:** Cuántos tests hay y qué porcentaje del código ejecutan.
- **CI/CD workflows:** Pipelines en GitHub que hacen build, tests y despliegue automático.

---

### Base de datos (sección 3.3)

- **Migraciones numeradas:** Cada cambio de esquema (tablas, índices, RLS) está en un fichero SQL ordenado (00001, 00002, …) para poder reproducir la BD en cualquier entorno.
- **RLS (Row Level Security):** Políticas en PostgreSQL para que, por ejemplo, un dealer solo vea sus vehículos y un admin vea todo.
- **is_admin() SECURITY DEFINER:** Función que comprueba si el usuario es administrador; “DEFINER” significa que se ejecuta con permisos del dueño de la función, no del usuario que llama.
- **Vertical isolation:** Filtro por “vertical” (tracciona, otro futuro marketplace) para que los datos de un vertical no se mezclen con otro.
- **Event store / particionado / RPCs:** Event store = tabla de eventos para auditoría o replay; particionado = preparación para partir tablas grandes; RPCs = funciones en la BD que encapsulan lógica (ej. estadísticas del dashboard).

---

### API y server (sección 3.4)

- **Crons:** Tareas programadas (ej. enviar alertas de búsqueda, expirar anuncios). Están protegidas con un secreto (`verifyCronSecret`) para que solo las llame vuestro sistema.
- **Webhooks:** Stripe y WhatsApp envían peticiones a vuestra API cuando ocurre algo (pago, mensaje). Se comprueba la firma para que no puedan falsificarse.
- **Zod:** Librería para validar y tipar los datos que llegan en el body de las peticiones.

---

### Calidad y convenciones (sección 3.5)

- **ESLint / vuejs-accessibility:** Herramientas que revisan estilo de código y accesibilidad (etiquetas, roles ARIA, etc.).
- **Typecheck:** Comprobación de tipos de TypeScript. Ahora falla por un problema de la herramienta (vue-router/volar), no necesariamente por errores vuestros en el código.
- **Imports duplicados:** El mismo tipo o función se exporta desde varios sitios (composables, utils, shared). Nuxt elige uno y avisa; es mejor tener un único sitio “canónico” para evitar confusión.
- **Ruta duplicada [...slug] vs [slug]:** Dos páginas generan el mismo nombre de ruta interno; se puede desambiguar con `definePageMeta({ name: '...' })`.
- **Límites 500 / 200 líneas:** Convención del proyecto: componentes &lt;500 líneas, rutas de servidor &lt;200; si se pasan, se recomienda dividir en partes más pequeñas.

---

### Tests (sección 3.6)

- **Unit (Vitest):** Tests de funciones y módulos aislados, sin levantar navegador ni servidor completo.
- **E2E (Playwright):** Tests que simulan un usuario: abrir la app, hacer clic, rellenar formularios.
- **Carga (k6):** Tests que mandan muchas peticiones para ver cómo se comporta la app bajo estrés.
- **Seguridad (auth, IDOR, etc.):** Tests específicos para comprobar que no se puede saltar la autenticación ni acceder a datos de otros usuarios (IDOR = acceso indebido a recursos).

---

### Riesgos y errores activos (sección 4)

- **P0-3 Rate limiting deshabilitado:** En producción no hay límite de peticiones por IP/usuario. Un atacante podría saturar la API. La solución es configurar reglas en el WAF de Cloudflare (no en código, porque los Workers son “sin estado”).
- **Typecheck no pasa (vue-router/volar):** La comprobación de tipos falla por una incompatibilidad entre la versión de vue-router y la extensión/librería Volar. No implica que vuestro código tenga errores de tipos; hay que actualizar dependencias o la config del typecheck.
- **Imports duplicados:** Ver “Calidad y convenciones” más arriba; la acción es unificar en `shared/types` y `server/utils`.
- **Ruta [...slug] vs [slug]:** Ver “Calidad y convenciones”.
- **2 stubs en useVehicles.test.ts:** Hay dos tests que usan datos o mocks falsos sin comprobar nada real; o se implementan bien o se marcan como pendientes (it.skip + TODO).
- **exceljs en manualChunks:** En la config de build ya hay un chunk “vendor-excel”; el punto es asegurarse de que exceljs va ahí para no cargar esa librería en todas las páginas.

---

### Fortalezas (sección 5)

Cada ítem significa:

1. **Seguridad:** RLS en casi todas las tablas, webhooks verificados, CSP, secretos en variables de entorno, CORS restrictivo, logs sin datos sensibles.
2. **Base de datos:** Migraciones ordenadas, índices para rendimiento, RPCs, event store y preparación para particionado.
3. **Infraestructura:** CI/CD que hace build y deploy, documentación de backups, PWA, Sentry para errores, endpoints de salud y tasa de error.
4. **Tests:** Muchos tests y estables; la parte crítica está cubierta.
5. **Documentación:** README, STATUS, backlog ejecutable, Plan Maestro, auditoría de 12 dimensiones, docs de referencia.
6. **Negocio:** Modelo de ingresos definido (capas y canales), dossier y presupuestos, plan de subvenciones 2026.
7. **Multi-vertical:** El diseño permite añadir más marketplaces (otra vertical) reutilizando el mismo código y configurando por BD.
8. **i18n y accesibilidad:** Dos idiomas, reglas de accesibilidad, diseño con tokens CSS, breadcrumbs y landmarks para lectores de pantalla.

---

### Debilidades y deuda (sección 6)

- **Rate limiting:** Igual que P0-3; pendiente de WAF.
- **Typecheck:** Igual que en riesgos; además podrían quedar errores de tipos en módulos de admin/balance que el fallo actual de tooling oculta.
- **Archivos muy grandes:** FilterBar y varias páginas de admin tienen más de 500 líneas; cuesta más mantenerlas y entenderlas; se recomienda refactor por partes.
- **Imports duplicados:** Ya explicado.
- **Secretos pendientes:** En GitHub Actions faltan RESEND_API_KEY y las variables de Supabase de staging; sin ellas, algunos flujos (emails, entornos de prueba) no funcionan en CI/staging.
- **Cobertura pendiente:** Sobre todo componentes Vue y páginas; se considera aceptable hasta cerrar funcionalidades (feature freeze) y luego subir cobertura.

---

### Recomendaciones prioritarias (sección 7)

Cada fila es una acción concreta:

1. **Rate limiting (CF WAF):** Tarea de configuración en el panel de Cloudflare; suele hacerla quien tiene acceso (fundadores/DevOps).
2. **Typecheck:** Arreglar versión de vue-router/volar o cómo se ejecuta el typecheck en CI.
3. **Consolidar imports:** Refactor de código para tener un solo sitio por tipo/helper.
4. **GitHub Secrets:** Añadir RESEND*API_KEY y STAGING_SUPABASE*\* en la configuración del repositorio.
5. **Refactor archivos &gt;500 líneas:** Plan para ir partiendo FilterBar y páginas admin en componentes más pequeños.
6. **Seguir BACKLOG y Plan Maestro:** Ir cerrando ítems del backlog ejecutable y del Plan Maestro en el orden que tenéis definido.

---

_Auditoría generada a partir de análisis del workspace y del código en Tracciona. Para metodología y checklist detallados, ver Tracciona/docs/tracciona-docs/referencia/AUDIT-METHODOLOGY.md._
