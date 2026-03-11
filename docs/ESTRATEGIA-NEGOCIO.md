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

## 2.13 Brokeraje Inteligente — Intermediación automatizada con IA

_(Definido 04-mar-2026)_

### Concepto

Sistema de intermediación automatizada donde **tres entidades independientes** colaboran para cerrar operaciones de compraventa con margen garantizado:

- **Tracciona** (marketplace) — precalifica compradores, facilita el match, cobra fee
- **Tank Ibérica** (compraventa) — negocia con vendedores, compra la unidad, vende al comprador con margen
- **IberHaul** (transporte) — entrega la unidad si es necesario

El comprador (C) nunca sabe quién es el vendedor original (V). Para C, Tank Ibérica es simplemente el vendedor. Son empresas distintas con CIFs distintos — no hay conflicto de intereses.

### Flujo operativo

```
1. C encuentra unidad en Tracciona
        ↓
2. IA de Tracciona (T) ofrece prenegociación vía WhatsApp
   - Precalifica: presupuesto, financiación, ubicación, urgencia
   - NO revela datos del vendedor ni identificadores de la unidad
   - Scoring de seriedad del comprador
        ↓
3. C pasa precalificación → IA de Tank Ibérica (I) contacta a V
   - "Hemos visto tu [vehículo] en Tracciona. Tenemos un comprador interesado. ¿Aceptarías X€?"
   - Negocia precio de compra
   - V no sabe que hay un C concreto esperando
        ↓
4. ¿Hay margen ≥ Z entre precio de V y lo que C pagaría?
   - NO → deal descartado, nadie pierde tiempo humano
   - SÍ ↓
        ↓
5. Tracciona dice a C: "Tenemos una unidad que encaja con lo que buscas
   a ese precio. ¿Quieres que te pongamos en contacto con el vendedor?"
   - El "vendedor" es Tank Ibérica
        ↓
6. C confirma interés real (visita, depósito, o acuerdo de precio)
        ↓
7. IA alerta a humanos de Tank Ibérica con resumen del deal:
   - Compra a V por X, venta a C por X+Y, margen Y
   - Humanos validan y toman el relevo
        ↓
8. Tank Ibérica compra a V → Tank Ibérica vende a C
   Tracciona cobra fee por el match
   IberHaul transporta si es necesario
```

### Modelo de consentimiento — Diseñado para auditoría

**Principio rector:** No diseñar para "que no se note", sino para ser **defendible ante auditoría** (AEPD, fiscal, mercantil). Transparencia de entidad, logs completos, base jurídica explícita, derecho de oposición efectivo.

**Servicio activo por defecto (opt-out):** Al publicar en Tracciona, los TyC incluyen:

> _"Al publicar un anuncio, aceptas recibir ofertas de compra de empresas colaboradoras de la plataforma. Puedes desactivar este servicio en tu perfil en cualquier momento."_

**Transparencia de entidad en cada comunicación:**

- Tracciona contacta a C → se identifica con nombre legal y CIF de Tracciona
- Tank Ibérica contacta a V → se identifica con nombre legal, CIF y dirección de Tank Ibérica
- Nunca se envía un mensaje sin identificar la empresa remitente

**Consentimiento explícito del comprador:** Antes de compartir datos de C con Tank Ibérica, se solicita consentimiento explícito (art. 6.1.a RGPD) con mensaje claro que identifica a Tank Ibérica como destinatario.

**Derecho de oposición del vendedor:**

- Toggle en perfil (`Ajustes → Ofertas de compra`) — efecto inmediato
- Responder "NO OFERTAS" por WhatsApp — efecto inmediato
- Cada cambio registrado en `brokerage_consent_log` con timestamp y evidencia

**Tres capas de contacto (todas transparentes):**

| Capa                    | Quién contacta               | Se identifica como    | Base jurídica (RGPD)                  |
| ----------------------- | ---------------------------- | --------------------- | ------------------------------------- |
| 1. Servicio activo      | IA en nombre de Tank Ibérica | Tank Ibérica SL + CIF | Art. 6.1.f (interés legítimo) + TyC   |
| 2. V desactiva servicio | Tank Ibérica como comprador  | Tank Ibérica SL + CIF | Art. 6.1.f (comprador legítimo)       |
| 3. V fuera de Tracciona | Tank Ibérica directamente    | Tank Ibérica SL + CIF | Art. 6.1.f (oferta a anuncio público) |

**Audit trail:** Cada acción del sistema (contacto, respuesta, opt-out, negociación, escalación) queda en `brokerage_audit_log` con actor, base jurídica y timestamp.

> **Arquitectura técnica completa:** `referencia/BROKERAJE-ARQUITECTURA.md` — tablas, máquina de estados, RLS, retención de datos, separación de datos entre empresas.

### Ventaja competitiva

**Ningún competidor puede replicar esto fácilmente.** Requiere las tres patas simultáneamente:

| Competidor                      | Marketplace | Compraventa con infraestructura | Transporte propio |
| ------------------------------- | ----------- | ------------------------------- | ----------------- |
| Autoline/Mascus                 | ✔️          | ✖️                              | ✖️                |
| Wallapop/Milanuncios            | ✔️          | ✖️                              | ✖️                |
| Dealers tradicionales           | ✖️          | ✔️                              | ✖️                |
| **Tracciona + Tank + IberHaul** | **✔️**      | **✔️**                          | **✔️**            |

**Diferenciador para vendedores:** _"En Tracciona no esperas compradores. Nosotros te los buscamos."_
La plataforma genera actividad percibida incluso cuando el vendedor rechaza ofertas → retención superior.

### Efecto volante

```
Más unidades publicadas en Tracciona
    → más compradores precalificados por la IA
        → más deals cerrados por Tank Ibérica
            → más vendedores ven actividad (ofertas recibidas)
                → más vendedores publican en Tracciona
```

Cada operación genera datos de mercado (precios de compra, precios de venta, tiempos, zonas, marcas) que alimentan la Capa 4 (§2.11 — datos para bancos, leasings, aseguradoras).

### Por qué funciona especialmente bien en vehículo industrial

- **Tickets altos** (20k-200k€): margen del 3-5% = 600-10.000€ por operación
- **Vendedores profesionales** que priorizan liquidez rápida sobre precio máximo
- **Compradores (autónomos/pymes)** que no quieren perder días negociando
- **Poca competencia digital** con IA en el sector industrial
- **Tank Ibérica ya opera** con campa en Onzonilla — infraestructura existente

### Requisitos legales y de compliance

