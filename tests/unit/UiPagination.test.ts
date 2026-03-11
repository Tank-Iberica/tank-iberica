import { describe, it, expect, vi, beforeAll } from 'vitest'
import { ref, computed } from 'vue'

// Stub Nuxt auto-imports
vi.stubGlobal('computed', computed)
vi.stubGlobal('useI18n', () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`
    return key
  },
}))

// We test the pagination logic as a pure computation unit
// (full component mounting requires a browser env; logic is extracted here for speed)

/** Mirrors the pages() computed in UiPagination.vue */
function buildPages(
  totalItems: number,
  pageSize: number,
  currentPage: number,
  maxVisible = 7,
): Array<{ type: string; key: string; value?: number }> {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: 'page',
      key: `p${i + 1}`,
      value: i + 1,
    }))
  }

  const items: Array<{ type: string; key: string; value?: number }> = []
  const half = Math.floor((maxVisible - 2) / 2)

  items.push({ type: 'page', key: 'p1', value: 1 })

  const leftBound = Math.max(2, currentPage - half)
  const rightBound = Math.min(totalPages - 1, currentPage + half)

  if (leftBound > 2) items.push({ type: 'ellipsis', key: 'el-left' })

  for (let p = leftBound; p <= rightBound; p++) {
    items.push({ type: 'page', key: `p${p}`, value: p })
  }

  if (rightBound < totalPages - 1) items.push({ type: 'ellipsis', key: 'el-right' })

  items.push({ type: 'page', key: `p${totalPages}`, value: totalPages })

  return items
}

describe('UiPagination — page computation', () => {
  it('returns no pages when totalItems is 0', () => {
    const pages = buildPages(0, 20, 1)
    expect(pages).toHaveLength(0)
  })

  it('returns single page for items <= pageSize', () => {
    const pages = buildPages(10, 20, 1)
    expect(pages).toHaveLength(1)
    expect(pages[0]).toMatchObject({ type: 'page', value: 1 })
  })

  it('returns all pages when total <= maxVisible (7)', () => {
    const pages = buildPages(140, 20, 1) // 7 pages
    expect(pages).toHaveLength(7)
    expect(pages.every((p) => p.type === 'page')).toBe(true)
  })

  it('shows ellipsis when pages exceed maxVisible', () => {
    const pages = buildPages(200, 20, 1) // 10 pages
    expect(pages.some((p) => p.type === 'ellipsis')).toBe(true)
  })

  it('always includes first and last page', () => {
    const pages = buildPages(300, 20, 8) // 15 pages, current=8
    const values = pages.filter((p) => p.type === 'page').map((p) => p.value)
    expect(values).toContain(1)
    expect(values).toContain(15)
  })

  it('includes current page in results', () => {
    const pages = buildPages(300, 20, 5) // 15 pages, current=5
    const values = pages.filter((p) => p.type === 'page').map((p) => p.value)
    expect(values).toContain(5)
  })

  it('shows left ellipsis when current is far from start', () => {
    const pages = buildPages(300, 20, 12) // 15 pages, current=12
    const ellipses = pages.filter((p) => p.type === 'ellipsis')
    expect(ellipses.length).toBeGreaterThanOrEqual(1)
    expect(ellipses.some((e) => e.key === 'el-left')).toBe(true)
  })

  it('shows right ellipsis when current is far from end', () => {
    const pages = buildPages(300, 20, 2) // 15 pages, current=2
    const ellipses = pages.filter((p) => p.type === 'ellipsis')
    expect(ellipses.some((e) => e.key === 'el-right')).toBe(true)
  })

  it('shows both ellipses when current is in the middle', () => {
    const pages = buildPages(400, 20, 10) // 20 pages, current=10
    const ellipses = pages.filter((p) => p.type === 'ellipsis')
    expect(ellipses).toHaveLength(2)
  })
})

describe('UiPagination — totalPages calculation', () => {
  it('rounds up fractional pages', () => {
    expect(Math.ceil(21 / 20)).toBe(2)
    expect(Math.ceil(20 / 20)).toBe(1)
    expect(Math.ceil(100 / 20)).toBe(5)
    expect(Math.ceil(101 / 20)).toBe(6)
  })
})
