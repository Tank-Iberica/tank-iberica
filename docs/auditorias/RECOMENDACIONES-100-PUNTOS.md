# Recomendaciones para alcanzar 100/100 en cada dimensión

**Referencia:** [VALORACION-PROYECTO-1-100.md](./VALORACION-PROYECTO-1-100.md)  
**Objetivo:** Acciones concretas para cerrar la brecha entre la puntuación actual y 100 en cada apartado.

---

## 1. Seguridad → 100/100

| Brecha actual                    | Acción recomendada                                                                                                                                                                               | Prioridad |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| No hay pentest externo           | Contratar una auditoría de penetración (empresa o bug bounty limitado) y remediar hallazgos críticos y altos.                                                                                    | Alta      |
| Tests de seguridad automatizados | Añadir tests que comprueben: auth obligatoria en endpoints sensibles, rechazo sin firma en webhooks, rechazo sin CRON_SECRET en crons, IDOR (cambiar ID de recurso y esperar 403).               | Alta      |
| Rate limiting                    | Revisar todas las rutas sensibles (login, registro, checkout, envío de formularios, APIs públicas). Aplicar rate limit por IP y/o por usuario (middleware o Cloudflare WAF). Documentar límites. | Media     |
| Mensajes de error                | Revisar que los `createError` no expongan stacks, rutas internas ni detalles de BD. Usar mensajes genéricos en producción ("Error de autenticación", "Operación no permitida").                  | Media     |
| Logs y PII                       | Asegurar que no se loguean contraseñas, tokens ni datos de pago. Revisar Sentry y logs de servidor; usar request IDs para trazabilidad sin PII.                                                  | Media     |
| CSP y cabeceras                  | Revisar que CSP no permita `unsafe-inline`/`unsafe-eval` donde no sea estrictamente necesario; endurecer si es posible (nonces, hashes).                                                         | Baja      |
| Dependencias                     | Mantener `npm audit` en verde; revisar dependencias con vulnerabilidades conocidas y actualizar o sustituir. Incluir en CI.                                                                      | Media     |

---

## 2. Modulabilidad → 100/100

| Brecha actual                   | Acción recomendada                                                                                                                                                                                                                                         | Prioridad |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Duplicación admin / dashboard   | Identificar listados, formularios y lógica compartida entre `app/pages/admin/` y `app/pages/dashboard/`. Extraer a componentes compartidos (p. ej. `components/shared/`) o composables comunes. Unificar criterios de permisos (admin vs dealer).          | Alta      |
| Componentes/páginas muy grandes | Dividir páginas admin con muchos bloques (p. ej. publicidad, subastas, infraestructura) en subcomponentes por sección (tabs, modales, formularios). Objetivo: archivos &lt; ~400 líneas por componente.                                                    | Media     |
| Capa de servicios               | Introducir una capa opcional de "servicios" (p. ej. `server/services/` o `app/services/`) que encapsule Supabase/Stripe por dominio (billing, vehicles, leads). Los endpoints llaman a servicios en vez de lógica directa. Facilita tests y reutilización. | Baja      |
| Convenciones explícitas         | Documentar en CLAUDE.md o en un CONTRIBUTING: cuándo crear un nuevo composable vs extender uno, cuándo un componente debe vivir en shared vs dominio, tamaño máximo recomendado de archivo.                                                                | Baja      |

### 2.1 Ejemplos concretos: unificar sin mezclar roles

**Objetivo:** Compartir solo lo que es igual (listados, formularios base, UI). Todo lo que es exclusivo del admin (config de la web, usuarios, visitas, infra) sigue solo en admin.

---

#### Ejemplo 1: Listado de vehículos

| Hoy          | Admin (`/admin/productos`)                                                        | Dashboard (`/dashboard/vehiculos`)                                                  |
| ------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Página**   | `app/pages/admin/productos/index.vue`                                             | `app/pages/dashboard/vehiculos/index.vue`                                           |
| **Datos**    | `useAdminVehicles()` → todos los vehículos, con filtros por categoría/tipo/estado | Consulta directa a Supabase con `.eq('dealer_id', dealer.id)` → solo los del dealer |
| **Vista**    | `AdminProductosTable` (tabla con muchas columnas)                                 | Grid de cards en el propio template                                                 |
| **Acciones** | Eliminar, cambiar estado, abrir Google Drive, ver favoritos                       | Editar, pausar/publicar, marcar vendido, eliminar                                   |
| **Extra**    | Filtros (AdminProductosFilters), tipos, subcategorías, conteo de favoritos        | Límites de plan (activeCount/maxListings), enlace a suscripción                     |

