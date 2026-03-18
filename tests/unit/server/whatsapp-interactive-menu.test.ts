/**
 * Tests for #61 — Interactive WhatsApp menu "¿Qué buscas?"
 *
 * Validates:
 * - Menu category list structure
 * - Menu selection parsing (interactive reply + numeric)
 * - Fallback text format
 */
import { describe, it, expect } from 'vitest'

// ── Replicate menu logic from webhook.post.ts ───────────────────────────────

const MENU_CATEGORIES = [
  { id: 'camion', title: '🚛 Camión', description: 'Camiones de carga y transporte' },
  { id: 'furgoneta', title: '🚐 Furgoneta', description: 'Furgonetas de reparto y carga' },
  { id: 'excavadora', title: '🏗️ Excavadora', description: 'Excavadoras y maquinaria' },
  { id: 'remolque', title: '🚚 Remolque', description: 'Remolques y semirremolques' },
  { id: 'autobus', title: '🚌 Autobús', description: 'Autobuses y microbuses' },
  { id: 'otro', title: '🔧 Otro', description: 'Otros vehículos industriales' },
] as const

function isMenuSelection(textContent: string): string | null {
  const match = textContent.match(/^cat_(\w+)$/)
  if (match) return match[1]

  const num = parseInt(textContent.trim(), 10)
  if (num >= 1 && num <= MENU_CATEGORIES.length) {
    return MENU_CATEGORIES[num - 1].id
  }

  return null
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MENU_CATEGORIES (#61)', () => {
  it('has 6 categories defined', () => {
    expect(MENU_CATEGORIES).toHaveLength(6)
  })

  it('all categories have id, title, and description', () => {
    for (const cat of MENU_CATEGORIES) {
      expect(cat.id).toBeTruthy()
      expect(cat.title).toBeTruthy()
      expect(cat.description).toBeTruthy()
    }
  })

  it('all category ids are unique', () => {
    const ids = MENU_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes camion as first category', () => {
    expect(MENU_CATEGORIES[0].id).toBe('camion')
  })
})

describe('isMenuSelection (#61)', () => {
  it('parses interactive reply "cat_camion"', () => {
    expect(isMenuSelection('cat_camion')).toBe('camion')
  })

  it('parses interactive reply "cat_excavadora"', () => {
    expect(isMenuSelection('cat_excavadora')).toBe('excavadora')
  })

  it('parses numeric selection "1" → camion', () => {
    expect(isMenuSelection('1')).toBe('camion')
  })

  it('parses numeric selection "2" → furgoneta', () => {
    expect(isMenuSelection('2')).toBe('furgoneta')
  })

  it('parses numeric selection "6" → otro', () => {
    expect(isMenuSelection('6')).toBe('otro')
  })

  it('parses numeric with whitespace " 3 "', () => {
    expect(isMenuSelection(' 3 ')).toBe('excavadora')
  })

  it('returns null for "0" (out of range)', () => {
    expect(isMenuSelection('0')).toBeNull()
  })

  it('returns null for "7" (out of range)', () => {
    expect(isMenuSelection('7')).toBeNull()
  })

  it('returns null for regular text', () => {
    expect(isMenuSelection('Hola, busco un camión')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(isMenuSelection('')).toBeNull()
  })

  it('returns null for ref code (handled by #60)', () => {
    expect(isMenuSelection('TRC-00123')).toBeNull()
  })
})

describe('Menu fallback text format (#61)', () => {
  it('builds numbered list from categories', () => {
    const text = MENU_CATEGORIES.map((c, i) => `${i + 1}. ${c.title}`).join('\n')
    expect(text).toContain('1. 🚛 Camión')
    expect(text).toContain('6. 🔧 Otro')
    expect(text.split('\n')).toHaveLength(6)
  })
})
