/**
 * Tests for #60 — TRC ref_code WhatsApp handler
 *
 * Validates:
 * - Ref code extraction from text messages
 * - Pattern matching (TRC-00123 format)
 * - Edge cases (no match, partial match, case insensitivity)
 */
import { describe, it, expect } from 'vitest'

// ── Replicate extractRefCode logic from webhook.post.ts ─────────────────────

const REF_CODE_PATTERN = /\b([A-Z]{2,5}-\d{3,6})\b/i

function extractRefCode(text: string): string | null {
  const match = text.match(REF_CODE_PATTERN)
  return match ? match[1].toUpperCase() : null
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('extractRefCode (#60)', () => {
  it('extracts TRC-00123 from plain text', () => {
    expect(extractRefCode('TRC-00123')).toBe('TRC-00123')
  })

  it('extracts ref code from sentence', () => {
    expect(extractRefCode('Info sobre TRC-00456 por favor')).toBe('TRC-00456')
  })

  it('is case-insensitive (lowercase input → uppercase output)', () => {
    expect(extractRefCode('trc-00789')).toBe('TRC-00789')
  })

  it('handles mixed case', () => {
    expect(extractRefCode('Trc-01234')).toBe('TRC-01234')
  })

  it('returns null for text without ref code', () => {
    expect(extractRefCode('Hola, quiero información')).toBeNull()
  })

  it('returns null for empty text', () => {
    expect(extractRefCode('')).toBeNull()
  })

  it('extracts first ref code if multiple present', () => {
    expect(extractRefCode('Ver TRC-00001 y TRC-00002')).toBe('TRC-00001')
  })

  it('handles 3-digit ref codes', () => {
    expect(extractRefCode('TRC-123')).toBe('TRC-123')
  })

  it('handles 6-digit ref codes', () => {
    expect(extractRefCode('TRC-123456')).toBe('TRC-123456')
  })

  it('handles non-TRC prefixes (e.g. VH-00001)', () => {
    expect(extractRefCode('VH-00001')).toBe('VH-00001')
  })

  it('does not match single digit after dash', () => {
    expect(extractRefCode('TRC-1')).toBeNull()
  })

  it('does not match 7+ digits after dash', () => {
    expect(extractRefCode('TRC-1234567')).toBeNull()
  })

  it('handles ref code with surrounding punctuation', () => {
    expect(extractRefCode('(TRC-00123)')).toBe('TRC-00123')
  })
})

// ── WhatsApp response formatting ─────────────────────────────────────────────

describe('TRC handler — response formatting (#60)', () => {
  function formatVehicleMessage(vehicle: {
    ref_code: string
    title: string | null
    brand: string | null
    model: string | null
    year: number | null
    price: number | null
    location_province: string | null
    status: string
    slug: string
  }): string {
    const title = vehicle.title || `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim()
    const price = vehicle.price ? `${vehicle.price.toLocaleString('es-ES')} €` : 'Consultar'
    const location = vehicle.location_province || ''
    const statusLabel = vehicle.status === 'published' ? 'Disponible' : vehicle.status === 'reserved' ? 'Reservado' : vehicle.status

    return [
      `🔍 *${vehicle.ref_code}*`,
      '',
      `🚛 *${title}*`,
      location ? `📍 ${location}` : '',
      `💰 ${price}`,
      `📋 Estado: ${statusLabel}`,
      '',
      `🔗 https://tracciona.com/${vehicle.slug}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  it('formats published vehicle correctly', () => {
    const msg = formatVehicleMessage({
      ref_code: 'TRC-00123',
      title: 'Volvo FH 2020',
      brand: 'Volvo',
      model: 'FH',
      year: 2020,
      price: 75000,
      location_province: 'Madrid',
      status: 'published',
      slug: 'volvo-fh-2020',
    })
    expect(msg).toContain('TRC-00123')
    expect(msg).toContain('Volvo FH 2020')
    expect(msg).toContain('75.000 €')
    expect(msg).toContain('Madrid')
    expect(msg).toContain('Disponible')
    expect(msg).toContain('volvo-fh-2020')
  })

  it('formats reserved vehicle correctly', () => {
    const msg = formatVehicleMessage({
      ref_code: 'TRC-00456',
      title: null,
      brand: 'MAN',
      model: 'TGX',
      year: 2019,
      price: null,
      location_province: null,
      status: 'reserved',
      slug: 'man-tgx-2019',
    })
    expect(msg).toContain('MAN TGX 2019')
    expect(msg).toContain('Consultar')
    expect(msg).toContain('Reservado')
    expect(msg).not.toContain('📍') // no location
  })

  it('uses brand+model+year when title is null', () => {
    const msg = formatVehicleMessage({
      ref_code: 'TRC-00789',
      title: null,
      brand: 'Scania',
      model: 'R450',
      year: 2021,
      price: 60000,
      location_province: 'Barcelona',
      status: 'published',
      slug: 'scania-r450-2021',
    })
    expect(msg).toContain('Scania R450 2021')
  })
})
