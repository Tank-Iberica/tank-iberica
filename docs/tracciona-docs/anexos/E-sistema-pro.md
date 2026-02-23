## ANEXO E: SISTEMA PRO — ACCESO ANTICIPADO Y SUSCRIPCIONES

### E.1 Concepto

Cuando un vendedor publica un vehículo, durante las primeras 24 horas solo aparece para suscriptores Pro. Pasadas las 24h, visible para todos.

**Por qué funciona:**

- El vendedor no pierde nada: su vehículo tiene visibilidad desde el minuto uno (los Pro lo ven)
- El comprador Pro gana ventaja real: acceso 24h antes
- El comprador gratuito ve que cuando llega a un buen vehículo, ya tiene 3 consultas de Pros
- Efecto psicológico: perder una oportunidad convence más que cualquier argumento de venta

### E.2 Implementación técnica

**Migración SQL (añadir a 00031 o crear 00033):**

```sql
-- Campo de visibilidad temporal en vehicles
ALTER TABLE vehicles ADD COLUMN visible_from TIMESTAMPTZ;

-- Cuando se publica un vehículo, visible_from = NOW() + 24 horas
-- UPDATE vehicles SET visible_from = NOW() + INTERVAL '24 hours' WHERE id = :new_vehicle_id;

-- Tabla de suscripciones Pro
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  plan VARCHAR NOT NULL, -- 'pro_monthly', 'pro_annual', 'pass_72h'
  status VARCHAR NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  price_cents INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_subscription_id VARCHAR,
  stripe_customer_id VARCHAR,        -- Añadido: ID del customer en Stripe (compartido entre suscripciones del mismo usuario)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, vertical);
CREATE INDEX idx_subscriptions_active ON subscriptions(status) WHERE status = 'active';

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
  );
```

**Query del catálogo público (modificar en useVehicles.ts):**

```typescript
// Usuario gratuito: solo vehículos cuyo visible_from ya pasó
const query = supabase
  .from('vehicles')
  .select('*')
  .eq('status', 'published')
  .lte('visible_from', new Date().toISOString()) // ← Solo público

// Usuario Pro: ignora visible_from
const queryPro = supabase.from('vehicles').select('*').eq('status', 'published')
// Sin filtro de visible_from → ve todo
```

**Sitemap:** Respetar `visible_from`. No incluir vehículos en período exclusivo Pro para que Google no indexe antes de que sea público.

### E.3 Precios

| Plan        | Precio                | Duración | Incluye                                              |
| ----------- | --------------------- | -------- | ---------------------------------------------------- |
| Pase 72h    | 9,99€                 | 3 días   | Acceso anticipado + alertas                          |
| Pro Mensual | 29€/mes               | Mensual  | Acceso anticipado + alertas instantáneas + badge Pro |
| Pro Anual   | 249€/año (20,75€/mes) | Anual    | Todo lo anterior + descuento                         |

### E.3b Programa Founding Dealers

Los primeros 10 dealers de cada vertical reciben suscripción gratuita para siempre con badge exclusivo "Founding Dealer".

**Por qué funciona:**

- Crea urgencia ("solo 10 plazas, ya quedan 6")
- Genera catálogo rápido (10 dealers × 20 vehículos = 200 listings de golpe)
- Los founding dealers se convierten en embajadores de la plataforma
- El badge "Founding Dealer" tiene valor psicológico: nadie quiere perder algo exclusivo
- Cuando otros dealers vean el badge, querrán saber cómo conseguirlo → "ya no hay plazas, pero puedes suscribirte a Pack Premium"

**Implementación:**

```sql
-- En la tabla subscriptions, plan 'founding' con expires_at NULL (nunca expira):
INSERT INTO subscriptions (user_id, vertical, plan, status, price_cents, started_at, expires_at)
VALUES (:dealer_user_id, 'tracciona', 'founding', 'active', 0, now(), NULL);
-- expires_at NULL = nunca expira

-- Badge en el perfil del dealer:
-- Si subscription.plan = 'founding' → mostrar badge "🏅 Founding Dealer"
-- Máximo 10 por vertical. Validar antes de insertar:
-- SELECT COUNT(*) FROM subscriptions WHERE vertical = 'tracciona' AND plan = 'founding' AND status = 'active'
-- Si >= 10 → rechazar
```

**Pitch comercial:**

> "Estamos lanzando Tracciona.com, la primera plataforma moderna de vehículos industriales en España. Para los 10 primeros dealers que se unan, ofrecemos suscripción premium gratuita para siempre: anuncios ilimitados, badge exclusivo de Founding Dealer, estadísticas, y prioridad en resultados. Me das un Excel con tus vehículos y mañana los tienes publicados con fichas profesionales bilingües. Solo quedan X plazas."

### E.4 Elementos de UX que generan conversión

**En el catálogo (usuario gratuito):**

```
┌─────────────────────────────────────────┐
│ 🔒 5 vehículos nuevos publicados hoy    │
│ Los suscriptores Pro ya los están viendo │
│                [Hazte Pro →]             │
└─────────────────────────────────────────┘
```

**En la ficha del vehículo (ya pública):**

```
👥 3 personas ya han contactado por este vehículo
```

**Cuando un gratuito intenta ver un vehículo en periodo exclusivo (si llega por URL directa):**

```
┌─────────────────────────────────────────┐
│ Este vehículo estará disponible en 14h  │
│ Los suscriptores Pro ya pueden verlo    │
│     [Ver ahora con Pase 72h — 9,99€]   │
│     [Suscribirme a Pro — 29€/mes]       │
└─────────────────────────────────────────┘
```

### E.5 Alertas instantáneas para Pro

Cuando se inserta un vehículo en `vehicles`, comparar con tabla `demands` de suscriptores Pro:

```typescript
// Trigger o webhook post-INSERT en vehicles:
// 1. Buscar demands activas que matcheen categoría + subcategoría + rango precio + zona
// 2. Para cada match con usuario Pro activo:
//    - Enviar notificación push (si PWA activa)
//    - Enviar WhatsApp vía API (Twilio/360dialog)
//    - Enviar email
// 3. El comprador Pro recibe "Nueva cisterna alimentaria Indox 3 ejes en Barcelona, 42.000€"
//    a los 30 segundos de publicarse
// 4. El comprador gratuito recibe email resumen al día siguiente
```

### E.6 Aplicación a otros verticales

El sistema Pro funciona especialmente bien en:

- **Horecaria:** Liquidación de restaurante = 20-30 listings de golpe. Hostelero Pro que monta local nuevo puede equipar todo a precio de ocasión.
- **CampoIndustrial:** Antes de campaña de siembra/cosecha, picos de demanda predecibles. Ventaja de 24h es crítica.
- **ReSolar:** Lotes grandes de paneles de instalaciones desmanteladas. Quien llega primero se lleva el lote.
- **Clinistock:** Renovación de equipamiento hospitalario. Ecógrafo a mitad de precio desaparece en horas.

---
