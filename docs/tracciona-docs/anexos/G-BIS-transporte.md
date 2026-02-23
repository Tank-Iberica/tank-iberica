## ANEXO G-BIS: CALCULADORA DE TRANSPORTE (Transporteo SL)

### G-BIS.1 Concepto

Precio cerrado de transporte visible directamente en la ficha del vehículo. El comprador ve la cisterna, ve el precio de transporte a su ubicación, y toma la decisión completa sin llamar a nadie. Ningún competidor tiene esto.

### G-BIS.2 Tarifas planas por zona

| Zona          | Descripción                                                                           | Precio             |
| ------------- | ------------------------------------------------------------------------------------- | ------------------ |
| Local         | Misma provincia                                                                       | 250-350€           |
| Zona 1        | Península Norte (Galicia, Asturias, Cantabria, País Vasco, Navarra, Aragón, Cataluña) | 500€               |
| Zona 2        | Península Centro (Madrid, Castilla y León, Castilla-La Mancha, Extremadura, La Rioja) | 600€               |
| Zona 3        | Península Sur (Andalucía, Murcia, Comunidad Valenciana)                               | 700€               |
| Portugal      | Todo Portugal                                                                         | 900€               |
| Francia Sur   | Hasta Toulouse/Montpellier                                                            | 1.200€             |
| Personalizado | Distancias largas, cargas especiales                                                  | Presupuesto manual |

Las zonas se calculan desde la ubicación del vehículo (ya está en el anuncio) hasta el CP del comprador (detectado por `useUserLocation` o introducido manualmente).

### G-BIS.3 Implementación técnica

**Migración SQL:**

```sql
CREATE TABLE transport_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  zone_name VARCHAR NOT NULL,
  zone_slug VARCHAR NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  -- Definición geográfica: lista de provincias/regiones incluidas
  regions TEXT[] NOT NULL, -- ['galicia', 'asturias', 'cantabria', 'pais_vasco', ...]
  sort_order INT DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, zone_slug)
);

-- Seed zonas de Tracciona
INSERT INTO transport_zones (vertical, zone_slug, zone_name, price_cents, regions) VALUES
  ('tracciona', 'local', 'Local', 30000, '{}'), -- Se calcula por proximidad
  ('tracciona', 'zona-1', 'Península Norte', 50000, '{"galicia","asturias","cantabria","pais_vasco","navarra","aragon","cataluña"}'),
  ('tracciona', 'zona-2', 'Península Centro', 60000, '{"madrid","castilla_leon","castilla_la_mancha","extremadura","la_rioja"}'),
  ('tracciona', 'zona-3', 'Península Sur', 70000, '{"andalucia","murcia","comunidad_valenciana"}'),
  ('tracciona', 'portugal', 'Portugal', 90000, '{"portugal"}'),
  ('tracciona', 'francia-sur', 'Francia Sur', 120000, '{"francia_sur"}');
```

**Componente en ficha de vehículo:**

```typescript
// /app/components/vehicle/TransportCalculator.vue
//
// 1. Obtener ubicación del vehículo (ya está en vehicle.location)
// 2. Obtener ubicación del comprador:
//    a) Automática desde useUserLocation() si tiene geolocalización
//    b) Manual: campo "Introduce tu código postal"
// 3. Determinar zona de destino según región del CP
// 4. Mostrar precio cerrado:
//
//    ┌──────────────────────────────────────────┐
//    │ 🚛 Transporte puerta a puerta            │
//    │                                          │
//    │ Desde: Zaragoza (ubicación del vehículo) │
//    │ Hasta: [Tu código postal: 28001]         │
//    │                                          │
//    │ Precio: 600€ (Zona Centro)               │
//    │ Incluye: seguro + carga/descarga         │
//    │                                          │
//    │ [Solicitar transporte]                   │
//    └──────────────────────────────────────────┘
//
// El botón "Solicitar transporte" crea una entrada en tabla transport_requests
// y notifica al admin/chófer.
```

### G-BIS.4 Escalabilidad

- Góndola propia: 3-4 transportes/mes
- Cuando la demanda supere capacidad → subcontratar manteniendo margen (cobrar 1.200€, pagar 900€ al subcontratado = 300€ margen sin mover tu camión)
- Clientes externos: Transporteo SL puede servir transportes fuera de la plataforma

---
