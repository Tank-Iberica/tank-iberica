### R.5 Seguro de responsabilidad civil profesional

**Recomendado pero no obligatorio.** Una póliza de RC profesional para actividades de intermediación digital cuesta 300-600€/año y cubre demandas por errores u omisiones en la plataforma. Evaluarlo cuando haya facturación recurrente (mes 6-12).

---

## ANEXO S: MONETIZACIÓN DE DATOS

### S.1 El activo: base de datos de precios de mercado

Cada día que Tracciona opera acumula datos que no existen en ningún otro sitio:

- Precios de publicación de cada vehículo (y evolución si bajan precio)
- Precios de venta (cuando el dealer marca como vendido y reporta precio)
- Tiempo medio de venta por tipo de vehículo, zona y rango de precio
- Volumen de demanda por categoría y subcategoría (búsquedas, alertas, leads)
- Evolución de stock disponible por zona geográfica

Combinado con scraping de competidores (Mascus, Europa-Camiones, Milanuncios — Anexo I.2), se genera la primera base de datos de referencia de precios de vehículos industriales del mercado ibérico. **No existe equivalente. Es el Idealista del transporte.**

### S.2 Productos de datos

| Producto                             | Cliente                                   | Precio                         | Frecuencia   | Dato clave                                                                         |
| ------------------------------------ | ----------------------------------------- | ------------------------------ | ------------ | ---------------------------------------------------------------------------------- |
| **Informe de valoración individual** | Dealer, particular, financiera            | 50-100€                        | Por consulta | "Tu cisterna Indox 2019 25.000L vale entre 32.000-38.000€ según mercado actual"    |
| **Informe sectorial trimestral**     | Financieras, aseguradoras, fabricantes    | 500-1.000€/trimestre           | Suscripción  | Evolución de precios por categoría, volumen, tiempo de venta, zonas calientes      |
| **API de valoración**                | Integradores, plataformas de financiación | 1-5€/consulta (volumen)        | Por uso      | Endpoint que devuelve valoración estimada dado marca/modelo/año/km                 |
| **Dataset anualizado**               | Consultoras, investigadores, fabricantes  | 2.000-5.000€                   | Anual        | CSV/API con todos los datos anonimizados del año                                   |
| **Alertas de mercado**               | Dealers Premium, fondos de inversión      | Incluido en Premium o 100€/mes | Continuo     | "Los precios de cisternas alimentarias han subido un 12% en 3 meses en zona norte" |

### S.3 Marco legal de la venta de datos

**Lo que SÍ puedes vender (datos anonimizados y agregados):**

- Precios medios por categoría/zona/periodo — NO son datos personales
- Volúmenes de oferta/demanda — NO son datos personales
- Tiempos de venta — NO son datos personales
- Tendencias de mercado — NO son datos personales

**Lo que NO puedes vender:**

- Datos identificables de usuarios (nombre, email, teléfono de dealers/compradores)
- Historial de transacciones vinculado a personas identificables
- Datos de navegación individual

**Requisitos RGPD para la venta de datos:**

1. **Anonimización real:** Los datos vendidos no deben permitir re-identificar a ninguna persona. Esto implica: eliminar IDs de usuario, eliminar nombres, agregar datos en grupos de mínimo 5-10 (nunca vender un dato que corresponda a un solo dealer), redondear precios para evitar identificación por unicidad.

2. **Base legal:** Interés legítimo (art. 6.1.f RGPD) para datos anonimizados. Para datos agregados no personales, el RGPD no aplica directamente.

3. **Política de privacidad:** Incluir en la política que "Tracciona puede utilizar datos anonimizados y agregados del marketplace para generar informes de mercado y análisis sectoriales que pueden ser comercializados a terceros. Estos datos nunca permiten identificar a usuarios individuales."

4. **Consentimiento:** NO necesitas consentimiento adicional para vender datos anonimizados. Sí necesitas informar de que lo haces (transparencia).

### S.4 Implementación técnica

```sql
-- Vista materializada para datos de mercado (se actualiza diariamente)
CREATE MATERIALIZED VIEW market_data AS
SELECT
  vertical,
  category,
  subcategory,
  brand,
  location_province,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS listings,
  AVG(price_cents) / 100.0 AS avg_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_cents) / 100.0 AS median_price,
  MIN(price_cents) / 100.0 AS min_price,
  MAX(price_cents) / 100.0 AS max_price,
  AVG(EXTRACT(EPOCH FROM (sold_at - created_at)) / 86400) AS avg_days_to_sell,
  COUNT(*) FILTER (WHERE status = 'sold') AS sold_count
FROM vehicles
WHERE status IN ('published', 'sold', 'expired')
GROUP BY vertical, category, subcategory, brand, location_province, month
HAVING COUNT(*) >= 5; -- Mínimo 5 vehículos para anonimización

-- Endpoint API
-- /api/market-data?category=cisternas&subcategory=alimentarias&province=zaragoza
-- Devuelve JSON con precio medio, mediana, rango, tendencia, volumen
-- Autenticado con API key (para clientes de datos)
```

### S.5 Cuándo activar la venta de datos

**No antes del mes 12.** Razones:

- Necesitas volumen mínimo para que los datos sean estadísticamente significativos
- Con <500 vehículos los datos son demasiado identificables
- Los clientes de datos (financieras, aseguradoras) necesitan ver que tienes cobertura de mercado

**Secuencia:**

```
Mes 1-6:    Acumular datos. No vender nada.
Mes 6-12:   Generar informes internos. Usar los datos para:
            - Sugerir precios a dealers ("Tu cisterna está un 15% por encima del mercado")
            - Alimentar el Km Score y las valoraciones
Mes 12-18:  Primer informe sectorial de prueba. Enviarlo gratis a 2-3 financieras como muestra.
            Si hay interés → empezar a cobrar suscripciones.
Mes 18+:    API de valoración disponible. Dataset anualizado. Suscripciones activas.
```

### S.6 Clientes potenciales de datos en España

| Cliente                                                      | Qué quiere                                                  | Por qué lo necesita                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| **Financieras de leasing** (Santander Leasing, BBVA Leasing) | Valoración actual de vehículos para calcular valor residual | Prestan dinero sobre activos, necesitan saber cuánto valen |
| **Aseguradoras** (Mapfre, Allianz, Zurich)                   | Valor de mercado para pólizas y siniestros                  | Necesitan valorar pérdidas totales y determinar primas     |
| **Fabricantes** (Schmitz, Kögel, Indox, Parcisa)             | Precios del mercado de segunda mano de SUS productos        | Ayuda a calibrar precios de nuevos y planificar producción |
| **Asociaciones del sector** (ASTIC, CETM, Ganvam)            | Informes de mercado para sus asociados                      | Servicio a miembros, lobby, publicaciones sectoriales      |
| **Consultoras** (Deloitte, KPMG, BCG)                        | Datos para proyectos con clientes del sector transporte     | Pagan bien, necesitan datos que no existen                 |
| **Fondos de inversión**                                      | Tendencias de mercado de activos industriales               | Decisiones de inversión en flotas y empresas de transporte |

---
