## ANEXO K: DEALER TOOLKIT

### K.1 Tabla de dealers

```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  -- Perfil público
  slug VARCHAR NOT NULL, -- URL: tracciona.com/dealer-slug
  company_name TEXT NOT NULL,
  logo_url TEXT, -- Cloudinary
  cover_image_url TEXT, -- Imagen de cabecera del perfil
  description JSONB DEFAULT '{}', -- {"es": "...", "en": "...", "fr": "..."} — JSONB multilingüe (Anexo T)
  -- Datos de contacto (visibles en perfil público)
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  -- Ubicación
  location_id UUID REFERENCES locations(id),
  address TEXT,
  province VARCHAR,
  country VARCHAR DEFAULT 'ES',
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  -- Datos fiscales (privados, para facturación)
  tax_id VARCHAR, -- CIF/NIF
  legal_name TEXT, -- Razón social
  fiscal_address TEXT,
  -- Badges y verificación
  badge VARCHAR DEFAULT 'none', -- 'none', 'verified', 'founding', 'premium'
  verified_at TIMESTAMPTZ,
  -- Configuración
  auto_reply_message TEXT, -- Respuesta automática cuando recibe un lead
  notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": true, "push": false}',
  -- Métricas (actualizadas por cron)
  total_listings INT DEFAULT 0,
  active_listings INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  avg_response_time_hours DECIMAL(5,1), -- Tiempo medio de respuesta a leads
  rating DECIMAL(3,2), -- Media de reseñas (cuando existan)
  -- Estado
  status VARCHAR DEFAULT 'active', -- 'pending', 'active', 'suspended'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical, slug)
);

CREATE INDEX idx_dealers_vertical ON dealers(vertical, status);
CREATE INDEX idx_dealers_slug ON dealers(slug);
CREATE INDEX idx_dealers_location ON dealers(location_id);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Perfil público visible para todos
CREATE POLICY "dealers_public_read" ON dealers FOR SELECT
  USING (status = 'active');
-- Dealer edita su propio perfil
CREATE POLICY "dealers_own_update" ON dealers FOR UPDATE
  USING (auth.uid() = user_id);
-- Admin gestiona todo
CREATE POLICY "dealers_admin_all" ON dealers FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
```

### K.2 Sistema de leads

Cuando un comprador contacta por un vehículo, se genera un lead vinculado al dealer.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  -- Partes involucradas
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  vehicle_id UUID REFERENCES vehicles(id), -- Puede ser null si es contacto general
  buyer_user_id UUID REFERENCES auth.users(id), -- Null si es anónimo
  -- Datos del comprador
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_email TEXT,
  buyer_location TEXT,
  -- Mensaje
  message TEXT,
  source VARCHAR NOT NULL, -- 'vehicle_detail', 'dealer_profile', 'whatsapp', 'phone', 'email', 'auction'
  -- Estado del lead
  status VARCHAR DEFAULT 'new', -- 'new', 'viewed', 'contacted', 'negotiating', 'won', 'lost'
  dealer_notes TEXT, -- Notas privadas del dealer sobre este lead
  first_viewed_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  close_reason VARCHAR, -- 'sold', 'price_disagreement', 'not_interested', 'bought_elsewhere', 'no_response'
  -- Valor (si se cierra la venta)
  sale_price_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_dealer ON leads(dealer_id, status);
CREATE INDEX idx_leads_vehicle ON leads(vehicle_id);
CREATE INDEX idx_leads_date ON leads(created_at);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Dealer ve solo sus propios leads
CREATE POLICY "leads_dealer_read" ON leads FOR SELECT
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));
-- Dealer actualiza sus propios leads (estado, notas)
CREATE POLICY "leads_dealer_update" ON leads FOR UPDATE
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));
-- Cualquier usuario autenticado puede crear un lead (contactar)
CREATE POLICY "leads_create" ON leads FOR INSERT
  WITH CHECK (true);
