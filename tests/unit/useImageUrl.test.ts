import { describe, it, expect } from 'vitest'
import { useImageUrl } from '../../app/composables/useImageUrl'

const { getImageUrl, getVersionedUrl } = useImageUrl()

// ─── getImageUrl ──────────────────────────────────────────────────────────

describe('getImageUrl — null/empty inputs', () => {
  it('returns placeholder for null', () => {
    expect(getImageUrl(null)).toBe('/placeholder-vehicle.svg')
  })

  it('returns placeholder for undefined', () => {
    expect(getImageUrl(undefined)).toBe('/placeholder-vehicle.svg')
  })

  it('returns placeholder for empty string', () => {
    expect(getImageUrl('')).toBe('/placeholder-vehicle.svg')
  })
})

describe('getImageUrl — CF Images (imagedelivery.net)', () => {
  const cfBase = 'https://imagedelivery.net/abc123/image-id'

  it('replaces existing variant in last segment', () => {
    const url = `${cfBase}/public`
    expect(getImageUrl(url, 'card')).toBe(`${cfBase}/card`)
  })

  it('replaces "thumb" variant with "gallery"', () => {
    const url = `${cfBase}/thumb`
    expect(getImageUrl(url, 'gallery')).toBe(`${cfBase}/gallery`)
  })

  it('appends variant when no known variant in last segment', () => {
    const url = `${cfBase}/image-id`
    const result = getImageUrl(url, 'og')
    expect(result).toContain('/og')
  })

  it('defaults to "card" variant', () => {
    const url = `${cfBase}/public`
    expect(getImageUrl(url)).toBe(`${cfBase}/card`)
  })

  it('handles all four variants: thumb, card, gallery, og', () => {
    for (const variant of ['thumb', 'card', 'gallery', 'og'] as const) {
      const url = `${cfBase}/public`
      expect(getImageUrl(url, variant)).toBe(`${cfBase}/${variant}`)
    }
  })
})

describe('getImageUrl — Cloudinary (cloudinary.com)', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload/tracciona/vehicles/test.jpg'

  it('inserts thumb transformation', () => {
    const result = getImageUrl(base, 'thumb')
    expect(result).toContain('w_300,h_200')
    expect(result).toContain('/upload/')
  })

  it('inserts card transformation', () => {
    const result = getImageUrl(base, 'card')
    expect(result).toContain('w_600,h_400')
  })

  it('inserts gallery transformation', () => {
    const result = getImageUrl(base, 'gallery')
    expect(result).toContain('w_1200,h_800')
  })

  it('inserts og transformation', () => {
    const result = getImageUrl(base, 'og')
    expect(result).toContain('w_1200,h_630')
  })

  it('does not duplicate /upload/ segment', () => {
    const result = getImageUrl(base, 'card')
    expect(result.split('/upload/').length).toBe(2)
  })

  it('returns original url when /upload/ not in url', () => {
    const noUpload = 'https://res.cloudinary.com/demo/image/tracciona/test.jpg'
    expect(getImageUrl(noUpload, 'card')).toBe(noUpload)
  })
})

describe('getImageUrl — fallback (other URLs)', () => {
  it('returns url as-is for unknown CDN', () => {
    const url = 'https://example.com/photo.jpg'
    expect(getImageUrl(url, 'card')).toBe(url)
  })
})

// ─── getVersionedUrl ──────────────────────────────────────────────────────

describe('getVersionedUrl', () => {
  it('appends ?v= to plain url', () => {
    expect(getVersionedUrl('https://example.com/img.jpg', '2024-01')).toBe(
      'https://example.com/img.jpg?v=2024-01',
    )
  })

  it('appends &v= when url already has query string', () => {
    expect(getVersionedUrl('https://example.com/img.jpg?w=300', 'abc')).toBe(
      'https://example.com/img.jpg?w=300&v=abc',
    )
  })

  it('encodes version parameter', () => {
    const result = getVersionedUrl('https://example.com/img.jpg', '2024-01-01T00:00:00Z')
    expect(result).toContain('v=')
  })

  it('returns url unchanged when url is placeholder', () => {
    const placeholder = '/placeholder-vehicle.svg'
    expect(getVersionedUrl(placeholder, 'v1')).toBe(placeholder)
  })

  it('returns url unchanged for empty string', () => {
    expect(getVersionedUrl('', 'v1')).toBe('')
  })

  it('accepts numeric version', () => {
    const result = getVersionedUrl('https://example.com/img.jpg', 42)
    expect(result).toBe('https://example.com/img.jpg?v=42')
  })
})
