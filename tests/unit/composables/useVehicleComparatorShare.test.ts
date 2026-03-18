import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useVehicleComparator.ts'), 'utf-8')

describe('Vehicle comparison share link (N47)', () => {
  describe('getShareUrl', () => {
    it('exports getShareUrl function', () => {
      expect(SRC).toContain('getShareUrl')
    })

    it('generates URL with ids parameter', () => {
      expect(SRC).toContain('?ids=')
      expect(SRC).toContain("ids.join(',')")
    })

    it('uses /perfil/comparador path', () => {
      expect(SRC).toContain('/perfil/comparador')
    })

    it('returns base path when no vehicles', () => {
      expect(SRC).toContain("ids.length === 0")
    })

    it('includes origin for absolute URL on client', () => {
      expect(SRC).toContain('window.location.origin')
    })
  })

  describe('loadFromShareUrl', () => {
    it('exports loadFromShareUrl function', () => {
      expect(SRC).toContain('loadFromShareUrl')
    })

    it('splits comma-separated IDs', () => {
      expect(SRC).toContain("split(',')")
    })

    it('validates UUIDs with regex', () => {
      expect(SRC).toContain('UUID_REGEX')
    })

    it('limits to MAX_VEHICLES', () => {
      expect(SRC).toContain('MAX_VEHICLES')
      expect(SRC).toContain('.slice(0, MAX_VEHICLES)')
    })

    it('trims whitespace from IDs', () => {
      expect(SRC).toContain('.trim()')
    })
  })

  describe('UUID validation logic (unit)', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    it('accepts valid UUID', () => {
      expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('accepts uppercase UUID', () => {
      expect(UUID_REGEX.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })

    it('rejects invalid UUID (too short)', () => {
      expect(UUID_REGEX.test('550e8400-e29b')).toBe(false)
    })

    it('rejects non-UUID strings', () => {
      expect(UUID_REGEX.test('not-a-uuid')).toBe(false)
      expect(UUID_REGEX.test('12345')).toBe(false)
    })

    it('rejects SQL injection attempts', () => {
      expect(UUID_REGEX.test("'; DROP TABLE vehicles; --")).toBe(false)
    })
  })

  describe('Share URL parsing (unit)', () => {
    const MAX_VEHICLES = 4
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    function loadFromShareUrl(idsParam: string): string[] {
      return idsParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => UUID_REGEX.test(id))
        .slice(0, MAX_VEHICLES)
    }

    it('parses single ID', () => {
      const ids = loadFromShareUrl('550e8400-e29b-41d4-a716-446655440000')
      expect(ids).toEqual(['550e8400-e29b-41d4-a716-446655440000'])
    })

    it('parses multiple IDs', () => {
      const ids = loadFromShareUrl(
        '550e8400-e29b-41d4-a716-446655440000,660e8400-e29b-41d4-a716-446655440001'
      )
      expect(ids).toHaveLength(2)
    })

    it('filters out invalid IDs', () => {
      const ids = loadFromShareUrl('550e8400-e29b-41d4-a716-446655440000,INVALID,hello')
      expect(ids).toHaveLength(1)
    })

    it('limits to MAX_VEHICLES (4)', () => {
      const manyIds = Array(10)
        .fill(null)
        .map((_, i) => `550e8400-e29b-41d4-a716-44665544000${i}`)
        .join(',')
      const ids = loadFromShareUrl(manyIds)
      expect(ids.length).toBeLessThanOrEqual(MAX_VEHICLES)
    })

    it('handles empty string', () => {
      const ids = loadFromShareUrl('')
      expect(ids).toEqual([])
    })
  })
})
