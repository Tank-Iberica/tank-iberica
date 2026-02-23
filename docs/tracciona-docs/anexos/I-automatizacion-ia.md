## ANEXO I: AUTOMATIZACIÓN CON IA

### I.1 Publicación de vehículos vía WhatsApp Business API

**Concepto:** El dealer no toca la plataforma. Envía fotos y ficha técnica por WhatsApp a un número de negocio. La IA recibe las fotos, extrae todos los datos, genera el listing y lo publica automáticamente.

**Flujo completo:**

```
1. Dealer envía al número de WhatsApp Business:
   - 5-10 fotos del vehículo
   - Foto de placa del fabricante (opcional pero recomendado)
   - Foto de ficha técnica / tarjeta ITV (opcional)
   - Mensaje de texto con precio y datos que quiera añadir

2. Webhook recibe el mensaje → Edge Function / Server Route

3. Claude Vision analiza las fotos:
   - Extrae marca, modelo de las fotos del vehículo y placa
   - Lee matrícula si es visible
   - Lee datos de ficha técnica / ITV (km, MMA, ejes, fecha matriculación)
   - Identifica tipo de vehículo (cisterna, semirremolque, tractora...)
   - Identifica subcategoría (alimentaria, frigorífico, lona...)

4. Claude genera:
   - Título del listing
   - Descripción en español (SEO optimizada)
   - Descripción en inglés
   - Alt-text para cada foto
   - attributes_json con los datos técnicos extraídos
   - Slug SEO-friendly

5. Sistema crea el listing en Supabase:
   - Sube fotos a Cloudinary
   - Inserta vehicle con todos los datos
   - Estado: 'draft' para revisión rápida del admin, o 'published' si el dealer es Founding/Premium

6. Responde al dealer por WhatsApp:
   - "✅ Tu vehículo ha sido publicado: [enlace a la ficha]"
   - "Revisa los datos y avísanos si hay que corregir algo"
```

**Implementación técnica:**

```typescript
// /server/api/whatsapp-webhook.post.ts
export default defineEventHandler(async (event) => {
  const payload = await readBody(event) // Webhook de WhatsApp Business API

  // 1. Verificar que el remitente es un dealer registrado (por número de teléfono)
  const dealer = await supabase.from('dealers').select('*').eq('phone', payload.from).single()

  // 2. Descargar las imágenes del mensaje
  const images = await downloadWhatsAppMedia(payload.messages)

  // 3. Enviar a Claude Vision para extracción de datos
  const vehicleData = await claude.analyze({
    images: images,
    text: payload.text,
    prompt: `Analiza estas fotos de un vehículo industrial. Extrae:
      - Marca, modelo, año
      - Tipo (cisterna, semirremolque, tractora, etc.)
      - Subtipo (alimentaria, frigorífico, lona, etc.)
      - Matrícula si es visible
      - Datos técnicos de placa/ficha (ejes, MMA, capacidad, etc.)
      - Kilometraje si hay foto del cuentakilómetros
      Genera título, descripción ES, descripción EN, y attributes_json.`,
  })

  // 4. Subir fotos a Cloudinary
  const cloudinaryUrls = await uploadToCloudinary(images, vehicleData.slug)

  // 5. Crear listing en Supabase
  const vehicle = await supabase.from('vehicles').insert({
    ...vehicleData,
    user_id: dealer.user_id,
    images: cloudinaryUrls,
    status: dealer.plan === 'founding' ? 'published' : 'draft',
    visible_from: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h exclusiva Pro
  })

  // 6. Responder al dealer por WhatsApp
  await sendWhatsAppMessage(
    payload.from,
    `✅ Vehículo publicado: https://tracciona.com/vehiculo/${vehicleData.slug}`,
  )

  return { ok: true }
})
```

**Costes:**

- WhatsApp Business API: ~50€/mes (vía proveedor como 360dialog, Twilio, o MessageBird)
- Claude Vision por vehículo: ~0,10-0,20€ (análisis de 5-10 fotos)
- Cloudinary por vehículo: despreciable con plan actual

**Impacto:** Multiplica velocidad de publicación de 3 vehículos/hora (manual) a 30+. Elimina la barrera principal de crecimiento del catálogo. El dealer solo necesita un smartphone.

**Pitch:**

> "Envíame las fichas técnicas por WhatsApp. Mañana tienes 30 vehículos publicados con fichas profesionales bilingües. Sin registrarte, sin subir nada, sin tocar ninguna web."

### I.2 Scraping de competidores para captación de dealers

**Concepto:** Script automático que scrapea diariamente Mascus, Europa-Camiones, Milanuncios y Autoline buscando vendedores profesionales. Genera lista de contactos para captación telefónica.

**Lógica:**

```typescript
// /scripts/scrape-competitors.ts (cron diario o semanal)
//
// 1. Scrapear las principales plataformas de competencia:
//    - Mascus.es: buscar vendedores con >5 anuncios activos
//    - Europa-Camiones.com: dealers con fichas profesionales
//    - Milanuncios.com: vendedores "profesional" en categoría vehículos industriales
//    - Autoline.es: dealers con catálogo
//
// 2. Para cada vendedor nuevo detectado, extraer:
//    - Nombre comercial
//    - Teléfono (si visible)
//    - Email (si visible)
//    - Ubicación
//    - Número de anuncios activos
//    - Tipos de vehículos que vende
//    - URL de su perfil en la plataforma
//
// 3. Guardar en tabla de leads:
```

**Migración SQL:**

```sql
CREATE TABLE dealer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  source VARCHAR NOT NULL, -- 'mascus', 'europa_camiones', 'milanuncios', 'autoline', 'manual'
  source_url TEXT,
  company_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  active_listings INT DEFAULT 0,
  vehicle_types TEXT[], -- ['cisternas', 'tractoras', 'semirremolques']
  -- Estado de captación
  status VARCHAR DEFAULT 'new', -- 'new', 'contacted', 'interested', 'onboarding', 'active', 'rejected'
  contacted_at TIMESTAMPTZ,
  contact_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id), -- Quién hace la llamada
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dealer_leads_status ON dealer_leads(status);
CREATE INDEX idx_dealer_leads_source ON dealer_leads(source);

