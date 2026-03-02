# TradeBase / Tracciona — Estrategia de Negocio

> **Propósito:** Detalle completo de estrategia de negocio, go-to-market, monetización y datos. Claude Code NO lee este archivo automáticamente — solo cuando la tarea lo requiera. Para contexto de código, ver `PROYECTO-CONTEXTO.md`.
> **Extraído de:** `PROYECTO-CONTEXTO.md` (10-mar-2026) para reducir consumo de tokens en sesiones de desarrollo.

---

## 2.4.1 Créditos y Suscripciones (detalle completo)

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

---

## 2.5 Revenue stacking por transacción

Un vehículo de €40K puede generar €2.650-3.785 sumando canales: destacado + comisión + transporte + verificación + seguro + documentación. Los canales se apilan, no compiten.

## 2.6 Los 17+ canales de monetización (3 fases)

**Fase 1 — Día 1 (ingresos inmediatos)**

1. Anuncios destacados (€2-5/día por vehículo)
2. Publicidad directa geolocalizada — 7 posiciones de ad (CPM €8-25), anunciantes por vertical
3. Google AdSense — monetización puente hasta tener anunciantes directos suficientes. Se sustituye progresivamente por publicidad directa (mayor CPM, mejor UX)
4. Suscripciones Pro dealers (Free / Basic €29 / Premium €79 / Founding: gratis permanente para los 10 primeros)
5. Generación IA de fichas (€0.99/ficha con Claude Haiku)

**Fase 2 — Meses 1-6 (servicios de valor añadido)** 6. Suscripciones dealer (CRM, estadísticas, herramientas) 7. Comisión por venta (1-3% del precio) 8. Informes DGT / verificación (€3.50-15 por informe) 9. Inspecciones presenciales (€150-500) 10. Transporte (€250-1.200 por zona, vía IberHaul) 11. Documentación legal (contratos, facturas) 12. Seguros (referidos, comisión 5-15%)

