## ANEXO U: SISTEMA DE PUBLICACIÓN PROGRAMADA Y CALENDARIO EDITORIAL

### U.1 Scheduled publishing en la BD

```sql
-- Campos en articles (ya parcialmente definidos en Anexo P, aquí ampliados):
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'draft';
  -- Valores: 'draft', 'scheduled', 'published', 'archived'
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
  -- Si status='scheduled', se publica automáticamente cuando NOW() >= scheduled_at
ALTER TABLE articles ADD COLUMN IF NOT EXISTS target_markets TEXT[] DEFAULT '{all}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_posted BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_post_text JSONB DEFAULT '{}';
  -- {"linkedin": {"es": "...", "fr": "..."}, "instagram": {"es": "..."}, "facebook": {"es": "..."}}
ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_scheduled_at TIMESTAMPTZ;
  -- Cuándo publicar en redes (puede ser distinto de scheduled_at en web)
```

### U.2 Cron de publicación automática

Un cron (Edge Function o script externo) ejecuta cada 15 minutos:

```sql
-- Publicar artículos programados cuya fecha ya pasó
UPDATE articles
SET status = 'published', published_at = NOW()
WHERE status = 'scheduled' AND scheduled_at <= NOW();
```

### U.3 Calendario editorial recomendado — Web

| Día        | Hora (CET) | Tipo de contenido              | Frecuencia |
| ---------- | ---------- | ------------------------------ | ---------- |
| **Martes** | 09:00      | Guía evergreen o comparativa   | Semanal    |
| **Jueves** | 09:00      | Noticia del sector o normativa | Semanal    |

**Total: 8-10 artículos/mes.** Constante y sostenible.
Cuando haya múltiples mercados activos, añadir artículos localizados: +1-2/semana por mercado = 15-20 artículos/mes.

### U.4 Calendario editorial recomendado — Redes sociales

| Día           | Hora (CET) | LinkedIn                                               | Instagram/Facebook      |
| ------------- | ---------- | ------------------------------------------------------ | ----------------------- |
| **Lunes**     | 10:00      | Dato del sector o vehículo destacado                   | —                       |
| **Martes**    | 09:00      | Artículo del blog (enlace al que se publica en web)    | Foto vehículo destacado |
| **Miércoles** | 11:00      | Post de opinión / comparativa corta                    | Story detrás de cámaras |
| **Jueves**    | 10:00      | Artículo del blog (segundo de la semana)               | Foto vehículo o feria   |
| **Viernes**   | 12:00      | Post ligero ("sabías que...", dato curioso del sector) | —                       |

**Reglas clave:**

- LinkedIn: 3-5 posts/semana, NUNCA más de 1/día (el algoritmo penaliza)
- Instagram/Facebook: 2-3 posts/semana
- La consistencia importa más que el volumen
- Los horarios cubren España, Francia, Alemania, Italia, Benelux y Polonia (misma zona CET)
- Martes-Miércoles-Jueves son los días con más engagement B2B
- Mañanas (9-11 AM) y mediodía (12 PM) son los picos de engagement

### U.5 Flujo de trabajo dominical

El admin puede preparar todo el contenido de la semana en una sesión con Claude Max:

```
1. Domingo por la tarde:
   - Abrir Claude Max
   - "Genera 2 artículos para esta semana: [temas]"
   - "Genera los posts de LinkedIn y redes para cada uno"
   - Claude genera: artículo completo, meta description, FAQ schema, excerpt,
     textos para LinkedIn/Instagram/Facebook en todos los idiomas activos

2. Copiar al admin panel de Tracciona:
   - Crear artículo con status='scheduled', scheduled_at=martes 09:00
   - Crear segundo artículo con scheduled_at=jueves 09:00
   - Los textos de redes sociales quedan en social_post_text
   - social_scheduled_at=martes 09:00 (LinkedIn) / martes 10:00 (Instagram)

3. Durante la semana: todo se publica solo.
```

### U.6 SEO Score Potenciador

El sistema de SEO Score existente (composable `useSeoScore.ts`) debe ampliarse para evaluar:

**Checklist SEO que el admin ve al crear/editar un artículo:**

```typescript
// composables/admin/useSeoScore.ts — ampliar con estos checks:

interface SeoCheck {
  id: string
  label: string
  passed: boolean
  weight: number  // 1-10
  tip: string
}

const seoChecks: SeoCheck[] = [
  // Existentes (ya implementados):
  { id: 'title_length', label: 'Título entre 50-60 caracteres', weight: 8, ... },
  { id: 'meta_desc', label: 'Meta description entre 150-160 chars', weight: 8, ... },
  { id: 'h1_present', label: 'Tiene H1 único', weight: 9, ... },

  // NUEVOS — Añadir estos:
  { id: 'keyword_in_title', label: 'Keyword principal en el título', weight: 9, tip: 'El título debe contener la keyword target' },
  { id: 'keyword_in_url', label: 'Keyword en la URL/slug', weight: 7, tip: 'El slug debe contener la keyword sin stop words' },
  { id: 'keyword_in_h2', label: 'Keyword en al menos un H2', weight: 6, tip: 'Usa variaciones de la keyword en subtítulos' },
  { id: 'content_length', label: 'Contenido >1.500 palabras (guías) o >400 (noticias)', weight: 7, tip: 'Google favorece contenido profundo para guías' },
  { id: 'internal_links', label: 'Al menos 2 enlaces internos al catálogo', weight: 8, tip: 'Enlaza a landing pages de categorías relevantes' },
  { id: 'faq_schema', label: 'Tiene FAQ schema (mínimo 3 preguntas)', weight: 6, tip: 'Las FAQs generan featured snippets en Google' },
  { id: 'cover_image', label: 'Tiene imagen de portada con alt text', weight: 5, tip: 'Google Images es fuente de tráfico' },
  { id: 'excerpt_present', label: 'Tiene excerpt para redes sociales', weight: 4, tip: 'El excerpt se usa como OG description y en posts de redes' },
  { id: 'related_categories', label: 'Tiene categorías relacionadas vinculadas', weight: 5, tip: 'Mejora el internal linking y la contextualización' },
  { id: 'reading_time', label: 'Tiene tiempo de lectura estimado', weight: 3, tip: 'Mejora UX y engagement' },
  { id: 'translation_ready', label: 'Traducido a al menos 2 idiomas', weight: 4, tip: 'Más idiomas = más mercados indexados' },

  // Calendario y constancia:
  { id: 'scheduled', label: 'Tiene fecha de publicación programada', weight: 3, tip: 'Programar es mejor que publicar de golpe' },
  { id: 'social_text', label: 'Tiene textos de redes sociales preparados', weight: 3, tip: 'Prepara los posts de LinkedIn/Instagram junto al artículo' },
]

// Score total: suma ponderada → 0-100
// Se muestra en el panel de admin como barra de progreso:
// 🔴 0-40 (no publicar) | 🟡 41-70 (mejorable) | 🟢 71-100 (listo)
```

**El admin ve esto como un panel lateral al editar cualquier artículo.** Cada check tiene ✅ o ❌ con el tip de mejora. El score se guarda en `articles.seo_score` para filtrar artículos que necesitan mejora.

---
