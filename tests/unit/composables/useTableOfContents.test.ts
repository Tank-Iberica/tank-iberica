/**
 * Tests for useTableOfContents composable
 *
 * Uses happy-dom (browser-like) environment.
 * IntersectionObserver is mocked since happy-dom doesn't implement it fully.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock IntersectionObserver before importing the composable
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockObserverCb = vi.fn()

// vi.fn() wrapping a regular function (not arrow) = spy + usable as constructor
const mockIOSpy = vi.fn(function MockIO(cb: IntersectionObserverCallback) {
  mockObserverCb.mockImplementation(cb)
  return {
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  }
})
vi.stubGlobal('IntersectionObserver', mockIOSpy)

import { useTableOfContents } from '../../../app/composables/useTableOfContents'

function makeContainer(html: string): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('useTableOfContents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns required interface shape', () => {
    const toc = useTableOfContents()
    expect(toc).toHaveProperty('tocItems')
    expect(toc).toHaveProperty('activeId')
    expect(toc).toHaveProperty('buildToc')
    expect(toc).toHaveProperty('scrollToHeading')
  })

  it('initializes with empty tocItems and activeId=""', () => {
    const { tocItems, activeId } = useTableOfContents()
    expect(tocItems.value).toEqual([])
    expect(activeId.value).toBe('')
  })

  it('buildToc returns early when container is null', () => {
    const { buildToc, tocItems } = useTableOfContents()
    buildToc(null)
    expect(tocItems.value).toEqual([])
  })

  it('buildToc extracts h2 headings', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const container = makeContainer('<h2>Sección uno</h2><h2>Sección dos</h2>')
    buildToc(container)
    expect(tocItems.value).toHaveLength(2)
    expect(tocItems.value[0].text).toBe('Sección uno')
    expect(tocItems.value[0].level).toBe(2)
  })

  it('buildToc extracts h3 and h4 headings', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const container = makeContainer('<h3>Sub-sección</h3><h4>Detalle</h4>')
    buildToc(container)
    expect(tocItems.value[0].level).toBe(3)
    expect(tocItems.value[1].level).toBe(4)
  })

  it('buildToc assigns id from text when heading has no id', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const container = makeContainer('<h2>Cómo elegir tu vehículo</h2>')
    buildToc(container)
    // Slug: lowercase, strip non-alphanumeric except spaces/dashes
    expect(tocItems.value[0].id).toBe('cmo-elegir-tu-vehculo')
  })

  it('buildToc preserves existing heading id', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const container = makeContainer('<h2 id="my-id">Título</h2>')
    buildToc(container)
    expect(tocItems.value[0].id).toBe('my-id')
  })

  it('buildToc uses fallback id for empty heading text', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const container = makeContainer('<h2></h2>')
    buildToc(container)
    expect(tocItems.value[0].id).toBe('heading-0')
  })

  it('buildToc starts IntersectionObserver for headings', () => {
    const { buildToc } = useTableOfContents()
    const container = makeContainer('<h2>A</h2><h3>B</h3>')
    buildToc(container)
    expect(mockIOSpy).toHaveBeenCalledTimes(1)
    expect(mockObserve).toHaveBeenCalledTimes(2)
  })

  it('buildToc does NOT start observer when no headings', () => {
    const { buildToc } = useTableOfContents()
    const container = makeContainer('<p>No headings here</p>')
    buildToc(container)
    expect(mockIOSpy).not.toHaveBeenCalled()
  })

  it('scrollToHeading sets activeId immediately', () => {
    const { buildToc, scrollToHeading, activeId } = useTableOfContents()
    const container = makeContainer('<h2 id="target-section">Sección</h2>')
    document.body.appendChild(container)
    buildToc(container)
    scrollToHeading('target-section')
    expect(activeId.value).toBe('target-section')
    document.body.removeChild(container)
  })

  it('scrollToHeading does nothing for unknown id', () => {
    const { scrollToHeading, activeId } = useTableOfContents()
    scrollToHeading('nonexistent-id')
    expect(activeId.value).toBe('')
  })

  it('buildToc handles container with mixed heading levels', () => {
    const { buildToc, tocItems } = useTableOfContents()
    const html = '<h2>A</h2><h3>B</h3><h4>C</h4><h2>D</h2>'
    buildToc(makeContainer(html))
    expect(tocItems.value).toHaveLength(4)
    expect(tocItems.value.map((i) => i.level)).toEqual([2, 3, 4, 2])
  })
})
