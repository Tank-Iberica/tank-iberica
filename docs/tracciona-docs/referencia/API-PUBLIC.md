# API Pública — Tracciona

> Documentación de los endpoints públicos disponibles para integraciones externas.
> Versión: 1.0 — Última actualización: 2026-02-26

## Autenticación

### Endpoints públicos (sin autenticación)

Los siguientes endpoints no requieren autenticación y están disponibles para cualquier cliente:

- `GET /api/market/valuation` — Valoración de vehículos
- `GET /api/widget/{dealerId}` — Widget embebible de vehículos
- `POST /api/demo/try-vehicle` — Demo de análisis con IA (rate limited)

### Endpoints con API Key

Los endpoints bajo `/api/v1/` requieren una API key en el header `Authorization: Bearer <API_KEY>`.
Las API keys se obtienen desde el dashboard del dealer o mediante suscripción de datos.

- `GET /api/v1/valuation` — Valoración avanzada (actualmente en estado 503 — requiere ≥500 transacciones)

---

## Endpoints

### GET /api/market/valuation

Devuelve estadísticas de precio agregadas para vehículos similares.

**Parámetros query:**

| Parámetro  | Tipo   | Requerido | Descripción                              |
| ---------- | ------ | --------- | ---------------------------------------- |
| `brand`    | string | Sí        | Marca del vehículo (e.g. "Scania")       |
| `model`    | string | No        | Modelo del vehículo (búsqueda parcial)   |
| `year`     | number | No        | Año de fabricación (busca ±3 años)       |
| `category` | string | No        | Categoría (e.g. "camiones", "remolques") |

**Respuesta (200):**

```json
{
  "brand": "Scania",
  "model": "R450",
  "category": null,
  "year": 2018,
  "sampleSize": 24,
  "priceStats": {
    "avg": 45000,
    "min": 28000,
    "max": 72000,
    "p25": 35000,
    "p75": 55000,
    "median": 44000
  },
  "confidence": "high"
}
```

**Valores de `confidence`:**

- `high`: ≥20 vehículos en la muestra
- `medium`: 8-19 vehículos
- `low`: 3-7 vehículos

Si hay menos de 3 vehículos comparables, `priceStats` será `null`.

**Cache:** `Cache-Control: public, s-maxage=3600, stale-while-revalidate=7200`

---

### GET /api/widget/{dealerId}

Devuelve HTML embebible con los vehículos activos de un dealer. Diseñado para ser usado en un `<iframe>`.

**Parámetros path:**

| Parámetro  | Tipo   | Descripción                       |
| ---------- | ------ | --------------------------------- |
| `dealerId` | string | UUID del dealer o slug del dealer |

**Parámetros query:**

| Parámetro | Tipo   | Default | Descripción                   |
| --------- | ------ | ------- | ----------------------------- |
| `theme`   | string | `light` | Tema visual: `light` o `dark` |
| `layout`  | string | `grid`  | Disposición: `grid` o `list`  |
| `limit`   | number | `6`     | Número de vehículos (máx 12)  |

**Respuesta:** HTML completo con CSS inline y tarjetas de vehículos.

**Ejemplo de uso:**

```html
<iframe
  src="https://tracciona.com/api/widget/DEALER_ID?theme=light&layout=grid&limit=6"
  style="width:100%;min-height:400px;border:none;"
  loading="lazy"
  title="Vehículos"
></iframe>
```

**Cache:** `Cache-Control: public, max-age=3600`

---

### POST /api/demo/try-vehicle

Analiza imágenes de un vehículo industrial con IA y devuelve un preview del listing.
No guarda datos en base de datos. Rate limited a 3 intentos por IP por día.

**Body (JSON):**

```json
{
  "images": [{ "data": "<base64>", "mediaType": "image/jpeg" }],
  "brand": "Scania",
  "model": "R450"
}
```

| Campo    | Tipo                                     | Requerido | Descripción            |
| -------- | ---------------------------------------- | --------- | ---------------------- |
| `images` | Array<{data: string, mediaType: string}> | Sí        | 1-4 imágenes en base64 |
| `brand`  | string                                   | No        | Marca del vehículo     |
| `model`  | string                                   | No        | Modelo del vehículo    |

**Respuesta (200):**

```json
{
  "success": true,
  "preview": {
    "title": "Scania R450 Tractora",
    "description": "...",
    "category": "camiones",
    "subcategory": "tractora",
    "brand": "Scania",
    "model": "R450",
    "year": 2019,
    "estimatedPrice": "35.000€ - 45.000€",
    "highlights": ["Motor en buen estado", "..."],
    "imageCount": 2
  },
  "provider": "anthropic"
}
```

**Rate Limit:** 3 peticiones por IP cada 24 horas. Devuelve 429 si se excede.

---

### GET /api/v1/valuation (Próximamente)

> **Estado:** 503 Service Unavailable — Se activará cuando haya ≥500 transacciones históricas.

Endpoint de valoración avanzada para integraciones de ERPs de dealers.

**Autenticación:** `Authorization: Bearer <API_KEY>`

**Parámetros query:**

| Parámetro     | Tipo   | Requerido | Descripción                   |
| ------------- | ------ | --------- | ----------------------------- |
| `brand`       | string | Sí        | Marca del vehículo            |
| `subcategory` | string | No        | Subcategoría del vehículo     |
| `province`    | string | No        | Provincia (filtro geográfico) |
| `year`        | number | No        | Año (aplica depreciación)     |

**Respuesta futura (200):**

```json
{
  "estimated_price": { "min": 28000, "median": 42000, "max": 65000 },
  "market_trend": "rising",
  "trend_pct": 3.2,
  "avg_days_to_sell": 35,
  "sample_size": 24,
  "confidence": "high",
  "data_date": "2026-02-26"
}
```

**Rate Limit:** Configurable por suscripción (default: 100 peticiones/día).

---

## Códigos de error

| Código | Descripción                                  |
| ------ | -------------------------------------------- |
| 400    | Parámetros inválidos o faltantes             |
| 401    | API key inválida o no proporcionada          |
| 429    | Rate limit excedido                          |
| 503    | Servicio no disponible (datos insuficientes) |

## Rate Limiting

- Endpoints públicos: rate limit por IP (varía por endpoint)
- Endpoints con API key: rate limit por clave (configurable por suscripción)
- Header `Retry-After` incluido en respuestas 429

## Formato de respuesta

Todos los endpoints devuelven JSON (excepto el widget que devuelve HTML).
Las respuestas incluyen headers de cache apropiados para CDN.

## Contacto

Para solicitar acceso a la API o reportar problemas:

- Email: tankiberica@gmail.com
- Web: https://tracciona.com/contacto