**Qué se puede unificar (compartir):**

- Un **composable** `useVehicleList(options: { scope: 'admin' | 'dealer', dealerId?: string })` que devuelva `{ vehicles, loading, error, fetchVehicles }`. Por dentro: si scope es admin usa `useAdminVehicles()`, si es dealer hace la query con `dealer_id`. Cada zona sigue teniendo sus propias acciones y columnas.
- O un **componente** `VehicleListTable` (o `VehicleListGrid`) que reciba `vehicles`, `loading`, `columns` y un slot `actions` por fila. Admin pasa sus acciones (eliminar, Drive, estado); dashboard pasa las suyas (editar, pausar, vendido). Así no se duplica la estructura de la tabla/grid ni la lógica de loading/error.

**Qué sigue solo en admin (independizado):**

- Filtros por categoría/tipo/estado (AdminProductosFilters).
- Google Drive (useGoogleDrive, openVehicleFolder).
- Conteo de favoritos por vehículo.
- Cualquier acción “sobre todos los vehículos de la plataforma”.

**Qué sigue solo en dashboard:**

- Límites de plan (maxListings, canPublish).
- Enlaces a “Importar”, “Nuevo”, “Suscripción”.
- Vista “mis vehículos” con contexto del dealer.

---

#### Ejemplo 2: Formulario de alta/edición de vehículo

| Hoy             | Admin                                                                                             | Dashboard                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Rutas**       | `admin/productos/nuevo.vue`, `admin/productos/[id].vue`                                           | `dashboard/vehiculos/nuevo.vue`, `dashboard/vehiculos/[id].vue` |
| **Componentes** | Muchos `AdminProducto*`: BasicInfo, Description, Images, Documents, Verification, Financial, etc. | Formularios en la página o componentes propios                  |

**Qué se puede unificar:**

- **Componentes de formulario reutilizables:** por ejemplo `VehicleFormBasicInfo` (marca, modelo, año, precio), `VehicleFormImages` (subida y orden de imágenes). Tanto admin como dashboard los usan. Cada uno los envuelve en su layout y sus permisos.
- **Composable** `useVehicleForm(vehicleId?)` que cargue/guarde el vehículo: por dentro puede usar Supabase con RLS; admin puede usar service role si hace falta. La lógica de validación y de “campos obligatorios” puede ser la misma.

**Qué sigue solo en admin (independizado):**

- Pestañas o bloques que solo tiene sentido para admin: **Verificación** (AdminProductoVerification), **Documentos** (AdminProductoDocuments), **Datos financieros** (AdminProductoFinancial), **Visibilidad/Pro** (AdminProductoVisibilidad).
- Acciones tipo “cambiar estado global”, “asignar a otro dealer”, etc.

**Qué sigue solo en dashboard:**

- Mensajes del tipo “Has llegado al límite de tu plan”.
- Flujo “publicar” vs “guardar borrador” según plan.

---

#### Ejemplo 3: Lo que no se comparte nunca (solo admin)

Estas partes son **dependencias propias del admin** de una plataforma web y se mantienen **solo en admin**, sin unificación con dashboard:

| Funcionalidad                             | Dónde está                                                          | Descripción                                      |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| **Configuración de la página principal**  | `admin/config/homepage.vue`                                         | Bloques, orden, contenidos del home.             |
| **Branding y navegación**                 | `admin/config/branding.vue`, `navigation.vue`                       | Logo, colores, menús globales.                   |
| **Editorial**                             | `admin/config/editorial.vue`                                        | Guías, noticias, calendario.                     |
| **Control de usuarios**                   | `admin/usuarios.vue`                                                | Listado y gestión de usuarios de la plataforma.  |
| **Visitas / analytics / infra**           | `admin/infraestructura.vue`, `admin/reportes.vue`, métricas         | Visitas, estado de servicios, reportes globales. |
| **Verificaciones**                        | `admin/verificaciones.vue`                                          | Aprobar/rechazar documentos de vehículos.        |
| **Facturación global**                    | `admin/facturacion.vue`, `admin/balance.vue`                        | Facturación de la plataforma, no la del dealer.  |
| **Subastas, anunciantes, WhatsApp, etc.** | `admin/subastas.vue`, `admin/anunciantes.vue`, `admin/whatsapp.vue` | Configuración y supervisión global.              |

