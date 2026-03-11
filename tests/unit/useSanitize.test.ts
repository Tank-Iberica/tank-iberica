import { describe, it, expect } from 'vitest'
import { useSanitize } from '../../app/composables/useSanitize'

// Note: DOMPurify (isomorphic-dompurify) runs in happy-dom environment

describe('sanitize', () => {
  it('returns plain text unchanged', () => {
    const { sanitize } = useSanitize()
    expect(sanitize('Hello World')).toBe('Hello World')
  })

  it('allows <b> tag', () => {
    const { sanitize } = useSanitize()
    expect(sanitize('<b>bold</b>')).toContain('<b>')
    expect(sanitize('<b>bold</b>')).toContain('bold')
  })

  it('allows <strong> tag', () => {
    const { sanitize } = useSanitize()
    expect(sanitize('<strong>bold</strong>')).toContain('bold')
  })

  it('allows <em> tag', () => {
    const { sanitize } = useSanitize()
    expect(sanitize('<em>italic</em>')).toContain('italic')
  })

  it('allows <p> tag', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<p>paragraph</p>')
    expect(result).toContain('paragraph')
  })

  it('allows <a> with href', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<a href="https://example.com">link</a>')
    expect(result).toContain('href')
    expect(result).toContain('link')
  })

  it('allows <ul> and <li>', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<ul><li>item</li></ul>')
    expect(result).toContain('item')
  })

  it('removes <script> tag', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('removes <div> tag but keeps content', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<div>content</div>')
    expect(result).not.toContain('<div>')
    expect(result).toContain('content')
  })

  it('removes onclick attribute', () => {
    const { sanitize } = useSanitize()
    const result = sanitize('<b onclick="alert(1)">click</b>')
    expect(result).not.toContain('onclick')
    expect(result).toContain('click')
  })

  it('returns empty string for empty input', () => {
    const { sanitize } = useSanitize()
    expect(sanitize('')).toBe('')
  })
})

describe('sanitizeStrict', () => {
  it('returns plain text unchanged', () => {
    const { sanitizeStrict } = useSanitize()
    expect(sanitizeStrict('Hello World')).toBe('Hello World')
  })

  it('strips <b> tags', () => {
    const { sanitizeStrict } = useSanitize()
    const result = sanitizeStrict('<b>bold</b>')
    expect(result).not.toContain('<b>')
  })

  it('strips <p> tags', () => {
    const { sanitizeStrict } = useSanitize()
    const result = sanitizeStrict('<p>paragraph</p>')
    expect(result).not.toContain('<p>')
  })

  it('strips <script> tags and content', () => {
    const { sanitizeStrict } = useSanitize()
    const result = sanitizeStrict('<script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('removes all attributes', () => {
    const { sanitizeStrict } = useSanitize()
    const result = sanitizeStrict('<a href="https://example.com">link</a>')
    expect(result).not.toContain('href')
  })

  it('returns empty string for empty input', () => {
    const { sanitizeStrict } = useSanitize()
    expect(sanitizeStrict('')).toBe('')
  })
})
