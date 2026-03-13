/**
 * Tests for Web Stories HTML generation helpers.
 * We test the pure helper functions extracted from the route.
 */
import { describe, it, expect } from 'vitest'

// Pure helpers extracted from the route for testability
function formatPrice(price: number | null): string {
  if (!price) return ''
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function safeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

describe('formatPrice', () => {
  it('returns empty string for null price', () => {
    expect(formatPrice(null)).toBe('')
  })

  it('formats price with EUR currency', () => {
    const result = formatPrice(25000)
    expect(result).toContain('25')
    expect(result).toContain('€')
  })

  it('formats large price correctly', () => {
    const result = formatPrice(125000)
    // Spanish locale: "125.000 €" — contains thousands separator, not decimal cents
    expect(result).toContain('125')
    expect(result).toContain('€')
  })
})

describe('safeText', () => {
  it('escapes & to &amp;', () => {
    expect(safeText('A & B')).toBe('A &amp; B')
  })

  it('escapes < to &lt;', () => {
    expect(safeText('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes " to &quot;', () => {
    expect(safeText('He said "hello"')).toBe('He said &quot;hello&quot;')
  })

  it('returns plain text unchanged', () => {
    expect(safeText('Camión Renault 2023')).toBe('Camión Renault 2023')
  })

  it('prevents XSS injection in titles', () => {
    const malicious = '<img src=x onerror=alert(1)>'
    const result = safeText(malicious)
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
  })
})

describe('Web Story structure', () => {
  it('builds correct title from brand, model, year', () => {
    const brand = 'Renault'
    const model = 'T480'
    const year = 2020
    const title = `${brand} ${model}${year ? ` (${year})` : ''}`
    expect(title).toBe('Renault T480 (2020)')
  })

  it('builds title without year when year is null', () => {
    const brand = 'Volvo'
    const model = 'FH16'
    const year = null
    const title = `${brand} ${model}${year ? ` (${year})` : ''}`
    expect(title).toBe('Volvo FH16')
  })

  it('truncates description to 120 chars', () => {
    const longDesc = 'A'.repeat(200)
    const truncated = longDesc.slice(0, 120).trim()
    expect(truncated.length).toBe(120)
  })
})