-- Evitar duplicados por nombre + fuente
CREATE UNIQUE INDEX idx_dealer_leads_unique ON dealer_leads(source, company_name);
```

**Flujo de captación:**

```
Script scrapea → Genera lista → Admin revisa → Llama por teléfono (20-30% conversión)
→ Dealer interesado → Onboarding vía WhatsApp (I.1) → Founding Dealer o suscripción
```

**Nota:** Después del mes 12 con 100+ listings y tráfico orgánico, los dealers empiezan a venir solos. El esfuerzo de captación activa baja drásticamente.

### I.3 Auto-publicación en redes sociales

**Concepto:** Cada vehículo nuevo publicado genera automáticamente un post para LinkedIn (y opcionalmente Instagram/Facebook). Se puede publicar automáticamente o dejarlo en cola para aprobación.

**Flujo:**

```typescript
// Trigger post-INSERT en vehicles (cuando status = 'published'):
//
// 1. Generar contenido del post con Claude:
//    "🚛 Nuevo en Tracciona: Cisterna Indox Alimentaria 3 ejes (2019)
//     📍 Zaragoza | 💰 42.000€ | 🔄 Venta
//     ✅ Verificado | 📸 15 fotos
//     👉 tracciona.com/vehiculo/cisterna-indox-alimentaria-3-ejes-2019"
//
// 2. Seleccionar la mejor foto (la primera o la que Claude considere más atractiva)
//
// 3. Opción A — Auto-publicación:
//    - LinkedIn: POST https://api.linkedin.com/v2/ugcPosts (con OAuth2 de la empresa)
//    - Facebook: POST https://graph.facebook.com/v18.0/{page_id}/feed
//    - Instagram: POST vía Facebook Graph API (requiere cuenta business)
//
// 4. Opción B — Cola de aprobación:
//    - Guardar en tabla social_posts con status 'pending'
//    - Admin ve la cola en panel y aprueba/edita/rechaza
//    - Al aprobar → se publica vía API
```

**Migración SQL:**

```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  vehicle_id UUID REFERENCES vehicles(id),
  platform VARCHAR NOT NULL, -- 'linkedin', 'facebook', 'instagram', 'twitter'
  content TEXT NOT NULL,
  image_url TEXT,
  -- Estado
  status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'published', 'rejected'
  published_at TIMESTAMPTZ,
  platform_post_id VARCHAR, -- ID del post en la plataforma externa
  -- Métricas (actualizar periódicamente)
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Prioridad de plataformas:**

