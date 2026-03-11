import { describe, it, expect } from 'vitest'
import { useSeoScore, calculateMiniSeoScore } from '../../app/composables/admin/useSeoScore'
import type { SeoInput } from '../../app/composables/admin/useSeoScore'

// ─── Helpers ──────────────────────────────────────────────────────────────

const LONG_CONTENT = [
  'Primer parrafo largo con mucho contenido relevante sobre camiones cisterna industriales.',
  'Segundo parrafo extenso que amplia la informacion sobre motores y caracteristicas tecnicas.',
  'Tercer parrafo con datos adicionales sobre precios mantenimiento revision ITV y garantias.',
  'Cuarto parrafo de cierre con llamada a la accion contacto ubicacion y disponibilidad.',
].join('\n\n') + ' ' + 'contenido adicional '.repeat(200)

function makeSeoInput(overrides: Partial<SeoInput> = {}): SeoInput {
  return {
    title_es: 'Camion cisterna renault 2024 venta',
    title_en: 'Renault tanker truck 2024 for sale',
    slug: 'camion-cisterna-renault-2024',
    description_es:
      'Meta descripcion perfecta para el articulo sobre camiones cisterna renault disponibles para compra inmediata con revision.',
    content_es: LONG_CONTENT,
    content_en:
      'Long English content.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph. ' +
      'more '.repeat(80),
    image_url: 'https://res.cloudinary.com/tracciona/img.jpg',
    hashtags: ['camion', 'cisterna', 'renault', 'industrial'],
    faq_schema: [
      {
        question: 'Cuantos litros tiene el deposito?',
        answer: 'El deposito tiene quince mil litros de capacidad total.',
      },
      {
        question: 'Que motor lleva el vehiculo?',
        answer: 'Motor Renault DXi certificado de alta potencia y rendimiento.',
      },
      {
        question: 'Donde esta ubicado actualmente?',
        answer: 'El vehiculo esta en Madrid disponible para visita y prueba.',
      },
    ],
    excerpt_es:
      'Extracto con longitud perfecta para vistas previas en redes sociales listados y buscadores del portal de vehiculos industriales online.',
    related_categories: ['camiones-cisterna', 'renault'],
    social_post_text: { linkedin: 'Post para LinkedIn', twitter: 'Post para Twitter' },
    section: null,
    ...overrides,
  }
}

function analyze(overrides: Partial<SeoInput> = {}) {
  const c = useSeoScore({ value: makeSeoInput(overrides) })
  return c.analysis.value
}

// ─── Return shape ─────────────────────────────────────────────────────────

describe('useSeoScore return shape', () => {
  it('returns an analysis object', () => {
    const c = useSeoScore({ value: makeSeoInput() })
    expect(c.analysis).toBeDefined()
    expect(c.analysis.value).toBeDefined()
  })

  it('analysis has score property', () => {
    expect(analyze()).toHaveProperty('score')
  })

  it('analysis has level property', () => {
    expect(analyze()).toHaveProperty('level')
  })

  it('analysis has criteria array', () => {
    expect(Array.isArray(analyze().criteria)).toBe(true)
  })

  it('analysis has snippetPreview', () => {
    expect(analyze()).toHaveProperty('snippetPreview')
  })

  it('criteria count is 15', () => {
    expect(analyze().criteria).toHaveLength(15)
  })

  it('each criterion has required fields', () => {
    const criterion = analyze().criteria[0]!
    expect(criterion).toHaveProperty('id')
    expect(criterion).toHaveProperty('label')
    expect(criterion).toHaveProperty('score')
    expect(criterion).toHaveProperty('level')
    expect(criterion).toHaveProperty('weight')
    expect(criterion).toHaveProperty('description')
  })

  it('weights approximately sum to 1.0', () => {
    const total = analyze().criteria.reduce((sum, c) => sum + c.weight, 0)
    expect(total).toBeCloseTo(1.0, 2)
  })

  it('perfect input scores 100', () => {
    expect(analyze().score).toBe(100)
  })

  it('level is "good" for perfect input', () => {
    expect(analyze().level).toBe('good')
  })
})

// ─── title_length criterion ────────────────────────────────────────────────

describe('title_length criterion', () => {
  function getTitleLength(title_es: string) {
    return analyze({ title_es }).criteria.find((c) => c.id === 'title_length')!
  }

  it('scores 100 for title of 30-60 chars', () => {
    expect(getTitleLength('A'.repeat(45)).score).toBe(100)
  })

  it('scores 50 for title of 20-29 chars', () => {
    expect(getTitleLength('A'.repeat(25)).score).toBe(50)
  })

  it('scores 50 for title of 61-70 chars', () => {
    expect(getTitleLength('A'.repeat(65)).score).toBe(50)
  })

  it('scores 20 for short title under 20 chars', () => {
    expect(getTitleLength('Camion').score).toBe(20)
  })

  it('scores 0 for empty title', () => {
    expect(getTitleLength('').score).toBe(0)
  })

  it('level is "bad" for score 20', () => {
    expect(getTitleLength('Camion').level).toBe('bad')
  })
})

