## ANEXO F: SISTEMA DE PUBLICIDAD DIRECTA

### F.1 Concepto

Publicidad propia, sin AdSense. Anunciantes B2B locales del sector que pagan por aparecer ante usuarios segmentados por zona geográfica y categoría de producto.

### F.2 Espacios publicitarios

| Posición                         | Formato                                               | Precio orientativo     | Segmentación     |
| -------------------------------- | ----------------------------------------------------- | ---------------------- | ---------------- |
| Ficha de vehículo (bajo specs)   | Módulo "Servicios para este vehículo" 2-3 anunciantes | PREMIUM — 200-400€/mes | Zona + categoría |
| Catálogo (cada 8-10 resultados)  | Tarjeta con badge "Patrocinado"                       | 100-200€/mes           | Categoría        |
| Sidebar landing pages            | Banner lateral (desktop) / intercalado (móvil)        | 100-150€/mes           | Categoría        |
| Arriba de resultados de búsqueda | 1 anunciante destacado                                | PREMIUM — 300-500€/mes | Categoría        |
| Footer informativo               | Logo pequeño "Partners recomendados"                  | 50-80€/mes             | Nacional         |
| Email de alertas                 | Bloque al final del email                             | 50-100€/mes            | Zona + categoría |
| PDF generado del vehículo        | Logo + datos anunciante                               | 50-100€/mes por zona   | Zona             |

**Dónde NO poner publicidad:** Proceso de registro/login, formulario de publicación, encima del botón de contacto, pop-ups, y nunca más de 2 anuncios visibles simultáneamente.

### F.3 Implementación técnica

**Migración SQL:**

```sql
-- Tabla de anuncios
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  advertiser_name TEXT NOT NULL,
  advertiser_contact TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  -- Segmentación
  regions TEXT[] DEFAULT '{}', -- ['aragon', 'cataluña'] o vacío = nacional
  category_slugs TEXT[] DEFAULT '{}', -- ['cisternas', 'semirremolques'] o vacío = todas
  positions TEXT[] NOT NULL, -- ['vehicle_detail', 'catalog_inline', 'sidebar', 'footer', 'email', 'pdf']
  -- Contrato
  price_monthly_cents INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'active', -- 'active', 'paused', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de eventos (impresiones y clics)
CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id),
  event_type VARCHAR NOT NULL, -- 'impression', 'click'
  user_region VARCHAR,
  page_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ad_events_ad ON ad_events(ad_id, event_type);
CREATE INDEX idx_ad_events_date ON ad_events(created_at);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- Lectura pública de ads activos
CREATE POLICY "ads_public_read" ON ads FOR SELECT USING (status = 'active');
-- Admin gestiona todo
CREATE POLICY "ads_admin_all" ON ads FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
-- Inserción pública de eventos (anónimo puede registrar impresión/clic)
CREATE POLICY "ad_events_insert" ON ad_events FOR INSERT WITH CHECK (true);
-- Solo admin lee eventos
CREATE POLICY "ad_events_admin_read" ON ad_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
```

**Componente Vue:**

```typescript
// /app/components/AdSlot.vue
// Props: position ('vehicle_detail' | 'catalog_inline' | 'sidebar' | etc.)
//        category (slug de la categoría actual)
//        maxAds (número máximo de anuncios a mostrar, default 2)
//
// Lógica:
// 1. Obtener región del usuario de useUserLocation()
// 2. Query ads WHERE status='active' AND position includes props.position
//    AND (regions is empty OR regions contains user_region)
//    AND (category_slugs is empty OR category_slugs contains props.category)
// 3. Renderizar anuncios con badge "Patrocinado"
// 4. Registrar impresión en ad_events
// 5. Al hacer clic, registrar clic en ad_events y navegar a link_url
```

### F.4 Pitch comercial

> "Tenemos una plataforma de compraventa de vehículos industriales. Cada mes nos visitan X transportistas de tu zona que están activamente buscando comprar o alquilar. ¿Quieres que tu taller aparezca como servicio recomendado cuando un transportista de Zaragoza mira una cisterna? Son 150€ al mes. Te doy informe mensual con impresiones y clics."

150€/mes para un taller que factura 500.000€/año es irrelevante. Si genera un solo cliente al mes ya compensa. 10 talleres × 10 provincias = 1.500€/mes sin que compitan entre sí.

### F.5 Anunciantes por vertical

| Vertical        | Anunciantes naturales                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Tracciona       | Talleres de semirremolques, corredurías de seguros, neumáticos, formación ADR, recambios, lubricantes  |
| CampoIndustrial | Distribuidores de recambios agrícolas, financiación agrícola, seguros agrarios, semillas/fertilizantes |
| Horecaria       | Gas industrial, limpieza de campanas, control de plagas, distribuidores alimentarios, uniformes        |
| Municipiante    | Consultoría de licitaciones, proveedores de recambios municipales, formación PRL                       |
| ReSolar         | Instaladores, mantenimiento de paneles, seguros de instalaciones, financiación renovable               |
| Clinistock      | Mantenimiento de equipos, calibración, software de gestión clínica, fungibles                          |
| BoxPort         | Empresas de modificación, transporte de contenedores, pintura industrial                               |

---
