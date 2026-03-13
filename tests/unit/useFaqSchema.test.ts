import { describe, it, expect } from 'vitest'
import { buildFaqPageSchema } from '../../app/utils/faqSchema'

describe('buildFaqPageSchema', () => {
  it('returns null when count is 0', () => {
    const result = buildFaqPageSchema({ title: 'Camiones', count: 0, locale: 'es' })
    expect(result).toBeNull()
  })

  it('returns null when count is negative', () => {
    const result = buildFaqPageSchema({ title: 'Camiones', count: -1, locale: 'es' })
    expect(result).toBeNull()
  })

  it('returns FAQPage schema with correct @type and @context', () => {
    const schema = buildFaqPageSchema({ title: 'Camiones', count: 10, locale: 'es' })
    expect(schema!['@type']).toBe('FAQPage')
    expect(schema!['@context']).toBe('https://schema.org')
  })

  it('includes exactly 5 Q&A items', () => {
    const schema = buildFaqPageSchema({ title: 'Camiones', count: 10, locale: 'es' })
    const mainEntity = schema!.mainEntity as unknown[]
    expect(mainEntity).toHaveLength(5)
  })

  it('each item has Question type with non-empty name and acceptedAnswer', () => {
    const schema = buildFaqPageSchema({ title: 'Camiones', count: 5, locale: 'es' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    for (const item of items) {
      expect(item['@type']).toBe('Question')
      expect(typeof item.name).toBe('string')
      expect((item.name as string).length).toBeGreaterThan(0)
      const answer = item.acceptedAnswer as Record<string, unknown>
      expect(answer['@type']).toBe('Answer')
      expect(typeof answer.text).toBe('string')
      expect((answer.text as string).length).toBeGreaterThan(0)
    }
  })

  it('ES first question contains the title', () => {
    const schema = buildFaqPageSchema({ title: 'Cisternas de aluminio', count: 8, locale: 'es' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const hasTitle = items.some((item) => (item.name as string).includes('Cisternas de aluminio'))
    expect(hasTitle).toBe(true)
  })

  it('ES first answer contains the count', () => {
    const schema = buildFaqPageSchema({ title: 'Cisternas', count: 12, locale: 'es' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const hasCount = items.some((item) => {
      const answer = item.acceptedAnswer as Record<string, unknown>
      return (answer.text as string).includes('12')
    })
    expect(hasCount).toBe(true)
  })

  it('ES singular count uses singular "anuncio"', () => {
    const schema = buildFaqPageSchema({ title: 'Camiones', count: 1, locale: 'es' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const firstAnswer = (items[0].acceptedAnswer as Record<string, unknown>).text as string
    expect(firstAnswer).toContain('1 anuncio ')
    expect(firstAnswer).not.toContain('1 anuncios')
  })

  it('ES plural count uses plural "anuncios"', () => {
    const schema = buildFaqPageSchema({ title: 'Camiones', count: 5, locale: 'es' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const firstAnswer = (items[0].acceptedAnswer as Record<string, unknown>).text as string
    expect(firstAnswer).toContain('5 anuncios')
  })

  it('EN locale generates English questions', () => {
    const schema = buildFaqPageSchema({ title: 'Dump trucks', count: 5, locale: 'en' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const firstQuestion = items[0].name as string
    expect(firstQuestion).toMatch(/for sale/i)
  })

  it('EN first question contains the title', () => {
    const schema = buildFaqPageSchema({ title: 'Refrigerated trucks', count: 3, locale: 'en' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const hasTitle = items.some((item) => (item.name as string).includes('Refrigerated trucks'))
    expect(hasTitle).toBe(true)
  })

  it('EN first answer contains the count', () => {
    const schema = buildFaqPageSchema({ title: 'Trucks', count: 7, locale: 'en' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const hasCount = items.some((item) => {
      const answer = item.acceptedAnswer as Record<string, unknown>
      return (answer.text as string).includes('7')
    })
    expect(hasCount).toBe(true)
  })

  it('EN singular count uses singular "listing"', () => {
    const schema = buildFaqPageSchema({ title: 'Trucks', count: 1, locale: 'en' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const firstAnswer = (items[0].acceptedAnswer as Record<string, unknown>).text as string
    expect(firstAnswer).toContain('1 listing ')
    expect(firstAnswer).not.toContain('1 listings')
  })

  it('EN plural count uses plural "listings"', () => {
    const schema = buildFaqPageSchema({ title: 'Trucks', count: 4, locale: 'en' })
    const items = schema!.mainEntity as Array<Record<string, unknown>>
    const firstAnswer = (items[0].acceptedAnswer as Record<string, unknown>).text as string
    expect(firstAnswer).toContain('4 listings')
  })

  it('unknown locale defaults to Spanish questions', () => {
    const esSchema = buildFaqPageSchema({ title: 'Camiones', count: 5, locale: 'es' })
    const frSchema = buildFaqPageSchema({ title: 'Camiones', count: 5, locale: 'fr' })
    const esFirst = (esSchema!.mainEntity as Array<Record<string, unknown>>)[0].name as string
    const frFirst = (frSchema!.mainEntity as Array<Record<string, unknown>>)[0].name as string
    expect(frFirst).toBe(esFirst)
  })
})
