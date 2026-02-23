## ANEXO W: PANEL DE CONFIGURACIÓN — ADMIN DE VERTICAL Y PORTAL DE DEALER

### W.1 Principio

**Cero VS Code para operar.** Todo lo que afecta a la apariencia, el contenido, la estructura de categorías, los idiomas, los precios, las comisiones, la identidad del dealer, el calendario editorial y el estado del sistema debe ser editable desde una UI de administración en el navegador. Esto es lo que permite que una persona no técnica opere la vertical, y lo que permite clonar una vertical nueva en horas en vez de días.

### W.2 Tabla `vertical_config`

Una sola fila por vertical. Contiene TODA la configuración.

```sql
CREATE TABLE vertical_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR UNIQUE NOT NULL, -- 'tracciona', 'horecaria', etc.

  -- IDENTIDAD VISUAL
  name JSONB NOT NULL,              -- {"es": "Tracciona", "en": "Tracciona", "fr": "Tracciona"}
  tagline JSONB,                    -- {"es": "El marketplace de vehículos industriales", ...}
  meta_description JSONB,           -- {"es": "Compra y vende...", ...}
  logo_url TEXT,                    -- URL Cloudinary del logo principal
  logo_dark_url TEXT,               -- Logo para fondo oscuro (si aplica)
  favicon_url TEXT,
  og_image_url TEXT,                -- Imagen por defecto para compartir en redes

  -- COLORES (CSS custom properties)
  theme JSONB NOT NULL DEFAULT '{
    "primary": "#2D5BFF",
    "primary_hover": "#1A3DB8",
    "secondary": "#0B8A4B",
    "accent": "#D4760A",
    "background": "#FAFAF8",
    "surface": "#FFFFFF",
    "surface_alt": "#F3F2EE",
    "text": "#1A1A18",
    "text_secondary": "#4A4A45",
    "text_muted": "#8A8A82",
    "border": "#E5E4E0",
    "error": "#C23A3A",
    "success": "#0B8A4B",
    "warning": "#D4760A"
  }',

  -- TIPOGRAFÍA
  font_preset VARCHAR DEFAULT 'default', -- 'default', 'industrial', 'modern', 'classic'
  -- Presets definidos en CSS:
  -- default:    DM Sans + Instrument Serif
  -- industrial: Inter + Space Grotesk
  -- modern:     Plus Jakarta Sans + Sora
  -- classic:    Source Serif Pro + Source Sans Pro

  -- HEADER
  header_links JSONB DEFAULT '[]',
  -- [{"label": {"es": "Catálogo", "en": "Catalog"}, "url": "/catalogo", "visible": true, "order": 1},
  --  {"label": {"es": "Subastas", "en": "Auctions"}, "url": "/subastas", "visible": false, "order": 2},
  --  {"label": {"es": "Guía", "en": "Guide"}, "url": "/guia", "visible": true, "order": 3}]

  -- FOOTER
  footer_text JSONB,                -- {"es": "© 2026 Tracciona. Todos los derechos reservados.", ...}
  footer_links JSONB DEFAULT '[]',  -- Mismo formato que header_links
  social_links JSONB DEFAULT '{}',  -- {"linkedin": "https://...", "instagram": "https://...", "facebook": "...", "x": "..."}

  -- HOMEPAGE
  hero_title JSONB,                 -- {"es": "Compra y vende vehículos industriales", ...}
  hero_subtitle JSONB,              -- {"es": "El primer marketplace moderno del sector", ...}
  hero_cta_text JSONB,              -- {"es": "Ver catálogo", ...}
  hero_cta_url VARCHAR DEFAULT '/catalogo',
  hero_image_url TEXT,
  homepage_sections JSONB DEFAULT '{
    "featured_vehicles": true,
    "categories_grid": true,
    "latest_news": true,
    "comparatives": false,
    "auctions": false,
    "stats_counter": true,
    "dealer_logos": false,
    "newsletter_cta": true
  }',

  -- IDIOMAS
  active_locales TEXT[] DEFAULT '{es,en}',
  -- Activar francés = UPDATE vertical_config SET active_locales = '{es,en,fr}' WHERE vertical = 'tracciona'
  -- La UI lo muestra como checkboxes
  default_locale VARCHAR(5) DEFAULT 'es',

  -- ACCIONES ACTIVAS
  active_actions TEXT[] DEFAULT '{venta,alquiler}',
  -- ¿Tiene subastas? → añadir 'subasta' al array
  -- ¿Tiene alquiler? → quitar 'alquiler' del array

  -- SEO E INTEGRACIONES
  google_analytics_id VARCHAR,       -- 'G-XXXXXXXXXX'
  google_search_console VARCHAR,     -- Verification meta tag content
  google_adsense_id VARCHAR,
  cloudinary_cloud_name VARCHAR,
  translation_api_key_encrypted TEXT, -- GPT-4o mini API key (encrypted)
  translation_engine VARCHAR DEFAULT 'gpt4omini', -- 'gpt4omini', 'claude_haiku', 'deepl'

  -- MONETIZACIÓN
  subscription_prices JSONB DEFAULT '{
    "free":     {"monthly_cents": 0,     "annual_cents": 0},
    "basic":    {"monthly_cents": 2900,  "annual_cents": 29000},
    "premium":  {"monthly_cents": 7900,  "annual_cents": 79000},
    "founding": {"monthly_cents": 0,     "annual_cents": 0, "note": "Gratis permanente"}
  }',
  commission_rates JSONB DEFAULT '{
    "sale_pct": 0,
    "auction_buyer_premium_pct": 8.0,
    "transport_commission_pct": 10.0,
    "transfer_commission_pct": 15.0,
    "verification_level1_cents": 0,
    "verification_level2_cents": 4900,
    "verification_level3_cents": 14900
  }',

  -- EMAIL TEMPLATES
  email_templates JSONB DEFAULT '{
    "dealer_welcome": {"subject": {"es": "Bienvenido a Tracciona"}, "body": {"es": "..."}},
    "lead_notification": {"subject": {"es": "Nuevo contacto para tu vehículo"}, "body": {"es": "..."}},
    "vehicle_published": {"subject": {"es": "Tu vehículo se ha publicado"}, "body": {"es": "..."}},
    "auction_starting": {"subject": {"es": "Tu subasta comienza en 24h"}, "body": {"es": "..."}},
    "weekly_stats": {"subject": {"es": "Tu resumen semanal"}, "body": {"es": "..."}}
  }',

  -- BANNERS INTERNOS
  banners JSONB DEFAULT '[]',
  -- [{"id": "banner1", "position": "hero_top", "content": {"es": "🎉 Lanzamiento..."},
  --   "url": "/founding", "active": true, "starts_at": "2026-03-01", "ends_at": "2026-04-01",
  --   "bg_color": "#2D5BFF", "text_color": "#FFFFFF"}]

  -- MODERACIÓN Y SISTEMA
  require_vehicle_approval BOOLEAN DEFAULT false, -- ¿Los vehículos nuevos necesitan aprobación?
  require_article_approval BOOLEAN DEFAULT false,
  auto_translate_on_publish BOOLEAN DEFAULT true,
  auto_publish_social BOOLEAN DEFAULT false,       -- ¿Publicar en redes automáticamente o con aprobación?

  -- METADATOS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed con configuración de Tracciona
INSERT INTO vertical_config (vertical, name, tagline) VALUES (
  'tracciona',
  '{"es": "Tracciona", "en": "Tracciona"}',
  '{"es": "El marketplace de vehículos industriales", "en": "The industrial vehicle marketplace"}'
);

ALTER TABLE vertical_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vertical_config_public_read" ON vertical_config FOR SELECT USING (true);
CREATE POLICY "vertical_config_admin_write" ON vertical_config FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
```