-- Admin ve todo
CREATE POLICY "leads_admin_all" ON leads FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
```

**Notificación al dealer cuando recibe un lead:**

```typescript
// Trigger post-INSERT en leads:
// 1. Email al dealer con datos del comprador y vehículo
// 2. WhatsApp al dealer (si tiene whatsapp configurado y notificaciones activas)
// 3. Push notification (si PWA activa)
// 4. Auto-reply al comprador con el auto_reply_message del dealer (si configurado):
//    "Gracias por tu interés. [Nombre Dealer] responderá en menos de [avg_response_time] horas."
```

### K.3 Planes de suscripción dealer

| Característica            | Gratuito     | Básico (29€/mes)            | Premium (79€/mes)                          | Founding (gratis siempre)    |
| ------------------------- | ------------ | --------------------------- | ------------------------------------------ | ---------------------------- |
| Anuncios activos          | 3            | 20                          | Ilimitados                                 | Ilimitados                   |
| Fotos por anuncio         | 5            | 15                          | 30                                         | 30                           |
| Badge                     | Ninguno      | ✓ Dealer                    | ⭐ Dealer Premium                          | 🏅 Founding Dealer           |
| Perfil público            | Básico       | Completo con logo           | Completo + cover + destacado               | Completo + cover + destacado |
| Estadísticas              | Solo visitas | Visitas + leads + favoritos | Todo + comparativa sector                  | Todo + comparativa sector    |
| Prioridad en resultados   | Normal       | +1 boost                    | +3 boost                                   | +2 boost                     |
| Generación IA de listings | 3/mes        | 20/mes                      | Ilimitados                                 | Ilimitados                   |
| Publicación vía WhatsApp  | ❌           | ✅                          | ✅                                         | ✅                           |
| Widget embebible          | ❌           | ❌                          | ✅                                         | ✅                           |
| Export catálogo (CSV/PDF) | ❌           | ✅                          | ✅                                         | ✅                           |
| Alertas de demanda        | ❌           | ❌                          | ✅ (cuando alguien busca lo que tú vendes) | ✅                           |
| Soporte                   | Email        | Email + chat                | Teléfono + prioritario                     | Email + chat                 |

**Implementación en la query del catálogo (boost de prioridad):**

```typescript
// En useVehicles.ts, al ordenar resultados:
// 1. Vehículos de dealers Premium: sort_boost = 3
// 2. Vehículos de dealers Founding: sort_boost = 2
// 3. Vehículos de dealers Básico: sort_boost = 1
// 4. Vehículos gratuitos: sort_boost = 0
// 5. Dentro del mismo boost: ordenar por fecha (más recientes primero)
// 6. Vehículos destacados (⭐): siempre arriba independientemente del plan

// SQL:
// ORDER BY
//   CASE WHEN v.featured = true THEN 1 ELSE 0 END DESC,
//   COALESCE(d.sort_boost, 0) DESC,
//   v.created_at DESC
```

### K.4 Dashboard del dealer

**Estructura de páginas:**

```
/dashboard                         → Resumen general (KPIs, leads recientes, onboarding)
/dashboard/vehiculos               → Mis vehículos (listar, editar, pausar, eliminar)
/dashboard/vehiculos/nuevo         → Publicar nuevo vehículo
/dashboard/vehiculos/importar      → Import masivo Excel/CSV
/dashboard/leads                   → Leads recibidos (bandeja de entrada con CRM)
/dashboard/leads/[id]              → Detalle del lead (historial, notas, estado)
/dashboard/estadisticas            → Estadísticas y métricas (plan-gated)
/dashboard/portal                  → Configurar portal público (colores, bio, logo)
/dashboard/herramientas            → Facturas, contratos, presupuestos, widget, export
/dashboard/suscripcion             → Plan actual, facturación, upgrade
/dashboard/facturas                → Historial de facturas
```

**Pantalla principal del dashboard (resumen):**

```
┌─────────────────────────────────────────────────────────────┐
│ 👋 Hola, Transportes García                     [Premium ⭐] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Este mes                        📈 vs mes anterior      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 12       │ │ 847      │ │ 23       │ │ 2        │      │
│  │ Vehículos│ │ Visitas  │ │ Leads    │ │ Ventas   │      │
│  │ activos  │ │ +15%     │ │ +8%      │ │ =        │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  🔔 Leads recientes                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 NUEVO  Juan P. pregunta por Cisterna Indox 3 ej. │   │
│  │    hace 15 min — Madrid — WhatsApp                   │   │
│  │                        [Responder] [Ver ficha]       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟡 VISTO  María L. pregunta por Semirremolque Schmitz│  │
│  │    hace 2h — Barcelona — Email                       │   │
│  │                        [Responder] [Ver ficha]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🚛 Vehículos que necesitan atención                       │
│  • Cisterna Parcisa 2017 — 45 días sin visitas → [Bajar precio] [Subasta]│
│  • Tractora Renault 2020 — Fotos de baja calidad → [Mejorar]│
│                                                             │
│  💡 Sugerencias                                             │
│  • "Tus cisternas alimentarias reciben 3x más visitas que  │
│     las de combustible. ¿Tienes más en stock?"              │
│  • "5 compradores buscan semirremolques frigoríficos en tu  │
│     zona. Publica uno para captarlos." [Solo Premium]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### K.5 Estadísticas del dealer (página /dashboard/estadisticas)