1. **LinkedIn** — Prioritario. B2B, profesionales del transporte. API bien documentada. Mayor conversión.
2. **Facebook** — Grupos de compraventa de vehículos industriales son muy activos en España.
3. **Instagram** — Fotos de vehículos funcionan bien visualmente. Reels de walkthroughs.
4. **Twitter/X** — Menor prioridad para B2B industrial.

### I.4 Facturación automática con Stripe

**Concepto:** Cada servicio cobrado genera factura automáticamente. Integración con software contable para que la contabilidad se mantenga al día sin intervención.

**Servicios facturables automáticamente:**

| Servicio                  | Evento Stripe              | Factura                    |
| ------------------------- | -------------------------- | -------------------------- |
| Anuncio destacado         | Subscription payment       | Factura recurrente mensual |
| Suscripción Pro           | Subscription payment       | Factura recurrente mensual |
| Suscripción dealer        | Subscription payment       | Factura recurrente mensual |
| Pase 72h                  | One-time payment           | Factura única              |
| Informe DGT               | One-time payment           | Factura única              |
| Inspección TI             | One-time payment           | Factura única              |
| Transporte                | One-time payment           | Factura única              |
| Gestión trámites          | One-time payment           | Factura única              |
| Buyer's premium (subasta) | Captured deposit + payment | Factura única              |

**Implementación:**

```typescript
// Stripe genera facturas automáticamente si se configura:
// 1. Crear cliente en Stripe con CIF/NIF y datos fiscales del comprador
// 2. Para suscripciones: Stripe genera factura en cada ciclo
// 3. Para pagos únicos: crear Invoice de Stripe antes del cobro
//
// Webhook de Stripe → /server/api/stripe-webhook.post.ts:
// - invoice.paid → guardar factura en tabla local + enviar PDF por email al cliente
// - invoice.payment_failed → notificar admin + reintentar

// Integración con software contable:
// Opción A — Holded (popular en España para startups):
//   POST https://api.holded.com/api/invoicing/v1/documents/invoice
//   Crear factura espejo en Holded con los datos de Stripe
//
// Opción B — Quaderno (especializado en SaaS/digital, gestiona IVA automáticamente):
//   Se integra directamente con Stripe via webhook propio
//
// Opción C — Export CSV mensual para gestoría:
//   Generar CSV con todas las facturas del mes y enviarlo a la gestoría
//   (solución más simple para empezar)
```

**Migración SQL:**

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_invoice_id VARCHAR UNIQUE,
  -- Datos fiscales
  customer_name TEXT NOT NULL,
  customer_tax_id VARCHAR, -- CIF/NIF
  customer_address TEXT,
  -- Detalle
  service_type VARCHAR NOT NULL, -- 'featured_ad', 'pro_subscription', 'dealer_subscription', 'dgt_report', 'inspection', 'transport', 'documentation', 'auction_premium'
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  tax_pct DECIMAL(4,2) DEFAULT 21.00, -- IVA 21%
  tax_cents BIGINT NOT NULL,
  total_cents BIGINT NOT NULL,
  -- Estado
  status VARCHAR DEFAULT 'paid', -- 'draft', 'sent', 'paid', 'void'
  pdf_url TEXT, -- URL del PDF de factura (generado por Stripe o propio)
  -- Contabilidad
  exported_to VARCHAR, -- 'holded', 'quaderno', 'csv', null
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_invoices_type ON invoices(service_type);
```

### I.5 Resumen de automatización por proceso

| Proceso                                | % Automático | Intervención humana             |
| -------------------------------------- | ------------ | ------------------------------- |
| Publicación de listings (vía WhatsApp) | 95%          | Revisión rápida si es draft     |
| Informes DGT                           | 100%         | Ninguna                         |
| Descripciones y SEO                    | 90%          | Revisión de 5 min por artículo  |
| Verificación de documentos (✓, ✓✓)     | 80%          | Solo si hay discrepancia        |
| Alertas y notificaciones               | 100%         | Ninguna                         |
| Publicación en redes sociales          | 90%          | Aprobar en cola (1 clic)        |
| Facturación                            | 100%         | Ninguna                         |
| Captación de dealers (scraping)        | 50%          | Llamada telefónica              |
| Onboarding de dealers                  | 80%          | Primer contacto personal        |
| Gestión documental (transferencias)    | 80%          | Coordinación con gestoría       |
| Coordinación de transporte             | 70%          | Fecha/hora con transportista    |
| Inspecciones                           | 30%          | Mecánico in situ + coordinación |

---
