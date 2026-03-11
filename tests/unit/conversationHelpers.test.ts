import { describe, it, expect } from 'vitest'
import { maskContactData, resolveUserName } from '../../app/composables/shared/conversationHelpers'

describe('maskContactData', () => {
  it('returns text unchanged when data is shared', () => {
    expect(maskContactData('Call me at +34 600 123 456', true)).toBe('Call me at +34 600 123 456')
  })

  it('masks phone numbers when data is not shared', () => {
    expect(maskContactData('Call me at +34 600 123 456', false)).toBe('Call me at [datos ocultos]')
  })

  it('masks emails when data is not shared', () => {
    expect(maskContactData('Email me at john@example.com', false)).toBe('Email me at [datos ocultos]')
  })

  it('masks both phone and email', () => {
    const text = 'Phone: 600123456 Email: a@b.com'
    const masked = maskContactData(text, false)
    expect(masked).not.toContain('600123456')
    expect(masked).not.toContain('a@b.com')
  })

  it('returns empty string as-is', () => {
    expect(maskContactData('', false)).toBe('')
  })

  it('does not mask short numbers', () => {
    expect(maskContactData('I have 42 items', false)).toBe('I have 42 items')
  })
})

describe('resolveUserName', () => {
  it('returns undefined for null user', () => {
    expect(resolveUserName(null)).toBeUndefined()
  })

  it('returns pseudonimo when present', () => {
    expect(resolveUserName({ name: 'A', apellidos: 'B', pseudonimo: 'Nick', company_name: 'Co' })).toBe('Nick')
  })

  it('returns company_name when no pseudonimo', () => {
    expect(resolveUserName({ name: 'A', apellidos: 'B', pseudonimo: null, company_name: 'Co' })).toBe('Co')
  })

  it('returns full name when no pseudonimo or company', () => {
    expect(resolveUserName({ name: 'Juan', apellidos: 'Garcia', pseudonimo: null, company_name: null })).toBe('Juan Garcia')
  })

  it('returns only name when no apellidos', () => {
    expect(resolveUserName({ name: 'Juan', apellidos: null, pseudonimo: null, company_name: null })).toBe('Juan')
  })

  it('returns undefined when all fields are null', () => {
    expect(resolveUserName({ name: null, apellidos: null, pseudonimo: null, company_name: null })).toBeUndefined()
  })
})