**Fase 3 — Año 2 (productos premium)** 13. Escrow / garantía de pago (1.5-2.5% del importe) 14. Financiación BNPL 15. Informes de valoración (€9.99-29.99) 16. Índice de mercado / datos sectoriales (suscripción mensual) 17. Subastas online (8% buyer's premium)

**Estimación por vertical:** Fase 1: €2.1-7K/mes · Fase 2: €8.7-34K/mes · Fase 3: €17-50.5K/mes

---

## 2.11 Estrategia de acumulación de datos (Capa 4)

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

## 2.12 Silent Safety — Estrategia anti-fraude sin fricción

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

Activar cuando haya >100 vehículos publicados, landings indexadas y presupuesto sin comprometer operaciones. Estructura de 6 campañas (detalle en Anexo J):

- **Campaña 0 — Branded** (Tracciona como keyword): CPC ~0.10€, 20€/mes. Protege la marca, siempre activa.
- **Campaña 1 — Categoría**: cisternas, semirremolques, cabezas tractoras. CPC 0.50-1.80€, 150-200€/mes.
- **Campaña 2 — Marca**: Indox, Schmitz, Lecitrailer, etc. CPC 0.30-0.80€, 100€/mes.
- **Campaña 3 — Acción+tipo**: alquiler, subasta, liquidación flota. CPC 0.30-2.50€, 150€/mes.
- **Campaña 4 — Remarketing Display**: usuarios que vieron fichas sin contactar. CPC 0.10-0.30€, 100€/mes.
- **Campaña 5 — Shopping/Merchant Center**: feed XML dinámico. Listados orgánicos gratuitos desde día 1; solo pagar posición premium si hay ROI demostrado.

**Presupuesto progresivo:** mes 6-9 → 150-200€ (solo campañas 0+1, validar keywords); mes 9-12 → 500€ (añadir 2+3); mes 12+ → 800-1.200€ (remarketing + Shopping pago). **Regla de parada:** 200€ sin leads = pausar y revisar. **Regla de escalado:** CPC <1€ y conversión >3% = duplicar presupuesto.

**KPIs:** CPC medio <2€ · CTR >3% · Tasa conversión (contacto) >2% · Coste por lead <30€ · ROAS >3:1. Conversiones trackeadas via `useGtag()` con 6 eventos: viewItem, search, generateLead, beginCheckout, subscribe, register. Gated por `useConsent()`. Implementación via GTM (no scripts directos en nuxt.config.ts).

### 3.6 WhatsApp multi-país

Fases: ahora €0 (un número español) → año 2 smart routing por país → año 3+ números locales por mercado.

### 3.7 Pricing intelligence futura

"Tu vehículo está un 15% por encima del mercado." Los datos acumulados crean valor para vendedores, no solo compradores. Justifica acumular datos desde el día 1 aunque no se moneticen inmediatamente.

### 3.8 Captación de vendedores (dealers) — Tácticas

#### 3.8.1 Red personal y seed inicial (semana 1, €0)

Subir todo el inventario de Tank Ibérica como seed (20-30 fichas reales). Pedir a 3-5 dealers conocidos que prueben: "Mándame fotos por WhatsApp, yo monto el anuncio. Gratis." Objetivo: 50 fichas reales con las que arrancar.

#### 3.8.2 Puerta fría a dealers (semanas 2-4, €0)

Lista de 50 dealers extraídos de Mascus/MachineryTrader/Milanuncios. 10-15 emails personalizados al día: "He visto tus X vehículos en [plataforma]. Te los subo gratis a Tracciona. No tienes que hacer nada." Tasa esperada: 5-15% responden sí. Objetivo: 15 dealers activos con 100+ fichas.

#### 3.8.3 Publicación multicanal como servicio (€0)

Propuesta de valor: "Me mandas fotos por WhatsApp → te publico en Tracciona + Milanuncios + Wallapop + Facebook desde un solo sitio." Killer feature: nadie en el sector lo ofrece. La herramienta "Exportar anuncio" ya está construida.

#### 3.8.4 Milanuncios PRO paraguas (€50/mes)

Una cuenta PRO a nombre de Tracciona. Subir vehículos de varios dealers. El contacto va directo al dealer real. Ellos aparecen en PRO sin pagar. Tracciona gana dealers comprometidos.

#### 3.8.5 Empresas de renting/leasing (€0)

Contactar a ALD, Arval, LeasePlan, Northgate, Alphabet. Al finalizar contratos de flota, necesitan liquidar 20-50 vehículos rápido. "Os publico toda la flota gratis." Llena catálogo de un día para otro con inventario de calidad.

### 3.9 Funnel WhatsApp desde plataformas externas

#### 3.9.1 El mecanismo

Publicar vehículos en Milanuncios/Wallapop/Facebook Marketplace como "Tracciona.com — Marketplace". Cada anuncio incluye enlace `wa.me/34XXXXXXXXX?text=TRC-042` con código de referencia pre-rellenado.

#### 3.9.2 Flujo automático

1. Comprador ve anuncio en Milanuncios → click en enlace WhatsApp
2. WhatsApp se abre con "TRC-042" pre-escrito
3. WhatsApp Business API responde automáticamente en 2 seg con ficha del vehículo + enlace a Tracciona
4. Comprador contacta al vendedor real en Tracciona

#### 3.9.3 Sin código de referencia

Si alguien escribe sin código: menú interactivo automático ("¿Qué buscas? 1️⃣ Camión 2️⃣ Excavadora...") → enlace al catálogo filtrado.

#### 3.9.4 Datos capturados por interacción

Teléfono del comprador, vehículo de interés, si hizo click, si contactó al vendedor. Métricas para el dealer: "14 personas preguntaron por tus vehículos este mes desde Milanuncios."

#### 3.9.5 Implementación técnica

- Columna `ref_code` en `vehicles` (ej: `TRC-001`, auto-generada)
- Handler en `server/api/whatsapp/webhook.post.ts` para mensajes con patrón `TRC-\d+`
- Respuesta automática con datos del vehículo + enlace a la ficha

### 3.10 SEO programático y herramientas de captación

#### 3.10.1 Landing pages programáticas

Páginas autogeneradas para cada combinación marca/modelo/ubicación: `/camiones/volvo-fh-500`, `/excavadoras/caterpillar-320-precio-madrid`. 200 combinaciones = 200 páginas indexables. Con vehículos: los muestra. Sin ellos: "Crea alerta y te avisamos" (captura email/WhatsApp). Posiciona en 3-6 meses.

#### 3.10.2 Herramienta "¿Cuánto vale mi camión?"

Formulario público en `/valoracion`: marca + modelo + año + km → estimación de precio de mercado. Captura vendedores. SEO: "valoración camión segunda mano" = búsqueda con intención de venta directa. CTA final: "¿Quieres venderlo? Publica gratis en Tracciona."

#### 3.10.3 Calculadoras públicas

Versiones simplificadas y públicas de herramientas ya construidas en el dashboard: coste por km, simulador de financiación, amortización, estimador de seguro. Cada una es una landing que posiciona en Google y termina con enlace al catálogo.

#### 3.10.4 Informe de mercado trimestral (lead magnet)

PDF: "Precios de vehículo industrial en España Q1 2026". Precios medios, tendencias, zonas. Descarga gratis a cambio de email. Compartir en LinkedIn. Captura emails cualificados del sector.

### 3.11 Redes sociales y canales directos

#### 3.11.1 LinkedIn (15 min/día, €0)

Publicar 2-3 veces/semana: fotos de vehículos, datos de mercado, comparativas. Conectar con fleet managers y directores de transporte. El sector industrial vive en LinkedIn.

#### 3.11.2 YouTube — reviews de vehículos (€0)

Vídeos de 3-5 min grabados con móvil en la campa de Onzonilla: "Review Volvo FH 2019 — ¿merece la pena?" Los compradores buscan vídeos antes de desplazarse 500km. 1/semana. Cada vídeo enlaza a Tracciona. Nadie hace esto en industrial en España. Mina de oro sin explotar.

#### 3.11.3 WhatsApp Channel (10 min/día, €0)

Canal público de difusión (feature nativa de WhatsApp). 2-3 vehículos nuevos al día con foto + precio + link. Los transportistas viven en WhatsApp. Suscribirse es un click. Automatizable: cada insert en `vehicles` dispara mensaje al canal vía la API existente.

#### 3.11.4 Facebook Marketplace + grupos (30 min/día, €0)

Publicar vehículos en Marketplace como "Tracciona.com". En grupos de compraventa de transporte/maquinaria (15-20k miembros cada uno), publicar 1 vehículo/día con buenas fotos. Contenido real, no spam.

#### 3.11.5 Telegram grupo sectorial (15 min/día, €0)

Crear "Compraventa Industrial España". No presentarlo como grupo de Tracciona sino como grupo del sector. Moderar, compartir, convertirse en referente.

#### 3.11.6 Pinterest auto-pin (setup 3h, después automático)

Cada vehículo nuevo → pin automático vía API con foto + título + enlace. Pinterest indexa en Google Images en días, no meses. Tableros por categoría: "Camiones usados España", "Excavadoras de ocasión".

#### 3.11.7 Auto-publicación en redes (setup 3-4h, después automático)

Cada insert en `vehicles` dispara automáticamente un post en Instagram + Facebook + X + Pinterest. 200 vehículos = 800 posts en 4 plataformas. Crece solo sin intervención manual.

#### 3.11.8 Newsletter semanal "El Industrial" (1h/semana)

5 vehículos destacados + 1 dato de mercado + 1 consejo práctico. Con Resend (ya configurado). Captura emails desde la herramienta de valoración, el informe de mercado y el registro en Tracciona. Canal propio, independiente de algoritmos.

### 3.12 Retargeting con pixel (€6/día)

#### 3.12.1 Concepto

Un visitante ve un vehículo en Tracciona y se va sin contactar. Durante los siguientes 7 días, le aparecen anuncios de ESE vehículo concreto en Instagram, Facebook, YouTube, webs, Gmail y LinkedIn. Tasa de conversión retargeting: 5-15% (vs 1-2% tráfico frío). Coste por click: €0.10-0.50.

#### 3.12.2 Implementación

Google Tag Manager como contenedor único → dispara Meta Pixel + Google Tag + LinkedIn Insight Tag con un solo `dataLayer.push()`. Setup: 30 minutos. No necesita vídeos ni diseño: las plataformas generan automáticamente todos los formatos (imagen estática, carrusel, slideshow animado, mini-vídeo) desde las fotos del vehículo.

#### 3.12.3 Catálogo dinámico (Dynamic Product Ads)

Endpoint `/api/feed/products.xml` genera feed de todos los vehículos. Meta y Google lo importan diariamente. Cada vehículo nuevo aparece como anuncio de retargeting sin intervención manual. El visitante ve exactamente el vehículo que miró, no un anuncio genérico.

#### 3.12.4 Plataformas y presupuesto

| Plataforma   | Dónde aparece el anuncio             | €/día         | Prioridad                    |
| ------------ | ------------------------------------ | ------------- | ---------------------------- |
| Google       | Webs, YouTube, Gmail, Maps, Discover | €3            | Desde el día 1               |
| Meta         | Instagram, Facebook, Messenger       | €3            | Desde el día 1               |
| LinkedIn     | Feed (fleet managers, directores)    | €10           | Cuando haya +100 visitas/día |
| Total inicio |                                      | €6 (€180/mes) |                              |

#### 3.12.5 GDPR

Banner de cookies con toggle separado para "marketing". Pixels solo se activan si el usuario acepta cookies de marketing. Sin consentimiento, sin tracking. Implementar vía `useConsent()` existente.

### 3.13 Alianzas offline con coste cero

| Aliado                          | Qué ve/sabe                            | Propuesta                                               | Impacto                |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------- | ---------------------- |
| Gestorías de transferencias     | Todas las compraventas de la zona      | "Recomienda Tracciona, €50 por venta cerrada"           | Alto (flujo constante) |
| Talleres de camiones/maquinaria | Quién va a vender su vehículo          | Tarjetas en recepción                                   | Medio                  |
| Corredores de seguros de flotas | 50-200 empresas de transporte cada uno | "Si tu cliente vende, recomiéndanos"                    | Alto (multiplicador)   |
| ITV de vehículos pesados        | Todo vehículo industrial pasa por ahí  | Flyers: "¿No pasa ITV? Véndelo gratis en tracciona.com" | Medio                  |

### 3.14 Branding físico pasivo

#### 3.14.1 Vinilo en góndola IberHaul (€300, una vez)

Lateral: "¿Vendes tu camión? tracciona.com — Publica gratis" + QR grande. Trasero: logo + WhatsApp. Miles de impresiones diarias en autopistas y polígonos industriales. La góndola viaja por toda España.

#### 3.14.2 QR en vehículos de la campa (€20)

Cartel plastificado en parabrisas de cada vehículo en Onzonilla → enlace a la ficha en Tracciona. Visitantes de la campa escanean y entran en la web.

#### 3.14.3 Google Business Profile (€0, 10 min)

"Tracciona — Marketplace de Vehículo Industrial" en Google Maps con dirección de la campa. Fotos de vehículos. Categoría: "Concesionario de vehículos comerciales". Aparece en búsquedas locales.

### 3.15 Plan de ejecución por fases

```
SEMANA 1  (€0, sin código)
├─ Subir inventario Tank Ibérica (seed 20-30 fichas)
├─ Pedir a 3-5 dealers conocidos que prueben
├─ Crear perfil LinkedIn + primer post
└─ Google Business Profile

SEMANA 2  (€50)
├─ Milanuncios PRO + primeros anuncios con wa.me
├─ Facebook Marketplace + 2 grupos
├─ WhatsApp Channel + primer mensaje
└─ Empezar emails personalizados a dealers (10/día)

SEMANA 3  (€6/día)
├─ Instalar Google Tag Manager + pixels
├─ Activar retargeting Meta + Google (€6/día)
├─ Primer vídeo YouTube en la campa
└─ Vinilo en la góndola

MES 2  (requiere código)
├─ SEO programático (landing pages marca/modelo)
├─ Herramienta de valoración pública
├─ Auto-publicación en redes (webhook → 4 plataformas)
├─ Feed de catálogo dinámico para retargeting
└─ Contactar 2-3 empresas de renting/leasing

MES 3+  (escalar lo que funcione)
├─ Newsletter semanal "El Industrial"
├─ Informe de mercado trimestral
├─ Calculadoras públicas
├─ Pinterest auto-pin
├─ Gestorías + talleres + corredores de seguros
└─ Medir, descartar lo que no funcione, doblar lo que sí
```

**Coste total primer mes: ~€250.** €50 Milanuncios PRO + €180 retargeting + €20 QR. Todo lo demás es tiempo del fundador.

**Métrica norte:** número de dealers activos con vehículos publicados. Todo lo demás es secundario hasta llegar a 20 dealers / 200 fichas.

### 3.16 Google AdSense — Ingresos publicitarios pasivos

AdSense es el puente, publicidad directa (Anexo F) es el destino. Estrategia de 3 fases:

```
Fase 1 (meses 1-6):   AdSense en espacios disponibles
Fase 2 (meses 6-12):  Anunciantes directos en slots premium + AdSense en el resto
Fase 3 (meses 12+):   Publicidad directa donde haya anunciante + AdSense solo en residual
```

AdSense y publicidad directa **nunca conviven en el mismo espacio**. Cuando llega un anunciante directo (100-400€/mes por slot), ese slot sale de AdSense (30-80€/mes). La transición es progresiva.

**Cuándo activar:** Con >100 vehículos publicados y >1.000 visitas/mes. Antes de eso, los ingresos (~€20-30/mes) no compensan el daño a la percepción de calidad del marketplace.

**Dónde SÍ:** catálogo in-feed entre resultados, sidebar desktop en landings, debajo de specs en ficha de vehículo, footer, artículos editoriales.

**Dónde NO:** encima del botón de contacto, registro/login, formulario de publicación, dashboard/admin, subastas en vivo, emails, PDFs.

**Regla de densidad:** máximo 2 bloques visibles simultáneamente. Más = aspecto de Milanuncios.

**CPM realista (conservador):** 3-8€ con tráfico bajo → 12-20€ con 30K+ visitas/mes. Evitar proyecciones optimistas — los CPMs altos llegan con engagement demostrado y tiempo.

| Visitas/mes | CPM realista | Bloques/pág | Ingresos/mes |
| ----------- | ------------ | ----------- | ------------ |
| 5.000       | 5€           | 2           | ~50€         |
| 15.000      | 9€           | 2           | ~270€        |
| 30.000      | 12€          | 2           | ~720€        |
| 100.000     | 18€          | 2           | ~3.600€      |

**Roadmap de redes:** AdSense (sin mínimo) → Ezoic (>10K visitas, mejor IA de optimización) → Mediavine (>50K sesiones, mejor CPM) → Raptive (>100K pageviews, muy selectivo).

**Implementación:** via GTM. Componente `AdSenseSlot.vue` con lógica fallback: si hay anuncio directo disponible para esa posición (tabla `ads`), renderiza anuncio directo; si no, renderiza AdSense. Carga lazy (IntersectionObserver) para no penalizar LCP. Ver Anexo J para detalles de implementación y comparativa completa AdSense vs Google Ads vs publicidad directa.

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

## 15. Tareas de negocio pendientes (no-código)

> Rescatadas de `docs/gobernanza/A REVISAR.md` (10-mar-2026). Items que no son redundantes con el resto de documentación.

### Sprint planning mínimo semanal

- **Lunes (15 min):** Definir 3-5 prioridades de la semana
- **Viernes (10 min):** Revisar 5 métricas: dealers activos, fichas publicadas, leads generados, visitas, revenue
- Coste: 0. Solo disciplina de fundadores.

### Asesor fiscal UK/ES

Cuando haya ingresos cruzados entre entidades (TradeBase SL en España, posible estructura UK), consultar asesor especializado en transfer pricing. No urgente hasta que haya facturación real entre entidades.

### Marco de auditoría a largo plazo (2026-2046)

Existe un plan de auditoría a 20 años en `docs/legacy/PLAN-AUDITORIA-TRACCIONA.md` con:

- Calendario maestro por dimensión (seguridad, legal, rendimiento, UX, datos)
- Fases evolutivas del plan
- Herramientas y coste por fase
- Plantilla de informe de auditoría

Evaluar si adoptar el marco formal o simplificar cuando la empresa tenga estructura.