Ninguna de estas rutas ni composables se “unifica” con el dashboard: el dealer no tiene acceso y no se reutiliza la misma UI. Se pueden compartir, si acaso, **componentes genéricos** (tablas, botones, modales) que ya existan en `components/ui/` o `components/shared/`, pero la lógica y la entrada (rutas, middleware admin) son solo de admin.

---

#### Resumen visual

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                  COMPONENTES COMPARTIDOS                 │
                    │  VehicleListTable/Grid, VehicleFormBasicInfo,            │
                    │  VehicleFormImages, useVehicleForm, useVehicleList       │
                    └───────────────────────┬─────────────────────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │  ADMIN          │           │  DASHBOARD      │           │  PÚBLICO        │
    │  (middleware    │           │  (middleware    │           │  (sin auth)      │
    │   admin)        │           │   auth+dealer)  │           │                  │
    ├─────────────────┤           ├─────────────────┤           ├─────────────────┤
    │ • Productos     │ usa       │ • Mis vehículos │ usa       │ • Catálogo      │
    │   (todos)       │ shared    │ • Mis leads    │ shared    │ • Ficha         │
    │ • Config home   │  comp.    │ • Estadísticas │  comp.    │ • Noticias      │
    │ • Config brand  │           │ • Herramientas │           │ • Guía          │
    │ • Usuarios      │  solo     │ • Suscripción  │  solo     │                 │
    │ • Infra/visitas │  admin    │ • Perfil       │  dealer   │                 │
    │ • Verificaciones│           │                 │           │                 │
    │ • Facturación   │           │                 │           │                 │
    └─────────────────┘           └─────────────────┘           └─────────────────┘
