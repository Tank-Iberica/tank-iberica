import { describe, it, expect } from 'vitest'
import { RESERVED_SLUGS } from '../../app/utils/reserved-slugs'

describe('RESERVED_SLUGS', () => {
  it('is an array', () => {
    expect(Array.isArray(RESERVED_SLUGS)).toBe(true)
  })

  it('contains admin', () => {
    expect(RESERVED_SLUGS).toContain('admin')
  })

  it('contains dashboard', () => {
    expect(RESERVED_SLUGS).toContain('dashboard')
  })

  it('contains login', () => {
    expect(RESERVED_SLUGS).toContain('login')
  })

  it('contains api', () => {
    expect(RESERVED_SLUGS).toContain('api')
  })

  it('contains legal', () => {
    expect(RESERVED_SLUGS).toContain('legal')
  })

  it('contains sitemap', () => {
    expect(RESERVED_SLUGS).toContain('sitemap')
  })

  it('contains robots', () => {
    expect(RESERVED_SLUGS).toContain('robots')
  })

  it('has more than 10 entries', () => {
    expect(RESERVED_SLUGS.length).toBeGreaterThan(10)
  })

  it('all entries are lowercase strings', () => {
    for (const slug of RESERVED_SLUGS) {
      expect(typeof slug).toBe('string')
      expect(slug).toBe(slug.toLowerCase())
    }
  })

  it('does not contain empty strings', () => {
    for (const slug of RESERVED_SLUGS) {
      expect(slug.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate entries', () => {
    const unique = new Set(RESERVED_SLUGS)
    expect(unique.size).toBe(RESERVED_SLUGS.length)
  })
})
