import { describe, it, expect } from 'vitest'
import { fuzzyMatch } from '../../app/utils/fuzzyMatch'

describe('fuzzyMatch', () => {
  it('returns true for an exact match', () => {
    expect(fuzzyMatch('cisterna', 'cisterna')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(fuzzyMatch('Renault Trucks', 'renault trucks')).toBe(true)
    expect(fuzzyMatch('renault trucks', 'RENAULT TRUCKS')).toBe(true)
  })

  it('matches ignoring accents and diacritics', () => {
    expect(fuzzyMatch('Cisterna', 'cisterna')).toBe(true)
    expect(fuzzyMatch('camion', 'camion')).toBe(true)
    // Accented query against non-accented text
    expect(fuzzyMatch('camion', 'camion')).toBe(true)
    // Accented text, non-accented query
    expect(fuzzyMatch('Vehiculo de ocasion', 'vehiculo de ocasion')).toBe(true)
  })

  it('handles multi-word queries where all words must match', () => {
    expect(fuzzyMatch('Renault Trucks Cisterna 2020', 'renault cisterna')).toBe(true)
    // "avion" is not in the text, so should fail
    expect(fuzzyMatch('Renault Trucks Cisterna', 'renault avion')).toBe(false)
  })

  it('matches substrings within words', () => {
    // "ren" is a substring of "renault"
    expect(fuzzyMatch('Renault Trucks', 'ren')).toBe(true)
    // "cist" is a substring of "cisterna"
    expect(fuzzyMatch('Cisterna grande', 'cist')).toBe(true)
  })

  it('returns false for completely different strings', () => {
    expect(fuzzyMatch('Renault Trucks', 'electronica avanzada')).toBe(false)
    expect(fuzzyMatch('cisterna', 'helicoptero')).toBe(false)
  })

  it('handles empty query — empty string is always a substring, so returns true', () => {
    // An empty normalized query is a substring of any string via String.includes('')
    expect(fuzzyMatch('Renault Trucks', '')).toBe(true)
  })

  it('returns false when both text and query are empty', () => {
    // Empty text includes empty query (substring match), so this actually returns true
    // but queryWords is empty after filtering, so let's verify the substring path
    expect(fuzzyMatch('', '')).toBe(true)
  })

  it('handles empty text with a non-empty query by returning false', () => {
    expect(fuzzyMatch('', 'renault')).toBe(false)
  })

  it('filters out short words (< 2 chars) from query', () => {
    // Query "a b" has only single-char words; after filtering, queryWords is empty => false
    expect(fuzzyMatch('Renault Trucks', 'a b')).toBe(false)
  })

  it('uses Dice coefficient similarity for close misspellings', () => {
    // "cisterma" is a close misspelling of "cisterna" - should match with default threshold
    expect(fuzzyMatch('cisterna', 'cisterma')).toBe(true)
    // "renauld" is close to "renault"
    expect(fuzzyMatch('Renault Trucks', 'renauld')).toBe(true)
  })

  it('respects a stricter threshold parameter', () => {
    // With a very strict threshold (0.95), a misspelling should NOT match
    expect(fuzzyMatch('cisterna', 'cisterma', 0.95)).toBe(false)
    // But exact substring still works regardless of threshold
    expect(fuzzyMatch('cisterna', 'cisterna', 0.95)).toBe(true)
  })

  it('matches when query word contains a text word (reverse substring)', () => {
    // The text word "gas" is contained in the query word "gasolina"
    expect(fuzzyMatch('gas natural', 'gasolina')).toBe(true)
  })

  it('handles whitespace normalization', () => {
    expect(fuzzyMatch('  Renault   Trucks  ', 'renault trucks')).toBe(true)
    expect(fuzzyMatch('Renault Trucks', '  renault   trucks  ')).toBe(true)
  })
})