**Métricas disponibles por plan:**

| Métrica                                | Gratuito | Básico | Premium/Founding |
| -------------------------------------- | -------- | ------ | ---------------- |
| Visitas totales a mis vehículos        | ✅       | ✅     | ✅               |
| Visitas por vehículo                   | ❌       | ✅     | ✅               |
| Leads totales recibidos                | ✅       | ✅     | ✅               |
| Leads por vehículo                     | ❌       | ✅     | ✅               |
| Favoritos por vehículo                 | ❌       | ✅     | ✅               |
| Tasa de conversión (visita→lead)       | ❌       | ✅     | ✅               |
| Tiempo medio de venta                  | ❌       | ❌     | ✅               |
| Comparativa con media del sector       | ❌       | ❌     | ✅               |
| Demandas activas que matchean mi stock | ❌       | ❌     | ✅               |
| Precio medio de mercado para mi stock  | ❌       | ❌     | ✅               |
| Gráfico de evolución mensual           | ❌       | ✅     | ✅               |

**Implementación — tabla de estadísticas pre-calculadas:**

```sql
-- Cron diario que calcula métricas por dealer
CREATE TABLE dealer_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  period_date DATE NOT NULL, -- Fecha del período (día)
  -- Métricas del día
  vehicle_views INT DEFAULT 0,
  profile_views INT DEFAULT 0,
  leads_received INT DEFAULT 0,
  leads_responded INT DEFAULT 0,
  favorites_added INT DEFAULT 0,
  pdf_downloads INT DEFAULT 0,
  -- Métricas calculadas
  conversion_rate DECIMAL(5,2), -- leads / views * 100
  avg_response_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dealer_id, period_date)
);

CREATE INDEX idx_dealer_stats_dealer ON dealer_stats(dealer_id, period_date);
```

### K.6 Perfil público del dealer

Accesible via catch-all `[...slug].vue` → busca en tabla `dealers` WHERE slug = input.

```
URL: tracciona.com/transportes-garcia

┌─────────────────────────────────────────────────────────────┐
│ [Cover image]                                               │
│                                                             │
│ [Logo] Transportes García SL            [🏅 Founding Dealer]│
│        Zaragoza, España                                     │
│        ⭐ 4.8 (12 reseñas) · 47 vehículos · Desde 2024     │
│                                                             │
│ [📞 Llamar]  [💬 WhatsApp]  [✉️ Contactar]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sobre nosotros                                              │
│ Transportes García es una empresa familiar con 25 años      │
│ de experiencia en compraventa de vehículos industriales...   │
│                                                             │
│ Nuestro catálogo (47 vehículos)                             │
│ [Cisternas (18)] [Tractoras (12)] [Semirremolques (17)]     │
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │ Cisterna│ │ Tractora│ │ Semirr. │ │ Cisterna│          │
│ │ Indox   │ │ Renault │ │ Schmitz │ │ Parcisa │          │
│ │ 42.000€ │ │ 38.000€ │ │ 28.000€ │ │ 35.000€ │          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│ Reseñas                                                     │
│ ⭐⭐⭐⭐⭐ "Muy profesionales, entrega rápida" — Juan M.     │
│ ⭐⭐⭐⭐  "Buen precio, el vehículo era como en las fotos"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**SEO del perfil:** Cada dealer genera una página indexable con:

- Title: "Transportes García — Vehículos Industriales en Zaragoza | Tracciona"
- Schema Organization con rating, address, contacto
- Breadcrumb: Home > Dealers > Transportes García
- Enlace desde cada ficha de vehículo del dealer al perfil

### K.7 Herramientas del dealer

**Widget embebible (Solo Premium/Founding):**

```html
<!-- El dealer pega este código en su propia web -->
<iframe
  src="https://tracciona.com/embed/transportes-garcia?limit=6&theme=light"
  width="100%"
  height="600"
  frameborder="0"
>
</iframe>