### W.3 Composable `useVerticalConfig()`

```typescript
// composables/useVerticalConfig.ts

const VERTICAL = 'tracciona' // Cambia por vertical al clonar

export function useVerticalConfig() {
  const config = useState<VerticalConfig | null>('vertical_config', () => null)

  async function loadConfig() {
    if (config.value) return config.value
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('vertical_config')
      .select('*')
      .eq('vertical', VERTICAL)
      .single()
    config.value = data
    return data
  }

  // Inyectar CSS custom properties desde la BD
  function applyTheme(theme: Record<string, string>) {
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/_/g, '-')}`, value)
    })
  }

  // Verificar si una sección está activa
  function isSectionActive(section: string): boolean {
    return config.value?.homepage_sections?.[section] ?? false
  }

  // Verificar si un idioma está activo
  function isLocaleActive(locale: string): boolean {
    return config.value?.active_locales?.includes(locale) ?? false
  }

  // Verificar si una acción está activa
  function isActionActive(action: string): boolean {
    return config.value?.active_actions?.includes(action) ?? false
  }

  return { config, loadConfig, applyTheme, isSectionActive, isLocaleActive, isActionActive }
}
```

### W.4 Campos del portal de dealer (en tabla `dealers`)

```sql
-- Añadir a la tabla dealers (definida en Anexo V.1):
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}';
-- Hereda de vertical_config.theme por defecto. El dealer puede sobreescribir:
-- {"primary": "#E63946", "accent": "#457B9D"}
-- Los campos no definidos se heredan de la vertical.

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{}';
-- {"es": "Transportes García lleva 30 años...", "en": "Garcia Transport has been..."}

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS contact_config JSONB DEFAULT '{
  "show_phone": true,
  "show_email": true,
  "show_address": true,
  "show_website": true,
  "phone_mode": "visible",
  "cta_text": {"es": "Contactar", "en": "Contact"},
  "auto_reply_text": {"es": "Gracias por contactar con nosotros. Responderemos en 24h.", "en": "Thank you for reaching out. We will reply within 24h."},
  "working_hours": {"es": "Lunes a Viernes 9:00-18:00", "en": "Monday to Friday 9:00-18:00"}
}';
-- phone_mode: 'visible' (cualquiera ve), 'click_to_reveal' (requiere clic), 'form_only' (solo formulario)

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
-- {"linkedin": "...", "instagram": "...", "facebook": "...", "youtube": "..."}

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
-- [{"label": {"es": "Dealer oficial Schmitz", "en": "Official Schmitz dealer"}, "icon": "badge", "verified": true},
--  {"label": {"es": "ISO 9001", "en": "ISO 9001"}, "icon": "shield", "verified": false}]

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS pinned_vehicles UUID[] DEFAULT '{}';
-- Hasta 5 vehículos fijados arriba en su portal

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS catalog_sort VARCHAR DEFAULT 'newest';
-- 'newest', 'price_asc', 'price_desc', 'featured_first'

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- Banner de cabecera del portal del dealer

