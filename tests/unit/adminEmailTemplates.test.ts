import { describe, it, expect } from 'vitest'
import {
  escapeRegex,
  getSampleValue,
  CATEGORIES,
  TEMPLATE_DEFINITIONS,
} from '../../app/utils/adminEmailTemplates'

// ─── escapeRegex ──────────────────────────────────────────────────────────────

describe('escapeRegex', () => {
  it('escapes dot character', () => {
    const escaped = escapeRegex('a.b')
    expect(new RegExp(escaped).test('axb')).toBe(false)
    expect(new RegExp(escaped).test('a.b')).toBe(true)
  })

  it('escapes asterisk', () => {
    const escaped = escapeRegex('a*b')
    expect(new RegExp(escaped).test('a*b')).toBe(true)
  })

  it('escapes plus', () => {
    const escaped = escapeRegex('a+b')
    expect(new RegExp(escaped).test('a+b')).toBe(true)
  })

  it('escapes brackets', () => {
    const escaped = escapeRegex('[test]')
    expect(new RegExp(escaped).test('[test]')).toBe(true)
    expect(new RegExp(escaped).test('test')).toBe(false)
  })

  it('escapes parentheses', () => {
    const escaped = escapeRegex('(group)')
    expect(new RegExp(escaped).test('(group)')).toBe(true)
  })

  it('escapes dollar sign', () => {
    const escaped = escapeRegex('price$')
    expect(new RegExp(escaped).test('price$')).toBe(true)
  })

  it('returns unchanged string when no special chars', () => {
    expect(escapeRegex('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(escapeRegex('')).toBe('')
  })
})

// ─── getSampleValue ───────────────────────────────────────────────────────────

describe('getSampleValue', () => {
  it('returns dealer_name sample', () => {
    expect(getSampleValue('dealer_name')).toBeTruthy()
    expect(typeof getSampleValue('dealer_name')).toBe('string')
  })

  it('returns dealer_email sample', () => {
    expect(getSampleValue('dealer_email')).toContain('@')
  })

  it('returns site_name sample', () => {
    expect(getSampleValue('site_name')).toBeTruthy()
  })

  it('returns login_url sample with https', () => {
    expect(getSampleValue('login_url')).toContain('https://')
  })

  it('returns vehicle_title sample', () => {
    expect(getSampleValue('vehicle_title')).toBeTruthy()
  })

  it('returns lead_name sample', () => {
    expect(getSampleValue('lead_name')).toBeTruthy()
  })

  it('returns plan_name sample', () => {
    expect(getSampleValue('plan_name')).toBeTruthy()
  })

  it('returns bracketed var name for unknown variable', () => {
    expect(getSampleValue('nonexistent_var')).toBe('[nonexistent_var]')
  })
})

// ─── CATEGORIES constant ──────────────────────────────────────────────────────

describe('CATEGORIES', () => {
  it('is an array', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true)
  })

  it('has at least 2 categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(2)
  })

  it('each category has key, labelKey, and icon', () => {
    for (const cat of CATEGORIES) {
      expect(cat).toHaveProperty('key')
      expect(cat).toHaveProperty('labelKey')
      expect(cat).toHaveProperty('icon')
      expect(typeof cat.key).toBe('string')
      expect(cat.key.length).toBeGreaterThan(0)
    }
  })

  it('contains dealers category', () => {
    const keys = CATEGORIES.map((c) => c.key)
    expect(keys).toContain('dealers')
  })
})

// ─── TEMPLATE_DEFINITIONS constant ───────────────────────────────────────────

describe('TEMPLATE_DEFINITIONS', () => {
  it('is an array', () => {
    expect(Array.isArray(TEMPLATE_DEFINITIONS)).toBe(true)
  })

  it('has multiple template definitions', () => {
    expect(TEMPLATE_DEFINITIONS.length).toBeGreaterThan(5)
  })

  it('each template has required fields', () => {
    for (const tpl of TEMPLATE_DEFINITIONS) {
      expect(tpl).toHaveProperty('key')
      expect(tpl).toHaveProperty('category')
      expect(tpl).toHaveProperty('variables')
      expect(typeof tpl.key).toBe('string')
    }
  })

  it('all template categories are valid CategoryKey values', () => {
    const validCategories = ['dealers', 'buyers', 'system']
    for (const tpl of TEMPLATE_DEFINITIONS) {
      expect(validCategories).toContain(tpl.category)
    }
  })

  it('no two templates share the same key', () => {
    const keys = TEMPLATE_DEFINITIONS.map((t) => t.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })
})