| Aspecto                  | Estado / Acción                                                                |
| ------------------------ | ------------------------------------------------------------------------------ |
| **RGPD**                 |                                                                                |
| TyC Tracciona            | Añadir cláusula de ofertas de empresas colaboradoras (opt-out)                 |
| Política de privacidad   | Declarar compartición de datos con Tank Ibérica SL (identificada)              |
| Acuerdo art. 26 RGPD     | Contrato de co-responsables del tratamiento entre Tracciona y Tank Ibérica     |
| EIPD (DPIA)              | Evaluación de impacto — recomendable por decisiones automatizadas (scoring IA) |
| Test de ponderación      | Documentar interés legítimo (art. 6.1.f) para contacto a vendedores            |
| Protocolo ARSULPD        | Procedimiento de atención de derechos para datos de brokeraje                  |
| **Mercantil / fiscal**   |                                                                                |
| Alta IAE Tank Ibérica    | Epígrafe de compraventa de vehículos usados (ya existente)                     |
| Régimen fiscal           | REBU si V es particular · IVA normal si V es empresa                           |
| Garantía legal           | 1 año si C es consumidor final (particular)                                    |
| Precios de transferencia | Fee Tracciona→Tank Ibérica a precio de mercado (documentado)                   |
| **LSSI**                 |                                                                                |
| Identificación remitente | Nombre legal + CIF + dirección en toda comunicación comercial                  |
| Derecho de oposición     | Opt-out inmediato vía perfil web o respuesta WhatsApp                          |

### Margen mínimo viable (Z) — A determinar

Factores que definen Z:

- Coste de transporte (IberHaul, si aplica)
- Gestión documental (transferencia, ITV si necesario)
- Coste financiero del stock (días en campa)
- Garantía legal (provisión por posibles reclamaciones)
- Fee de Tracciona por el match
- Margen neto mínimo de Tank Ibérica

> **Pendiente:** Definir Z con datos reales de las primeras operaciones. Inicialmente estimar por franja de precio del vehículo (ej: Z = 5% en vehículos <50k€, Z = 3% en >50k€).

### Precalificación del comprador — Scoring

La IA de Tracciona puntúa a C antes de activar la negociación con V:

| Factor                  | Peso  | Señal positiva                  | Señal negativa               |
| ----------------------- | ----- | ------------------------------- | ---------------------------- |
| Presupuesto declarado   | Alto  | Rango realista para la unidad   | Muy por debajo del mercado   |
| Financiación            | Alto  | Pre-aprobado o no necesita      | Sin capacidad ni interés     |
| Urgencia                | Medio | "Necesito para este mes"        | "Solo estoy mirando"         |
| Historial en plataforma | Medio | Ha contactado, ha buscado mucho | Primera visita               |
| Ubicación               | Bajo  | Cercana o acepta transporte     | Muy lejos sin plan logístico |

Solo compradores con score ≥ umbral activan la negociación con V. Esto evita que Tank Ibérica pierda tiempo con curiosos.

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

#### 3.2.1 SLAs de activación de dealers

_(Añadido 10-mar-2026)_

Medir 5 hitos de activación por dealer:

1. **Contactado** — primer contacto realizado
2. **Acepta prueba** — confirma que quiere probar
3. **Inventario cargado** — tiene anuncios publicados
4. **Primera interacción compradora** — un comprador ve/contacta sus vehículos
5. **Primer lead cualificado** — recibe consulta seria de comprador

**SLAs internos (no negociables):**

| Regla | SLA |
|---|---|
| Dealer que acepta → anuncios publicados | **Máximo 48h** |
| Dealer activo → reporte de rendimiento | **Cada 7 días** |
| Dealer con 0 leads en 14 días | **Intervención manual obligatoria** |

En fase inicial, la retención de dealers no la gana un dashboard — la gana una sensación de acompañamiento y movimiento. El contacto humano antes del día 7 es más valioso que el email automático de stats.

### 3.3 SEO orgánico como canal principal de adquisición

No se empieza con paid ads. El funnel es: contenido editorial → tráfico orgánico → usuarios → dealers siguen a los usuarios. Esto explica por qué el motor de contenido es tan crítico.

**Estrategia de linking interno:** Cada artículo editorial enlaza a 2+ páginas de catálogo/categoría. El contenido editorial existe para bombear autoridad SEO hacia las páginas de catálogo, no es contenido por contenido.

**El sitio NO está indexado en Google todavía** (0 resultados en `site:tracciona.com`). Google Search Console necesita verificación por los fundadores. Todo el trabajo SEO (SSR, Schema.org, hreflang, editorial) depende de esto.

### 3.4 Motor de contenido editorial

> **Consideración (10-mar-2026):** El arranque editorial debería condicionarse a tener Google Search Console verificada y operativa. Sin GSC, publicar artículos no tiene efecto SEO medible — el contenido existe pero no se puede validar su impacto en indexación, impresiones ni posiciones. Priorizar la verificación de GSC como bloqueante antes de iniciar la rutina editorial.

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

### 3.5 Google Ads — Herramienta de validación, no de crecimiento

_(Reescrito 10-mar-2026)_

Google Ads NO es un canal de crecimiento permanente para este nicho. En vehículo industrial hay pocas búsquedas con intención altísima — quien busca "cisterna alimentaria segunda mano" quiere comprar una. Cada clic es valioso, pero hay muy pocos clics disponibles. Subir presupuesto no da más clics, solo sube el CPC.

El SEO orgánico dará más tráfico a coste cero en 6-12 meses que Ads pagando indefinidamente. Google Ads se usa como **diagnóstico y puente**, no como motor.

#### 3.5.1 Los 3 usos de Google Ads

**Uso 1 — Investigación de mercado (meses 3-4, ~€300 total)**

No buscas ventas. Buscas datos. Configuras campañas con keywords amplias por categoría y dejas que Google te diga qué busca la gente realmente (los "términos de búsqueda reales" que activaron tus anuncios). Vas a descubrir cosas como que la gente busca "cisterna de leche usada" en vez de "cisterna alimentaria", o que buscan marcas concretas ("cisterna Indox segunda mano") más que categorías genéricas. Esos datos valen oro para el SEO orgánico: creas landing pages para esas keywords reales y te posicionas gratis.

- Presupuesto: 10€/día durante 1 mes = ~€300
- Objetivo: datos de keywords, no leads

**Uso 2 — Demostrar valor a dealers (meses 4-6, €200-300/mes)**

El problema más difícil no es atraer compradores — es convencer a dealers de que publiquen. Si un dealer publica 10 vehículos y no recibe ni una llamada en 2 meses, se va. Google Ads permite enviar tráfico cualificado a las fichas de los dealers y generar leads reales. Cuando un dealer recibe 3 llamadas desde Tracciona en un mes, ya no necesitas convencerle de nada.

- Este dinero no es "marketing" — es inversión en retención de supply
- Se para cuando el tráfico orgánico sea suficiente para generar leads sin pagar

