## ANEXO H: SISTEMA DE SUBASTAS

### H.1 Concepto

Vehículos que no se venden en 60 días en marketplace pasan a subasta con fecha concreta. Pujas en tiempo real. También aplica a liquidaciones (restaurantes que cierran, flotas que se renuevan, fábricas que desmantelan).

**Contexto competitivo:** Ritchie Bros y Euro Auctions operan en España pero están enfocados en construcción y maquinaria pesada. El nicho de cisternas, semirremolques y tractoras en subasta online en el mercado ibérico está prácticamente vacío.

### H.2 Registro y verificación de pujadores

No puede pujar cualquiera. Los pujadores falsos son el cáncer de las subastas online. Antes de pujar, el usuario debe pasar un proceso de registro específico.

**Migración SQL:**

```sql
CREATE TABLE auction_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  -- Verificación de identidad
  id_type VARCHAR NOT NULL, -- 'dni', 'nie', 'cif', 'passport'
  id_number VARCHAR NOT NULL,
  id_document_url TEXT, -- Foto del documento en Cloudinary
  company_name TEXT, -- Si es CIF
  -- Documentación adicional según vertical
  transport_license_url TEXT, -- Licencia de transporte (si aplica en Tracciona)
  additional_docs JSONB DEFAULT '{}', -- Docs extra por vertical
  -- Depósito
  stripe_payment_intent_id VARCHAR, -- PaymentIntent con capture_method: 'manual'
  deposit_cents BIGINT NOT NULL,
  deposit_status VARCHAR DEFAULT 'pending', -- 'pending', 'held', 'captured', 'released', 'forfeited'
  -- Estado
  status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, auction_id)
);

CREATE INDEX idx_auction_reg_user ON auction_registrations(user_id);
CREATE INDEX idx_auction_reg_auction ON auction_registrations(auction_id, status);

ALTER TABLE auction_registrations ENABLE ROW LEVEL SECURITY;

-- Usuarios leen su propio registro
CREATE POLICY "auction_reg_own_read" ON auction_registrations FOR SELECT
  USING (auth.uid() = user_id);
-- Usuarios pueden registrarse
CREATE POLICY "auction_reg_insert" ON auction_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Admin gestiona todo
CREATE POLICY "auction_reg_admin_all" ON auction_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
```

**Flujo de registro para pujar:**

```
1. Usuario quiere pujar → clic "Registrarse para pujar"
2. Formulario: DNI/CIF + foto documento + datos fiscales
   - Si Tracciona y vehículo >3.500kg: pedir licencia de transporte
   - Si CIF: pedir datos de empresa
3. Depósito: Stripe PaymentIntent con capture_method: 'manual'
   - Retiene importe sin cobrar (hold de 7 días máximo en Stripe)
   - Importe: 5-10% del precio de salida, mínimo 500€, máximo 5.000€
4. Admin revisa y aprueba (o auto-aprobación si DNI ya verificado en transacciones anteriores)
5. Usuario aprobado → puede pujar
6. Post-subasta:
   - Ganador: hold se captura como parte del pago → pierde depósito si no completa compra
   - Perdedores: hold se libera automáticamente (Stripe cancel PaymentIntent)
```

### H.3 Implementación técnica

**Migración SQL — Tablas de subastas y pujas:**

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  vehicle_id UUID REFERENCES vehicles(id),
  title TEXT NOT NULL,
  description TEXT,
  -- Configuración de la subasta
  starting_price_cents BIGINT NOT NULL,
  reserve_price_cents BIGINT, -- Precio mínimo oculto. Si no se alcanza, no se adjudica
  current_bid_cents BIGINT DEFAULT 0,
  bid_increment_cents BIGINT NOT NULL DEFAULT 50000, -- Mínimo 500€ de incremento
  buyers_premium_pct DECIMAL(4,2) NOT NULL DEFAULT 8.00, -- 8% buyer's premium
  deposit_cents BIGINT NOT NULL DEFAULT 100000, -- 1.000€ de depósito para pujar
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  -- Anti-sniping: si hay puja en los últimos 2 min, extender 2 min más
  anti_snipe_seconds INT DEFAULT 120,
  extended_until TIMESTAMPTZ, -- null si no se ha extendido
  -- Estado
  status VARCHAR NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'adjudicated', 'cancelled', 'no_sale'
  winner_id UUID REFERENCES auth.users(id),
  winning_bid_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bids_auction ON bids(auction_id, amount_cents DESC);