ALTER TABLE dealers ADD COLUMN IF NOT EXISTS notification_config JSONB DEFAULT '{
  "email_on_lead": true,
  "email_on_sale": true,
  "email_weekly_stats": true,
  "email_auction_updates": true,
  "push_enabled": false
}';
```

### W.5 Composable `useDealerTheme()`

```typescript
// composables/useDealerTheme.ts

export function useDealerTheme() {
  const { config: verticalConfig } = useVerticalConfig()

  /**
   * Merge dealer theme over vertical theme.
   * Dealer overrides only what they set; rest inherits from vertical.
   */
  function mergedTheme(dealerTheme: Record<string, string> | null): Record<string, string> {
    const base = verticalConfig.value?.theme || {}
    if (!dealerTheme || Object.keys(dealerTheme).length === 0) return base
    return { ...base, ...dealerTheme }
  }

  function applyDealerTheme(dealerTheme: Record<string, string> | null) {
    const theme = mergedTheme(dealerTheme)
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/_/g, '-')}`, value)
    })
  }

  return { mergedTheme, applyDealerTheme }
}
```

### W.6 UI del panel de administración — Secciones

El panel de admin (`/admin/`) tiene estas secciones de configuración:

#### W.6.1 Identidad visual (`/admin/config/branding`)