**Uso 3 — Puente SEO para keywords transaccionales (puntual)**

El SEO tarda 6-12 meses en posicionar. Hay keywords transaccionales donde necesitas estar visible ya, especialmente las de marca ("cisterna Indox venta") que son las de mayor conversión. Hasta que la posición orgánica suba, Ads te pone ahí. Cuando la posición orgánica suba, quitas el Ad para esa keyword y dejas el orgánico hacer su trabajo. Es un puente, no un destino.

#### 3.5.2 Configuración concreta

**Solo campañas de búsqueda (Search).** Nunca Display, nunca Performance Max — están optimizadas para e-commerce de consumo con miles de conversiones. Con 3-5 leads/mes, el algoritmo no tiene datos suficientes para optimizar y quema el presupuesto en clics irrelevantes.

**Estructura por grupos:**

| Grupo | Keywords ejemplo | Landing |
|---|---|---|
| Cisternas | "cisterna segunda mano", "cisterna alimentaria usada", "cisterna ADR venta" | `/cisternas` |
| Tractoras | "cabeza tractora ocasión", "tractora segunda mano" | `/cabezas-tractoras` |
| Semirremolques | "semirremolque usado", "semirremolque frigorífico venta" | `/semirremolques` |
| Alquiler | "alquiler cisterna", "alquiler semirremolque" | `/alquiler` |
| Marcas | "cisterna Indox", "semirremolque Schmitz segunda mano" | Landing de marca |

Cada grupo apunta a su landing page específica en Tracciona (nunca a la home).

**Keywords negativas desde el día 1:** "nuevo", "nueva", "precio nuevo", "concesionario oficial", "financiación nueva". No queremos gente que busca vehículos nuevos.

**Segmentación:** España. Si se prueba Portugal, campaña separada en portugués.

#### 3.5.3 Números reales

300€/mes → ~100 clics (a ~3€ CPC medio) → 3-5 contactos (conversión 3-5% en B2B nicho) → 1-2 operaciones con servicios → €500-1.500 de ingreso por servicios.

- Si el ROAS es positivo → se autofinancia, se mantiene con lo que genera
- Si el ROAS es negativo después de 2 meses → se para. Has gastado €600 en datos de mercado que aplicas al SEO. En ambos casos ganas

#### 3.5.4 Lo que NO hacer

- **No dejar que Google venda campañas "inteligentes" o Performance Max.** Para este volumen y nicho, se necesita control total sobre keywords y pujas.
- **No poner más de 15€/día.** En un nicho de bajo volumen, subir presupuesto no da más clics — solo sube el CPC porque Google interpreta que tienes más margen.
- **No usar como canal permanente.** El SEO orgánico es acumulativo y gratuito. Ads es lineal y de pago.

#### 3.5.5 Timeline

| Fase | Acción | Gasto |
|---|---|---|
| Meses 1-3 | Nada de Ads. Llenar catálogo + captar Founding Dealers | €0 |
| Meses 3-4 | €300 de investigación de keywords. Analizar datos, aplicar al SEO | ~€300 |
| Meses 4-6 | €200-300/mes si los datos son prometedores, enfocado en generar leads para dealers | €400-900 |
| Mes 7+ | Evaluar. Si el SEO orgánico ya genera leads, reducir o eliminar Ads. Si no, mantener como puente | Variable |
| **Máximo Año 1** | | **€1.200-1.800** |

**Regla de parada:** €200 gastados sin leads = pausar y revisar.

**Regla de autofinanciación:** Si genera retorno, se mantiene con lo que produce. Si no, se para.

#### 3.5.6 Cuándo repetir el ciclo de diagnóstico

Google Ads como herramienta de diagnóstico no es de una sola vez. Repetir el ciclo de investigación (Uso 1: €300, 1 mes) cada vez que cambien las condiciones del marketplace:

| Situación | Por qué repetir |
|---|---|
| **Lanzamiento de nuevo vertical** (Horecaria, CampoIndustrial) | Las keywords son completamente distintas. Necesitas descubrir qué busca ESE sector |
| **Apertura de nueva categoría** dentro de un vertical | Validar si hay demanda real antes de invertir en contenido/landings |
| **SEO orgánico estancado** | Diagnosticar si el problema es keyword, landing, demanda o competencia |
| **Entrada en nuevo país** | Las keywords, el idioma y el comportamiento de búsqueda cambian |
| **Cambio significativo en el mercado** | Nueva regulación, crisis del sector, nuevo competidor fuerte |

Coste de cada ciclo de diagnóstico: ~€300 (10€/día × 1 mes). Retorno: datos de mercado actualizados para recalibrar la estrategia SEO.

#### 3.5.7 Campaña Branded — Protección de marca (€20/mes, constante)

Campaña Search con la keyword "Tracciona" (y variantes: "tracciona.com", "tracciona vehículos", "tracciona marketplace"). CPC ~€0.10. Objetivo: que nadie puje por tu marca y se lleve tus clics. No busca crecimiento — es defensiva.

- **Cuándo activar:** Cuando GSC detecte que empiezan a llegar impresiones por búsquedas de marca. Antes de eso, nadie busca "Tracciona" y los €20/mes no sirven para nada.
- **Cuándo desactivar:** Nunca. Una vez activa, se deja siempre encendida. €20/mes = €240/año por proteger la marca.
- **Independiente del resto:** Esta campaña NO forma parte de los ciclos de diagnóstico (§3.5.1-3.5.6). Es una línea fija aparte.

#### 3.5.8 Google Shopping orgánico (€0)

Independientemente de si se pagan Ads o no, activar Google Merchant Center para listados orgánicos gratuitos en Google Shopping. Requiere feed XML dinámico (`/api/feed/products.xml`). Los vehículos aparecen en Shopping sin coste. Solo pagar posición premium si hay ROI demostrado (probablemente nunca necesario en este nicho).

#### 3.5.9 KPIs

CPC medio <€4 · Tasa conversión (contacto) >3% · Coste por lead <€30 · ROAS >1:1 para autofinanciación. Conversiones trackeadas via `useGtag()` con 6 eventos: viewItem, search, generateLead, beginCheckout, subscribe, register. Gated por `useConsent()`. Implementación via GTM (no scripts directos en nuxt.config.ts).

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

#### 3.8.4 Milanuncios como canal de distribución (€0)

Publicar anuncios gratuitos en Milanuncios a nombre de Tracciona. Subir vehículos de varios dealers. El contacto va al funnel WhatsApp con ref codes (§3.9.6) que redirige al dealer real en Tracciona. No se contrata Milanuncios PRO — el anuncio gratuito cumple la función de embudo hacia Tracciona, donde se genera la confianza real. El sello verificado y la mejor posición de PRO no justifican €30-50/mes cuando el objetivo no es vender en Milanuncios sino capturar tráfico hacia la plataforma propia.

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

