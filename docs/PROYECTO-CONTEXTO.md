# TradeBase / Tracciona — Contexto Completo del Proyecto

> **Propósito:** Documento de referencia única para que Claude Code entienda la visión, arquitectura, decisiones y dirección del proyecto. Leer SIEMPRE antes de cualquier tarea.
> **Última actualización:** 2026-02-28

---

## 1. Qué es TradeBase

TradeBase es un **grupo de marketplaces B2B verticales** que comparten un solo codebase. Cada vertical opera con su propio dominio, marca y configuración, pero reutiliza el 100% de la infraestructura técnica.

**Trayectoria a largo plazo:** Marketplace → plataforma de datos → estándar del sector. Las decisiones de hoy (acumular datos, API pública, estructura multi-vertical) sirven a esta visión a 20 años.

### 1.1 Entidades legales

| Entidad                             | Función                                                                                                   | Por qué separada                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **TradeBase SL**                    | Titular de los marketplaces digitales (Tracciona, Municipiante, etc.)                                     | Digital, escalable, bajo coste fijo                                      |
| **Tank Ibérica SL**                 | Operaciones físicas: campa en Onzonilla (León), compraventa directa, subastas presenciales, liquidaciones | Revenue existente (~500K€/año), responsabilidad civil por bienes físicos |
| **IberHaul** (antes Transporteo SL) | Logística y transporte de vehículos industriales (góndola propia)                                         | Operación especializada de transporte                                    |
| **Gesturban**                       | [Pendiente de definición por fundadores]                                                                  | —                                                                        |

**La separación es intencionada:** TradeBase SL (digital) está aislada de la responsabilidad civil de las operaciones físicas de Tank Ibérica. Tracciona es **puro intermediario**: nunca posee, inspecciona ni garantiza los bienes. Esto limita responsabilidad legal y condiciona cómo se redactan disclaimers y se construyen features (informar, no garantizar).

### 1.2 Modelo operativo: cero empleados fijos

- **2 fundadores** gestionan todo
- **Claude Code** actúa como ingeniero principal (ahorra 15-20K€/año)
- **Partners externos** para merchandising (imprentas), transporte (IberHaul), contenido (Claude Max)
- **Sin costes fijos de personal** — toda la arquitectura está diseñada para automatización y self-service
- **Contratación:** solo cuando ingresos recurrentes superen 2-3K€/mes
- **Tank Ibérica financia el experimento:** 500K€/año de operaciones físicas + 200K€ en caja + 150K€ en stock. Sin presión de VC, sin runway clock. Iterar con paciencia, preferir sostenible sobre rápido.

### 1.3 Verticales confirmados (7)

| Vertical            | Dominio             | Sector                                                       | Ticket medio |
| ------------------- | ------------------- | ------------------------------------------------------------ | ------------ |
| **Tracciona**       | tracciona.com       | Vehículos industriales (semirremolques, cisternas, furgones) | 15-80K€      |
| **Municipiante**    | municipiante.com    | Maquinaria municipal (barredoras, quitanieves, grúas)        | 20-120K€     |
| **CampoIndustrial** | campoindustrial.com | Maquinaria agrícola (tractores, cosechadoras)                | 10-200K€     |
| **Horecaria**       | horecaria.com       | Equipamiento hostelería (hornos, cámaras, mobiliario)        | 500-50K€     |
| **ReSolar**         | resolar.es          | Energía renovable (paneles, inversores, baterías)            | 1-100K€      |
| **Clinistock**      | clinistock.com      | Equipamiento médico (TAC, ecógrafos, mobiliario clínico)     | 2-500K€      |
| **BoxPort**         | boxport.es          | Contenedores marítimos (dry, reefer, tank, open top)         | 1.5-25K€     |

**Cada vertical tiene su propia taxonomía** de categorías/subcategorías en BD. No es universal: Tracciona tiene semirremolques/cisternas/furgones; Horecaria tiene hornos/cámaras/mobiliario. La taxonomía se lee de la BD, no está hardcodeada.

**Cada vertical es un beachhead independiente:** No hace falta que los 7 funcionen. Si solo Tracciona tiene tracción, ya valida el modelo y financia los demás. La estrategia multi-vertical es opcionalidad, no necesidad.

### 1.4 Verticales futuros (4)

| Vertical                | Dominio     | Sector                            |
| ----------------------- | ----------- | --------------------------------- |
| **Relevo**              | relevo.com  | Traspasos de negocios             |
| Maquinaria construcción | Por definir | Excavadoras, grúas torre, etc.    |
| Equipamiento fábrica    | Por definir | CNC, tornos, líneas de producción |
| Náutica profesional     | Por definir | Embarcaciones de trabajo, pesca   |

**Criterio de activación:** No se lanza un vertical hasta tener demanda real medida (tráfico, consultas, dealers interesados). No construir sin demanda.

### 1.5 Sinergia físico-digital

Tank Ibérica compra/vende vehículos físicamente → los lista en Tracciona → los leads online generan transacciones físicas en la campa de León → y viceversa. Esta retroalimentación entre lo físico y lo digital es única en el sector.

La campa de León ofrece:

- Espacio para subastas presenciales
- Inspecciones de vehículos
- Servicio de liquidaciones de flotas (~31.4K€ por empresa mediana)
- Almacenamiento temporal durante transacciones

### 1.6 Vacío competitivo

No existe un marketplace B2B industrial profesional en España ni en Europa. Los dealers usan Milanuncios/Wallapop (generalistas) o nada. No hay competidor directo. TradeBase entra en un mercado sin incumbente digital.

---

## 2. Modelo de Negocio

### 2.1 Principio fundacional: publicar es GRATIS

**Vendedores nunca pagan por publicar. Compradores nunca pagan por buscar ni por contactar al vendedor.** El contacto entre comprador y vendedor es siempre gratuito. Cualquier feature que ponga un muro entre comprador y vendedor mata el marketplace.

El paywall está en herramientas y servicios opcionales, nunca en la comunicación ni en el listado.

### 2.2 Quién paga

| Pagador                  | Cómo paga                                                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compradores**          | Suscripciones (Classic €19/Premium €39), créditos (reserva prioritaria, desbloquear ocultos, informes DGT), buyer's premium en subastas (8%), informes de valoración                                                                                                                          |
| **Vendedores / Dealers** | Créditos (destacar, renovar, anuncio protegido, color/marco, exportar), suscripciones dealer (herramientas/CRM/stats), generación IA de fichas, comisión por venta                                                                                                                            |
| **Anunciantes locales**  | Publicidad geolocalizada: gestorías, talleres, aseguradoras, financieras, empresas de transporte, proveedores de repuestos. Adaptada por vertical (ej: en Tracciona → talleres de semirremolques, ITVs industriales; en Horecaria → servicios de mantenimiento hostelero, proveedores de gas) |
| **Compradores de datos** | Informes de valoración, índice de mercado sectorial, datasets anualizados, API de datos                                                                                                                                                                                                       |

### 2.3 Modelo de datos = Idealista

Acumular datos de mercado (precios, tiempos de venta, volumen por zona) y venderlos a bancos, leasings, aseguradoras, fabricantes, asociaciones, consultoras, fondos de inversión. Exactamente como Idealista hace con datos inmobiliarios para la banca española. Los años de datos de precios se convierten en un **moat defensivo irreplicable**: ningún competidor puede fabricar un histórico.

### 2.4 Los 4 layers de revenue

1. **Marketplace** — Tráfico y acumulación de datos (listados gratis, SEO, editorial)
2. **Dealer SaaS** — Revenue recurrente de herramientas (free / basic €29 / premium €79 / founding gratis forever)
3. **Servicios transaccionales** — Alto margen por operación (transporte, verificación, docs, seguros, subastas)
4. **Productos de datos** — Valor a largo plazo (API valoración, informes sectoriales, datasets). Activar tras masa crítica.

### 2.4.1 Créditos y Suscripciones

_(Definido 06-mar-2026)_

#### Suscripciones de usuario (compradores y vendedores)

Basic = usuario registrado gratuito. Precios en lanzamiento (subirán a €29/€59 estándar).

|                    | **Basic** | **Classic**         | **Premium**         |
| ------------------ | --------- | ------------------- | ------------------- |
| **Precio mensual** | Gratis    | €19/mes             | €39/mes             |
| **Precio anual**   | —         | €149/año (~€12/mes) | €299/año (~€25/mes) |

#### Funcionalidades por tier

**✔️ Incluido · ✖️ No incluido · ◯ Créditos**

**Alertas:**

| Función               | Basic | Classic | Premium |
| --------------------- | ----- | ------- | ------- |
| Alertas semanales     | ✔️    | ✔️      | ✔️      |
| Alertas diarias       | ✖️    | ✔️      | ✔️      |
| Alertas inmediatas    | ✖️    | ✖️      | ✔️      |
| Price Down semanales  | ✔️    | ✔️      | ✔️      |
| Price Down diarias    | ✖️    | ✔️      | ✔️      |
| Price Down inmediatas | ✖️    | ✖️      | ✔️      |

**Gestión de anuncios:**

| Función                                               | Basic | Classic | Premium      |
| ----------------------------------------------------- | ----- | ------- | ------------ |
| Ver anuncios en segmento oculto                       | 24h   | 12h     | ✔️ Inmediato |
| Anuncio protegido (inmunidad + visibilidad inmediata) | ◯     | ◯       | ✔️           |
| Reserva Prioritaria (48h)                             | ◯     | ◯       | ◯            |
| Desbloquear ocultos (batch, 1 uso)                    | ◯     | ◯       | ✔️           |

**Promoción y visibilidad:**