// ─── meta_description criterion ────────────────────────────────────────────

describe('meta_description criterion', () => {
  function getMeta(description_es: string | null) {
    return analyze({ description_es }).criteria.find((c) => c.id === 'meta_description')!
  }

  it('scores 100 for 120-160 chars', () => {
    expect(getMeta('A'.repeat(140)).score).toBe(100)
  })

  it('scores 60 for 80-119 chars', () => {
    expect(getMeta('A'.repeat(100)).score).toBe(60)
  })

  it('scores 70 for 161-200 chars', () => {
    expect(getMeta('A'.repeat(180)).score).toBe(70)
  })

  it('scores 40 for more than 200 chars', () => {
    expect(getMeta('A'.repeat(210)).score).toBe(40)
  })

  it('scores 0 for null description', () => {
    expect(getMeta(null).score).toBe(0)
  })
})

// ─── content_length criterion ──────────────────────────────────────────────

describe('content_length criterion', () => {
  function getContentLength(content_es: string) {
    return analyze({ content_es }).criteria.find((c) => c.id === 'content_length')!
  }

  it('scores 100 for 300+ words', () => {
    expect(getContentLength('word '.repeat(300)).score).toBe(100)
  })

  it('scores 50 for 150-299 words', () => {
    expect(getContentLength('word '.repeat(200)).score).toBe(50)
  })

  it('scores 20 for fewer than 150 words', () => {
    expect(getContentLength('word '.repeat(50)).score).toBe(20)
  })

  it('scores 0 for empty content', () => {
    expect(getContentLength('').score).toBe(0)
  })
})

// ─── image criterion ──────────────────────────────────────────────────────

describe('image criterion', () => {
  function getImage(image_url: string | null) {
    return analyze({ image_url }).criteria.find((c) => c.id === 'image')!
  }

  it('scores 100 for https image URL', () => {
    expect(getImage('https://cdn.com/img.jpg').score).toBe(100)
  })

  it('scores 100 for http image URL', () => {
    expect(getImage('http://cdn.com/img.jpg').score).toBe(100)
  })

  it('scores 50 for relative URL without protocol', () => {
    expect(getImage('/images/img.jpg').score).toBe(50)
  })

  it('scores 0 for null image', () => {
    expect(getImage(null).score).toBe(0)
  })
})

// ─── hashtags criterion ────────────────────────────────────────────────────

describe('hashtags criterion', () => {
  function getHashtags(hashtags: string[]) {
    return analyze({ hashtags }).criteria.find((c) => c.id === 'hashtags')!
  }

  it('scores 100 for 3-6 hashtags', () => {
    expect(getHashtags(['a', 'b', 'c', 'd']).score).toBe(100)
  })

  it('scores 50 for 1-2 hashtags', () => {
    expect(getHashtags(['a']).score).toBe(50)
  })

  it('scores 50 for 7-10 hashtags', () => {
    expect(getHashtags(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).score).toBe(50)
  })

  it('scores 0 for empty hashtags array', () => {
    expect(getHashtags([]).score).toBe(0)
  })

  it('scores 30 for more than 10 hashtags', () => {
    expect(getHashtags(Array.from({ length: 12 }, (_, i) => `tag${i}`)).score).toBe(30)
  })
})

// ─── bilingual criterion ───────────────────────────────────────────────────

describe('bilingual criterion', () => {
  function getBilingual(title_en: string | null, content_en: string | null) {
    return analyze({ title_en, content_en }).criteria.find((c) => c.id === 'bilingual')!
  }

  it('scores 100 for title and content in English', () => {
    expect(getBilingual('English title here', 'English content body').score).toBe(100)
  })

  it('scores 50 for only English title', () => {
    expect(getBilingual('English title here', null).score).toBe(50)
  })

  it('scores 0 for no English content at all', () => {
    expect(getBilingual(null, null).score).toBe(0)
  })
})

// ─── faq_schema criterion ─────────────────────────────────────────────────

describe('faq_schema criterion', () => {
  function getFaq(faq_schema: SeoInput['faq_schema']) {
    return analyze({ faq_schema }).criteria.find((c) => c.id === 'faq_schema')!
  }

  it('scores 100 for 3+ valid FAQ items', () => {
    const faqs = [
      { question: 'Cuantos litros tiene el vehiculo?', answer: 'El deposito tiene quince mil litros de capacidad.' },
      { question: 'Que motor lleva este modelo?', answer: 'Lleva motor Renault DXi de alta potencia certificado.' },
      { question: 'Donde se puede ver el vehiculo?', answer: 'El vehiculo esta en Madrid disponible para visita.' },
    ]
    expect(getFaq(faqs).score).toBe(100)
  })

  it('scores 50 for 1-2 valid FAQ items', () => {
    const faqs = [
      { question: 'Cuantos litros tiene el vehiculo?', answer: 'El deposito tiene quince mil litros de capacidad.' },
    ]
    expect(getFaq(faqs).score).toBe(50)
  })

  it('scores 0 for null FAQ schema', () => {
    expect(getFaq(null).score).toBe(0)
  })

  it('ignores invalid FAQ items with short question or answer', () => {
    const faqs = [{ question: 'Short?', answer: 'Short.' }]
    expect(getFaq(faqs).score).toBe(0)
  })
})