#### 3.9.6 Códigos de referencia mejorados para atribución

_(Añadido 10-mar-2026)_

El formato `TRC-042` es insuficiente para atribuir origen y rendimiento. Migrar a formato compuesto:

```
{CANAL}-{CATEGORÍA}-{DEALER}-{VEHÍCULO}
```

Ejemplos:
- `MIL-CIST-D03-042` → Milanuncios, cisterna, dealer 03, vehículo 042
- `WAL-SEMI-D07-118` → Wallapop, semirremolque, dealer 07, vehículo 118
- `FBK-GRUA-D01-055` → Facebook, grúa, dealer 01, vehículo 055

**Canales:** `MIL` (Milanuncios), `WAL` (Wallapop), `FBK` (Facebook), `WEB` (web directa), `LNK` (LinkedIn), `YTB` (YouTube), `NWS` (newsletter), `QR` (QR físico).

Esto permite medir:
- Qué canal genera más leads
- Qué categoría convierte mejor por canal
- Qué dealers reciben más tráfico externo
- ROI real de cada canal de distribución

### 3.10 SEO programático y herramientas de captación

#### 3.10.1 Landing pages programáticas

Páginas autogeneradas para cada combinación marca/modelo/ubicación: `/camiones/volvo-fh-500`, `/excavadoras/caterpillar-320-precio-madrid`. 200 combinaciones = 200 páginas indexables. Con vehículos: los muestra. Sin ellos: "Crea alerta y te avisamos" (captura email/WhatsApp). Posiciona en 3-6 meses.

> **Regla de activación (10-mar-2026):** No abrir SEO programático masivo hasta tener **al menos 100-150 fichas reales activas** y señales de GSC sobre consultas, impresiones y categorías que ya empiezan a moverse. Antes de eso, mejor pocas páginas excelentes que muchas páginas con thin content. El riesgo de crear 200 páginas sin inventario suficiente es penalización SEO por contenido pobre.

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

#### 3.11.6 Pinterest — SEO visual + catálogo gratuito (setup 3-4h, después automático, €0)

Pinterest es un canal infrautilizado en B2B industrial: competencia prácticamente cero en keywords como "cisterna segunda mano" o "cabeza tractora usada". No va a ser canal principal de leads — el comprador de cisterna no va a Pinterest a comprar — pero da posicionamiento gratuito en Google Images, presencia de marca y otro escaparate de producto sin esfuerzo recurrente.

**SEO indirecto (por qué importa):**
- Los pins y boards de Pinterest se indexan en Google → un board "Cisternas alimentarias en venta" puede posicionar en búsquedas de cola larga
- Las imágenes de pins aparecen en Google Images con enlace directo a la ficha en Tracciona
- Pinterest tiene DA 89 — las menciones de marca y tráfico referido envían señales positivas a Google
- Pinterest tiene buscador propio (450M usuarios/mes) — en industrial no hay contenido, primer entrador domina