| Función                                          | Basic | Classic | Premium |
| ------------------------------------------------ | ----- | ------- | ------- |
| Destacar anuncio                                 | ◯     | ✔️      | ✔️      |
| Renovar anuncio                                  | ◯     | ✔️      | ✔️      |
| Auto-renovar (toggle, descuenta 1 cr/ejecución)  | ◯     | ◯       | ✔️      |
| Auto-destacar (toggle, descuenta 1 cr/ejecución) | ◯     | ◯       | ✔️      |
| Color / Fondo / Marco especial                   | ◯     | ◯       | ✔️      |

**Publicación:**

| Función           | Basic | Classic | Premium |
| ----------------- | ----- | ------- | ------- |
| Exportar catálogo | ◯     | ◯       | ✔️      |

**Informes:**

| Función              | Basic | Classic | Premium |
| -------------------- | ----- | ------- | ------- |
| Informe DGT básico   | ◯     | ◯       | ◯       |
| Informe DGT avanzado | ◯     | ◯       | ◯       |

> Ningún plan incluye informes DGT: siempre de pago con créditos.

#### Reserva Prioritaria — Definición

Función de créditos que permite al comprador **bloquear un anuncio durante 48 horas**, garantizando prioridad frente a otros compradores.

1. El comprador paga 2 créditos. El anuncio queda **pausado** (máximo 48h).
2. Se abre chat interno con **mensaje obligatorio** del comprador.
3. **Si el vendedor responde:** anuncio se reactiva, comprador NO recupera créditos, obtiene prioridad como primer interesado.
4. **Si el vendedor NO responde en 48h:** anuncio se reactiva, comprador **recupera créditos**, reserva marcada como fallida por inacción.

**Reglas:** 1 reserva activa por anuncio. No extensible. No cancelable. Anuncios Premium son **inmunes** (no pueden recibir Reserva Prioritaria). Basic/Classic pueden comprar Anuncio protegido para obtener esa inmunidad.

#### Anuncio protegido — Definición

Pago único por anuncio (2 créditos). Doble beneficio:

1. **Inmunidad a Reserva Prioritaria** — nadie puede pausar tu anuncio.
2. **Visibilidad inmediata** — salta el periodo oculto (24h Basic / 12h Classic).
   Dura mientras el anuncio esté publicado.

#### Coste en créditos por función

| Créditos | Funciones                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| **1**    | Renovar (manual o auto), Destacar (manual o auto), Exportar catálogo, Informe DGT básico, Desbloquear ocultos (batch) |
| **2**    | Reserva Prioritaria, Color/Marco, Anuncio protegido                                                                   |
| **3**    | Informe DGT avanzado                                                                                                  |

#### Packs de créditos

Compra via Stripe Checkout (one-time payment). Los créditos **no caducan**. Balance en `user_credits`, historial en `credit_transactions`. Visibles en `/precios#creditos`.

| Pack         | Pagas | Bonus      | **Recibes** | Precio | €/cr real |
| ------------ | ----- | ---------- | ----------- | ------ | --------- |
| Recarga      | 1     | —          | **1**       | €5     | €5,00     |
| Básico       | 3     | —          | **3**       | €9,90  | €3,30     |
| **Estándar** | 10    | +1 gratis  | **11**      | €19,90 | €1,81     |
| Pro          | 25    | +3 gratis  | **28**      | €39,90 | €1,43     |
| Empresa      | 50    | +10 gratis | **60**      | €64,90 | €1,08     |

**Psicología de packs:** Recarga y Básico sin bonus (entrada baja). Estándar marcado como "Más popular" en UI — salto de descuento agresivo de €3,30→€1,81/cr. Sin pack de 5 créditos para forzar salto 3→10. Créditos sobrantes = retención (usuario vuelve a la plataforma).

**Pricing de suscripciones:** €19/€39 redondos (B2B profesional, sin ",90"). Packs de créditos sí usan ",90" (compra puntual e-commerce). Precios de lanzamiento; subirán a €29/€59 tras los primeros 6 meses.

#### A definir — Monetización adicional de compradores y vendedores

**Del comprador:**

1. **Alerta premium personalizada** — Configuración granular (marca, modelo, año, km, zona, precio máximo). Solo Classic/Premium o créditos para Basic.
2. **Informe de valoración de mercado** — Dato interno: "Este vehículo vale €X según nuestro histórico. Está un 12% por encima/debajo de mercado." Monetiza Capa 4 de datos.
3. **Comparador de vehículos premium** — Comparar 2-3 vehículos con métricas de mercado (precio medio, tiempo de venta, fiabilidad km). Básico gratis (specs), avanzado con datos de mercado por créditos.
4. **Historial de precio de un vehículo** — "Este camión empezó a €55K, bajó a €48K en 3 meses." Dato de `price_history`. Gratis para Premium, créditos para el resto.
5. **Alertas de bajada con umbral** — "Avísame cuando ESTE vehículo baje de €40K." Más específico que Price Down general.

**Del vendedor:**

6. **Generación IA de ficha** — WhatsApp → fotos → ficha bilingüe profesional. 1 crédito. Diferenciador clave del producto.
7. **Estadísticas de rendimiento del anuncio** — Vistas, contactos, CTR. Básico gratis; detallado (comparativa mercado, recomendaciones precio) por créditos o Classic/Premium.
8. **Recomendación de precio IA** — "Basándonos en 230 vehículos similares, el precio óptimo es €42K–€46K." Monetiza datos + IA. Por créditos.
9. **Exportar anuncio a otras plataformas** — Texto optimizado para Milanuncios/Wallapop/AutoScout24 desde ficha Tracciona. Lock-in + créditos.
10. **Certificado de publicación** — PDF con QR verificable: "Vehículo publicado en Tracciona el [fecha] con [X] fotos verificadas." 1 crédito.

### 2.5 Revenue stacking por transacción

Un vehículo de €40K puede generar €2.650-3.785 sumando canales: destacado + comisión + transporte + verificación + seguro + documentación. Los canales se apilan, no compiten.

### 2.6 Los 17+ canales de monetización (3 fases)

**Fase 1 — Día 1 (ingresos inmediatos)**

1. Anuncios destacados (€2-5/día por vehículo)
2. Publicidad directa geolocalizada — 7 posiciones de ad (CPM €8-25), anunciantes por vertical
3. Google AdSense — monetización puente hasta tener anunciantes directos suficientes. Se sustituye progresivamente por publicidad directa (mayor CPM, mejor UX)
4. Suscripciones Pro dealers (Free / Basic €29 / Premium €79 / Founding: gratis permanente para los 10 primeros)
5. Generación IA de fichas (€0.99/ficha con Claude Haiku)

**Fase 2 — Meses 1-6 (servicios de valor añadido)** 6. Suscripciones dealer (CRM, estadísticas, herramientas) 7. Comisión por venta (1-3% del precio) 8. Informes DGT / verificación (€3.50-15 por informe) 9. Inspecciones presenciales (€150-500) 10. Transporte (€250-1.200 por zona, vía IberHaul) 11. Documentación legal (contratos, facturas) 12. Seguros (referidos, comisión 5-15%)

