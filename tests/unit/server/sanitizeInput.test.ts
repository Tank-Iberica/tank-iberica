import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeRecord, sanitizeSlug } from '../../../server/utils/sanitizeInput'

describe('sanitizeText', () => {
  it('returns the string unchanged when clean', () => {
    expect(sanitizeText('Volvo FH16')).toBe('Volvo FH16')
  })

  it('strips null bytes', () => {
    expect(sanitizeText('foo\0bar')).toBe('foobar')
    expect(sanitizeText('\0start')).toBe('start')
  })

  it('normalizes CRLF to LF', () => {
    const result = sanitizeText('line1\r\nline2\rline3')
    expect(result).toBe('line1\nline2\nline3')
  })

  it('strips HTML tags by default', () => {
    expect(sanitizeText('<b>bold</b> text')).toBe('bold text')
    expect(sanitizeText('<p class="x">para</p>')).toBe('para')
  })

  it('strips script tags', () => {
    expect(sanitizeText('<script>alert(1)</script>safe')).toBe('safe')
    expect(sanitizeText('<script type="text/javascript">evil()</script>ok')).toBe('ok')
  })

  it('decodes HTML entities', () => {
    expect(sanitizeText('a &amp; b')).toBe('a & b')
    expect(sanitizeText('&lt;tag&gt;')).toBe('<tag>')
    expect(sanitizeText('it&quot;s')).toBe('it"s')
    expect(sanitizeText('it&#x27;s')).toBe("it's")
  })

  it('preserves HTML tags when stripHtml=false', () => {
    expect(sanitizeText('<b>text</b>', { stripHtml: false })).toBe('<b>text</b>')
  })

  it('collapses repeated whitespace within a line', () => {
    expect(sanitizeText('foo   bar   baz')).toBe('foo bar baz')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world')
  })

  it('preserves newlines between lines', () => {
    const result = sanitizeText('line1\nline2\nline3')
    expect(result).toBe('line1\nline2\nline3')
  })

  it('trims individual lines', () => {
    const result = sanitizeText('  line1  \n  line2  ')
    expect(result).toBe('line1\nline2')
  })

  it('enforces maxLength', () => {
    const result = sanitizeText('abcdefghij', { maxLength: 5 })
    expect(result).toBe('abcde')
  })

  it('does not truncate when under maxLength', () => {
    expect(sanitizeText('abc', { maxLength: 10 })).toBe('abc')
  })

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('handles string with only whitespace', () => {
    expect(sanitizeText('   ')).toBe('')
  })

  it('combined: null bytes + HTML + whitespace', () => {
    const input = '  <b>hello\0</b>   world  '
    expect(sanitizeText(input)).toBe('hello world')
  })
})

describe('sanitizeRecord', () => {
  it('sanitizes all string values', () => {
    const result = sanitizeRecord({ brand: '  Volvo  ', model: '<b>FH16</b>' })
    expect(result.brand).toBe('Volvo')
    expect(result.model).toBe('FH16')
  })

  it('passes through non-string values unchanged', () => {
    const result = sanitizeRecord({ year: 2020, active: true, data: null })
    expect(result.year).toBe(2020)
    expect(result.active).toBe(true)
    expect(result.data).toBeNull()
  })

  it('applies maxLength option to all strings', () => {
    const result = sanitizeRecord({ a: 'abcdef', b: 'xyz' }, { maxLength: 4 })
    expect(result.a).toBe('abcd')
    expect(result.b).toBe('xyz')
  })

  it('returns a new object (does not mutate original)', () => {
    const original = { name: '  hello  ' }
    const result = sanitizeRecord(original)
    expect(result.name).toBe('hello')
    expect(original.name).toBe('  hello  ')
  })

  it('handles empty object', () => {
    expect(sanitizeRecord({})).toEqual({})
  })
})

describe('sanitizeSlug', () => {
  it('lowercases the string', () => {
    expect(sanitizeSlug('VOLVO-FH16')).toBe('volvo-fh16')
  })

  it('replaces spaces with hyphens', () => {
    expect(sanitizeSlug('volvo fh16')).toBe('volvo-fh16')
  })

  it('replaces special characters with hyphens', () => {
    expect(sanitizeSlug('camión/tractora')).toBe('cami-n-tractora')
  })

  it('collapses multiple hyphens', () => {
    expect(sanitizeSlug('a--b---c')).toBe('a-b-c')
  })

  it('strips leading and trailing hyphens', () => {
    expect(sanitizeSlug('-hello-')).toBe('hello')
  })

  it('strips null bytes', () => {
    expect(sanitizeSlug('foo\0bar')).toBe('foobar')
  })

  it('enforces 200 character max length', () => {
    const long = 'a'.repeat(300)
    expect(sanitizeSlug(long).length).toBe(200)
  })

  it('handles empty string', () => {
    expect(sanitizeSlug('')).toBe('')
  })

  it('preserves hyphens and alphanumeric', () => {
    expect(sanitizeSlug('volvo-fh16-2020')).toBe('volvo-fh16-2020')
  })
})