**Pinterest Shopping Catalog (Product Pins gratuitos):**
- Feed de productos `/api/feed/products.xml` (el mismo de retargeting §3.12.3 y Google Merchant Center §3.5.8) se conecta a [Pinterest Catalogs](https://business.pinterest.com/shopping/)
- Cada vehículo aparece como Product Pin con precio, disponibilidad y enlace directo a ficha
- Es otro Google Shopping gratis — listados orgánicos de producto sin coste publicitario
- Se actualiza automáticamente con el feed diario (vehículos vendidos desaparecen, nuevos aparecen)

**Automatización:**
- Cada insert en `vehicles` → pin automático vía [Pinterest API v5](https://developers.pinterest.com/) con foto principal + título + precio + enlace a ficha
- Boards organizados por categoría: "Cisternas en venta", "Cabezas tractoras usadas", "Semirremolques de ocasión", "Maquinaria industrial"
- Pinterest indexa imágenes en Google Images en días, no meses
- Setup: 3-4 horas (cuenta business + API + feed catalog + boards). Después: cero intervención manual

**Lo que NO hacer:**
- No pagar Pinterest Ads (audiencia mayoritariamente B2C, CPM alto para nicho industrial)
- No crear pins manuales con diseño (las fotos reales del vehículo son el contenido — autenticidad > diseño)
- No esperar leads directos — Pinterest es amplificador de SEO y presencia, no canal de conversión

#### 3.11.7 Auto-publicación en redes (setup 3-4h, después automático)

Cada insert en `vehicles` dispara automáticamente un post en Instagram + Facebook + X + Pinterest. 200 vehículos = 800 posts en 4 plataformas. Crece solo sin intervención manual.

#### 3.11.8 Newsletter semanal "El Industrial" (1h/semana)

5 vehículos destacados + 1 dato de mercado + 1 consejo práctico. Con Resend (ya configurado). Captura emails desde la herramienta de valoración, el informe de mercado y el registro en Tracciona. Canal propio, independiente de algoritmos.

### 3.12 Retargeting con pixel

#### 3.12.1 Concepto

Un visitante ve un vehículo en Tracciona y se va sin contactar. Entra en una ventana de retargeting de hasta 30 días, durante la cual puede ver anuncios de ese vehículo concreto en Instagram, Facebook, YouTube, webs de Display, Gmail y Discover. El retargeting suele convertir significativamente mejor que el tráfico frío; como referencia orientativa, puede situarse en rangos del 5–15% frente a 1–2% en tráfico frío, según sector, volumen y calidad del dato. Coste por clic orientativo: desde ~€0,10–0,50 en audiencias de retargeting eficientes, con variación según plataforma y competencia.

#### 3.12.2 Implementación

Google Tag Manager como contenedor único → dispara Meta Pixel + Google Tag + LinkedIn Insight Tag con un solo `dataLayer.push()`. Configuración técnica inicial: 0,5–1 día incluyendo consent mode, validación de eventos y QA. No necesita vídeos ni diseño: las plataformas pueden adaptar automáticamente las fotos del vehículo a distintos formatos publicitarios (imagen, carrusel, slideshow y variantes animadas).

#### 3.12.3 Catálogo dinámico (Dynamic Product Ads)

Endpoint `/api/feed/products.xml` genera feed de todos los vehículos. Meta y Google lo importan diariamente. Cada vehículo nuevo aparece como anuncio de retargeting sin intervención manual. El visitante ve exactamente el vehículo que miró, no un anuncio genérico.

#### 3.12.4 Modelo operativo: always-on + pulsos

| Modo | Qué es | Cuándo | Presupuesto |
| --- | --- | --- | --- |
| **Always-on** | Presupuesto mínimo constante | Siempre (tras activación) | Base orientativo de €6/día (€3 Meta + €3 Google), ajustable según tamaño de audiencia y rendimiento |
| **Pulso** | Incremento temporal ×2-×3 | Activadores específicos (ver abajo) | €12–18/día durante 2–4 semanas |

**Activadores de pulso:**
- Entrada de lote relevante de stock (ej. dealer nuevo con 20+ vehículos)
- Campañas de captación que eleven tráfico a fichas
- Newsletter o acción comercial dirigida
- Ferias o eventos sectoriales (SMOPYC, SIL, FIAA)
- Meses estacionalmente fuertes del sector (sept-oct, ene-feb)

Como punto de partida, se recomienda mantener un always-on continuo y añadir 3–4 pulsos al año de 2 semanas cada uno. Coste anual estimado: ~€2.500–3.000.

#### 3.12.5 Plataformas y prioridad

| Plataforma | Dónde aparece el anuncio | €/día | Activación |
| --- | --- | --- | --- |
| Meta | Instagram, Facebook, Messenger | €3 | Cuando ≥30 visitas/semana a fichas |
| Google | Webs de Display, YouTube, Gmail, Discover | €3 | Cuando ≥30 visitas/semana a fichas |
| LinkedIn | Feed (fleet managers, directores) | €10 | Fase posterior; reservado para campañas ABM orientadas a perfiles directivos, no retargeting general de inventario |

> **Condición de activación:** No activar retargeting hasta que exista un flujo mínimo de **30–50 visitas semanales a fichas de vehículos** con eventos bien medidos (vista de ficha, clic a WhatsApp, contacto). Sin volumen, el gasto no genera retorno. Verificar vía GA4 antes de activar.

#### 3.12.6 Audiencia y segmentación

Una sola audiencia: **visitantes que vieron ficha de vehículo en los últimos 30 días**. Con volúmenes de 30–100 visitas/día, segmentar en múltiples audiencias por intención deja cada una demasiado pequeña para que los algoritmos optimicen. La personalización principal la aporta el catálogo dinámico: cada visitante ve el vehículo exacto que miró, sin necesidad de segmentación manual fina. Esta se reserva para fases de mayor volumen (>500 visitas/día a fichas).

#### 3.12.7 Exclusiones (ahorro real)

| Excluir | Por qué | Cómo |
| --- | --- | --- |
| Leads confirmados | Ya están en el funnel — retargetear es gastar doble | Evento `form_submitted` / lead confirmado → excluir automáticamente |
| Clics a WhatsApp/teléfono | Probablemente ya contactaron, pero no siempre | Evaluar según tasa de contacto real observada; excluir solo si >70% de clics resultan en contacto efectivo |
| Vehículos vendidos | Anunciar un vehículo ya vendido frustra al usuario | Feed `/api/feed/products.xml` se actualiza diariamente — la plataforma retira automáticamente |
| Rebote rápido (<10s) | No tuvo interés real — clic accidental o bot | Configurar en GTM: solo disparar pixel si tiempo en ficha >10 segundos |
| Dealers propios | El anunciante no debe ver sus propios vehículos como retargeting | Excluir por email de sesión (si logueado) |

#### 3.12.8 Frequency cap

Máximo **7–10 impresiones por usuario por semana**. Con €6/día el riesgo de saturación es bajo, pero el cap evita que un visitante vea el mismo vehículo 30 veces y asocie la marca con spam. Configurar en Meta Ads Manager y Google Ads.

#### 3.12.9 GDPR

Banner de cookies con toggle separado para "marketing". Pixels solo se activan si el usuario acepta cookies de marketing. Sin consentimiento, sin tracking. Implementar vía `useConsent()` existente.

#### 3.12.10 KPIs de control

Tamaño de audiencia retargetable, frecuencia media, CTR, visitas de retorno a ficha, leads asistidos y coste por lead recuperado.

### 3.13 Alianzas offline con coste cero

| Aliado                          | Qué ve/sabe                            | Propuesta                                               | Impacto                |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------- | ---------------------- |
| Gestorías de transferencias     | Todas las compraventas de la zona      | "Recomienda Tracciona, €50 por venta cerrada"           | Alto (flujo constante) |
| Talleres de camiones/maquinaria | Quién va a vender su vehículo          | Tarjetas en recepción                                   | Medio                  |
| Corredores de seguros de flotas | 50-200 empresas de transporte cada uno | "Si tu cliente vende, recomiéndanos"                    | Alto (multiplicador)   |
| ITV de vehículos pesados        | Todo vehículo industrial pasa por ahí  | Flyers: "¿No pasa ITV? Véndelo gratis en tracciona.com" | Medio                  |

### 3.14 Branding físico pasivo

_(Ampliado 10-mar-2026)_

Todo el branding físico lleva QR con ref code de canal `QR` (§3.9.6) para medir qué soporte genera más tráfico.

#### 3.14.1 Vinilos en vehículos propios (~€150-300/unidad)

Lateral: "¿Vendes tu camión? tracciona.com — Publica gratis" + QR grande. Trasero: logo + WhatsApp. Miles de impresiones diarias en autopistas y polígonos industriales.

| Vehículo | Coste | Impacto |
|---|---|---|
| Góndola IberHaul | ~€300 | Alto — viaja por toda España, público 100% target |
| Otros camiones Tank Ibérica | ~€150-250/ud | Medio-alto — circulan por zonas industriales |
| Furgonetas de servicio | ~€100-150/ud | Medio — visibilidad local/regional |

Priorizar la góndola primero. Añadir más vinilos según presupuesto y flota disponible. Cada vinilo es inversión única que dura años.

#### 3.14.2 QR en vehículos de la campa (~€20-30)

Carteles plastificados con QR en el parabrisas de cada vehículo en la campa de Onzonilla. El QR enlaza a la ficha de ESE vehículo en Tracciona. Visitantes que vienen a ver vehículos físicamente escanean y entran a la web. Coste: impresión y plastificación del lote.

#### 3.14.3 Tarjetas de visita (~€30-50 por 500 uds)

Tarjeta con QR + "Publica gratis en tracciona.com" + número WhatsApp + logo. Para:
- Dejar a dealers en visitas comerciales
- Entregar en ferias del sector
- Dejar en gestorías y talleres aliados (§3.13)
- Llevar siempre encima para networking

#### 3.14.4 Flyers / panfletos (~€50-80 por 500 uds)

A4 o A5 con propuesta de valor, 2-3 vehículos destacados, QR y WhatsApp. Para distribuir en:
- ITV de vehículos pesados (§3.13): "¿No pasa ITV? Véndelo gratis en tracciona.com"
- Talleres de camiones/maquinaria: dejar en zona de recepción/espera
- Gestorías de transferencias: junto al mostrador
- Campas ajenas y parkings de vehículos industriales
- Áreas de servicio en autopistas (zona camiones)

#### 3.14.5 Banners / carteles (~€50-150/unidad)

Carteles grandes para zonas de paso de público target:
- Campa propia de Onzonilla (visible desde la carretera)
- Campas de dealers aliados (si lo permiten)
- Parkings de polígonos industriales
- Áreas de descanso de camiones

Coste variable según tamaño y material (lona, PVC, forex). Lo más económico: lona impresa con ojales (~€50 por 1×2m).

#### 3.14.6 Google Business Profile (€0, 10 min)

"Tracciona — Marketplace de Vehículo Industrial" en Google Maps con dirección de la campa. Fotos de vehículos. Categoría: "Concesionario de vehículos comerciales". Aparece en búsquedas locales.

#### 3.14.7 Ferias como visitante

_(Añadido 10-mar-2026)_

Ir como visitante, no como expositor. Objetivo: networking con dealers, repartir tarjetas, conocer el mercado. Coste = entrada + viaje.

| Feria | Dónde | Frecuencia | Entrada | Relevancia |
|---|---|---|---|---|
| **SMOPYC** (Salón Int. Maquinaria Obra Pública) | Zaragoza | Bienal (próxima: 15-18 abril 2026) | ~€15-30 | Muy alta — Pabellón 1 = vehículo industrial. 964 expositores de 34 países |
| **SIL** (Salón Int. Logística) | Barcelona | Anual (junio) | ~€20-30 | Alta — Logística y transporte |
| **FIAA** (Feria Int. Autobús y Autocar) | Madrid (IFEMA) | Bienal | ~€15-25 | Media — Más autobuses/autocares, pero hay vehículo industrial |
| **Logistics & Automation** | Madrid | Anual (noviembre) | ~€20 | Media — Logística y automatización |

**Prioridad:** SMOPYC (abril 2026) es la cita más importante. Ir con tarjetas de visita y flyers, recorrer Pabellón 1, hablar con dealers, dejar material. Coste total: entrada + viaje + material impreso.

#### 3.14.8 Eventos sectoriales

Jornadas y eventos de asociaciones del sector. Coste bajo o gratuito. Objetivo: networking directo con fleet managers, transportistas y dealers.

| Evento | Organiza | Coste | Público |
|---|---|---|---|
| Jornadas ASTIC | Asociación de Transporte Internacional | €0-50 | Transportistas internacionales |
| Jornadas CETM | Confederación Española de Transporte de Mercancías | €0-100 | Empresas de flota, directores de transporte |
| Jornadas ANMOPYC | Asociación Nacional de Maquinaria de Obra Pública | €0-50 | Dealers y fabricantes de maquinaria |
| Meetups logísticos locales | Varios | €0 | Networking informal del sector |

#### 3.14.9 Presencia en medios sectoriales (€0)

No pagar anuncios en revistas (€300-2.000/inserción). En su lugar, tres tácticas gratuitas:

**1. Aparecer como fuente de datos** — Ofrecer datos de mercado de Tracciona a las revistas para sus artículos. "Según datos de Tracciona, las cisternas alimentarias se venden un 25% más rápido con ITV al día." Publicidad gratuita a cambio de contenido relevante.

**2. Notas de prensa** — "Nace Tracciona, el primer marketplace especializado en vehículo industrial en España." Las revistas digitales publican notas de prensa gratis si son relevantes para su audiencia.

**3. Artículos invitados** — Algunas publicaciones aceptan colaboraciones de expertos del sector a coste cero. Posiciona a Tracciona como referente.

**Revistas target — Transporte:**

| Revista | Tipo | Público | Web |
|---|---|---|---|
| **Transporte 3** | Mensual impresa + digital, 12.000 ejemplares, 39 años | Transporte de mercancías | transporte3.com |
| **Transporte Profesional** | Impresa + digital (revista del CETM) | Transporte y logística | transporteprofesional.es |
| **Autónomos ¡En Ruta!** | Impresa + digital | Transportistas autónomos | autonomosenruta.com |
| **Ruta del Transporte** | Digital | Transporte por carretera | rutadeltransporte.com |
| **Camión Actualidad** | Digital | Camiones y furgonetas | camionactualidad.es |

**Revistas target — Maquinaria y obra pública:**

| Revista | Tipo | Público | Web |
|---|---|---|---|
| **OP Machinery** | Mensual impresa + digital | Maquinaria obra pública, construcción, minería | opmachinery.com |
| **Noticias Maquinaria** | Digital | Maquinaria agrícola, construcción, elevación, alquiler | noticiasmaquinaria.com |
| **Interempresas Obras Públicas** | Digital (portal grande) | Construcción e infraestructura | interempresas.net/ObrasPublicas |

#### 3.14.10 Resumen de costes branding físico

| Soporte | Coste unitario | Unidades iniciales | Total estimado |
|---|---|---|---|
| Vinilo góndola | ~€300 | 1 | €300 |
| Vinilos adicionales | ~€150-250 | Según flota | Variable |
| QR campa | ~€20-30 | 1 lote | €25 |
| Tarjetas de visita | ~€30-50 | 500 uds | €40 |
| Flyers | ~€50-80 | 500 uds | €65 |
| Banners | ~€50-150 | 1-2 | €100-300 |
| Ferias (entrada + viaje) | ~€50-150/feria | 1-2/año | €100-300 |
| Eventos sectoriales | ~€0-100/evento | 2-4/año | €0-200 |
| Medios sectoriales | €0 | — | €0 |
| Google Business Profile | €0 | 1 | €0 |
| **Total mínimo inicial** | | | **~€630-1.230** |

### 3.15 Plan de ejecución por fases

_(Reorganizado 10-mar-2026 en 4 bloques secuenciales por retorno esperado)_

La secuencia separa claramente fundación, tracción y amplificación. No mezclar construcción de motor con expansión de canales demasiado pronto.

```
BLOQUE 1 — Fundamentos comerciales (semanas 1-4, ~€70)
├─ Subir inventario Tank Ibérica como seed (20-30 fichas)
├─ Lista de 50-100 dealers objetivo
├─ Outreach diario (10-15 emails personalizados)
├─ Onboarding manual concierge (ver SLAs §3.2.1)
├─ Reporting sencillo a dealers activados
├─ Google Business Profile
├─ Milanuncios gratis (anuncios como embudo hacia Tracciona)
├─ QR en vehículos de la campa (€20)
└─ Objetivo: 15 dealers activos, 100+ fichas

BLOQUE 2 — Fundamentos de demanda (semanas 3-6, ~€180/mes)
├─ Verificar Google Search Console (BLOQUEANTE)
├─ Instalar GTM + GA4 + Microsoft Clarity
├─ Fichas y categorías indexables (SEO técnico)
├─ 1 canal externo principal (Milanuncios con ref codes §3.9.6)
├─ Tracking WhatsApp / click / contacto
├─ Vinilo en góndola IberHaul (€300, una vez)
├─ Activar retargeting Meta+Google (€6/día) — solo si §3.12.4 se cumple
├─ WhatsApp Channel + primer mensaje
└─ Objetivo: trazabilidad perfecta de leads

BLOQUE 3 — Aceleración (meses 2-3, escalar lo que funcione)
├─ 2º canal externo (Facebook Marketplace + grupos)
├─ Auto-publicación en redes (webhook → 4 plataformas, setup 3-4h)
├─ 2-4 piezas de contenido de alta intención (guías pricing/inspección)
├─ Feed de catálogo dinámico para retargeting
├─ Pinterest auto-pin (setup 3h, automático después)
├─ Primer vídeo YouTube en la campa
├─ Primeras landing pages programáticas (solo si ≥100 fichas, §3.10.1)
├─ Contactar 2-3 empresas de renting/leasing
└─ Objetivo: multiplicar visibilidad con canales automáticos

BLOQUE 4 — Expansión (mes 3+, solo tras validar tracción)
├─ Newsletter semanal "El Industrial"
├─ Herramienta de valoración pública
├─ Informe de mercado trimestral (lead magnet)
├─ Calculadoras públicas
├─ Gestorías + talleres + corredores de seguros
├─ Telegram grupo sectorial
├─ Rutina editorial completa (2 artículos/semana)
├─ Google Ads (campañas 0+1, solo si >100 vehículos publicados, §3.5)
└─ Medir, descartar lo que no funcione, doblar lo que sí
```

**Coste total primer mes: ~€200.** €180 retargeting (condicional, ver §3.12.4) + €20 QR. Todo lo demás es tiempo del fundador.

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

### 3.17 KPIs de liquidez del marketplace

_(Añadido 10-mar-2026)_

Los KPIs de canales de marketing (CTR, CPC, ROAS) son secundarios frente a los KPIs de liquidez del marketplace. Reducir el cuadro de mando semanal a 7 métricas core + 2 ratios.

#### 7 métricas semanales

| # | Métrica | Qué mide |
|---|---|---|
| 1 | Dealers contactados | Esfuerzo de captación |
| 2 | Dealers activados (con inventario) | Conversión del outreach |
| 3 | Fichas publicadas | Volumen de oferta |
| 4 | Fichas con al menos 1 visita | Visibilidad real del inventario |
| 5 | Leads generados | Demanda activa |
| 6 | % de dealers con al menos 1 lead | Distribución de la demanda (¿concentrada o repartida?) |
| 7 | Tiempo medio alta dealer → primera publicación | Eficiencia del onboarding |

#### 2 ratios críticos

| Ratio | Fórmula | Qué revela |
|---|---|---|
| **Lead por 10 fichas** | leads / (fichas / 10) | Liquidez: ¿el inventario genera interés? Si <1 → problema de demanda o calidad |
| **Dealer activo a 30 días** | dealers con ≥1 ficha a los 30 días / dealers activados | Retención: ¿los dealers se quedan o abandonan tras probar? |

#### Diagnóstico por ratio

Estos ratios permiten identificar dónde está el problema real:

- **Lead/10 fichas bajo + fichas con visitas alto** → Las fichas se ven pero no generan contacto. Problema de precio, calidad de fotos o confianza.
- **Lead/10 fichas bajo + fichas con visitas bajo** → Las fichas no se ven. Problema de SEO, distribución o volumen de tráfico.
- **Dealer activo a 30d bajo** → Los dealers prueban y se van. Problema de valor percibido, soporte o falta de leads.
- **Dealer activo a 30d alto + leads bajo** → Los dealers se quedan pero no reciben demanda. Problema de tráfico, no de producto.

### 3.18 Stack de herramientas de marketing

_(Añadido 10-mar-2026)_

Inventario completo de herramientas disponibles, organizadas por función. Prioridad: aprovechar todo lo gratuito. Las versiones de pago se activan solo cuando se cumplan condiciones de gating.

#### 3.18.1 Analítica y medición (todas €0)

| Herramienta | Función | Cuándo activar | Notas |
|---|---|---|---|
| **Google Analytics 4 (GA4)** | Tráfico, eventos, conversiones, audiencias | Día 1, vía GTM | Reemplaza Universal Analytics. Gratuito sin límite |
| **Google Search Console (GSC)** | Indexación, queries, impresiones, errores, posiciones | Día 1 — **BLOQUEANTE** para toda la estrategia SEO | Requiere verificación por fundadores |
| **Microsoft Clarity** | Heatmaps, grabaciones de sesión, rage clicks, scroll depth | Día 1 | Script ligero (~17KB), no afecta rendimiento. Complementa GA4 con datos visuales |
| **Google Looker Studio** | Dashboards visuales conectando GSC + GA4 + otras fuentes | Cuando haya datos (mes 2-3) | Gratuito. Ideal para reportes semanales y deck de inversores |
| **Hotjar (free)** | Heatmaps + grabaciones (35 sesiones/día) | Opcional | Solapa con Clarity. Usar solo si Clarity no cubre algún caso específico |
| **Matomo** | Analítica web completa, alternativa open source a GA4 | Disponible como reserva | GPL, self-hosted. Requiere servidor propio. Útil si se quisiera independencia total de Google o cumplimiento GDPR estricto sin transferencia de datos a terceros |
| **Plausible** | Analítica ligera y privacy-first | Disponible como reserva | AGPL, self-hosted gratis. Más simple que GA4/Matomo — sin cookies, sin banner de consentimiento necesario. Ideal si se busca analítica mínima sin complejidad |
| **Umami** | Analítica simple y privada, self-hosted | Disponible como reserva | MIT, self-hosted. Similar a Plausible en filosofía. Dashboard limpio, métricas esenciales. Muy ligero |

#### 3.18.2 SEO y keyword research

| Herramienta | Función | Coste | Cuándo | Notas |
|---|---|---|---|---|
| **Google Keyword Planner** | Volúmenes de búsqueda por keyword, ideas de keywords | €0 (con cuenta Google Ads, sin gastar) | Bloque 2 | Datos de primera mano de Google. Suficiente para research básico |
| **Ubersuggest (free)** | Ideas de keywords + dificultad + backlinks básicos | €0 (3 búsquedas/día) | Bajo demanda | Complementa Keyword Planner con datos de dificultad |
| **Ahrefs Webmaster Tools** | Auditoría técnica SEO + backlinks de tu propio sitio | €0 (verificando sitio) | Bloque 2 | Solo para tu sitio, no competidores. Buena auditoría técnica gratuita |
| **SEMrush (free)** | Keyword research + datos de competidores | €0 (10 búsquedas/día, resultados limitados) | Bajo demanda | Resultados recortados (3 por consulta), pero útil para consultas puntuales |
| **AnswerThePublic (free)** | Preguntas que la gente hace en Google sobre un tema | €0 (3 búsquedas/día) | Para generar ideas de artículos editoriales | Útil para contenido de inteligencia de mercado (§3.4.1) |
| **Google Trends** | Estacionalidad y tendencias de búsqueda por keyword/zona | €0 | Desde Bloque 1 | Validar estacionalidad del sector (cuándo buscan cisternas, cuándo hay valles) |
| **Screaming Frog (free)** | Crawler SEO: errores 404, títulos duplicados, metas vacías, imágenes sin alt, redirects, thin content | €0 (hasta 500 URLs) | Bloque 2-3 | Suficiente para Año 1. Versión paid (€230/año) solo si sitio supera 500 URLs |
| **Serpbear** | Tracking de posiciones en Google para tus keywords | €0 (open source, MIT, self-hosted) | Cuando haya keywords objetivo definidos | Alternativa gratuita a Ahrefs/SEMrush para rank tracking. Se ejecuta en Docker |
| **SEOPanel** | Suite SEO básica: keywords, backlinks, rank tracker, auditoría | €0 (open source, GPL, self-hosted) | Disponible como alternativa | Suite todo-en-uno open source. Menos potente que Ahrefs/SEMrush pero cubre lo básico sin coste. Requiere servidor LAMP |

**Herramientas de pago condicionales (no activar sin cumplir gating):**

| Herramienta | Coste | Condición de activación |
|---|---|---|
| **Screaming Frog paid** | £199/año (~€230) | Sitio supera 500 URLs indexables |
| **Ahrefs Lite** | $99/mes (~€1.090/año) | Merece la pena pagar cuando: (1) SEO genera >30% del tráfico total, (2) se necesita análisis de backlinks de competidores (qué sitios enlazan a Mascus/Autoline y no a nosotros), (3) se quiere auditar link building o detectar backlinks tóxicos, (4) keyword research avanzado con datos de dificultad y volumen más precisos que Ubersuggest/Keyword Planner, (5) content gap analysis (qué keywords posicionan competidores y nosotros no). Mientras Ahrefs Webmaster Tools (free) + Serpbear + Ubersuggest cubran las necesidades, no activar. Probablemente Año 2-3 |

> **Nota:** Ahrefs Lite O SEMrush Pro, nunca las dos. Solapan en un 80%. Si se llega al punto de necesitar una herramienta paid, elegir una.

#### 3.18.3 Rendimiento y auditoría técnica (todas €0)

| Herramienta | Función | Cuándo | Notas |
|---|---|---|---|
| **Google PageSpeed Insights** | Rendimiento web, Core Web Vitals | Bajo demanda | No requiere setup. Usar antes de cada release importante |
| **Google Lighthouse** | Auditoría rendimiento + accesibilidad + SEO + best practices | Bajo demanda | Integrado en Chrome DevTools. Puntuación 0-100 por categoría |
| **Schema Markup Validator** | Validar structured data (Product, Article, FAQ, etc.) | Tras cambios en schema | Ya tenemos Schema.org implementados (§3.4). Validar periódicamente |
| **Rich Results Test** | Previsualizar cómo aparecen las páginas en Google con rich snippets | Tras cambios en schema | Confirma que Google interpreta correctamente los structured data |
| **TinyPNG** | Compresión de imágenes para web | Bajo demanda | 500 imágenes/mes gratis. Útil para editorial e informes |

#### 3.18.4 Distribución y contenido visual

| Herramienta | Función | Coste | Cuándo | Notas |
|---|---|---|---|---|
| **Canva (free)** | Diseño gráfico: banners, infografías, creatividades social | €0 | Cuando se produzca contenido visual (informes, newsletter, social) | Tier gratuito cubre lo esencial. No pagamos Pro |
| **Buffer (free)** | Programar publicaciones en 3 canales, 10 posts/canal | €0 | Solo si auto-publicación por webhook no cubre algún caso | Probablemente innecesario — la auto-publicación (§3.11.7) cubre más. No pagamos Pro |
| **Google Merchant Center** | Feed de productos gratuito para Shopping orgánico | €0 | Bloque 3 (requiere feed XML, §3.5 Campaña 5) | Listados orgánicos gratuitos en Google Shopping desde día 1 |

#### 3.18.5 Solapamientos y decisiones

Algunas herramientas cubren funciones similares. Todas las alternativas están disponibles como reserva — activar solo si la herramienta principal falla o no cubre un caso concreto.

| Función | Herramienta principal | Alternativas disponibles (todas €0) | Decisión |
|---|---|---|---|
| Analítica web | **GA4** | Matomo (GPL), Plausible (AGPL), Umami (MIT) — todas self-hosted | GA4 como principal (ya integrado vía GTM, sin hosting). Matomo/Plausible/Umami disponibles como reserva si se necesita independencia de Google o GDPR sin transferencia a terceros |
| Heatmaps/grabaciones | **Microsoft Clarity** | Hotjar free (35 sesiones/día) | Clarity como principal (ilimitado). Hotjar disponible como complemento |
| Rank tracking | **Serpbear** (MIT, self-hosted) | SEOPanel (GPL, self-hosted) | Serpbear para tracking de posiciones. SEOPanel como suite más amplia si se necesita todo-en-uno |
| Keyword research | **Google Keyword Planner + Ubersuggest free** | Ahrefs Webmaster Tools (free), SEMrush free (10/día), AnswerThePublic free (3/día), SEOPanel | Stack gratuito cubre ~80% de necesidades. Ahrefs Lite paid solo si se cumple gating §3.18.2 |
| Crawler SEO | **Screaming Frog free** (hasta 500 URLs) | SEOPanel (auditoría básica) | Screaming Frog free suficiente para Año 1. Paid (€230/año) solo si >500 URLs |
| Suite SEO todo-en-uno | **Stack modular** (GSC + Keyword Planner + Screaming Frog + Serpbear) | SEOPanel (GPL, self-hosted) | Stack modular más potente. SEOPanel disponible como alternativa todo-en-uno más simple |
| Publicación social | **Auto-publicación por webhook** (§3.11.7) | Buffer free (3 canales, 10 posts/canal) | Webhook cubre publicación automática. Buffer solo para posts manuales/editoriales |
| Diseño gráfico | **Canva free** | Figma (free tier), GIMP (open source) | Canva free por su simplicidad para no-diseñadores |

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