**Fase 3 — Año 2 (productos premium)** 13. Escrow / garantía de pago (1.5-2.5% del importe) 14. Financiación BNPL 15. Informes de valoración (€9.99-29.99) 16. Índice de mercado / datos sectoriales (suscripción mensual) 17. Subastas online (8% buyer's premium)

**Estimación por vertical:** Fase 1: €2.1-7K/mes · Fase 2: €8.7-34K/mes · Fase 3: €17-50.5K/mes

### 2.7 Flywheel del marketplace

Más fichas → más compradores → más dealers quieren publicar → más fichas. Efecto de red clásico de marketplace bilateral. Publicar gratis es lo que arranca el flywheel. Los ingresos vienen de servicios, no de frenar la rueda.

### 2.8 Programa Founding Dealer

Primeros 10 dealers = suscripción dealer gratis de por vida (lock-in estratégico). Estos dealers se convierten en evangelistas y casos de éxito para la segunda ola.

### 2.9 Sistema de verificación (6 niveles)

| Nivel | Nombre        | Descripción                                       |
| ----- | ------------- | ------------------------------------------------- |
| 0     | Sin verificar | Publicado sin documentos                          |
| 1     | Verificado    | Documentos básicos revisados (ficha técnica, ITV) |
| 2     | Extendido     | Historial de mantenimiento, fotos adicionales     |
| 3     | Detallado     | Inspección técnica independiente                  |
| 4     | Auditado      | Auditoría completa con informe profesional        |
| 5     | Certificado   | Certificación oficial del fabricante              |

Cada vertical tiene sus propios documentos requeridos por nivel. Claude Vision se usa para auto-verificación de documentos subidos. DGT km reliability score vía InfoCar.

### 2.10 Mecanismos de lock-in (3 tipos)

1. **Herramientas como coste de cambio:** El dealer que usa facturas, contratos, CRM, export y widget de Tracciona no se va. El repositioning estratégico es "herramienta de gestión de stock", no "portal de anuncios".
2. **Merchandising físico:** Tarjetas, imanes y banners con QR que apuntan al perfil del dealer en Tracciona. El dealer paga por materiales que promocionan la URL de Tracciona. Lock-in disfrazado de servicio.
3. **Export cross-platform como caballo de Troya:** Los dealers exportan fichas DESDE Tracciona HACIA Milanuncios/Wallapop. Tracciona se convierte en el hub de gestión; los competidores pasan a ser canales de distribución.

### 2.11 Estrategia de acumulación de datos (Capa 4)

El moat estratégico de Tracciona no es el código, la UI ni las herramientas. Es **la base de datos de mercado que solo nosotros poseemos.** Cada transacción, cada búsqueda, cada consulta que pasa por la plataforma es un dato que nuestros competidores nunca verán.

#### 2.11.1 Datos que YA recopilamos

| Tabla                 | Dato capturado                                                                   | Valor para monetizar                |
| --------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| `vehicles`            | Precio, categoría, marca, modelo, año, km, provincia                             | Core del dataset                    |
| `price_history`       | Historial de bajadas de precio por vehículo                                      | Evolución temporal                  |
| `market_data` (vista) | Media, mediana, mín, máx, días hasta venta, volumen por mes/categoría/marca/zona | Listo para vender a financieras     |
| `demand_data`         | Alertas creadas por categoría/marca/zona                                         | Demanda latente del mercado         |
| `user_vehicle_views`  | Qué vehículos mira cada usuario + view_count                                     | Popularidad y engagement            |
| `search_alerts`       | Filtros guardados                                                                | Demanda insatisfecha                |
| `favorites`           | Vehículos guardados por usuario                                                  | Intención de compra                 |
| `leads`               | Contactos buyer→dealer, con `sale_price_cents`                                   | **Precio real de venta (oro puro)** |
| `analytics_events`    | page_view, vehicle_view, search, filter, contact_click                           | Comportamiento del usuario completo |
| `search_logs`         | Búsquedas realizadas                                                             | Qué busca el mercado                |
| `dealer_stats`        | Vistas, leads, conversión, tiempo respuesta por dealer/día                       | Rendimiento por dealer              |
| `ad_events`           | Impressions, clicks, conversiones de anuncios                                    | Rendimiento publicitario            |

#### 2.11.2 Datos que deberíamos capturar (10+ gaps de alto valor)

| #   | Dato faltante                       | Cómo capturarlo                                                                                                                                           | Valor de venta                                                                   |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | **Precio real de venta**            | Cuando dealer marca "vendido", hacer obligatorio introducir precio final. Incentivo: "Danos el precio final → desbloqueamos tu informe de mercado gratis" | Diferencia publicado vs venta real = márgenes del mercado. **DATO MÁS VALIOSO**  |
| 2   | **Precio negociado / descuento**    | Campo en lead al cerrar: "¿a cuánto se cerró?"                                                                                                            | Ratio descuento. Ningún competidor lo tiene                                      |
| 3   | **Motivo de no-venta**              | Al retirar un vehículo: "¿por qué lo retiras?" (precio alto, mal estado, cambió planes, vendido fuera)                                                    | Entender por qué NO se vende = tan valioso como saber por qué sí                 |
| 4   | **Origen geográfico del comprador** | `buyer_location` existe pero es opcional. Hacerlo obligatorio o inferir de IP                                                                             | Flujos comerciales: "Los compradores de Madrid compran cisternas de Zaragoza"    |
| 5   | **Tiempo en página por vehículo**   | `analytics_events` con metadata `{duration_seconds: N}` cuando el usuario sale                                                                            | Interés real (no solo clicks). Qué tipo de vehículo genera más engagement        |
| 6   | **Comparaciones**                   | Trackear cuando un usuario ve 2+ vehículos similares en la misma sesión                                                                                   | Competencia directa entre modelos/marcas                                         |
| 7   | **Búsquedas sin resultados**        | Loguear en `search_logs` cuando `results_count = 0`                                                                                                       | Demanda insatisfecha: "300 personas buscaron grúas hidráulicas y no hay ninguna" |
| 8   | **Estacionalidad por categoría**    | Ya implícito en `market_data` por mes, pero no lo explotamos                                                                                              | "Los quitanieves se buscan un 400% más en octubre-noviembre"                     |
| 9   | **Rotación de stock**               | Calcular por mes: vehículos nuevos publicados vs retirados                                                                                                | Velocidad de reemplazo de flotas. Fabricantes pagarían por esto                  |
| 10  | **Financiación solicitada**         | Cuando se implemente BNPL: qué % pide financiación, ticket medio                                                                                          | Dato que bancos pagarían por tener                                               |
| 11  | **Historial de precios del dealer** | Tracks: cuántos de sus vehículos baja precio, patrones de negociación                                                                                     | Perfil comercial del dealer                                                      |
| 12  | **Conversión lead → venta**         | Si el lead pasa por tu chat/formulario, ¿se cierra?                                                                                                       | Solo Tracciona sabe esto                                                         |

#### 2.11.3 El MOAT: datos que solo nosotros podemos tener

Ningún competidor (Mascus, Autoline, TruckScout24) puede recopilar esto porque no controlan ambos extremos de la transacción:

| Dato exclusivo                                         | Por qué es moat                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Precio real de venta** (`leads.sale_price_cents`)    | Mascus solo ve el precio publicado. Solo nosotros vemos lo que realmente se pagó                   |
| **Tiempo real hasta venta** (`created_at` → `sold_at`) | Controlamos inicio y fin. El competidor solo ve una foto de un punto en el tiempo                  |
| **Demanda vs oferta por zona**                         | Búsquedas (demanda) vs listings (oferta) cruzados. Ningún marketplace solo de venta lo puede medir |
| **Tasa de respuesta del dealer**                       | Solo la plataforma que media la comunicación lo sabe                                               |
| **Conversión lead → venta**                            | Si el lead entra por tu chat, sabes si convierte                                                   |
| **Flujos geográficos**                                 | "El comprador de Barcelona compra camiones de Zaragoza". Solo lo sabe el intermediario             |
| **Historial de negociación real**                      | Múltiples ofertas, contrapropuestas. Solo pasa por la plataforma                                   |

Estos datos no existen en ningún dataset público. Los acumulas desde el día 1, a los 2 años tienes 2 años de datos irreplicables.

#### 2.11.4 Tres acciones concretas (Prioridad P0-P1)

**P0 — Mes actual:**

1. **Hacer obligatorio el precio de venta al marcar "vendido"**
   - Campo en modal: "¿A cuánto se cerró finalmente?" con validación €
   - Incentivo: "Danos el precio real → desbloqueamos tu informe de mercado personalizado (libre, para siempre)"
   - Impacto: Convierte `leads.sale_price_cents` (actualmente opcional) en el dato más rico de Tracciona
   - Timeline: 1h implementación, se activa hoy

**P1 — Próximas 2 semanas:** 2. **Loguear búsquedas sin resultados**

- Tabla `search_logs` necesita campo `results_count INT`
- Cuando `results_count = 0`, registrar los filtros exactos
- Dashboard admin: "Top 20 búsquedas sin resultados" → oportunidades de stock
- Impacto: Demanda insatisfecha = mina de oro para fabricantes y dealers
- Timeline: 30 min SQL, integración en search endpoint

3. **Trackear duración de sesión por vehículo**
   - `analytics_events` con metadata `{page_duration_seconds: N}` cuando el usuario sale de ficha
   - Calcular: promedio de segundos en ficha por categoría/marca
   - Resultado: "Las cisternas alimentarias generan 120s promedio; las grúas solo 45s" = interés desigual
   - Timeline: 20 min frontend, importante para valoraciones futuras

**Resultado esperado tras estas 3 acciones:** En 3 meses tendrás un dataset que ningún competidor posee. Con 500-1000 transacciones con precio real, la API de valoración (`/api/v1/valuation`) puede activarse sin riesgo.

#### 2.11.5 Datos adicionales de alto ROI (Capa de reputación + inteligencia de mercado)

Más allá de los datos básicos de precios, existen **3 vectores de datos que tienen 10x ROI** y deberías implementar en paralelo al roadmap:

##### A. Sistema de reviews/ratings (Capa de reputación) — P0-1

**Implementación:** Tabla `seller_reviews` (ya existe en BD desde migración 00060)

```sql
CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES dealers(id),
  buyer_id UUID REFERENCES users(id),
  transaction_id UUID,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(100),
  body TEXT,
  dimensions JSONB, -- {communication: 5, accuracy: 4, condition: 5, logistics: 4}
  nps INT CHECK (nps >= 0 AND nps <= 10),
  verified_purchase BOOLEAN,
  created_at TIMESTAMPTZ
);
```

**Qué monetizar:**

| Monetización                              | Precio                        | Modelo                                                                    |
| ----------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| **Dealer "Top-Rated" badge** (⭐⭐⭐⭐⭐) | €50-100/mes                   | Filtrable en búsqueda. Aparece en ficha dealer. Aumento de CTR comprobado |
| **Review Analytics para dealers**         | Incluido en Premium (€79/mes) | Dashboard: "Qué dicen los compradores de ti" + puntos de mejora           |
| **Public scoreboard**                     | Gratis + premium              | "Top 100 dealers by rating" → gamificación, aspiracional                  |
| **Trust Badge API**                       | €1-5/consulta                 | Otros marketplaces integran "Este dealer tiene ⭐⭐⭐⭐⭐ en Tracciona"   |

**Por qué es ORO:**

1. **Lock-in de reputación:** Un dealer con 500 reviews positivos no se va (costo de cambio altísimo)
2. **SEO trust signals:** Google valida testimonios en schema.org → featured snippets
3. **Volumen exponencial:** Month 4: 50 reviews/mes. Month 12: 2000 reviews/mes = dataset estadístico
4. **Defensiva:** Mascus/Autoline NO tienen reviews verificadas. Esta es tu arma
5. **Única en el sector:** Ningún marketplace industrial tiene reviews. Diferencial absoluto

**Timeline:** 2-3 semanas. Se activa en month 4-5 cuando haya suficientes transacciones (threshold: 100 transacciones cerradas mínimo).

---

##### B. Compliance tracking + DGT alliance — P0-2 (estratégico)

**Qué recoger** (sin infraestructura nueva, solo recolección):

| Campo                            | Fuente                                 | Valor                                                     |
| -------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| **Euro standard** (Euro IV/V/VI) | DGT vía API + OCR de documento técnico | Aseguradoras: "Euro VI cuesta 15% menos póliza"           |
| **ITV status**                   | Integración DGT AEAT (OAuth)           | 300K€/año de valor: aseguradoras + talleres + transportes |
| **Cargas máximas vs publicadas** | Parsing documento técnico + OCR        | Detección de fraude. Transporte legal                     |
| **Origen/destino de operación**  | Form opcional en publicación           | Rutas de transporte. IberHaul planifica logística         |

**Monetización indirecta (no directa = delicado):**

1. **Alianza DGT:** Tracciona = fuente oficial de compliance del mercado. DGT paga por datos agregados (2000-5000€/mes)
2. **Aseguradoras:** "Mostrad vehículos Euro VI" = versión premium de búsqueda. Ellos son los compradores
3. **Talleres/STT:** Alertas: "3 cisterna en tu zona con ITV vencida" = lead generation (€100-500/mes)
4. **Transporte:** IberHaul prioriza vehículos con documentación limpia = operativa más eficiente

**Marco legal:**

- Todo es información PÚBLICA (DGT, ITV, fichas técnicas)
- Solo agrupar y analizar, nunca vender datos individuales
- RGPD: la placa del vehículo NO es dato personal (es vehículo, no persona)
- Avisar en privacidad: "Recolectamos datos técnicos públicos para mejorar buscar"

**Timeline:** 4-6 semanas (incluye negociación DGT). Se activa en month 6-8.

---

##### C. Network graph + supply chain intelligence — P1-1

**Qué recoger:**

```
Transacción:
  dealer_id: UUID
  buyer_company_type: ENUM (individual, dealer, distributor, fleet_manager, leasing_company)
  buyer_vertical_segment: ENUM (dentro del mismo vertical, para anonimización)
  category + subcategory
  created_at
  [anonimizar: solo permitir agregación, nunca individual]
```

**Análisis que genera:**

| Pregunta que responde                                                 | Valor                                |
| --------------------------------------------------------------------- | ------------------------------------ |
| "¿Cuáles son los principales distribuidores de cisternas en España?"  | €2-5K/informe para fabricantes       |
| "¿Hay cuellos de botella geográficos en la distribución?"             | €1-3K/análisis para consultoras      |
| "¿Cuál es el flujo: fábrica → distribuidor → dealer → usuario final?" | €5-10K/mapa de cadena para fondos VC |
| "¿Qué dealers tienen poder de negociación (muchos compradores)?"      | €500-1K/ranking para asociaciones    |

**Monetización:**

1. **Mapa de distribución vertical** (€2-5K/vertical/año): "Cómo se distribuye [categoría] en [país]"
2. **Benchmark comparativo** (€1-2K/trimestre): "Tu dealer está en top 15% de distribuidores"
3. **Supply chain optimization** (€3-5K/proyecto): Identificar oportunidades de direct-to-consumer

**Framework legal:**

- Todo ANONIMIZADO: dealer A → dealer B, sin nombres identificables
- Agregación mínima de 5 observaciones (GDPR)
- No linkear con datos personales del dealer
- Avisar en privacidad: "Analizamos flujos comerciales agregados"

**Timeline:** 3-4 semanas implementación. Se activa en month 5-6 (necesita volumen mínimo: 500+ transacciones).

---

**Resumen de prioridades (todos + rápido que P2):**

| Ranking     | Dato                                | ROI anual esperado | Timeline  | Esfuerzo       |
| ----------- | ----------------------------------- | ------------------ | --------- | -------------- |
| 🔴 **P0-1** | Reviews + badges (reputación)       | €20-50K            | Month 4-5 | 2-3 sem        |
| 🔴 **P0-2** | Compliance tracking (DGT alliance)  | €100-300K          | Month 6-8 | 4-6 sem + nego |
| 🟡 **P1-1** | Supply chain network (inteligencia) | €50-100K           | Month 5-6 | 3-4 sem        |

Con estos 3 vectores **en month 8-12 tendrás ingresos recurentes de €200-500K/año solo de datos**, sin comprometer la experiencia del usuario. El moat es irreplicable porque solo tú ves ambos lados de cada transacción.

---

#### 2.11.6 Datos comportamentales avanzados (Capa de inteligencia de producto)

Más allá de precios y transacciones, el **comportamiento del usuario dentro de la plataforma** genera datos de altísimo valor para optimización interna y monetización externa.

| #   | Dato                            | Cómo recogerlo                                                          | Valor estratégico                                                                           |
| --- | ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **UTM attribution**             | `utm_source/medium/campaign` en `analytics_events.metadata`             | Saber qué canal trae compradores que compran (no solo visitan). ROI de marketing real       |
| 2   | **Form abandonment**            | Evento `form_abandon` con `step_reached` y `time_spent`                 | Detectar fricción: "El 60% abandona en paso 3 del contacto" → optimizar UX                  |
| 3   | **Scroll depth en ficha**       | Evento `scroll_depth` con porcentaje (25/50/75/100)                     | "Las fichas con vídeo se scrollean un 40% más" → incentivar vídeo a dealers                 |
| 4   | **Fotos vs velocidad de venta** | Correlacionar `vehicle_images.count` con `sold_at - created_at`         | "Vehículos con 8+ fotos se venden 3x más rápido" → dato para dealers, upsell fotógrafo      |
| 5   | **Descripción vs leads**        | Correlacionar longitud/calidad de descripción con `leads.count`         | "Descripciones AI bilingual generan 2x más leads" → validar diferencial AI                  |
| 6   | **Precio relativo al mercado**  | `vehicle.price / market_data.avg_price` por categoría/zona              | "Este vehículo está un 15% por debajo del mercado" → alerta al comprador, urgencia          |
| 7   | **Compradores cross-vertical**  | Trackear `user_id` que visita múltiples verticales TradeBase            | "El 30% de compradores de tractores también buscan remolques" → cross-sell entre verticales |
| 8   | **Device/platform**             | `navigator.userAgent` o `navigator.userAgentData` en eventos            | "El 70% de compradores busca en móvil pero contacta en desktop" → optimizar flujos móvil    |
| 9   | **AI photo quality scoring**    | Puntuación automática de calidad de fotos (fondo, iluminación, ángulos) | Gamificación: "Tu puntuación de fotos es 6/10, mejora para más leads"                       |
| 10  | **Análisis de temas en chat**   | NLP sobre mensajes (anonimizado, solo categorías)                       | "El 40% de chats pregunta por financiación" → activar módulo de financiación                |
| 11  | **Velocidad de onboarding**     | Tiempo desde registro hasta primera publicación                         | "Dealers que publican en <24h tienen 5x más retención" → optimizar onboarding               |
| 12  | **Gaps geográficos de precio**  | Diferencia de precio por categoría entre provincias/regiones            | "Las cisternas cuestan 20% más en Cataluña que en Andalucía" → oportunidad de arbitraje     |

**Priorización:** Los puntos 1-3 y 6 son P0 (implementables en <1 semana con eventos en `analytics_events`). Los puntos 4-5 requieren volumen (month 3+). Los puntos 7-12 son P1 (month 6+).

**Monetización directa:** Los datos 4, 5, 6 y 12 se empaquetan en informes para dealers (incluido en Premium). Los datos 7 y 10 se venden a fabricantes y financieras. El dato 9 se ofrece como servicio de mejora (upsell fotógrafo profesional).

---

### 2.12 Silent Safety — Estrategia anti-fraude sin fricción

**Filosofía:** Proteger al usuario sin castigar al vendedor. Cero fricción al entrar, protección invisible de fondo, incentivos positivos (badges) en lugar de restricciones. Un autónomo con su NIF debe poder publicar tan fácil como una gran empresa.

#### 2.12.1 Principios fundamentales

1. **Entrada libre, vigilancia silenciosa:** Cualquiera puede registrarse y publicar. No hay barreras de entrada. La verificación es un incentivo, no un requisito.
2. **No penalizar, incentivar:** En lugar de bloquear dealers sin verificar, se premia a los verificados con badges visibles y mejor posición.
3. **Escalar la respuesta:** La intervención humana solo se activa cuando las señales automáticas superan un umbral. El 99% de los casos se resuelven solos.
4. **Fleet companies ≠ fraude:** Una empresa que renueva flota puede publicar 200 vehículos de golpe. El sistema debe distinguir volumen legítimo de spam.

#### 2.12.2 Capa 1 — Verificación pasiva (automática, invisible)

| Check                     | Qué hace                                                            | Cuándo                                |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| **Email verification**    | Confirmar email real (ya implementado con Supabase Auth)            | Al registrarse                        |
| **Phone verification**    | SMS OTP para dealers (ya planificado)                               | Al crear primera publicación          |
| **DMARC/SPF en dominio**  | Proteger `@tracciona.com` contra spoofing                           | Configuración DNS única en Cloudflare |
| **Rate limiting**         | Max 30 publicaciones/hora por dealer (excepto importación CSV bulk) | En endpoint de creación               |
| **Duplicate detection**   | Hash de imágenes + similitud de título para detectar duplicados     | Al publicar                           |
| **IP/device fingerprint** | Detectar múltiples cuentas desde mismo dispositivo                  | Background, sin bloquear              |

**Excepción fleet companies:** Si un dealer tiene `subscription_tier >= 'basic'` O ha sido verificado manualmente, el rate limit sube a 500/hora para permitir cargas masivas de flota.

#### 2.12.3 Capa 2 — Trust Score interno (solo visible para admin)

**Puntuación interna 0-100** que calcula la confiabilidad de cada dealer. El dealer NUNCA ve su puntuación numérica — solo ve los badges positivos que ha ganado.

| Factor                            | Puntos | Detalle                                                                            |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Email verificado                  | +10    | Automático                                                                         |
| Teléfono verificado               | +15    | SMS OTP                                                                            |
| Documentación fiscal (NIF/CIF)    | +20    | Upload opcional, verificación manual o automática (VIES para CIF intracomunitario) |
| Antigüedad >3 meses               | +10    | Automático                                                                         |
| ≥5 vehículos publicados           | +5     | Actividad real                                                                     |
| ≥1 transacción cerrada            | +15    | Prueba de legitimidad                                                              |
| Reviews positivas (≥4⭐ promedio) | +10    | Reputación                                                                         |
| Responde en <24h                  | +10    | Profesionalismo                                                                    |
| Sin reportes válidos              | +5     | Historial limpio                                                                   |

**Umbrales de acción:**

| Score     | Acción                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| **<20**   | Alerta admin: revisión manual. Los anuncios se publican pero no aparecen en "destacados" |
| **20-59** | Normal: sin restricciones, sin badges                                                    |
| **60-79** | Badge "Dealer Verificado" 🟢 visible en ficha y búsqueda                                 |
| **≥80**   | Badge "Top Dealer" 🔵 + prioridad en resultados (sort_boost +1)                          |

**Nota autónomos:** Se acepta NIF (no solo CIF). No se exige Registro Mercantil ni web corporativa. Un autónomo con NIF verificado + teléfono + antigüedad puede llegar a 60 puntos (badge verde) sin ningún requisito empresarial.

#### 2.12.4 Capa 3 — Badge público con sistema de colores

El badge de confianza es **público y visible** en la ficha del dealer y en los resultados de búsqueda. Funciona como incentivo positivo.

| Badge                 | Color    | Requisito   | Visual                                                  |
| --------------------- | -------- | ----------- | ------------------------------------------------------- |
| Sin badge             | —        | Score <60   | Nada visible (no se penaliza, simplemente no hay badge) |
| **Dealer Verificado** | 🟢 Verde | Score 60-79 | Icono check + "Verificado"                              |
| **Top Dealer**        | 🔵 Azul  | Score ≥80   | Icono estrella + "Top Dealer"                           |

**Interacción del badge:**

- **Hover (desktop):** Tooltip explicando qué significa: "Este dealer ha verificado su identidad, responde rápido y tiene buenas valoraciones"
- **Click/tap (móvil):** Modal con desglose: "Identidad verificada ✓ | Respuesta rápida ✓ | Buenas valoraciones ✓"

**Guía de mejora para dealers:** Desde el dashboard del dealer, una sección "Mejora tu puntuación" muestra:

- Qué criterios ya cumple (✓ verde)
- Qué le falta para el siguiente badge (con instrucciones claras)
- Ejemplo: "Te faltan 15 puntos para 'Dealer Verificado'. Sube tu NIF/CIF (+20 puntos) o verifica tu teléfono (+15 puntos)"

#### 2.12.5 Capa 4 — Alertas contextuales al comprador

En lugar de bloquear vendedores, se informa al comprador de forma sutil y contextual:

| Situación                              | Alerta                                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Dealer sin verificar + precio muy bajo | Banner suave: "Este vendedor aún no ha verificado su identidad. Te recomendamos solicitar documentación antes de transferir dinero" |
| Cuenta creada hace <7 días             | Info discreta: "Vendedor nuevo en Tracciona" (neutro, no negativo)                                                                  |
| Vehículo con pocas fotos               | Sugerencia: "Pide más fotos al vendedor antes de decidir"                                                                           |
| Precio >30% bajo mercado               | Info: "Este precio está significativamente por debajo de la media del mercado"                                                      |

**Principio:** Nunca decir "cuidado con este vendedor". Siempre informar de forma neutral y ofrecer una acción constructiva.

#### 2.12.6 Protección de infraestructura

| Medida                 | Estado              | Detalle                                                                      |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------- |
| **DMARC + SPF + DKIM** | Pendiente DNS       | Protege contra phishing desde `@tracciona.com`. Configurar en Cloudflare DNS |
| **Cloudflare WAF**     | Activo (Pages)      | Rate limiting, bot detection, DDoS protection ya incluidos                   |
| **Supabase RLS**       | Activo              | Cada dealer solo ve/edita sus propios vehículos                              |
| **CSP headers**        | Configurado en Nuxt | Previene XSS y script injection                                              |
| **Audit log**          | Implementado        | Todas las acciones admin quedan registradas                                  |

#### 2.12.7 Timeline de implementación

| Fase       | Qué                                           | Cuándo    | Esfuerzo    |
| ---------- | --------------------------------------------- | --------- | ----------- |
| **Fase 0** | DMARC DNS + rate limiting básico              | Inmediato | 1 día       |
| **Fase 1** | Trust score interno + badges visuales         | Month 2-3 | 1-2 semanas |
| **Fase 2** | Guía de mejora en dashboard dealer            | Month 3-4 | 3-5 días    |
| **Fase 3** | Alertas contextuales al comprador             | Month 4-5 | 1 semana    |
| **Fase 4** | Duplicate detection + fleet company exception | Month 5-6 | 1 semana    |

**Resultado:** Una plataforma donde los dealers legítimos se sienten bienvenidos (no interrogados), los compradores están informados (no asustados), y el fraude se detecta sin fricción visible. El sistema escala sin intervención humana al 99%.

---

## 3. Crecimiento y Go-to-Market

### 3.1 Supply-side first

En un marketplace bilateral, primero se resuelve la oferta (dealers/inventario), luego la demanda (compradores) viene sola con SEO. Todo feature early-stage debe optimizar para captar y retener dealers.

**Los 10 Founding Dealers son LA métrica.** Todo lo demás es secundario hasta que estos 10 estén onboarded y activos. Cada decisión de feature debe pasar el filtro: "¿esto ayuda a conseguir o retener los primeros 10 dealers?"

### 3.2 Go-to-market

1. Scraping de competidores (Milanuncios, Wallapop) → identificar dealers → añadir a `dealer_leads` → contactar
2. Ofrecer Founding Dealer (gratis forever) a los primeros 10
3. Onboarding con funnel diseñado: día 0 (registro) → día 1-3 (primera ficha) → día 7 (primer email stats) → día 14 (trial expiry) → día 30 (conversión o free tier)
4. Éxitos de Founding Dealers = casos de estudio para la segunda ola

### 3.3 SEO orgánico como canal principal de adquisición

No se empieza con paid ads. El funnel es: contenido editorial → tráfico orgánico → usuarios → dealers siguen a los usuarios. Esto explica por qué el motor de contenido es tan crítico.

**Estrategia de linking interno:** Cada artículo editorial enlaza a 2+ páginas de catálogo/categoría. El contenido editorial existe para bombear autoridad SEO hacia las páginas de catálogo, no es contenido por contenido.

**El sitio NO está indexado en Google todavía** (0 resultados en `site:tracciona.com`). Google Search Console necesita verificación por los fundadores. Todo el trabajo SEO (SSR, Schema.org, hreflang, editorial) depende de esto.

### 3.4 Motor de contenido editorial

- **Rutina dominical:** 1-2h con Claude Max → 2 artículos/semana + traducción + social posts
- **Publicación programada:** Martes y jueves 09:00 CET (cron cada 15 min)
- **Calendario social:** LinkedIn (lunes, miércoles, viernes) + Instagram (martes, jueves)
- **Gate de calidad:** SEO Score ≥50 para publicar. 15 checks ponderados (keyword en título, longitud, links internos, FAQ schema, imágenes con alt, excerpt, traducciones, etc.)
- **Schema.org implementados:** Product (vehículos), Organization (dealers), Article (editorial), FAQ (artículos), BreadcrumbList, WebSite → rich snippets en Google

### 3.4.1 Contenido de inteligencia de mercado (guías compra/venta)

**Concepto:** Artículos y guías que posicionan a Tracciona como asesor de confianza del sector, respaldados con datos reales de la plataforma. Cada tema tiene versión comprador y versión vendedor (simetría = nadie se siente atacado).

**Framing:** Nunca "trucos para regatear". Siempre "inteligencia de mercado para tomar mejores decisiones".

| Para compradores                                         | Para vendedores                                               |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| Cómo evaluar si un precio es justo (con datos Tracciona) | Cómo fijar el precio correcto para vender rápido              |
| Qué preguntar antes de comprar una cisterna usada        | Las 5 fotos que triplican tus contactos                       |
| Checklist de inspección: 20 puntos que revisar           | Por qué responder en <2h te da un 40% más de leads            |
| Cuándo es mejor comprar (estacionalidad real)            | Cuándo es mejor publicar (estacionalidad real)                |
| Financiación vs pago al contado: qué conviene            | Cómo negociar sin perder margen                               |
| Guía de transporte: costes y opciones por zona           | Cómo preparar un vehículo para la venta (ITV, limpieza, docs) |

**Diferencial clave:** Cada artículo se respalda con datos propios — "Según 500 transacciones en Tracciona, las cisternas con ITV al día se venden un 25% más rápido". Ningún competidor puede hacer esto.

**Monetización:** Tips básicos = gratis (SEO). Guías avanzadas + datos de mercado = Pro (paywall suave). Informes sectoriales = venta directa a empresas.

**SEO:** Palabras clave como "cómo comprar camión usado", "precio justo grúa autocargante" no tienen contenido de calidad en el sector. Oportunidad de dominar SERPs con contenido experto.

### 3.5 Google Ads (lado gasto)

5 campañas cuando haya presupuesto: búsqueda por categoría, búsqueda por marca, acción+tipo, remarketing, Shopping. Conversiones trackeadas via `useGtag()` con 6 eventos: viewItem, search, generateLead, beginCheckout, subscribe, register. Gated por `useConsent()`.

### 3.6 WhatsApp multi-país

Fases: ahora €0 (un número español) → año 2 smart routing por país → año 3+ números locales por mercado.

### 3.7 Pricing intelligence futura

"Tu vehículo está un 15% por encima del mercado." Los datos acumulados crean valor para vendedores, no solo compradores. Justifica acumular datos desde el día 1 aunque no se moneticen inmediatamente.

---

## 4. Arquitectura Técnica

### 4.1 Stack y por qué

| Capa          | Tecnología                                                                                                        | Por qué esta y no otra                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend/SSR  | **Nuxt 3** (Vue 3 + Nitro)                                                                                        | SSR nativo para SEO (todo el negocio depende de búsqueda orgánica). Toda página indexable DEBE ser server-side rendered. |
| Base de datos | **Supabase** (PostgreSQL + RLS + Realtime + Auth + Storage)                                                       | Open source = exit strategy si cambian precios. Self-hostable. RLS integrado. Realtime para subastas.                    |
| Hosting/CDN   | **Cloudflare Pages** (edge, serverless)                                                                           | Edge rendering, free tier generoso, Workers integration, Pages Functions                                                 |
| Pagos         | **Stripe** (Checkout, Connect, Webhooks con firma HMAC)                                                           | Estándar de la industria, Connect para futuros pagos entre partes                                                        |
| Imágenes      | **Cloudinary** (transformaciones) + **CF Images** (almacenamiento CDN)                                            | Pipeline híbrido ahorra 94% vs Cloudinary puro                                                                           |
| Email         | **Resend** (transaccional)                                                                                        | Simple, barato, buena DX                                                                                                 |
| IA            | **Anthropic Claude** (descripciones, verificación Vision) · **OpenAI** (fallback, traducciones batch GPT-4o mini) | Failover automático Claude → OpenAI vía env var                                                                          |
| CAPTCHA       | **Cloudflare Turnstile**                                                                                          | Invisible, sin fricción, gratis                                                                                          |
| Mensajería    | **WhatsApp Meta Cloud API**                                                                                       | El target (dealers 45-60) vive en WhatsApp                                                                               |
| Analytics     | **GA4** + Google Ads pixel                                                                                        | Estándar, gated por cookie consent                                                                                       |
| Monitoring    | **Sentry** (errores) · `infra_metrics` + `infra_alerts` (custom)                                                  | Cron cada 5 min recoge métricas de BD y caché                                                                            |
| CI/CD         | **GitHub Actions** (7 workflows)                                                                                  | lint, typecheck, build, E2E, Lighthouse, DAST, backup                                                                    |

**No añadir dependencias sin justificación.** El proyecto es deliberadamente lean: no Tailwind, no ORM, no UI framework. CSS custom con design system propio + Supabase client directo. No proponer instalar librerías nuevas salvo que el usuario lo pida.

**No proponer microservices.** Monolito Nuxt + Supabase es deliberado. Con 2 personas, la complejidad operativa de microservices no se justifica.

### 4.2 Patrón multi-vertical

Un solo codebase, N deploys. Cada vertical es un deploy de Cloudflare Pages con variables de entorno distintas (`VERTICAL_SLUG`, `NUXT_PUBLIC_SITE_URL`, etc.).

La tabla `vertical_config` controla todo per-vertical: marca, colores, tipografía, idiomas, módulos activos (feature flags), plantillas de email, SEO, monetización. Se pueden activar/desactivar funcionalidades por vertical sin tocar código (no todos los verticales necesitan subastas, transporte o verificación DGT).

**Clonar un vertical = 2-4 horas, cero código:** insertar filas en `vertical_config` + nuevo deploy CF Pages + dominio + env vars.

### 4.3 Base de datos

- **89 tablas** con RLS habilitado
- **65 migraciones** aplicadas
- Columna `vertical` en tablas clave para aislamiento de datos
- Índices compuestos para queries multi-vertical (migraciones 62-63)
- Full-text search en PostgreSQL
- Triggers automáticos para `updated_at`, generación de slugs SEO-friendly
- Precios en céntimos (convención Stripe). Display en euros. Evita errores de punto flotante.
- **BD adelantada al frontend (Layer 2):** Varias tablas existen en schema pero no tienen UI todavía. Verificar SIEMPRE si una tabla ya existe antes de proponer crearla.
- **Activity logs:** Tabla `activity_logs` registra todas las acciones admin. Audit trail para gobernanza.

**Modelo multi-cluster Supabase:**

- Cada cluster ($25/mes) tiene capacidad 4.0 unidades
- Pesos por vertical: pesada=1.0, media=0.4, ligera=0.15
- Escalado: 1 vertical (1 cluster) → 7 verticales (2 clusters) → 20 verticales (~5 clusters, $125/mes)

### 4.4 Pipeline de imágenes (3 fases evolutivas)

- **Fase 1:** Cloudinary-only (actual para transformaciones)
- **Fase 2:** Cloudinary transforma + CF Images almacena (ACTUAL — ahorra 94%)
- **Fase 3:** CF Images solo (futuro, cuando justificado)
- WebP, responsive sizes, lazy loading, blur placeholder en frontend
- Cache immutable 30d
- **No migrar a fase 3 sin instrucción explícita**

### 4.5 Rendimiento y caché

- **SWR (Stale-While-Revalidate)** en Cloudflare edge: absorbe 98% de lecturas
- El marketplace es 95% lecturas → el edge es extremadamente efectivo
- Objetivo: 20 verticales × 200M visitas/mes a $350-600/mes de infraestructura total

### 4.6 Seguridad (9 capas)

1. Cloudflare WAF + DDoS protection
2. Turnstile CAPTCHA en formularios
3. Rate limiting (middleware in-memory para dev, CF WAF para producción)
4. Supabase RLS en todas las tablas
5. Auth JWT via Supabase Auth (Google Login habilitado)
6. Verificación de firma HMAC en webhooks (Stripe, WhatsApp)
7. `verifyCronSecret()` en los 13 endpoints cron
8. CSP headers + security headers
9. SAST (Semgrep) + DAST (OWASP ZAP) + npm audit en CI

**Cookie consent como gate universal:** `useConsent()` controla analytics, ads y tracking. Sin consentimiento, nada se ejecuta. Cualquier nueva integración de terceros DEBE pasar por este gate.

### 4.7 Patrones de código en API

- **Auth endpoints:** `serverSupabaseUser()` para autenticación
- **Cron endpoints:** `verifyCronSecret()` para verificación
- **Webhooks:** Firma HMAC (Stripe `constructEvent()`, WhatsApp)
- **Errores:** `safeError()` para nunca exponer detalles internos al usuario
- **Convención:** No improvisar otra. Usar estos patrones establecidos.

### 4.8 Testing

No se busca 100% coverage. 34 tests actuales:

- **E2E** (12): Flujos críticos de usuario
- **Seguridad** (5): Vulnerabilidades (IDOR, info leak, rate limit)
- **Unit** (11): Lógica compleja de composables
- **Componentes** (3): Rendering de componentes clave
- Claude Code no debe proponer "añadir tests para todo". Tests para flujos críticos y lógica compleja.

### 4.9 Deploy pipeline

git push → GitHub Actions CI (lint → typecheck → build → E2E → Lighthouse → DAST) → Cloudflare Pages auto-deploy. Zero-downtime, edge deployment. Claude Code debe saber que **el CI validará su código** — lint y typecheck deben pasar.

### 4.10 Backups (3 capas)

1. **Supabase PITR**: RPO 0, retención 7-28 días
2. **Daily automático a Backblaze B2**: RPO 24h, AES-256-CBC, 7 diarios + 4 semanales + 6 mensuales
3. **Archivo mensual a 6 meses** (cold storage)

### 4.11 Rotación de secrets

- **Anual:** Supabase Service Role, Stripe, WhatsApp token, Resend, CRON_SECRET, Turnstile, Cloudinary, Backblaze
- **Cada 6 meses:** Anthropic y OpenAI API keys (billing-critical)
- **Nunca rotar:** Supabase URL, WhatsApp Phone Number ID, Cloudinary Cloud Name (estáticos/públicos)

---

## 5. Funcionalidades Principales

### 5.1 Catálogo y búsqueda

- Filtros dinámicos leídos de BD (categoría, subcategoría, marca, modelo, precio, año, ubicación, etc.)
- Vista grid + tabla con export CSV/PDF
- SEO: JSON-LD (Product), hreflang, canonical, sitemap dinámico, breadcrumbs (BreadcrumbList)
- Landing pages automáticas por categoría/marca (umbral dinámico: 3-10 items: 40%, 50+: 70%)
- URLs planas con slugs SEO: `/cisterna-alimentaria-indox-2019-madrid` (no IDs en URLs)

### 5.2 Dashboard dealer

- CRM con pipeline de leads
- Estadísticas (vistas, leads, conversiones) — email resumen semanal automático
- Herramientas: generador de facturas, contratos, presupuestos
- Calculadora ROI de alquiler
- Exportador cross-platform (Milanuncios, Wallapop formato CSV) — caballo de Troya estratégico
- Widget embeddable para web del dealer
- Portal público del dealer con perfil y listado (`/[dealer-slug]`)
- **Ficha de vehículo en contexto dealer** (`/[dealer-slug]/[vehicle-slug]`): misma ficha pero con branding del dealer (logo, colores). `noindex` + canonical → `/vehiculo/[slug]`. Lock-in: el dealer comparte links propios desde Tracciona.
- Onboarding funnel diseñado: día 0-30

### 5.3 Subastas

- Subastas online con Supabase Realtime (bidding en vivo)
- Anti-sniping: extensión automática si puja en últimos 2 min
- Depósito vía Stripe PaymentIntent (captura manual — dinero retenido, no cobrado)
- 8% buyer's premium
- Flujo: marketplace → subasta cuando el vendedor elige

### 5.4 WhatsApp AI Pipeline

- Dealer envía fotos por WhatsApp → Claude Vision extrae datos → auto-publica ficha bilingüe
- **Moat competitivo:** Ningún otro marketplace industrial permite publicar por WhatsApp. Para el target (dealers 45-60 años, baja adopción digital), es game-changer.
- Retry automático cada 15 min para mensajes fallidos

### 5.5 Sistema de reservas

- Reserva de vehículos con depósito vía Stripe
- Cron diario expira reservas no confirmadas

### 5.6 Contenido editorial

- Rutas: `/guia/` (evergreen) + `/noticias/` (temporal)
- Generación con Claude Max en sesión dominical batch
- Publicación programada (cron cada 15 min)
- SEO Score (15 checks, 0-100) con panel en editor — gate: ≥50 para publicar
- Schema.org FAQ para featured snippets
- Linking interno: cada artículo enlaza a 2+ páginas de catálogo
- Calendario social integrado (LinkedIn/Instagram)

### 5.7 Transporte

- Calculadora por zonas (€250-1.200)
- Integración con IberHaul
- Tabla `transport_zones` con pricing por zona

### 5.8 Sistema de alertas, favoritos y notificaciones

- Búsquedas guardadas con notificación push/email
- Favoritos con comparativa
- Alertas Pro con prioridad 24h
- **Price drop notifications:** Cron diario notifica bajadas de precio en favoritos. Driver de engagement y retorno.
- Push notifications via service worker (PWA)

### 5.9 Sistema de demandas inverso

- Compradores publican "busco cisterna alimentaria 2018-2022 <30K€"
- Dealers reciben estas demandas
- Canal de leads inverso que complementa el catálogo

### 5.10 Features legacy preservadas

6 funcionalidades de Tank Ibérica que se mantienen activas:

- **Balance/crédito** de dealers
- **Chat** comprador-vendedor
- **Registros de mantenimiento** de vehículos
- **Tracking de alquileres** con tabla rental_records
- **Publicidad** (sistema de ads)
- **Demandas** (punto 5.9)

Ya existen como tablas y código. **No reconstruir de cero** — verificar que existen antes de implementar.

### 5.11 Datos de mercado

- Base de datos de precios (primera de su tipo para vehículos industriales ibéricos)
- API de valoración (`/api/market/valuation`): min/avg/max/percentiles con nivel de confianza
- API avanzada (`/v1/valuation`): pospuesta hasta ≥500 transacciones históricas
- 5 productos de datos futuros: valoración individual, informe trimestral, API, dataset anual, alertas de mercado
- Clientes potenciales: leasings, aseguradoras, fabricantes, asociaciones, consultoras, fondos

### 5.12 Catálogo fresco (4 mecanismos)

1. Renovación obligatoria a 30 días
2. Detección de inactividad
3. Scraping cross-platform (¿el vehículo se vendió en otra plataforma?)
4. Incentivo de "vendido" (el dealer marca como vendido → datos de precio real)
5. Auto-despublicación a 90 días si no se renueva

### 5.13 PWA y offline

- Service worker con capacidad offline
- Prompt de instalación
- Crítico para el target: dealers en campa/nave sin buena conexión móvil

### 5.14 Accesibilidad

- ARIA live regions (polite + assertive) en default.vue
- useToast anuncia a screen readers
- Touch targets ≥ 44px (obligatorio por design system)

### 5.15 Google Ads conversion tracking

- `useGtag()` composable con 6 eventos trackeados
- Gated por `useConsent()` — sin consentimiento de cookies, no se ejecuta
- Claude Code debe usar este composable para cualquier tracking nuevo, no crear otro

---

## 6. Internacionalización (i18n)

### Arquitectura

| Nivel                  | Qué traduce                   | Mecanismo                                             |
| ---------------------- | ----------------------------- | ----------------------------------------------------- |
| UI (strings estáticos) | Botones, menús, mensajes      | `$t()` + archivos `locales/XX.json`                   |
| Campos cortos BD       | Nombres de categoría, títulos | JSONB (`{es: "...", en: "..."}`) + `localizedField()` |
| Contenido largo        | Descripciones, artículos      | Tabla `content_translations` con índice full-text     |

### Estado actual

- **Activos:** ES + EN
- **Pospuestos:** FR, DE, NL, PL, IT (activar según demanda real)
- **Routing:** `prefix_except_default` (ES sin prefijo, `/en/`, `/fr/`)
- **Traducción:** GPT-4o mini Batch API (~€0.001/ficha, 30× más barato que DeepL)
- **Añadir idioma:** 1 línea en nuxt.config + `locales/XX.json` + batch traducción. Sin código, sin migraciones.

---

## 7. Decisiones Estratégicas Tomadas (no reimplementar sin validación)

| Decisión                                    | Detalle                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Publicar es gratis**                      | Vendedores nunca pagan por listar. Compradores nunca pagan por buscar o contactar.                                                                                                                                                                                                        |
| **Solo ES + EN por ahora**                  | Resto de idiomas activar cuando haya demanda medida                                                                                                                                                                                                                                       |
| **Cloudinary + CF Images (fase 2)**         | No migrar a fase 3 sin instrucción. Cache immutable 30d                                                                                                                                                                                                                                   |
| **Merchandising = solo formulario**         | Sin flujo de compra completo. Solo formulario de interés                                                                                                                                                                                                                                  |
| **API valoración pospuesta**                | No activar hasta ≥500 transacciones históricas                                                                                                                                                                                                                                            |
| **Scraping = solo manual**                  | NUNCA cron en producción. Scraping externo (Wallapop, Milanuncios) es frágil y arriesga bloqueo de IP/legal. Ejecutar manualmente con revisión humana. Nota: infra_metrics y otras tareas en APIs propias (Supabase, Cloudflare) sí pueden usar cron/Edge Functions cuando sea necesario. |
| **i18n JSONB + tabla**                      | No columnas `_es`/`_en` (no escala)                                                                                                                                                                                                                                                       |
| **prefix_except_default**                   | URLs limpias ES, prefijo para otros idiomas                                                                                                                                                                                                                                               |
| **GPT-4o mini para traducción**             | 30× más barato, calidad suficiente para texto técnico                                                                                                                                                                                                                                     |
| **Claude Code como ingeniero**              | Contratar humano cuando revenue > 2-3K€/mes                                                                                                                                                                                                                                               |
| **Dominio único .com**                      | Abandonados dominios regionales. Hreflang en .com                                                                                                                                                                                                                                         |
| **URLs planas**                             | `/cisternas-indox` no `/cisternas/alimentarias` (anti-canibalización SEO)                                                                                                                                                                                                                 |
| **No dependencias extras**                  | No Tailwind, no ORM, no UI framework. CSS custom + Supabase directo                                                                                                                                                                                                                       |
| **No microservices**                        | Monolito deliberado. 2 personas no justifican la complejidad                                                                                                                                                                                                                              |
| **Documentación legacy intocable**          | `docs/legacy/` = referencia histórica, no modificar                                                                                                                                                                                                                                       |
| **Admin panel solo español (P2)**           | Solo 2 personas lo usan. Lo que ve el usuario final va primero                                                                                                                                                                                                                            |
| **Doble URL por vehículo**                  | `/vehiculo/[slug]` = canonical (marketplace). `/[dealer]/[slug]` = portal dealer (noindex). Misma ficha, branding diferente.                                                                                                                                                              |
| **Branding dealer en portal: gratis**       | Logo, colores y header del dealer en su contexto de ficha son gratuitos en launch. Monetizar en futuro si hay demanda.                                                                                                                                                                    |
| **Dominio custom para dealers: descartado** | Complejidad operativa no justificada en fase de captación. Reevaluar tras masa crítica.                                                                                                                                                                                                   |

---

## 8. Target Demográfico y sus Implicaciones

**Dealers de 45-60 años, WhatsApp-first, baja adopción digital.** Esto condiciona TODO el diseño UX:

- Interfaces simples, textos grandes, CTAs claros
- Mínimos pasos para cualquier acción
- Todo accesible por teléfono móvil (mobile-first no es opcional, es supervivencia)
- Si algo se puede hacer por WhatsApp, hacerlo por WhatsApp
- Touch targets ≥ 44px (dedos grandes, pantallas pequeñas)
- No asumir familiaridad con patrones UX modernos (drag & drop, gestos complejos)

---

## 9. Criterios para Tomar Decisiones de Código

Cuando Claude Code tenga que elegir entre opciones, aplicar estos criterios:

### 9.1 Principios de arquitectura

1. **Multi-vertical primero**: Toda tabla, query y componente debe funcionar con N verticales. Usar `vertical` como filtro. Nunca hardcodear lógica de un solo vertical.
2. **Configuración en BD, no en código**: Categorías, subcategorías, filtros, idiomas, colores, módulos → `vertical_config` o tablas de configuración. Añadir = insertar fila.
3. **Mobile-first**: CSS base = 360px. Breakpoints con `min-width`. Touch targets ≥ 44px.
4. **SSR obligatorio para contenido público**: Toda página indexable DEBE ser server-side rendered. Sin excepciones.
5. **SWR edge-first**: 95% de lecturas desde Cloudflare edge. Siempre considerar `Cache-Control` + `stale-while-revalidate`.
6. **Adapter pattern para servicios**: Cada proveedor externo tiene un server route que abstrae el vendor. Cambiar proveedor = cambiar adapter, nunca frontend.

### 9.2 Principios de código

1. **Composables para lógica**: Todo estado + lógica → `useXxx.ts`. Script de página ≤ 30 líneas. Hay 147 composables — verificar si ya existe uno antes de crear otro.
2. **$t() y localizedField()**: Todo texto visible al usuario usa i18n. Sin excepciones.
3. **Páginas reales, no modales**: Vehículos y artículos tienen URL propia con SEO (JSON-LD, OG, hreflang).
4. **RLS siempre**: Toda tabla nueva tiene RLS habilitado. Policies de dealer: `dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid())`.
5. **Archivos < 500 líneas**: Extraer lógica a composable o subcomponentes. Excepción: archivos dominados por CSS (>60% CSS).
6. **Verificar antes de crear**: 89 tablas, 147 composables, 418 componentes ya existen. Verificar si algo existe antes de construirlo de cero.
7. **Precios en céntimos**: Toda la BD almacena precios en cents (convención Stripe). Display en euros.

### 9.3 Principios de negocio

1. **10 Founding Dealers first**: Todo feature debe pasar el filtro: "¿esto ayuda a conseguir o retener los primeros 10 dealers?"
2. **No construir sin demanda**: Los módulos pospuestos tienen condiciones de activación específicas.
3. **Coste ≈ 0**: Infraestructura en tiers gratuitos o casi gratuitos hasta que haya revenue.
4. **Supply-side first**: Priorizar features que atraen y retienen dealers sobre features para compradores.
5. **Contacto siempre gratis**: Nunca poner un muro entre comprador y vendedor.
6. **WhatsApp-first UX**: Si algo se puede hacer por WhatsApp, hacerlo por WhatsApp.

### 9.4 Decisiones que NO tomar unilateralmente

- `docs/gobernanza/A REVISAR.md` tiene ~10 decisiones abiertas de fundadores. Claude Code debe preguntar, no decidir.

---

## 10. Integraciones Externas y Contingencias

| Servicio           | Función                          | Plan B                              |
| ------------------ | -------------------------------- | ----------------------------------- |
| Supabase           | BD + Auth + Realtime             | PostgreSQL + Auth0 (2-4 semanas)    |
| Stripe             | Pagos                            | Paddle / LemonSqueezy (1-2 semanas) |
| Cloudinary         | Transformación imágenes          | CF Images directo                   |
| CF Images          | Almacenamiento imágenes          | Backblaze B2 + CF R2                |
| Anthropic Claude   | IA (descripciones, verificación) | OpenAI (cambio vía env var)         |
| OpenAI GPT-4o mini | Traducciones batch               | DeepL API (30× más caro)            |
| Resend             | Email transaccional              | Postmark / SendGrid                 |
| Meta WhatsApp      | Pipeline publicación             | Twilio (1-2 semanas)                |
| Cloudflare Pages   | Hosting edge                     | Vercel / Netlify                    |
| Turnstile          | CAPTCHA                          | hCaptcha                            |

**Failovers automáticos**: IA (Anthropic → OpenAI), Imágenes (Cloudinary → CF Images), Backups (B2), Repo mirror (GitHub → Bitbucket).

---

## 11. Crons y Automatizaciones

| Cron                | Frecuencia  | Función                                                 |
| ------------------- | ----------- | ------------------------------------------------------- |
| freshness-check     | Diario      | Detecta vehículos obsoletos (>90 días), auto-despublica |
| search-alerts       | Diario      | Envía alertas de búsqueda a usuarios                    |
| price-drop          | Diario      | Notifica bajadas de precio en favoritos                 |
| reservation-expiry  | Diario      | Expira reservas no confirmadas                          |
| publish-scheduled   | Diario      | Publica artículos programados                           |
| auto-auction        | Cada 5 min  | Procesa ganadores de subastas                           |
| infra-metrics       | Cada 5 min  | Recoge métricas de BD y caché → `infra_metrics`         |
| whatsapp-retry      | Cada 15 min | Reintenta mensajes WhatsApp fallidos                    |
| dealer-weekly-stats | Lunes 09:00 | Envía resumen semanal a dealers                         |

Todos protegidos con `verifyCronSecret()`. Scheduler recomendado: GitHub Actions o cron-job.org.

---

## 12. GDPR y Legal

- **Puro intermediario**: Tracciona nunca posee, inspecciona ni garantiza bienes. Disclaimers en verificación, subastas e informes DGT.
- **13 actividades de tratamiento** documentadas en RAT borrador
- **11 subprocesadores** identificados (Supabase, Stripe, Meta, Anthropic, etc.)
- **Retención de datos**: 30 días (logs) → 10 años (facturas, ley fiscal española)
- **Endpoints GDPR**: `/api/account/delete` (anonimización), `/api/account/export` (portabilidad)
- **7 páginas legales** implementadas
- **Compliance DSA** (Digital Services Act): módulo de transparencia implementado
- **Cookie consent**: `useConsent()` gates todo tracking/analytics/ads
- **Pendiente**: Formalizar RAT como documento legal, registrar marca OEPM (~€150)

---

## 13. Estado Actual del Proyecto (28 Feb 2026)

> **Nota:** Para errores críticos y estado detallado, consultar `STATUS.md` (se actualiza más frecuentemente que este documento).

### Métricas

| Métrica              | Valor                                                            |
| -------------------- | ---------------------------------------------------------------- |
| Puntuación auditoría | **79/100** (corregida de 71/100 por auditoría externa imprecisa) |
| Sesiones completadas | 0–64 + 14 iteraciones de auditoría                               |
| Páginas Vue          | 124                                                              |
| Componentes Vue      | 418                                                              |
| Composables          | 147                                                              |
| Endpoints API        | 62                                                               |
| Migraciones SQL      | 65                                                               |
| Tablas BD            | 89                                                               |
| Tests                | 34 (12 E2E + 5 seguridad + 11 unit + 3 componentes + 3 setup)    |
| CI/CD workflows      | 7                                                                |

### Módulos pospuestos

| Módulo                         | Condición de activación          |
| ------------------------------ | -------------------------------- |
| API valoración `/v1/valuation` | ≥500 transacciones históricas    |
| Suscripción datos sectoriales  | ≥1.000 vehículos en catálogo     |
| Dataset anualizado             | ≥12 meses de datos               |
| Merchandising completo         | Demanda medida                   |
| Idiomas 3-7                    | Demanda real                     |
| Prebid demand partners         | Registro en SSPs + placement IDs |
| Landing pages builder          | Solo si dealers lo solicitan     |

### Tareas de fundadores (no-código)

| Tarea                                   | Urgencia | Coste  |
| --------------------------------------- | -------- | ------ |
| Registrar marca Tracciona en OEPM       | Alta     | ~€150  |
| Configurar Cloudflare WAF rate limiting | Alta     | €0     |
| Verificar Google Search Console         | Alta     | €0     |
| Configurar UptimeRobot                  | Media    | €0     |
| Probar restauración de backup           | Media    | €0     |
| Contactar 50 dealers potenciales        | Media    | Tiempo |

---

## 14. Roadmap y Proyección

### Corto plazo (pre-launch)

1. Aplicar migración 00065 y corregir RLS
2. Regenerar types/supabase.ts
3. Configurar Cloudflare WAF
4. Verificar Google Search Console
5. Contactar primeros 10 Founding Dealers

### Medio plazo (meses 1-6)

- Activar canales de monetización Fase 2
- Alcanzar 90/100 en auditoría
- Validar PMF con Founding Dealers
- Evaluar lanzamiento de segundo vertical (Municipiante o CampoIndustrial)

### Largo plazo (año 1-2)

- 3-5 verticales activos
- Productos de datos (valoración, índice de mercado)
- Subastas online activas
- Considerar segundo cluster Supabase
- Evaluar idiomas adicionales según tráfico

### Escalabilidad probada

| Verticales | Clusters Supabase | Coste infra/mes | Capacidad        |
| ---------- | ----------------- | --------------- | ---------------- |
| 1          | 1 ($25)           | ~$34            | 10M visitas/mes  |
| 7          | 2 ($50)           | ~$100           | 50M visitas/mes  |
| 11         | 3 ($75)           | ~$200           | 100M visitas/mes |
| 20         | 5 ($125)          | ~$600           | 200M visitas/mes |

---

## 15. Referencia Rápida de Archivos

| Necesitas...                   | Lee...                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| Entender el proyecto completo  | Este documento                                               |
| Ejecutar una sesión de trabajo | `docs/tracciona-docs/INSTRUCCIONES-MAESTRAS.md`              |
| Estado actual y errores        | `STATUS.md` (raíz)                                           |
| Convenciones de código         | `CONTRIBUTING.md`                                            |
| Esquema de BD                  | `docs/tracciona-docs/referencia/ERD.md`                      |
| Endpoints API                  | `docs/tracciona-docs/referencia/INVENTARIO-ENDPOINTS.md`     |
| Crons                          | `docs/tracciona-docs/referencia/CRON-JOBS.md`                |
| Seguridad                      | `docs/tracciona-docs/referencia/SECURITY-TESTING.md`         |
| Disaster recovery              | `docs/tracciona-docs/referencia/DISASTER-RECOVERY.md`        |
| Dependencias externas          | `docs/tracciona-docs/referencia/THIRD-PARTY-DEPENDENCIES.md` |
| Secrets y rotación             | `docs/tracciona-docs/referencia/SECRETS-ROTATION.md`         |
| WAF config                     | `docs/tracciona-docs/referencia/CLOUDFLARE-WAF-CONFIG.md`    |
| Retención de datos GDPR        | `docs/tracciona-docs/referencia/DATA-RETENTION.md`           |
| API pública                    | `docs/tracciona-docs/referencia/API-PUBLIC.md`               |
| Flujos operativos              | `docs/tracciona-docs/referencia/FLUJOS-OPERATIVOS.md`        |
| Checklist SEO/UX               | `docs/tracciona-docs/CHECKLIST-SEO-UX-TECNICO.md`            |
| Auditoría detallada            | `docs/auditorias/AUDITORIA-26-FEBRERO.md`                    |
| Decisiones abiertas fundadores | `docs/gobernanza/A REVISAR.md`                               |
| Documentación legacy           | `docs/legacy/` (solo referencia, no modificar)               |