<!-- Muestra los últimos 6 vehículos del dealer con diseño integrable -->
<!-- Clic en un vehículo → abre ficha en tracciona.com -->
```

Implementar como server route que renderiza HTML:

```typescript
// /server/routes/embed/[dealer-slug].get.ts
// Query los vehículos del dealer, renderizar HTML con CSS inline
// Parámetros: limit, theme (light/dark), category
```

**Export de catálogo:**

```typescript
// /server/api/dealer/export.get.ts
// Genera CSV o PDF con todos los vehículos activos del dealer
// CSV: para importar en otros portales o compartir con clientes
// PDF: catálogo profesional con fotos, descripciones, precios
// Solo Básico+ puede exportar
```

**Generación masiva de PDFs:**

```typescript
// /server/api/dealer/pdf-catalog.get.ts
// Genera un PDF de catálogo con todos los vehículos del dealer
// Portada con logo y datos del dealer
// 1 vehículo por página con fotos, specs, precio
// Pie de página con URL del perfil y QR
// Útil para ferias, visitas comerciales, envío por email
```

### K.8 Onboarding flow del dealer

```
DÍA 0 — Captación:
  Contacto por teléfono (desde scraping I.2) o inbound
  Pitch: "Te subo 40 vehículos en 24h, gratis si eres de los 10 primeros"

DÍA 0 — Registro:
  1. Dealer envía datos básicos (nombre empresa, CIF, teléfono, ubicación)
  2. Admin crea cuenta → email de bienvenida con credenciales
  3. Dealer accede al dashboard por primera vez

DÍA 0-1 — Carga de catálogo:
  Opción A (WhatsApp — fricción cero):
    Dealer envía fotos por WhatsApp → IA genera listings → publicado
  Opción B (Excel/CSV):
    Dealer envía su Excel → script procesa → Claude genera descripciones → publicado
  Opción C (Manual):
    Dealer entra al dashboard → /dashboard/vehiculos/nuevo → formulario asistido por IA

DÍA 1 — Perfil público:
  Admin configura perfil con logo, descripción, ubicación
  URL activa: tracciona.com/transportes-garcia

DÍA 2-3 — Verificación:
  Si los vehículos tienen documentación → asignar badges ✓/✓✓
  Si el dealer tiene buena reputación → marcar como "Verified Dealer"

DÍA 7 — Follow-up:
  Llamada o WhatsApp: "¿Cómo va? Ya tienes X visitas y X leads.
  ¿Quieres añadir más vehículos?"

DÍA 30 — Evaluación:
  Si Founding: "Tus números este mes: X visitas, X leads, X ventas"
  Si gratuito: "Con el plan Básico tendrías acceso a estadísticas detalladas
  y podrías publicar hasta 20 vehículos. ¿Te interesa?"
```

### K.9 Actualizar catch-all para perfiles de dealer

El catch-all `[...slug].vue` (Paso 4.2) ya contempla dealers. Actualizar la lógica de resolución:

```typescript
// [...slug].vue — Orden de resolución:
// 1. Buscar en active_landings WHERE slug = input AND is_active = true
//    → Si encuentra → renderizar landing page de catálogo
// 2. Si landing existe pero is_active = false → 302 redirect a parent_slug
// 3. Buscar en dealers WHERE slug = input AND status = 'active'
//    → Si encuentra → renderizar perfil público del dealer
// 4. Nada encontrado → 404
```

### K.10 Vincular vehículos a dealers

Actualizar tabla vehicles para vincular con dealers:

```sql
-- Añadir FK a dealers en vehicles
ALTER TABLE vehicles ADD COLUMN dealer_id UUID REFERENCES dealers(id);
CREATE INDEX idx_vehicles_dealer ON vehicles(dealer_id);

-- Actualizar vehículos existentes: vincular por user_id
UPDATE vehicles v SET dealer_id = d.id
FROM dealers d
WHERE v.user_id = d.user_id;
```

En la ficha del vehículo, mostrar tarjeta del dealer:

```
┌──────────────────────────────────┐
│ [Logo] Transportes García        │
│ 🏅 Founding Dealer               │
│ Zaragoza · ⭐ 4.8 · 47 vehículos│
│ Responde en ~2 horas             │
│                                  │
│ [Ver perfil]  [📞]  [💬 WhatsApp]│
└──────────────────────────────────┘
```

### K.11 Resumen de tablas del Dealer Toolkit

| Tabla                | Propósito                             | RLS                                                              |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `dealers`            | Perfil público y privado del dealer   | Público: lectura si activo. Dealer: edita propio. Admin: todo.   |
| `leads`              | Contactos de compradores al dealer    | Dealer: ve/edita los suyos. Comprador: puede crear. Admin: todo. |
| `dealer_stats`       | Métricas pre-calculadas por día       | Dealer: ve las suyas. Admin: todo.                               |
| `subscriptions`      | Planes y pagos (ya existe en Anexo E) | Dealer: ve las suyas. Admin: todo.                               |
| `vehicles.dealer_id` | Vinculación vehículo → dealer         | Heredado de vehicles.                                            |

---
