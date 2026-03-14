import { describe, it, expect } from 'vitest'
import { parseSimpleMarkdown } from '../../app/utils/markdownToHtml'

describe('parseSimpleMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(parseSimpleMarkdown('')).toBe('')
    expect(parseSimpleMarkdown('   ')).toBe('')
  })

  it('wraps plain text in a paragraph', () => {
    const result = parseSimpleMarkdown('Hello world')
    expect(result).toBe('<p>Hello world</p>')
  })

  it('converts **bold** to <strong>', () => {
    const result = parseSimpleMarkdown('This is **bold** text')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('converts __bold__ to <strong>', () => {
    const result = parseSimpleMarkdown('This is __bold__ text')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('converts *italic* to <em>', () => {
    const result = parseSimpleMarkdown('This is *italic* text')
    expect(result).toContain('<em>italic</em>')
  })

  it('converts _italic_ to <em>', () => {
    const result = parseSimpleMarkdown('This is _italic_ text')
    expect(result).toContain('<em>italic</em>')
  })

  it('converts [text](url) to anchor tag', () => {
    const result = parseSimpleMarkdown('See [cisternas](/cisternas) for more')
    expect(result).toContain('<a href="/cisternas" rel="noopener noreferrer">cisternas</a>')
  })

  it('converts internal landing link correctly', () => {
    const result = parseSimpleMarkdown('[Cisternas de aluminio](/cisternas-de-aluminio)')
    expect(result).toContain('href="/cisternas-de-aluminio"')
    expect(result).toContain('rel="noopener noreferrer"')
    expect(result).toContain('>Cisternas de aluminio<')
  })

  it('splits blank lines into separate paragraphs', () => {
    const result = parseSimpleMarkdown('First paragraph\n\nSecond paragraph')
    expect(result).toContain('<p>First paragraph</p>')
    expect(result).toContain('<p>Second paragraph</p>')
  })

  it('converts single newlines to <br>', () => {
    const result = parseSimpleMarkdown('Line one\nLine two')
    expect(result).toContain('<br>')
  })

  it('handles bold inside a link text', () => {
    const result = parseSimpleMarkdown('[**Bold link**](/path)')
    expect(result).toContain('<a href="/path"')
  })

  it('handles multiple links in same paragraph', () => {
    const result = parseSimpleMarkdown(
      'See [cisternas](/cisternas) and [cabezas](/cabezas)',
    )
    expect(result).toContain('href="/cisternas"')
    expect(result).toContain('href="/cabezas"')
  })

  it('does not add extra newline between paragraphs', () => {
    const result = parseSimpleMarkdown('Para 1\n\nPara 2\n\nPara 3')
    const paragraphCount = (result.match(/<p>/g) || []).length
    expect(paragraphCount).toBe(3)
  })

  it('handles text with no markdown — just plain text', () => {
    const plain =
      'Cisterna de aluminio en buen estado. Capacidad 30.000 litros. Revisión reciente.'
    const result = parseSimpleMarkdown(plain)
    expect(result).toBe(`<p>${plain}</p>`)
  })
})