```

**Conclusión:** Unificar = compartir componentes y composables donde la necesidad es la misma (listado de vehículos, formulario base). Las dependencias propias del admin (página principal, usuarios, visitas, infra, etc.) siguen viviendo solo en admin y siguen independizadas; solo usan las mismas “piezas” (tablas, formularios, inputs) que el resto de la app.

---

## 3. Escalabilidad → 100/100

| Brecha actual           | Acción recomendada                                                                                                                                                                                                                                       | Prioridad |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Chunks &gt;500 KB       | Aplicar code-splitting: `manualChunks` en Vite para separar admin, dashboard, editor pesado (Chart.js, etc.). O usar `defineAsyncComponent` / lazy load de rutas para admin y dashboard. Revisar que el chunk inicial (home, catálogo) sea &lt; ~250 KB. | Alta      |
| Rate limiting y WAF     | Definir reglas de rate limit y WAF en Cloudflare (o en middleware) para APIs públicas y rutas de login/registro. Documentar en ARQUITECTURA-ESCALABILIDAD.                                                                                               | Media     |
| Índices y consultas     | Revisar consultas pesadas (listados, reportes, sitemap) y asegurar índices en BD para filtros y ordenación. Incluir en checklist de nuevas migraciones.                                                                                                  | Media     |
| Escalabilidad operativa | Documentar (en referencia o plan operativo) cómo escala el equipo y los procesos (deploy, incidencias, soporte) cuando crezcan verticales o tráfico.                                                                                                     | Baja      |
| Umbrales y alertas      | Definir umbrales (p. ej. uso de Supabase, Cloudinary, tiempo de respuesta) y alertas (Sentry, email) para actuar antes de límites.                                                                                                                       | Media     |

---

## 4. Monetización → 100/100

| Brecha actual               | Acción recomendada                                                                                                                                                                                                                                                                   | Prioridad |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Canales en roadmap          | Priorizar e implementar al menos 2–3 canales adicionales documentados: p. ej. API de valoración (v1/valuation ya existe; cerrar modelo de precios y facturación por uso), o comisión por venta (tracking de cierre + facturación), o widget embebible (iframe + API key por dealer). | Alta      |
| Trials, dunning, downgrades | Si hay suscripciones: implementar trial period si aplica, flujo de dunning (reintentos de pago, emails), y downgrade/cancelación con retención de datos. Documentar en anexo de monetización.                                                                                        | Media     |
| Métricas de monetización    | Dashboard o informe (admin o interno) con métricas: MRR, ARR, ingresos por canal (suscripciones, subastas, ads, etc.), conversión por plan. Alimentar con datos reales de Stripe/Quaderno.                                                                                           | Alta      |
| Lead gen y branding         | Cuantificar en producto: leads generados por dealer, clics en "contactar", descargas de ficha. Opcional: valoración económica de un lead para reportes a dealers.                                                                                                                    | Baja      |

---

## 5. Arquitectura → 100/100

| Brecha actual              | Acción recomendada                                                                                                                                                                                                | Prioridad |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Nombre del proyecto        | Cambiar `name` en package.json de "tank-iberica" a "tracciona" (o el nombre oficial del producto). Actualizar referencias en README y docs si las hay.                                                            | Baja      |
| Endpoints con lógica larga | Extraer la lógica de `market-report.get.ts` (y otros endpoints &gt; ~200 líneas) a funciones en `server/utils/` o `server/services/`. El handler solo valida, llama y devuelve.                                   | Media     |
| Capa de dominio (opcional) | Si el equipo crece o la lógica de negocio se complica: introducir una capa de "dominio" (reglas de negocio puras, sin I/O) que los servicios consuman. No obligatorio para 100 si el código actual es mantenible. | Baja      |
| Diagrama de arquitectura   | Mantener un diagrama actualizado (ASCII o Mermaid) en docs: flujo de datos (usuario → CF → Nuxt → Supabase/Stripe), webhooks, crons. Incluir en ARQUITECTURA-ESCALABILIDAD o en un ARCHITECTURE.md.               | Media     |

---

## 6. Claridad → 100/100

| Brecha actual                      | Acción recomendada                                                                                                                                                                                                                                                                                                     | Prioridad |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Single source of truth             | Crear un documento maestro (p. ej. **README-PROYECTO.md** o ampliar **ESTADO-REAL-PRODUCTO.md**) que sea el punto de entrada: qué es el proyecto, qué está hecho, qué está en roadmap, dónde está cada tipo de información (técnica, negocio, sesiones). Enlazar desde ahí a tracciona-docs, anexos, progreso, legacy. | Alta      |
| Unificar enfoques documentales     | Decidir qué documentos son "vivos" y cuáles son "históricos". Marcar en cada doc: "Vigente" vs "Referencia histórica (plan-v3, guia-claude-code)". Reducir confusión para quien llega nuevo.                                                                                                                           | Alta      |
| Actualización automática de estado | Automatizar (script o job en CI) la generación de ESTADO-REAL-PRODUCTO (páginas, endpoints, tablas) a partir del código. O al menos un checklist manual mensual para actualizar progreso y estado.                                                                                                                     | Media     |
| Onboarding de desarrolladores      | Un único doc "Cómo empezar" (clone, env, comandos, estructura, dónde leer primero) que apunte al source of truth y a CLAUDE.md.                                                                                                                                                                                        | Media     |
| Inventario de endpoints            | Mantener INVENTARIO-ENDPOINTS actualizado (auth, método, descripción) y enlazado desde el doc maestro.                                                                                                                                                                                                                 | Baja      |

---

## 7. Experiencia de usuario → 100/100

| Brecha actual              | Acción recomendada                                                                                                                                                                                                       | Prioridad |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Auditoría de accesibilidad | Ejecutar axe-core o Lighthouse (pestaña Accessibility) en las rutas críticas (home, listado, ficha, login, dashboard). Corregir errores de contraste, focos, labels, roles ARIA. Objetivo: sin fallos críticos.          | Alta      |
| Core Web Vitals            | Medir LCP, INP/FID, CLS en producción (o staging) para home, listado y ficha. Fijar objetivos (p. ej. LCP &lt; 2.5 s, CLS &lt; 0.1). Iterar con lazy load, optimización de imágenes y reducción de chunks hasta cumplir. | Alta      |
| Flujos de punta a punta    | Definir 5–10 "user journeys" (anon → ver ficha, usuario → favoritos, dealer → publicar vehículo, admin → aprobar algo). Ejecutarlos manualmente o con E2E cada release; documentar y corregir bloqueos.                  | Alta      |
| Formularios y errores      | Revisar todos los formularios críticos (login, registro, checkout, contacto, alta de vehículo): validación en tiempo real, mensajes de error claros en el idioma del usuario, sin pérdida de datos al fallar.            | Media     |
| Touch y móvil              | Revisar en dispositivo real o emulación 360px: que todos los botones y enlaces tengan área táctil ≥ 44px, que no haya overflow horizontal, que los modales/filtros sean usables (bottom sheet o pantalla completa).      | Media     |
| PWA y offline              | Comprobar que la PWA funciona (installable, caché de rutas críticas). Opcional: mensaje amigable cuando no hay conexión en lugar de error genérico.                                                                      | Baja      |

---

## 8. Proyección → 100/100

| Brecha actual                    | Acción recomendada                                                                                                                                                                                                                                                       | Prioridad |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Sesiones pendientes              | Cerrar las sesiones de roadmap que quedan (compliance, datos, resiliencia, etc.) según INSTRUCCIONES-MAESTRAS, o documentar explícitamente cuáles se posponen y por qué. Mantener progreso y ESTADO-REAL al día.                                                         | Alta      |
| Módulos parciales                | Completar o acotar los 2 módulos parciales (landing pages builder avanzado, OAuth social): ya sea implementando el mínimo viable o documentando que se posponen y con qué alternativa se cubre el caso de uso.                                                           | Media     |
| Proyección comercial y operativa | Documentar (en plan operativo o Business Bible) hitos de negocio: cuándo se lanza cada vertical, qué equipo hace falta, qué ingresos se esperan por fase. No es solo técnico: la proyección 100 implica que el plan de negocio y el producto están alineados y creíbles. | Media     |
| Clonado de vertical              | Tener un proceso repetible (script o guía paso a paso) para lanzar un nuevo vertical en 2–4 h (BD, vertical_config, dominio). Documentado y probado al menos una vez (p. ej. Horecaria).                                                                                 | Media     |
| Extensibilidad verificada        | Una vez al año (o al añadir un vertical): verificar que añadir una categoría, idioma o mercado es "solo datos" (BD/config) y no requiere cambios de código. Corregir si se detectan acoplamientos.                                                                       | Baja      |

---

## Orden sugerido de ejecución

Si quieres priorizar por impacto y esfuerzo razonable:

1. **Primero (1–2 sprints):** Claridad (single source of truth + unificar docs), Seguridad (tests de auth/webhooks/crons + rate limit), UX (Lighthouse + a11y en rutas críticas), Escalabilidad (code-splitting chunks).
2. **Segundo (2–3 sprints):** Monetización (métricas + 1–2 canales nuevos), Modulabilidad (consolidar admin/dashboard), Proyección (cerrar sesiones pendientes o documentar).
3. **Tercero (continuo):** Arquitectura (refactors suaves, diagrama), Seguridad (pentest externo cuando el presupuesto lo permita), UX (E2E y refinado de flujos).

---

## Resumen por dimensión

| Dimensión                  | Acción clave para 100                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **Seguridad**              | Pentest + tests de seguridad automatizados + rate limit + mensajes de error genéricos.          |
| **Modulabilidad**          | Consolidar admin/dashboard, dividir componentes grandes, opcional capa de servicios.            |
| **Escalabilidad**          | Code-splitting (chunks &lt;500 KB), rate limit/WAF documentado, índices y alertas.              |
| **Monetización**           | 2–3 canales más implementados, métricas (MRR/canal), trials/dunning si aplica.                  |
| **Arquitectura**           | Nombre package, extraer lógica larga a servicios/utils, diagrama actualizado.                   |
| **Claridad**               | Un solo doc maestro + docs "vivos" vs "históricos" + estado actualizado automáticamente.        |
| **Experiencia de usuario** | A11y sin fallos críticos, Core Web Vitals en verde, flujos E2E y formularios revisados.         |
| **Proyección**             | Sesiones pendientes cerradas o documentadas, módulos parciales acotados, plan negocio alineado. |

---

_Documento de recomendaciones. Las prioridades pueden ajustarse según recursos y objetivos del equipo._
