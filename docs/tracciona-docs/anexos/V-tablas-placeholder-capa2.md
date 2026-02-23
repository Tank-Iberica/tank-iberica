## ANEXO V: TABLAS PLACEHOLDER DE CAPA 2

Tablas que se crean ahora (con la migración) pero NO tienen frontend todavía. Solo schema SQL con RLS. Cuando se implemente la funcionalidad completa, la BD ya está preparada.

### V.1 Tabla `dealers`

```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slug VARCHAR UNIQUE NOT NULL,
  company_name JSONB NOT NULL,  -- {"es": "Transportes García", "en": "Garcia Transport"}
  legal_name TEXT,
  cif_nif TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  locale VARCHAR(5) DEFAULT 'es',  -- idioma principal del dealer
  location_data JSONB DEFAULT '{}', -- {"province": "...", "country": "...", "region": "..."}
  phone TEXT,
  email TEXT,
  website TEXT,
  subscription_type VARCHAR DEFAULT 'free', -- 'free', 'basic', 'premium', 'founding'
  subscription_valid_until TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  stats JSONB DEFAULT '{}', -- {"total_vehicles": 0, "total_views": 0, "total_leads": 0}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dealers_slug ON dealers(slug);
CREATE INDEX idx_dealers_vertical ON dealers(vertical);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
-- Público: ver dealers publicados
CREATE POLICY "dealers_public_read" ON dealers FOR SELECT USING (true);
-- Dealer: editar su propio perfil
CREATE POLICY "dealers_own_update" ON dealers FOR UPDATE USING (user_id = auth.uid());
-- Admin: todo
CREATE POLICY "dealers_admin_all" ON dealers FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
```

### V.2 Columnas adicionales en `vehicles`

```sql
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS listing_type VARCHAR DEFAULT 'sale'; -- sale, rental, auction
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS verification_level INT DEFAULT 0; -- 0, 1, 2, 3
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_price_cents BIGINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pending_translations BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT '{}';

CREATE INDEX idx_vehicles_dealer ON vehicles(dealer_id);
CREATE INDEX idx_vehicles_listing ON vehicles(listing_type);
```

### V.3 Tablas de subastas (placeholder)

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  start_price_cents BIGINT NOT NULL,
  reserve_price_cents BIGINT,
  current_bid_cents BIGINT DEFAULT 0,
  bid_count INT DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'draft', -- draft, scheduled, active, ended, cancelled
  buyer_premium_pct NUMERIC(4,2) DEFAULT 8.00,
  anti_sniping_minutes INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_cents BIGINT NOT NULL,
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auction_registrations (
  auction_id UUID NOT NULL REFERENCES auctions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  deposit_paid BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (auction_id, user_id)
);

-- RLS: lectura pública, escritura autenticada, admin todo
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_registrations ENABLE ROW LEVEL SECURITY;
```

### V.4 Tabla de verificación (placeholder)

```sql
CREATE TABLE verification_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  report_type VARCHAR NOT NULL, -- 'dgt', 'inspection', 'km_score'
  data JSONB NOT NULL DEFAULT '{}',
  level INT NOT NULL, -- 1, 2, 3
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  price_cents INT
);

ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;
```

### V.5 Tablas de publicidad (placeholder)

```sql
CREATE TABLE ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  slot_name VARCHAR NOT NULL,
  page VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  price_cents_per_day INT,
  status VARCHAR DEFAULT 'available',
  current_advertiser_id UUID REFERENCES dealers(id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id UUID NOT NULL REFERENCES ad_slots(id),
  event_type VARCHAR NOT NULL, -- 'impression', 'click'
  viewer_ip INET,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
```

### V.6 Tabla de transporte (placeholder)

```sql
CREATE TABLE transport_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  origin_province VARCHAR,
  destination_province VARCHAR,
  origin_country VARCHAR DEFAULT 'ES',
  destination_country VARCHAR DEFAULT 'ES',
  vehicle_type VARCHAR, -- 'gondola', 'grua', 'portacoches'
  estimated_price_cents INT,
  distance_km INT,
  status VARCHAR DEFAULT 'quoted', -- 'quoted', 'accepted', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transport_quotes ENABLE ROW LEVEL SECURITY;
```

---