CREATE INDEX idx_auctions_status ON auctions(status, ends_at);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Subastas públicas visibles
CREATE POLICY "auctions_public_read" ON auctions FOR SELECT USING (status != 'cancelled');
-- Admin gestiona subastas
CREATE POLICY "auctions_admin_all" ON auctions FOR ALL
  USING (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin'));
-- Usuarios leen sus propias pujas
CREATE POLICY "bids_own_read" ON bids FOR SELECT USING (auth.uid() = user_id);
-- Usuarios autenticados pueden pujar (con verificación adicional via trigger)
CREATE POLICY "bids_authenticated_insert" ON bids FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Trigger de validación de pujas (en BD, no solo frontend):**

```sql
-- CRÍTICO: La validación de pujas DEBE estar en la base de datos, no solo en frontend.
-- Un usuario malicioso podría llamar directamente a la API de Supabase.

CREATE OR REPLACE FUNCTION validate_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_registration auction_registrations%ROWTYPE;
  v_max_bid BIGINT;
BEGIN
  -- 1. Obtener datos de la subasta
  SELECT * INTO v_auction FROM auctions WHERE id = NEW.auction_id;

  -- 2. Verificar que la subasta está activa
  IF v_auction.status != 'live' THEN
    RAISE EXCEPTION 'La subasta no está activa';
  END IF;

  -- 3. Verificar que no ha expirado (considerando extensiones)
  IF COALESCE(v_auction.extended_until, v_auction.ends_at) < NOW() THEN
    RAISE EXCEPTION 'La subasta ha terminado';
  END IF;

  -- 4. Verificar que el usuario tiene registro aprobado con depósito retenido
  SELECT * INTO v_registration FROM auction_registrations
  WHERE user_id = NEW.user_id AND auction_id = NEW.auction_id
  AND status = 'approved' AND deposit_status = 'held';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes registro aprobado con depósito para esta subasta';
  END IF;

  -- 5. Verificar que la puja es mayor que la actual + incremento mínimo
  SELECT COALESCE(MAX(amount_cents), v_auction.starting_price_cents) INTO v_max_bid
  FROM bids WHERE auction_id = NEW.auction_id;

  IF NEW.amount_cents < v_max_bid + v_auction.bid_increment_cents THEN
    RAISE EXCEPTION 'La puja debe ser al menos % cents', v_max_bid + v_auction.bid_increment_cents;
  END IF;

  -- 6. Actualizar current_bid en la subasta
  UPDATE auctions SET current_bid_cents = NEW.amount_cents WHERE id = NEW.auction_id;

  -- 7. Anti-sniping: si quedan menos de anti_snipe_seconds, extender
  IF COALESCE(v_auction.extended_until, v_auction.ends_at) - NOW() < (v_auction.anti_snipe_seconds || ' seconds')::INTERVAL THEN
    UPDATE auctions SET extended_until = NOW() + (v_auction.anti_snipe_seconds || ' seconds')::INTERVAL
    WHERE id = NEW.auction_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_bid
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid();
```

**Motor de pujas en tiempo real:**

```typescript
// Usar Supabase Realtime para suscribirse a cambios en la tabla bids:
// supabase.channel('auction:' + auctionId)
//   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: 'auction_id=eq.' + auctionId }, handleNewBid)
//   .subscribe()
//
// También suscribirse a cambios en auctions para detectar extensiones de tiempo:
// supabase.channel('auction-status:' + auctionId)
//   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions', filter: 'id=eq.' + auctionId }, handleAuctionUpdate)
//   .subscribe()
```

**Depósitos con Stripe:**

```typescript
// /server/api/auction-deposit.post.ts
export default defineEventHandler(async (event) => {
  const { auctionId, registrationId } = await readBody(event)

  // 1. Obtener datos de la subasta para saber el depósito requerido
  const auction = await supabase
    .from('auctions')
    .select('deposit_cents')
    .eq('id', auctionId)
    .single()

  // 2. Crear PaymentIntent con capture_method: 'manual' (retiene sin cobrar)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: auction.data.deposit_cents,
    currency: 'eur',
    capture_method: 'manual', // ← CLAVE: retiene pero NO cobra
    metadata: { auction_id: auctionId, registration_id: registrationId },
  })

  // 3. Actualizar registro con el PaymentIntent ID
  await supabase
    .from('auction_registrations')
    .update({ stripe_payment_intent_id: paymentIntent.id, deposit_status: 'pending' })
    .eq('id', registrationId)

  // 4. Devolver client_secret para que el frontend complete el pago
  return { clientSecret: paymentIntent.client_secret }
})

// Post-subasta:
// Ganador → stripe.paymentIntents.capture(paymentIntentId) → deposit_status = 'captured'
// Perdedores → stripe.paymentIntents.cancel(paymentIntentId) → deposit_status = 'released'
// Ganador que no paga en 48h → deposit_status = 'forfeited' (pierde depósito)
```

### H.4 Flujo marketplace → subasta automático

El vendedor puede configurar al publicar que su vehículo pase automáticamente a subasta si no se vende en X días.

```sql
-- Añadir a tabla vehicles:
ALTER TABLE vehicles ADD COLUMN auto_auction_after_days INT; -- null = no auto-subasta, 60 = pasa a subasta tras 60 días
ALTER TABLE vehicles ADD COLUMN auto_auction_starting_pct DECIMAL(4,2); -- % del precio original como precio de salida, ej: 70 = 70% del precio
```

**Lógica (cron job o Edge Function diaria):**

```typescript
// Cada día, buscar vehículos con auto_auction activado que hayan pasado el plazo:
// SELECT * FROM vehicles
// WHERE status = 'published'
//   AND auto_auction_after_days IS NOT NULL
//   AND created_at + (auto_auction_after_days || ' days')::INTERVAL < NOW()
//   AND NOT EXISTS (SELECT 1 FROM auctions WHERE vehicle_id = vehicles.id AND status != 'cancelled')
//
// Para cada uno:
// 1. Crear auction con starting_price = price * auto_auction_starting_pct / 100
// 2. Fecha inicio = mañana a las 10:00
// 3. Fecha fin = 7 días después a las 20:00
// 4. Notificar al vendedor: "Tu vehículo no se ha vendido en 60 días. Hemos creado una subasta que empieza mañana."
// 5. Notificar a suscriptores Pro con demandas que matcheen
```

**Pitch al vendedor:**

> "Publica tu cisterna a 45.000€ en venta directa. Si no se vende en 2 meses, la pasamos a subasta con salida en 31.500€ (70%). Tú decides si aceptas la adjudicación o prefieres retirarla."

### H.5 Componente de puja en tiempo real

```typescript
// /app/components/auction/AuctionBidPanel.vue
//
// Muestra en tiempo real:
// ┌──────────────────────────────────────────┐
// │ 🔨 SUBASTA EN VIVO                       │
// │                                          │
// │ Cisterna Indox Alimentaria 3 ejes 2019   │
// │                                          │
// │ Puja actual:    38.500€                  │
// │ Pujas totales:  12                       │
// │ Pujadores:      5                        │
// │ Tiempo restante: 00:14:32 ⏱️             │
// │ (Extensión anti-sniping activa)          │
// │                                          │
// │ Tu próxima puja mínima: 39.000€          │
// │                                          │
// │ [Pujar 39.000€]  [Pujar 40.000€]        │
// │                                          │
// │ ─── Historial de pujas ───               │
// │ 38.500€  Usuario****23  hace 45s         │
// │ 38.000€  Usuario****87  hace 2m          │
// │ 37.500€  Tú             hace 5m          │
// │ 37.000€  Usuario****23  hace 8m          │
// │ ...                                      │
// └──────────────────────────────────────────┘
//
// - Countdown se actualiza cada segundo
// - Nuevas pujas aparecen instantáneamente vía Realtime
// - Si queda <2 min y hay puja nueva, el countdown se reinicia (anti-sniping visual)
// - Usuarios no registrados ven el panel en modo lectura con botón "Regístrate para pujar"
// - Buyer's premium se muestra claramente: "Precio final = puja + 8% buyer's premium"
```

### H.6 Casos de uso por vertical

| Vertical            | Caso típico                                              | Valor                  |
| ------------------- | -------------------------------------------------------- | ---------------------- |
| Tracciona           | Flota de 10 cisternas de empresa que renueva             | Alto                   |
| Horecaria           | Liquidación completa de restaurante que cierra           | Muy alto (20-30 items) |
| CampoIndustrial     | Renovación de flota de cooperativa agrícola              | Alto                   |
| ReSolar             | Lote de 500 paneles de instalación desmantelada          | Muy alto               |
| Clinistock          | Equipamiento de clínica que cierra o renueva             | Alto                   |
| Industrial (futuro) | Maquinaria de fábrica que cierra (liquidación concursal) | Muy alto               |
| BoxPort             | Lote de contenedores de naviera que renueva flota        | Medio                  |

### H.7 Ingresos

Buyer's premium del 5-10% sobre precio de adjudicación.
Ejemplo: 4 lotes/mes × 35.000€ ticket medio × 8% = **11.200€/mes**.

Ingreso por subasta completa con servicios:
| Servicio | Ingreso |
|----------|---------|
| Buyer's premium 8% de 35.000€ | 2.800€ |
| Transporte (Transporteo SL) | 1.000€ |
| Gestión de trámites | 250€ |
| **Total por subasta** | **4.050€** |

Las subastas también generan tráfico, urgencia, y contenido indexable (cada subasta es una landing page temporal con countdown que Google puede indexar).

---
