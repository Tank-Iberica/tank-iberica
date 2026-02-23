## ANEXO P: CONTENIDO EDITORIAL — GUÍAS Y NOTICIAS COMO SEO

### P.1 Estructura de URLs de contenido editorial

> **DECISIÓN SEO (17 Feb):** Eliminar `/comunicacion/`. Usar `/guia/` para evergreen y `/noticias/` para temporal.
> Normativa, comparativas y cualquier contenido que alguien buscaría en Google dentro de 12 meses va en `/guia/`.
> Noticias temporales de eventos van a LinkedIn/WhatsApp. Solo publicar en `/noticias/` si tiene valor SEO a 3+ meses.

```
/guia/                                → Índice de guías (evergreen: normativa, comparativas, guías de compra)
/guia/[slug]                          → Guía individual (/guia/normativa-adr-cisternas)
/noticias/                            → Índice de noticias (temporal con valor SEO a 3+ meses)
/noticias/[slug]                      → Noticia individual (/noticias/nuevo-reglamento-adr-2027)
```

**Criterio de publicación:**

- `/guia/`: ¿Alguien buscaría esto en Google dentro de 12 meses? → Sí → `/guia/`
- `/noticias/`: ¿Tiene valor SEO a 3+ meses? → Sí → `/noticias/`. ¿No? → LinkedIn/WhatsApp
- Nunca publicar noticias temporales de eventos en la web (diluye el dominio)

### P.2 Tipos de contenido y su función SEO

| Sección          | Ejemplo                                            | Frecuencia | Función SEO                                      | Vida útil                          |
| ---------------- | -------------------------------------------------- | ---------- | ------------------------------------------------ | ---------------------------------- |
| **Guías**        | "Cómo elegir una cisterna alimentaria"             | 2/mes      | Long-tail informacional, featured snippets       | Evergreen (actualizar anualmente)  |
| **Noticias**     | "Nuevo reglamento ADR 2027 entra en vigor"         | 2-4/mes    | Freshness signal, Google News, redes sociales    | Temporal (3-6 meses relevancia)    |
| **Normativa**    | "Normativa ITV para semirremolques: guía completa" | 1/mes      | Autoridad E-E-A-T, backlinks de foros del sector | Semi-evergreen                     |
| **Comparativas** | "Schmitz vs Kögel vs Krone: ¿qué lona comprar?"    | 1/mes      | Alto CTR, decision-stage keywords                | Evergreen (actualizar con precios) |

**Por qué `/guia/` y no `/blog/` o `/comunicacion/`:**

- `/guia/normativa-adr-cisternas` tiene keywords en la URL y Google entiende "guía" como contenido de valor
- `/comunicacion/` suena a departamento de prensa corporativo (decisión SEO 17 Feb)
- Un solo nivel de carpeta (`/guia/slug`) = SEO óptimo sin colisiones de rutas
- El índice `/guia/` es landing page indexable con internal linking a todas las guías
- Las noticias relevantes en `/noticias/` dan "freshness signal" sin diluir `/guia/`

### P.3 Integración con landing pages de catálogo

Cada guía y artículo incluye enlaces contextuales al catálogo:

```
En el artículo "Cómo elegir una cisterna alimentaria":
- "Ver cisternas alimentarias disponibles" → /cisternas-alimentarias
- "Comparar precios de cisternas Indox" → /cisternas-indox (flat, sin /marcas/)
- Sidebar: "23 cisternas alimentarias en stock" con snippet del catálogo
- CTA al final: "¿Buscas una cisterna alimentaria? [Ver catálogo]"
```

**Esto crea un ciclo de internal linking:**

```
Landing de categoría ← enlaza → Guías relacionadas
Ficha de vehículo   ← enlaza → Guía de compra del tipo
Guía                ← enlaza → Landing de categoría + fichas
Noticia             ← enlaza → Guías + Landing cuando relevante
```

### P.4 Schema y SEO técnico de artículos