// ─── slug_quality criterion ────────────────────────────────────────────────

describe('slug_quality criterion', () => {
  function getSlug(slug: string) {
    return analyze({ slug }).criteria.find((c) => c.id === 'slug_quality')!
  }

  it('scores 100 for 3-5 word slug', () => {
    expect(getSlug('camion-cisterna-renault').score).toBe(100)
  })

  it('scores 10 for UUID-style slug', () => {
    expect(getSlug('550e8400-e29b-41d4-a716-446655440000').score).toBe(10)
  })

  it('scores 0 for empty slug', () => {
    expect(getSlug('').score).toBe(0)
  })

  it('scores 60 for 1-2 word slug', () => {
    expect(getSlug('camion').score).toBe(60)
  })
})

// ─── snippetPreview ────────────────────────────────────────────────────────

describe('snippetPreview', () => {
  it('url includes the slug', () => {
    const result = analyze({ slug: 'mi-articulo-test' })
    expect(result.snippetPreview.url).toContain('mi-articulo-test')
  })

  it('url uses "noticias" prefix by default', () => {
    expect(analyze({ section: null }).snippetPreview.url).toContain('noticias/')
  })

  it('url uses "guia" prefix for section="guia"', () => {
    expect(analyze({ section: 'guia' }).snippetPreview.url).toContain('guia/')
  })

  it('title is truncated to at most 60 chars', () => {
    const result = analyze({ title_es: 'A'.repeat(80) })
    expect(result.snippetPreview.title.length).toBeLessThanOrEqual(60)
  })

  it('description uses description_es when available', () => {
    const result = analyze({ description_es: 'Meta unica para este test especifico.' })
    expect(result.snippetPreview.description).toContain('Meta unica')
  })

  it('description falls back to content when description_es is null', () => {
    const result = analyze({
      description_es: null,
      content_es: 'Contenido principal del articulo usado como descripcion alternativa.',
    })
    expect(result.snippetPreview.description).toContain('Contenido')
  })

  it('snippetPreview has title, url and description properties', () => {
    const preview = analyze().snippetPreview
    expect(preview).toHaveProperty('title')
    expect(preview).toHaveProperty('url')
    expect(preview).toHaveProperty('description')
  })
})

// ─── level thresholds ─────────────────────────────────────────────────────

describe('level thresholds', () => {
  it('level "good" when score >= 70', () => {
    expect(analyze().level).toBe('good')
  })

  it('level "bad" when all criteria score 0', () => {
    const result = analyze({
      title_es: '',
      title_en: null,
      slug: '',
      description_es: null,
      content_es: '',
      content_en: null,
      image_url: null,
      hashtags: [],
      faq_schema: null,
      excerpt_es: null,
      related_categories: null,
      social_post_text: null,
      section: null,
    })
    expect(result.level).toBe('bad')
  })
})

// ─── calculateMiniSeoScore ─────────────────────────────────────────────────

describe('calculateMiniSeoScore', () => {
  const perfectData = {
    title_es: 'A'.repeat(45),
    content_es: 'word '.repeat(300),
    slug: 'three-word-slug',
    image_url: 'https://cdn.com/img.jpg',
    hashtags: ['a', 'b', 'c', 'd'],
  }

  it('returns score and level properties', () => {
    const result = calculateMiniSeoScore(perfectData)
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('level')
  })

  it('perfect input scores 100', () => {
    expect(calculateMiniSeoScore(perfectData).score).toBe(100)
  })

  it('level "good" for perfect input', () => {
    expect(calculateMiniSeoScore(perfectData).level).toBe('good')
  })

  it('no image reduces score below 100', () => {
    expect(calculateMiniSeoScore({ ...perfectData, image_url: null }).score).toBeLessThan(100)
  })

  it('empty content reduces score', () => {
    expect(calculateMiniSeoScore({ ...perfectData, content_es: '' }).score).toBeLessThan(100)
  })

  it('level "bad" when all fields are empty', () => {
    const result = calculateMiniSeoScore({
      title_es: '',
      content_es: '',
      slug: '',
      image_url: null,
      hashtags: [],
    })
    expect(result.level).toBe('bad')
  })

  it('score with hashtags higher than without', () => {
    const withTags = calculateMiniSeoScore(perfectData)
    const noTags = calculateMiniSeoScore({ ...perfectData, hashtags: [] })
    expect(withTags.score).toBeGreaterThan(noTags.score)
  })
})
