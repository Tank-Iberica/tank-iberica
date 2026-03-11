/**
 * Tests for app/composables/admin/useSeoScore.ts
 * Tests all 15 evaluate* functions via useSeoScore() and calculateMiniSeoScore()
 */
import { describe, it, expect, vi } from 'vitest'
import {
  useSeoScore,
  calculateMiniSeoScore,
  type SeoInput,
} from '~/composables/admin/useSeoScore'

vi.mock('vue', () => ({
  computed: (fn: () => unknown) => ({ value: fn() }),
  ref: (val: unknown) => ({ value: val }),
  unref: (val: unknown) =>
    val && typeof val === 'object' && 'value' in val ? (val as { value: unknown }).value : val,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<SeoInput> = {}): SeoInput {
  return {
    title_es: 'Título de prueba para el artículo del sector industrial',
    title_en: 'Test title for the industrial sector article',
    slug: 'titulo-prueba-articulo-industrial',
    description_es: 'Meta descripción de prueba con la longitud ideal para Google entre 120 y 160 caracteres exactamente aquí.',
    content_es: 'Contenido de prueba para el artículo.\n\nSegundo párrafo con información relevante.\n\nTercer párrafo con más detalle.\n\nCuarto párrafo final.',
    content_en: 'Test content for the article with enough words to meet the minimum requirement.',
    image_url: 'https://example.com/image.jpg',
    hashtags: ['industrial', 'transporte', 'vehiculos', 'logistica'],
    faq_schema: [
      { question: 'Primera pregunta larga?', answer: 'Primera respuesta larga con detalle suficiente para SEO.' },
      { question: 'Segunda pregunta larga?', answer: 'Segunda respuesta larga con detalle suficiente para SEO.' },
      { question: 'Tercera pregunta larga?', answer: 'Tercera respuesta larga con detalle suficiente para SEO.' },
    ],
    excerpt_es: 'Extracto de prueba con una longitud ideal de entre 120 y 200 caracteres para las vistas previas.',
    related_categories: ['camiones', 'maquinaria'],
    social_post_text: { twitter: 'Tweet de prueba', linkedin: 'Post de LinkedIn' },
    section: null,
    ...overrides,
  }
}

function getAnalysis(input: Partial<SeoInput> = {}) {
  const { analysis } = useSeoScore(ref(makeInput(input)))
  return analysis.value
}

function getCriterion(criterionId: string, input: Partial<SeoInput> = {}) {
  return getAnalysis(input).criteria.find((c) => c.id === criterionId)!
}

// ─── useSeoScore — structure ──────────────────────────────────────────────────

describe('useSeoScore — return structure', () => {
  it('returns analysis with score, level, criteria, snippetPreview', () => {
    const result = getAnalysis()
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('level')
    expect(result).toHaveProperty('criteria')
    expect(result).toHaveProperty('snippetPreview')
    expect(Array.isArray(result.criteria)).toBe(true)
  })

  it('returns exactly 15 criteria', () => {
    expect(getAnalysis().criteria).toHaveLength(15)
  })

  it('score is in 0-100 range', () => {
    const { score } = getAnalysis()
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('level is "good" for high-scoring input', () => {
    expect(getAnalysis().level).toBe('good')
  })
})

// ─── 1. title_length ─────────────────────────────────────────────────────────

describe('evaluateTitleLength (title_length)', () => {
  it('scores 100 for title 30-60 chars', () => {
    const c = getCriterion('title_length', { title_es: 'Título perfecto de treinta caracteres exactamente' }) // 49 chars
    expect(c.score).toBe(100)
    expect(c.level).toBe('good')
  })

  it('scores 50 for title 20-29 chars', () => {
    const c = getCriterion('title_length', { title_es: 'Título un poco corto aqui' }) // ~25 chars
    expect(c.score).toBe(50)
  })

  it('scores 50 for title 61-70 chars', () => {
    const c = getCriterion('title_length', { title_es: 'Este título tiene exactamente sesenta y cinco caracteres en total' }) // ~65 chars
    expect(c.score).toBe(50)
  })

  it('scores 0 for empty title', () => {
    const c = getCriterion('title_length', { title_es: '' })
    expect(c.score).toBe(0)
  })

  it('scores 20 for very short title (< 20 chars)', () => {
    const c = getCriterion('title_length', { title_es: 'Corto' })
    expect(c.score).toBe(20)
  })

  it('scores 20 for very long title (> 70 chars)', () => {
    const c = getCriterion('title_length', { title_es: 'Este título es extremadamente largo y supera con creces los setenta caracteres recomendados por Google' })
    expect(c.score).toBe(20)
  })
})

// ─── 2. title_keywords ────────────────────────────────────────────────────────

describe('evaluateTitleKeywords (title_keywords)', () => {
  it('scores 100 for title with 2+ keywords and ratio >= 0.3', () => {
    const c = getCriterion('title_keywords', { title_es: 'Camiones industriales transporte logística Europa' })
    expect(c.score).toBe(100)
  })

  it('scores 50 for title with 1 keyword', () => {
    const c = getCriterion('title_keywords', { title_es: 'El la los transporte' }) // only 'transporte'
    expect(c.score).toBe(50)
  })

  it('scores 0 for empty title', () => {
    const c = getCriterion('title_keywords', { title_es: '' })
    expect(c.score).toBe(0)
  })

  it('scores 20 for title with no keywords (all stopwords)', () => {
    const c = getCriterion('title_keywords', { title_es: 'el la los de con por para' })
    expect(c.score).toBe(20)
  })
})

// ─── 3. keywords_in_url ──────────────────────────────────────────────────────

describe('evaluateKeywordsInUrl (keywords_in_url)', () => {
  it('scores 100 when slug contains >= 50% of title keywords', () => {
    const c = getCriterion('keywords_in_url', {
      title_es: 'Camiones industriales Europa',
      slug: 'camiones-industriales-europa-2024',
    })
    expect(c.score).toBe(100)
  })

  it('scores 60 when slug contains some but < 50% of keywords', () => {
    const c = getCriterion('keywords_in_url', {
      title_es: 'Camiones industriales transporte logistica Europa',
      slug: 'camiones-2024',
    })
    expect(c.score).toBe(60)
  })

  it('scores 20 when slug has no keywords from title', () => {
    const c = getCriterion('keywords_in_url', {
      title_es: 'Camiones industriales transporte',
      slug: 'articulo-general-noticias',
    })
    expect(c.score).toBe(20)
  })

  it('scores 0 for empty slug', () => {
    const c = getCriterion('keywords_in_url', { slug: '', title_es: 'Camiones industriales' })
    expect(c.score).toBe(0)
  })
})

// ─── 4. slug_quality ─────────────────────────────────────────────────────────

describe('evaluateSlugQuality (slug_quality)', () => {
  it('scores 100 for slug with 3-5 words', () => {
    const c = getCriterion('slug_quality', { slug: 'camion-industrial-volvo-2024' }) // 4 words
    expect(c.score).toBe(100)
  })

  it('scores 60 for slug with 1-2 words', () => {
    const c = getCriterion('slug_quality', { slug: 'camion-volvo' }) // 2 words
    expect(c.score).toBe(60)
  })

  it('scores 60 for slug with 6-8 words', () => {
    const c = getCriterion('slug_quality', { slug: 'camion-industrial-volvo-fh16-2024-espana-transporte' }) // 7 words
    expect(c.score).toBe(60)
  })

  it('scores 0 for empty slug', () => {
    const c = getCriterion('slug_quality', { slug: '' })
    expect(c.score).toBe(0)
  })

  it('scores 10 for UUID-like slug', () => {
    const c = getCriterion('slug_quality', { slug: 'a1b2c3d4-resto-del-slug' })
    expect(c.score).toBe(10)
  })

  it('scores 30 for slug with > 8 words', () => {
    const c = getCriterion('slug_quality', { slug: 'uno-dos-tres-cuatro-cinco-seis-siete-ocho-nueve-diez' }) // 10 words
    expect(c.score).toBe(30)
  })
})

// ─── 5. content_length ───────────────────────────────────────────────────────

describe('evaluateContentLength (content_length)', () => {
  const long = Array(310).fill('palabra').join(' ')
  const medium = Array(160).fill('palabra').join(' ')
  const short = Array(50).fill('palabra').join(' ')

  it('scores 100 for content with >= 300 words', () => {
    const c = getCriterion('content_length', { content_es: long })
    expect(c.score).toBe(100)
  })

  it('scores 50 for content with 150-299 words', () => {
    const c = getCriterion('content_length', { content_es: medium })
    expect(c.score).toBe(50)
  })

  it('scores 20 for content with < 150 words', () => {
    const c = getCriterion('content_length', { content_es: short })
    expect(c.score).toBe(20)
  })

  it('scores 0 for empty content', () => {
    const c = getCriterion('content_length', { content_es: '' })
    expect(c.score).toBe(0)
  })
})

// ─── 6. content_structure ────────────────────────────────────────────────────

describe('evaluateContentStructure (content_structure)', () => {
  it('scores 100 for content with >= 4 paragraphs', () => {
    const c = getCriterion('content_structure', {
      content_es: 'P1\n\nP2\n\nP3\n\nP4',
    })
    expect(c.score).toBe(100)
  })

  it('scores 50 for content with 2-3 paragraphs', () => {
    const c = getCriterion('content_structure', { content_es: 'P1\n\nP2\n\nP3' })
    expect(c.score).toBe(50)
  })

  it('scores 20 for single paragraph', () => {
    const c = getCriterion('content_structure', { content_es: 'Un solo bloque de texto sin separaciones.' })
    expect(c.score).toBe(20)
  })

  it('scores 0 for empty content', () => {
    const c = getCriterion('content_structure', { content_es: '' })
    expect(c.score).toBe(0)
  })
})

// ─── 7. meta_description ─────────────────────────────────────────────────────

describe('evaluateMetaDescription (meta_description)', () => {
  it('scores 100 for description 120-160 chars', () => {
    const desc = 'a'.repeat(140)
    const c = getCriterion('meta_description', { description_es: desc })
    expect(c.score).toBe(100)
  })

  it('scores 60 for description 80-119 chars', () => {
    const c = getCriterion('meta_description', { description_es: 'a'.repeat(100) })
    expect(c.score).toBe(60)
  })

  it('scores 70 for description 161-200 chars', () => {
    const c = getCriterion('meta_description', { description_es: 'a'.repeat(180) })
    expect(c.score).toBe(70)
  })

  it('scores 40 for description > 200 chars', () => {
    const c = getCriterion('meta_description', { description_es: 'a'.repeat(210) })
    expect(c.score).toBe(40)
  })

  it('scores 30 for description < 80 chars but > 0', () => {
    const c = getCriterion('meta_description', { description_es: 'Corta descripcion.' })
    expect(c.score).toBe(30)
  })

  it('scores 0 for null description', () => {
    const c = getCriterion('meta_description', { description_es: null })
    expect(c.score).toBe(0)
  })
})

// ─── 8. excerpt ──────────────────────────────────────────────────────────────

describe('evaluateExcerpt (excerpt)', () => {
  it('scores 100 for excerpt 120-200 chars', () => {
    const c = getCriterion('excerpt', { excerpt_es: 'a'.repeat(150) })
    expect(c.score).toBe(100)
  })

  it('scores 60 for excerpt 50-119 chars', () => {
    const c = getCriterion('excerpt', { excerpt_es: 'a'.repeat(80) })
    expect(c.score).toBe(60)
  })

  it('scores 60 for excerpt 201-300 chars', () => {
    const c = getCriterion('excerpt', { excerpt_es: 'a'.repeat(250) })
    expect(c.score).toBe(60)
  })

  it('scores 30 for excerpt > 300 chars', () => {
    const c = getCriterion('excerpt', { excerpt_es: 'a'.repeat(350) })
    expect(c.score).toBe(30)
  })

  it('scores 0 for null excerpt', () => {
    const c = getCriterion('excerpt', { excerpt_es: null })
    expect(c.score).toBe(0)
  })
})

// ─── 9. image ────────────────────────────────────────────────────────────────

describe('evaluateImage (image)', () => {
  it('scores 100 for valid https URL', () => {
    const c = getCriterion('image', { image_url: 'https://cdn.example.com/img.jpg' })
    expect(c.score).toBe(100)
  })

  it('scores 100 for http URL', () => {
    const c = getCriterion('image', { image_url: 'http://cdn.example.com/img.jpg' })
    expect(c.score).toBe(100)
  })

  it('scores 50 for non-http URL', () => {
    const c = getCriterion('image', { image_url: '/relative/path/to/image.jpg' })
    expect(c.score).toBe(50)
  })

  it('scores 0 for null image', () => {
    const c = getCriterion('image', { image_url: null })
    expect(c.score).toBe(0)
  })
})

// ─── 10. hashtags ────────────────────────────────────────────────────────────

describe('evaluateHashtags (hashtags)', () => {
  it('scores 100 for 3-6 hashtags', () => {
    const c = getCriterion('hashtags', { hashtags: ['a', 'b', 'c', 'd'] })
    expect(c.score).toBe(100)
  })

  it('scores 50 for 1-2 hashtags', () => {
    const c = getCriterion('hashtags', { hashtags: ['uno', 'dos'] })
    expect(c.score).toBe(50)
  })

  it('scores 50 for 7-10 hashtags', () => {
    const c = getCriterion('hashtags', { hashtags: ['a','b','c','d','e','f','g','h'] })
    expect(c.score).toBe(50)
  })

  it('scores 0 for no hashtags', () => {
    const c = getCriterion('hashtags', { hashtags: [] })
    expect(c.score).toBe(0)
  })

  it('scores 30 for > 10 hashtags', () => {
    const c = getCriterion('hashtags', { hashtags: Array(12).fill('tag') })
    expect(c.score).toBe(30)
  })
})

// ─── 11. bilingual ───────────────────────────────────────────────────────────

describe('evaluateBilingual (bilingual)', () => {
  it('scores 100 when both title_en and content_en present', () => {
    const c = getCriterion('bilingual', {
      title_en: 'English title here',
      content_en: 'English content here with words',
    })
    expect(c.score).toBe(100)
  })

  it('scores 50 when only title_en present', () => {
    const c = getCriterion('bilingual', { title_en: 'English title', content_en: null })
    expect(c.score).toBe(50)
  })

  it('scores 0 when neither title_en nor content_en', () => {
    const c = getCriterion('bilingual', { title_en: null, content_en: null })
    expect(c.score).toBe(0)
  })
})

// ─── 12. faq_schema ──────────────────────────────────────────────────────────

describe('evaluateFaqSchema (faq_schema)', () => {
  it('scores 100 for >= 3 valid FAQ items', () => {
    const c = getCriterion('faq_schema', {
      faq_schema: [
        { question: 'Pregunta uno muy larga?', answer: 'Respuesta uno muy larga con suficientes palabras.' },
        { question: 'Pregunta dos muy larga?', answer: 'Respuesta dos muy larga con suficientes palabras.' },
        { question: 'Pregunta tres muy larga?', answer: 'Respuesta tres muy larga con suficientes palabras.' },
      ],
    })
    expect(c.score).toBe(100)
  })

  it('scores 50 for 1-2 valid FAQ items', () => {
    const c = getCriterion('faq_schema', {
      faq_schema: [
        { question: 'Pregunta válida larga aquí?', answer: 'Respuesta válida con suficiente texto aquí.' },
      ],
    })
    expect(c.score).toBe(50)
  })

  it('scores 0 for null faq_schema', () => {
    const c = getCriterion('faq_schema', { faq_schema: null })
    expect(c.score).toBe(0)
  })

  it('ignores FAQ items with short question or answer', () => {
    const c = getCriterion('faq_schema', {
      faq_schema: [
        { question: 'Corta?', answer: 'No.' }, // too short, ignored
        { question: 'Corta?', answer: 'No.' },
        { question: 'Corta?', answer: 'No.' },
      ],
    })
    expect(c.score).toBe(0)
  })
})

// ─── 13. social_text ─────────────────────────────────────────────────────────

describe('evaluateSocialText (social_text)', () => {
  it('scores 100 for >= 2 filled social texts', () => {
    const c = getCriterion('social_text', {
      social_post_text: { twitter: 'Tweet', linkedin: 'Post' },
    })
    expect(c.score).toBe(100)
  })

  it('scores 50 for exactly 1 filled social text', () => {
    const c = getCriterion('social_text', {
      social_post_text: { twitter: 'Tweet único' },
    })
    expect(c.score).toBe(50)
  })

  it('scores 0 for null social_post_text', () => {
    const c = getCriterion('social_text', { social_post_text: null })
    expect(c.score).toBe(0)
  })
})

// ─── 14. related_categories ──────────────────────────────────────────────────

describe('evaluateRelatedCategories (related_categories)', () => {
  it('scores 100 for >= 2 categories', () => {
    const c = getCriterion('related_categories', { related_categories: ['cat1', 'cat2'] })
    expect(c.score).toBe(100)
  })

  it('scores 60 for exactly 1 category', () => {
    const c = getCriterion('related_categories', { related_categories: ['cat1'] })
    expect(c.score).toBe(60)
  })

  it('scores 0 for null categories', () => {
    const c = getCriterion('related_categories', { related_categories: null })
    expect(c.score).toBe(0)
  })
})

// ─── 15. reading_time ────────────────────────────────────────────────────────

describe('evaluateReadingTime (reading_time)', () => {
  it('scores 100 for 2-8 min reading time (400-1600 words)', () => {
    const c = getCriterion('reading_time', { content_es: Array(500).fill('palabra').join(' ') })
    expect(c.score).toBe(100)
  })

  it('scores 40 for ~1 min (< 200 words)', () => {
    const c = getCriterion('reading_time', { content_es: Array(100).fill('palabra').join(' ') })
    expect(c.score).toBe(40)
  })

  it('scores 60 for > 8 min reading time', () => {
    const c = getCriterion('reading_time', { content_es: Array(2000).fill('palabra').join(' ') })
    expect(c.score).toBe(60)
  })

  it('scores 0 for empty content', () => {
    const c = getCriterion('reading_time', { content_es: '' })
    expect(c.score).toBe(0)
  })
})

// ─── snippetPreview ───────────────────────────────────────────────────────────

describe('useSeoScore — snippetPreview', () => {
  it('truncates title to 60 chars', () => {
    const longTitle = 'A'.repeat(80)
    const result = getAnalysis({ title_es: longTitle })
    expect(result.snippetPreview.title.length).toBeLessThanOrEqual(60)
    expect(result.snippetPreview.title.endsWith('...')).toBe(true)
  })

  it('uses description_es for snippet when available', () => {
    const result = getAnalysis({ description_es: 'Mi meta descripción' })
    expect(result.snippetPreview.description).toContain('Mi meta descripción')
  })

  it('falls back to content_es for snippet when no description', () => {
    const result = getAnalysis({ description_es: null, content_es: 'Contenido del artículo para usar como descripción.' })
    expect(result.snippetPreview.description).toContain('Contenido del artículo')
  })

  it('includes slug in URL', () => {
    const result = getAnalysis({ slug: 'mi-articulo-slug' })
    expect(result.snippetPreview.url).toContain('mi-articulo-slug')
  })

  it('uses "guia" prefix for section=guia', () => {
    const result = getAnalysis({ section: 'guia' })
    expect(result.snippetPreview.url).toContain('guia/')
  })

  it('uses "noticias" prefix for other sections', () => {
    const result = getAnalysis({ section: 'noticias' })
    expect(result.snippetPreview.url).toContain('noticias/')
  })
})

// ─── calculateMiniSeoScore (existing tests complement) ───────────────────────

describe('calculateMiniSeoScore — edge cases', () => {
  it('returns 0 for completely empty input', () => {
    const { score } = calculateMiniSeoScore({
      title_es: '',
      content_es: '',
      slug: '',
      image_url: null,
      hashtags: [],
    })
    expect(score).toBe(0)
  })

  it('returns 100 for perfect input', () => {
    const { score } = calculateMiniSeoScore({
      title_es: 'Camiones industriales Volvo transporte España', // 45 chars, in range
      content_es: Array(310).fill('palabra').join(' '), // 300+ words
      slug: 'camiones-industriales-volvo',   // 3-5 words
      image_url: 'https://cdn.com/img.jpg',
      hashtags: ['camion', 'volvo', 'logistica'],
    })
    expect(score).toBe(100)
  })
})
