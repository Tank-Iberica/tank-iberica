import { describe, it, expect } from 'vitest'
import { calculateMiniSeoScore } from '../../app/composables/admin/useSeoScore'

function makeInput(overrides: Partial<Parameters<typeof calculateMiniSeoScore>[0]> = {}) {
  return {
    title_es: '',
    content_es: '',
    slug: '',
    image_url: null as string | null,
    hashtags: [] as string[],
    ...overrides,
  }
}

describe('calculateMiniSeoScore', () => {
  it('returns a score between 0 and 100', () => {
    const { score } = calculateMiniSeoScore(makeInput())
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns a low score for empty/minimal input', () => {
    const { score, level } = calculateMiniSeoScore(makeInput())
    expect(score).toBeLessThan(30)
    expect(level).toBe('bad')
  })

  it('returns a high score for perfect input', () => {
    const longContent = Array(310).fill('palabra').join(' ')
    const { score, level } = calculateMiniSeoScore(
      makeInput({
        title_es: 'Guia completa de camiones cisterna en Europa', // 46 chars, in 30-60 range
        content_es: longContent, // 310 words
        slug: 'guia-camiones-cisterna-europa', // 4 words, in 3-5 range
        image_url: 'https://example.com/image.jpg',
        hashtags: ['camiones', 'cisterna', 'transporte', 'europa'], // 4 tags, in 3-6 range
      }),
    )
    expect(score).toBeGreaterThanOrEqual(80)
    expect(level).toBe('good')
  })

  it('score improves with longer title in optimal range (30-60 chars)', () => {
    const shortTitle = calculateMiniSeoScore(makeInput({ title_es: 'Hola' })) // 4 chars
    const mediumTitle = calculateMiniSeoScore(makeInput({ title_es: 'Titulo medio de prueba' })) // 22 chars, in 20-70
    const optimalTitle = calculateMiniSeoScore(
      makeInput({
        title_es: 'Guia completa de camiones cisterna en venta', // 43 chars
      }),
    )

    expect(optimalTitle.score).toBeGreaterThan(shortTitle.score)
    expect(optimalTitle.score).toBeGreaterThan(mediumTitle.score)
  })

  it('score improves with longer content (300+ words)', () => {
    const noContent = calculateMiniSeoScore(makeInput({ content_es: '' }))
    const shortContent = calculateMiniSeoScore(
      makeInput({
        content_es: Array(50).fill('test').join(' '),
      }),
    )
    const medContent = calculateMiniSeoScore(
      makeInput({
        content_es: Array(160).fill('test').join(' '),
      }),
    )
    const longContent = calculateMiniSeoScore(
      makeInput({
        content_es: Array(310).fill('test').join(' '),
      }),
    )

    expect(shortContent.score).toBeGreaterThan(noContent.score)
    expect(medContent.score).toBeGreaterThan(shortContent.score)
    expect(longContent.score).toBeGreaterThan(medContent.score)
  })

  it('score improves with proper slug (3-5 words)', () => {
    const noSlug = calculateMiniSeoScore(makeInput({ slug: '' }))
    const shortSlug = calculateMiniSeoScore(makeInput({ slug: 'guia' })) // 1 word
    const optimalSlug = calculateMiniSeoScore(makeInput({ slug: 'guia-camiones-cisterna' })) // 3 words

    expect(shortSlug.score).toBeGreaterThan(noSlug.score)
    expect(optimalSlug.score).toBeGreaterThan(shortSlug.score)
  })

  it('score improves with image URL present', () => {
    const noImage = calculateMiniSeoScore(makeInput({ image_url: null }))
    const withImage = calculateMiniSeoScore(
      makeInput({
        image_url: 'https://res.cloudinary.com/test/image.jpg',
      }),
    )

    expect(withImage.score).toBeGreaterThan(noImage.score)
  })

  it('score improves with hashtags in optimal range (3-6)', () => {
    const noTags = calculateMiniSeoScore(makeInput({ hashtags: [] }))
    const fewTags = calculateMiniSeoScore(makeInput({ hashtags: ['camion'] }))
    const optimalTags = calculateMiniSeoScore(
      makeInput({
        hashtags: ['camion', 'cisterna', 'transporte', 'europa'],
      }),
    )

    expect(fewTags.score).toBeGreaterThan(noTags.score)
    expect(optimalTags.score).toBeGreaterThan(fewTags.score)
  })

  it('level is "good" for score >= 70', () => {
    const longContent = Array(310).fill('palabra').join(' ')
    const { level } = calculateMiniSeoScore(
      makeInput({
        title_es: 'Guia completa de camiones cisterna en Europa',
        content_es: longContent,
        slug: 'guia-camiones-cisterna-europa',
        image_url: 'https://example.com/image.jpg',
        hashtags: ['camiones', 'cisterna', 'transporte', 'europa'],
      }),
    )
    expect(level).toBe('good')
  })

  it('level is "warning" for score >= 40 and < 70', () => {
    // Provide some decent fields but not all optimal
    const { score, level } = calculateMiniSeoScore(
      makeInput({
        title_es: 'Guia completa de camiones cisterna en Europa',
        content_es: Array(160).fill('test').join(' '), // medium content = 15/30
        slug: 'guia', // short slug = 5/10
        image_url: null, // no image = 0/20
        hashtags: ['camion'], // few tags = 5/10
      }),
    )
    // title: 30 + content: 15 + image: 0 + hashtags: 5 + slug: 5 = 55/100
    expect(score).toBeGreaterThanOrEqual(40)
    expect(score).toBeLessThan(70)
    expect(level).toBe('warning')
  })

  it('level is "bad" for score < 40', () => {
    const { level } = calculateMiniSeoScore(
      makeInput({
        title_es: 'Hola', // short = 5/30
        content_es: 'breve', // minimal = 5/30
        slug: '', // empty = 0/10
        image_url: null, // 0/20
        hashtags: [], // 0/10
      }),
    )
    expect(level).toBe('bad')
  })

  it('image URL must start with "http" to count', () => {
    const invalidUrl = calculateMiniSeoScore(
      makeInput({
        image_url: 'not-a-url.jpg',
      }),
    )
    const validUrl = calculateMiniSeoScore(
      makeInput({
        image_url: 'https://example.com/photo.jpg',
      }),
    )

    expect(validUrl.score).toBeGreaterThan(invalidUrl.score)
  })

  it('slug with too many words gets lower score than optimal 3-5 words', () => {
    // A UUID-like slug with 8+ segments falls outside the 3-5 optimal range
    const longSlug = calculateMiniSeoScore(
      makeInput({
        slug: 'a1b2c3d4-e5f6-7890-abcd-ef12-3456-7890-extra',
      }),
    )
    const goodSlug = calculateMiniSeoScore(
      makeInput({
        slug: 'guia-camiones-cisterna',
      }),
    )

    // goodSlug has 3 words (optimal, 10 pts), longSlug has 8 words (not optimal, 5 pts)
    expect(goodSlug.score).toBeGreaterThan(longSlug.score)
  })
})