```
┌─────────────────────────────────────────────┐
│ 🎨 Identidad Visual                         │
├─────────────────────────────────────────────┤
│ Logo principal:    [📎 Subir imagen]         │
│ Logo oscuro:       [📎 Subir imagen]         │
│ Favicon:           [📎 Subir imagen]         │
│ OG Image:          [📎 Subir imagen]         │
│                                             │
│ Nombre:            [Tracciona          ] 🌐  │
│ Tagline:           [El marketplace...  ] 🌐  │
│ Meta description:  [Compra y vende...  ] 🌐  │
│                                             │
│ 🌐 = botón para editar en otros idiomas      │
│                                             │
│ Preset tipográfico: [▼ Default (DM Sans)]    │
│   ○ Default    ○ Industrial    ○ Modern      │
│   ○ Classic                                  │
│                                             │
│ COLORES                                      │
│ Primario:     [■ #2D5BFF] [color picker]     │
│ Secundario:   [■ #0B8A4B] [color picker]     │
│ Acento:       [■ #D4760A] [color picker]     │
│ Fondo:        [■ #FAFAF8] [color picker]     │
│ Texto:        [■ #1A1A18] [color picker]     │
│ Borde:        [■ #E5E4E0] [color picker]     │
│                                             │
│ [Vista previa en tiempo real]                │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.2 Navegación (`/admin/config/navigation`)

```
┌─────────────────────────────────────────────┐
│ 🧭 Navegación                                │
├─────────────────────────────────────────────┤
│ HEADER                                       │
│ ┌──────────────────────────────────────────┐ │
│ │ ≡ Catálogo        /catalogo      ☑ activo│ │
│ │ ≡ Guía           /guia          ☑ activo│ │
│ │ ≡ Subastas        /subastas      ☐ oculto│ │
│ │ ≡ Dealers         /dealers       ☑ activo│ │
│ │                                          │ │
│ │ [+ Añadir enlace]                        │ │
│ └──────────────────────────────────────────┘ │
│ (Arrastrar para reordenar)                   │
│                                             │
│ FOOTER                                       │
│ ┌──────────────────────────────────────────┐ │
│ │ Texto legal: [© 2026 Tracciona...  ] 🌐  │ │
│ │                                          │ │
│ │ Enlaces: (mismo drag-and-drop)           │ │
│ │ ≡ Legal           /legal         ☑       │ │
│ │ ≡ Privacidad      /privacidad    ☑       │ │
│ │ ≡ Cookies         /cookies       ☑       │ │
│ │ ≡ Condiciones     /condiciones   ☑       │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ REDES SOCIALES                               │
│ LinkedIn:  [https://linkedin.com/company/...]│
│ Instagram: [https://instagram.com/...]       │
│ Facebook:  [https://facebook.com/...]        │
│ X:         [                            ]    │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.3 Homepage (`/admin/config/homepage`)

```
┌─────────────────────────────────────────────┐
│ 🏠 Homepage                                  │
├─────────────────────────────────────────────┤
│ HERO                                         │
│ Título:     [Compra y vende vehículos...] 🌐 │
│ Subtítulo:  [El primer marketplace...   ] 🌐 │
│ CTA texto:  [Ver catálogo              ] 🌐  │
│ CTA URL:    [/catalogo                 ]     │
│ Imagen hero: [📎 Subir imagen]               │
│                                             │
│ SECCIONES (arrastrar para reordenar)         │
│ ┌──────────────────────────────────────────┐ │
│ │ ☑ Vehículos destacados                   │ │
│ │ ☑ Grid de categorías                     │ │
│ │ ☑ Últimas noticias                       │ │
│ │ ☐ Comparativas recientes                 │ │
│ │ ☐ Subastas activas                       │ │
│ │ ☑ Contador de estadísticas               │ │
│ │ ☐ Logos de dealers destacados             │ │
│ │ ☑ CTA newsletter                         │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ BANNERS PROMOCIONALES                        │
│ ┌──────────────────────────────────────────┐ │
│ │ Banner 1: "🎉 Founding Dealer..."        │ │
│ │ Posición: [▼ Encima del hero]            │ │
│ │ Color fondo: [■ #2D5BFF]  Texto: [■ #FFF]│ │
│ │ URL: [/founding]                         │ │
│ │ Activo: ☑  Desde: [01/03/2026]           │ │
│ │            Hasta: [01/04/2026]           │ │
│ │ [Eliminar]                               │ │
│ └──────────────────────────────────────────┘ │
│ [+ Añadir banner]                            │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.4 Catálogo (`/admin/config/catalog`)

```
┌─────────────────────────────────────────────┐
│ 📦 Catálogo                                  │
├─────────────────────────────────────────────┤
│ ACCIONES ACTIVAS                             │
│ ☑ Venta    ☑ Alquiler    ☐ Subasta          │
│                                             │
│ CATEGORÍAS                                   │
│ ┌──────────────────────────────────────────┐ │
│ │ ≡ 🚛 Cisternas        [✏️] [👁] [🗑]     │ │
│ │   ├─ Alimentarias      [✏️] [👁] [🗑]     │ │
│ │   ├─ Combustibles      [✏️] [👁] [🗑]     │ │
│ │   ├─ Químicas          [✏️] [👁] [🗑]     │ │
│ │   └─ ADR               [✏️] [👁] [🗑]     │ │
│ │ ≡ 🚛 Tractoras         [✏️] [👁] [🗑]     │ │
│ │ ≡ 🚛 Semirremolques    [✏️] [👁] [🗑]     │ │
│ │   ├─ Lona              [✏️] [👁] [🗑]     │ │
│ │   ├─ Frigorífico       [✏️] [👁] [🗑]     │ │
│ │   └─ Plataforma        [✏️] [👁] [🗑]     │ │
│ │ [+ Añadir categoría]                     │ │
│ └──────────────────────────────────────────┘ │
│ ✏️ = editar nombre (multi-idioma)            │
│ 👁 = visible/oculto                          │
│ 🗑 = eliminar (solo si 0 vehículos)          │
│ ≡ = arrastrar para reordenar                 │
│                                             │
│ ATRIBUTOS (FILTROS)                          │
│ ┌──────────────────────────────────────────┐ │
│ │ Capacidad (L)    tipo: rango    [✏️] [🗑] │ │
│ │   Aplica a: ☑ Cisternas ☐ Tractoras      │ │
│ │ Ejes             tipo: select   [✏️] [🗑] │ │
│ │   Aplica a: ☑ Todos                      │ │
│ │ ADR              tipo: boolean  [✏️] [🗑] │ │
│ │   Aplica a: ☑ Cisternas ☑ Semirremolques │ │
│ │ Potencia (CV)    tipo: rango    [✏️] [🗑] │ │
│ │   Aplica a: ☑ Tractoras ☑ Rígidos        │ │
│ │ [+ Añadir atributo]                      │ │
│ └──────────────────────────────────────────┘ │
│ Tipos disponibles: rango, select, boolean,   │
│ text, multi-select                           │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.5 Idiomas (`/admin/config/languages`)

```
┌─────────────────────────────────────────────┐
│ 🌐 Idiomas                                   │
├─────────────────────────────────────────────┤
│ IDIOMAS ACTIVOS                              │
│ ☑ Español (ES) — default                    │
│ ☑ English (EN)                               │
│ ☐ Français (FR)                              │
│ ☐ Deutsch (DE)                               │
│ ☐ Nederlands (NL)                            │
│ ☐ Polski (PL)                                │
│ ☐ Italiano (IT)                              │
│                                             │
│ Idioma por defecto: [▼ Español]              │
│                                             │
│ MOTOR DE TRADUCCIÓN                          │
│ Motor: [▼ GPT-4o mini (recomendado)]         │
│   ○ GPT-4o mini — 0,001€/ficha (técnico)    │
│   ○ Claude Haiku — 0,005€/ficha (mejor)     │
│   ○ DeepL — 0,024€/ficha (premium)          │
│ API Key: [sk-••••••••••••••••] [👁]          │
│                                             │
│ Traducción automática al publicar: ☑         │
│                                             │
│ ESTADO DE TRADUCCIONES                       │
│ ┌──────────────────────────────────────────┐ │
│ │ ES: ████████████████████ 500/500 (100%)  │ │
│ │ EN: ████████████████░░░░ 420/500 (84%)   │ │
│ │ FR: ░░░░░░░░░░░░░░░░░░░░  0/500 (0%)    │ │
│ │ DE: ░░░░░░░░░░░░░░░░░░░░  0/500 (0%)    │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ Cola de traducción: 80 fichas pendientes     │
│ [▶ Traducir todo ahora]  [⏸ Pausar cola]    │
│                                             │
│ Último batch: hace 2 horas (80 fichas, 0,08€)│
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.6 Monetización (`/admin/config/pricing`)

```
┌─────────────────────────────────────────────┐
│ 💰 Precios y Comisiones                      │
├─────────────────────────────────────────────┤
│ SUSCRIPCIONES DEALER                         │
│ ┌──────────────────────────────────────────┐ │
│ │ Free:     0€/mes      0€/año             │ │
│ │ Basic:    [29]€/mes    [290]€/año         │ │
│ │ Premium:  [79]€/mes    [790]€/año         │ │
│ │ Founding: 0€/mes (permanente)             │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ COMISIONES                                   │
│ Venta directa:           [0] %               │
│ Subasta (buyer premium): [8.0] %             │
│ Transporte (IberHaul):   [10.0] %            │
│ Transferencia (Gesturban):[15.0] %           │
│ Verificación Nivel 2:    [49.00] €           │
│ Verificación Nivel 3:    [149.00] €          │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.7 SEO e Integraciones (`/admin/config/integrations`)

```
┌─────────────────────────────────────────────┐
│ 🔧 SEO e Integraciones                       │
├─────────────────────────────────────────────┤
│ GOOGLE                                       │
│ Analytics ID:         [G-XXXXXXXXXX    ]     │
│ Search Console:       [meta verification]    │
│ AdSense ID:           [ca-pub-XXXXXXXX ]     │
│                                             │
│ CLOUDINARY                                   │
│ Cloud name:           [tracciona       ]     │
│                                             │
│ ROBOTS.TXT                                   │
│ ┌──────────────────────────────────────────┐ │
│ │ User-agent: *                            │ │
│ │ Allow: /                                 │ │
│ │ Disallow: /admin/                        │ │
│ │ Sitemap: https://tracciona.com/sitemap   │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.8 Emails (`/admin/config/emails`)

```
┌─────────────────────────────────────────────┐
│ ✉️ Templates de Email                         │
├─────────────────────────────────────────────┤
│ Seleccionar template:                        │
│ [▼ Bienvenida dealer                    ]    │
│                                             │
│ Asunto: [Bienvenido a Tracciona       ] 🌐   │
│                                             │
│ Cuerpo (Markdown):                           │
│ ┌──────────────────────────────────────────┐ │
│ │ Hola {{dealer_name}},                    │ │
│ │                                          │ │
│ │ Bienvenido a Tracciona. Tu portal está   │ │
│ │ listo en: {{dealer_url}}                 │ │
│ │                                          │ │
│ │ Variables: {{dealer_name}},              │ │
│ │ {{dealer_url}}, {{vehicle_title}},       │ │
│ │ {{lead_name}}, {{lead_email}}            │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ [👁 Vista previa]  [📧 Enviar test]          │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.9 Editorial (`/admin/config/editorial`)

```
┌─────────────────────────────────────────────┐
│ 📝 Contenido Editorial                       │
├─────────────────────────────────────────────┤
│ CALENDARIO (vista semanal)                   │
│ ┌──────────────────────────────────────────┐ │
│ │ Lu   Ma       Mi     Ju       Vi   Sa Do│ │
│ │      📗09:00         📘09:00             │ │
│ │ 📱10  📱09    📱11   📱10    📱12        │ │
│ │                                          │ │
│ │ 📗 = artículo web  📘 = noticia          │ │
│ │ 📱 = post redes    (arrastrar para mover)│ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ ARTÍCULOS PROGRAMADOS                        │
│ ┌──────────────────────────────────────────┐ │
│ │ 🟢 "Cómo elegir cisterna" — Mar 09:00    │ │
│ │ 🟢 "Normativa ADR 2026"   — Jue 09:00   │ │
│ │ 🟡 "Schmitz vs Kögel"     — borrador     │ │
│ │    SEO Score: 52/100 ⚠️ [Mejorar]        │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ TAGS                                         │
│ ┌──────────────────────────────────────────┐ │
│ │ cisternas (24)  adr (12)  schmitz (8)    │ │
│ │ alimentaria (15)  kögel (5)  normativa(7)│ │
│ │ [Fusionar tags]  [Eliminar sin uso]      │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ Publicación automática en redes: ☐           │
│ (Si ☑, publica social_post_text al publicar  │
│  el artículo. Si ☐, el admin lo hace manual) │
│                                             │
│ TEMPLATES POR SECCIÓN                        │
│ [▼ Guías] — Estructura base:                │
│ ┌──────────────────────────────────────────┐ │
│ │ ## Introducción                          │ │
│ │ ## Factores a considerar                 │ │
│ │ ## Comparativa                           │ │
│ │ ## Preguntas frecuentes                  │ │
│ │ ## Conclusión                            │ │
│ └──────────────────────────────────────────┘ │
│ [✏️ Editar template] [👁 Vista previa]       │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

#### W.6.10 Sistema (`/admin/config/system`)

```
┌─────────────────────────────────────────────┐
│ ⚙️ Sistema                                    │
├─────────────────────────────────────────────┤
│ MODERACIÓN                                   │
│ Aprobar vehículos antes de publicar: ☐       │
│ Aprobar artículos antes de publicar: ☐       │
│                                             │
│ COLA DE MODERACIÓN                           │
│ ┌──────────────────────────────────────────┐ │
│ │ 3 vehículos pendientes                   │ │
│ │ 1 artículo pendiente                     │ │
│ │ [Ver cola →]                             │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ CRONS Y TAREAS                               │
│ ┌──────────────────────────────────────────┐ │
│ │ Auto-publish:    🟢 Activo (cada 15 min) │ │
│ │   Último run: hace 8 min                 │ │
│ │   Publicados hoy: 2 artículos            │ │
│ │                                          │ │
│ │ Traducción:      🟢 Activo (cada 3h)     │ │
│ │   Último run: hace 1h 23min              │ │
│ │   Pendientes: 12 fichas                  │ │
│ │   Errores: 0                             │ │
│ │                                          │ │
│ │ Sitemap:         🟢 Regenerado hace 2h   │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ LOGS DE ACTIVIDAD                            │
│ ┌──────────────────────────────────────────┐ │
│ │ 14:32 Admin editó categoría "Cisternas"  │ │
│ │ 14:28 Sistema publicó "Normativa ADR"    │ │
│ │ 14:15 Dealer García subió 3 vehículos    │ │
│ │ 13:50 Sistema tradujo 15 fichas (EN)     │ │
│ │ [Ver todos →]                            │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ CACHE                                        │
│ [🗑 Invalidar cache sitemap]                 │
│ [🗑 Invalidar cache páginas estáticas]       │
│ [🗑 Regenerar hreflang]                      │
│                                             │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

### W.7 Portal del dealer — UI de personalización

El dealer accede a su configuración desde `/admin/dealer/config` (si es admin de su cuenta):

```
┌─────────────────────────────────────────────┐
│ 🏪 Mi Portal — Configuración                │
├─────────────────────────────────────────────┤
│ IDENTIDAD                                    │
│ Logo:          [📎 Subir]  [vista previa]    │
│ Portada:       [📎 Subir]  [vista previa]    │
│ Nombre empresa: [Transportes García   ] 🌐   │
│                                             │
│ COLORES DE ACENTO (hereda de Tracciona)      │
│ Primario:     [■ #E63946] [color picker]     │
│ Acento:       [■ #457B9D] [color picker]     │
│ [↩️ Restaurar colores de Tracciona]          │
│                                             │
│ SOBRE NOSOTROS                               │
│ Bio: [                                  ] 🌐 │
│ ┌──────────────────────────────────────────┐ │
│ │ Transportes García lleva 30 años en el   │ │
│ │ sector del transporte de mercancías...   │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ CONTACTO                                     │
│ Teléfono:  [+34 987 654 321]                │
│ Email:     [info@transportesgarcia.es]       │
│ Web:       [https://transportesgarcia.es]    │
│ Dirección: [Pol. Ind. Onzonilla, León]       │
│ Horario:   [L-V 9:00-18:00           ] 🌐   │
│                                             │
│ Mostrar teléfono: [▼ Visible para todos]     │
│   ○ Visible    ○ Click to reveal    ○ Solo   │
│                  formulario                  │
│ Texto CTA: [Pide presupuesto         ] 🌐   │
│                                             │
│ REDES SOCIALES                               │
│ LinkedIn:  [https://...]                     │
│ Instagram: [https://...]                     │
│ Facebook:  [https://...]                     │
│ YouTube:   [https://...]                     │
│                                             │
│ CERTIFICACIONES                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🏅 Dealer oficial Schmitz    ☑ verificado│ │
│ │ 🛡️ ISO 9001                  ☐ pendiente │ │
│ │ [+ Añadir certificación]                 │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ CATÁLOGO                                     │
│ Ordenación: [▼ Más recientes primero]        │
│ Vehículos fijados (máx 5):                   │
│ ┌──────────────────────────────────────────┐ │
│ │ 📌 Cisterna Indox 25.000L [×]            │ │
│ │ 📌 Schmitz Cargobull S.CO [×]            │ │
│ │ [+ Fijar vehículo]                       │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ RESPUESTA AUTOMÁTICA A LEADS                 │
│ ┌──────────────────────────────────────────┐ │
│ │ Gracias por contactar con Transportes    │ │
│ │ García. Responderemos en 24h.            │ │
│ └──────────────────────────────────────────┘ │
│                                             │
│ NOTIFICACIONES                               │
│ ☑ Email cuando reciba un lead               │
│ ☑ Email cuando se venda un vehículo          │
│ ☑ Resumen semanal de estadísticas            │
│ ☑ Actualizaciones de subastas                │
│                                             │
│ [👁 Vista previa de mi portal]               │
│              [💾 Guardar cambios]             │
└─────────────────────────────────────────────┘
```

### W.8 Clonar vertical con la UI

Con este sistema, clonar una vertical nueva (ej: Horecaria) es:

```
1. INSERT INTO vertical_config (vertical, name, ...) VALUES ('horecaria', '{"es":"Horecaria"}', ...);
2. En /admin/config/branding → subir logo Horecaria, cambiar colores
3. En /admin/config/catalog → crear categorías: Horno, Freidora, Refrigeración...
4. En /admin/config/catalog → crear atributos: Capacidad, Potencia, Gas/Eléctrico...
5. En /admin/config/languages → activar idiomas
6. En /admin/config/navigation → configurar header y footer
7. En /admin/config/homepage → configurar hero y secciones
8. Deploy del mismo código con variable VERTICAL='horecaria'

Tiempo estimado: 2-4 horas. Cero código.
```

### W.9 Tabla de logs de actividad

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical VARCHAR NOT NULL,
  user_id UUID REFERENCES users(id),
  actor_type VARCHAR NOT NULL, -- 'admin', 'dealer', 'system', 'cron'
  action VARCHAR NOT NULL,     -- 'create', 'update', 'delete', 'publish', 'translate', 'login'
  entity_type VARCHAR,         -- 'vehicle', 'article', 'dealer', 'category', 'config'
  entity_id UUID,
  details JSONB DEFAULT '{}',  -- Detalles del cambio: {"field": "name", "old": "...", "new": "..."}
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_vertical ON activity_logs(vertical, created_at DESC);
CREATE INDEX idx_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
-- Solo admin puede leer logs
CREATE POLICY "logs_admin_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND au.raw_user_meta_data->>'role' = 'admin')
);
-- Sistema puede escribir (service role)
```

---