```javascript
// Cada artículo editorial genera:
{
  "@type": "Article",        // o "NewsArticle" para noticias
  "headline": "...",
  "datePublished": "...",
  "dateModified": "...",
  "author": { "@type": "Organization", "name": "Tracciona" },
  "publisher": { "@type": "Organization", "name": "Tracciona" },
  "image": "...",
  "articleSection": "Guías",  // o "Noticias", "Normativa", "Comparativas"
  "breadcrumb": { ... }
}

// FAQ Schema en guías (para featured snippets):
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Qué capacidad de cisterna necesito?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

### P.5 Tabla de contenido editorial para BD

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR UNIQUE NOT NULL,
  vertical VARCHAR NOT NULL DEFAULT 'tracciona',
  section VARCHAR NOT NULL, -- 'guia' o 'noticias' (normativa y comparativas van como 'guia')
  title JSONB NOT NULL,     -- {"es": "Cómo elegir...", "en": "How to choose...", "fr": "Comment choisir..."}
  meta_description JSONB,   -- {"es": "...", "en": "...", ...}
  -- El contenido largo va en content_translations (ver Anexo T.3)
  -- NO se guardan content_es/content_en aquí
  excerpt JSONB,             -- {"es": "Resumen...", "en": "Summary..."} — para índices y redes
  cover_image_url TEXT,
  author VARCHAR DEFAULT 'Tracciona',
  tags TEXT[],               -- ['cisternas', 'alimentaria', 'ADR']
  related_categories TEXT[], -- ['cisternas-alimentarias', 'cisternas-adr']
  faq_schema JSONB,          -- FAQ schema generado por IA para featured snippets

  -- Publicación y programación (ver Anexo U):
  status VARCHAR DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'archived'
  scheduled_at TIMESTAMPTZ,       -- Si status='scheduled', se publica cuando NOW() >= scheduled_at
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,         -- NULL para evergreen, fecha para noticias temporales

  -- SEO:
  seo_score INT,             -- Calculado por SEO Score Potenciador (ver Anexo U.6) (0-100)
  reading_time_minutes INT,
  views INT DEFAULT 0,
  pending_translations BOOLEAN DEFAULT false,

  -- Mercados y redes sociales (ver Anexo T.8 y U):
  target_markets TEXT[] DEFAULT '{all}', -- '{all}', '{es}', '{fr,be}', '{de,at,ch}'
  social_posted BOOLEAN DEFAULT false,
  social_post_text JSONB DEFAULT '{}',   -- {"linkedin": {"es": "...", "fr": "..."}, "instagram": {"es": "..."}}
  social_scheduled_at TIMESTAMPTZ        -- Cuándo publicar en redes (puede diferir de scheduled_at)
);

-- Índices
CREATE INDEX idx_articles_section ON articles(vertical, section, status, published_at DESC);
-- section values: 'guia' (evergreen: normativa, comparativas, guías de compra) o 'noticias' (temporal con valor SEO)
CREATE INDEX idx_articles_scheduled ON articles(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_articles_market ON articles USING GIN(target_markets);
```

**RLS:** Lectura pública si status='published'. Escritura solo admin.

### P.6 Generación de contenido con IA

Cada artículo se genera con Claude Max (coste 0€):

1. Admin elige tema (o el sistema sugiere basándose en keywords con volumen de búsqueda)
2. Claude Max genera: título SEO (en JSONB multi-idioma), meta description, contenido completo en ES, FAQ schema, excerpt para redes, textos de LinkedIn/Instagram/Facebook
3. Admin revisa con el SEO Score Potenciador (Anexo U.6) — corrige hasta 🟢 (>70/100)
4. Admin programa publicación: status='scheduled', scheduled_at=martes 09:00 CET
5. El sistema publica automáticamente (cron cada 15 min, Anexo U.2)
6. La traducción a otros idiomas se gestiona según Anexo T.7:
   - Fase lanzamiento: admin ejecuta traducción con Claude Code (0€)
   - Fase crecimiento: GPT-4o mini Batch API automático (~0,01€/artículo × 7 idiomas)

**Tabla de quién traduce qué (referencia rápida):**

| Contenido                                | Motor                                   | Coste         |
| ---------------------------------------- | --------------------------------------- | ------------- |
| Títulos de fichas de vehículo            | Auto-generados (marca + modelo + specs) | 0€            |
| Términos fijos (UI, filtros, categorías) | Admin con Claude Max, una sesión        | 0€            |
| Artículos SEO (original en español)      | Admin con Claude Max                    | 0€            |
| Traducir fichas a N idiomas              | GPT-4o mini Batch API                   | ~0,001€/ficha |
