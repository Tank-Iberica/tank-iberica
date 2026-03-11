import { describe, it, expect } from 'vitest'
import {
  getDescriptionTemplate,
  applyPlaceholders,
  getAllTemplates,
} from '~/utils/descriptionTemplates'

describe('getDescriptionTemplate', () => {
  it('returns semirremolque template for matching slug', () => {
    const tpl = getDescriptionTemplate('semirremolques')
    expect(tpl.label).toBe('Semirremolque')
    expect(tpl.es).toContain('Semirremolque')
    expect(tpl.en).toContain('Semi-trailer')
  })

  it('returns cisterna template for partial slug match', () => {
    const tpl = getDescriptionTemplate('cisternas-alimentarias')
    expect(tpl.label).toBe('Cisterna')
  })

  it('returns cabeza-tractora template', () => {
    const tpl = getDescriptionTemplate('cabeza-tractora')
    expect(tpl.label).toBe('Cabeza tractora')
    expect(tpl.es).toContain('tractora')
  })

  it('returns camion template', () => {
    const tpl = getDescriptionTemplate('camion-frigorifico')
    expect(tpl.label).toBe('Camión')
  })

  it('returns excavadora template', () => {
    const tpl = getDescriptionTemplate('excavadora')
    expect(tpl.es).toContain('Excavadora')
    expect(tpl.en).toContain('Excavator')
  })

  it('returns remolque template', () => {
    const tpl = getDescriptionTemplate('remolque-bañera')
    expect(tpl.label).toBe('Remolque')
  })

  it('returns default template for unknown slug', () => {
    const tpl = getDescriptionTemplate('unknown-category')
    expect(tpl.label).toBe('General')
    expect(tpl.es).toContain('Unidad en buen estado')
  })

  it('returns default template for empty slug', () => {
    const tpl = getDescriptionTemplate('')
    expect(tpl.label).toBe('General')
  })

  it('is case-insensitive', () => {
    const tpl = getDescriptionTemplate('CISTERNA')
    expect(tpl.label).toBe('Cisterna')
  })
})

describe('applyPlaceholders', () => {
  it('replaces all placeholders with provided values', () => {
    const result = applyPlaceholders('{marca} {modelo} {año} {km}', {
      marca: 'Volvo',
      modelo: 'FH16',
      año: 2021,
      km: 300000,
    })
    expect(result).toBe('Volvo FH16 2021 300000')
  })

  it('uses fallback values when not provided', () => {
    const result = applyPlaceholders('{marca} {modelo}', {})
    expect(result).toBe('Marca Modelo')
  })

  it('replaces multiple occurrences of same placeholder', () => {
    const result = applyPlaceholders('{marca} {marca}', { marca: 'DAF' })
    expect(result).toBe('DAF DAF')
  })

  it('preserves surrounding text', () => {
    const result = applyPlaceholders('Vendo {marca} {modelo} en perfecto estado', {
      marca: 'MAN',
      modelo: 'TGX',
    })
    expect(result).toBe('Vendo MAN TGX en perfecto estado')
  })
})

describe('getAllTemplates', () => {
  it('returns array of template options', () => {
    const templates = getAllTemplates()
    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(0)
  })

  it('does not include default template', () => {
    const templates = getAllTemplates()
    expect(templates.find((t) => t.key === 'default')).toBeUndefined()
  })

  it('each option has key and label', () => {
    const templates = getAllTemplates()
    for (const tpl of templates) {
      expect(typeof tpl.key).toBe('string')
      expect(typeof tpl.label).toBe('string')
    }
  })
})
