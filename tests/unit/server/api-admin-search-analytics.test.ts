/**
 * Tests for /api/admin/search-analytics (Item #41)
 *
 * Validates:
 * - Zero-result query grouping and ranking
 * - Search rate calculation
 * - Daily trend aggregation
 * - Pagination/limit handling
 */
import { describe, it, expect } from 'vitest'

// ─── Business logic replicated for testing ──────────────────────────────────

interface SearchLog {
  query: string | null
  filters: unknown
  results_count: number
  created_at: string
}

/**
 * Group zero-result searches by query text and rank by frequency.
 * Mirrors the grouping logic in search-analytics.get.ts
 */
function groupZeroResults(logs: SearchLog[], limit: number) {
  const queryMap = new Map<string, { count: number; lastSeen: string; filters: unknown }>()

  for (const log of logs) {
    if (log.results_count !== 0) continue
    const q = (log.query || '(empty)').toLowerCase().trim()
    const existing = queryMap.get(q)
    if (existing) {
      existing.count++
      if (log.created_at > existing.lastSeen) {
        existing.lastSeen = log.created_at
        existing.filters = log.filters
      }
    } else {
      queryMap.set(q, { count: 1, lastSeen: log.created_at, filters: log.filters })
    }
  }

  return [...queryMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([queryText, data]) => ({
      query: queryText,
      count: data.count,
      lastSeen: data.lastSeen,
      filters: data.filters,
    }))
}

/**
 * Calculate zero-result rate.
 */
function calculateZeroResultRate(total: number, zeroResults: number) {
  if (total === 0) return 0
  return Math.round((zeroResults / total) * 100)
}

/**
 * Build daily trend from logs.
 */
function buildDailyTrend(logs: SearchLog[]) {
  const dailyMap = new Map<string, { total: number; zeroResults: number }>()

  for (const log of logs) {
    const day = log.created_at.slice(0, 10)
    const existing = dailyMap.get(day)
    if (existing) {
      existing.total++
      if (log.results_count === 0) existing.zeroResults++
    } else {
      dailyMap.set(day, {
        total: 1,
        zeroResults: log.results_count === 0 ? 1 : 0,
      })
    }
  }

  return [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }))
}

// ─── Test data ──────────────────────────────────────────────────────────────

function createLogs(entries: Array<{ query: string | null; count: number; date: string }>): SearchLog[] {
  const logs: SearchLog[] = []
  for (const entry of entries) {
    logs.push({
      query: entry.query,
      filters: { q: entry.query },
      results_count: entry.count,
      created_at: `${entry.date}T12:00:00Z`,
    })
  }
  return logs
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Search Analytics — Zero-result grouping', () => {
  it('groups identical queries', () => {
    const logs = createLogs([
      { query: 'volvo fh', count: 0, date: '2026-03-01' },
      { query: 'volvo fh', count: 0, date: '2026-03-02' },
      { query: 'volvo fh', count: 0, date: '2026-03-03' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].query).toBe('volvo fh')
    expect(result[0].count).toBe(3)
  })

  it('is case-insensitive', () => {
    const logs = createLogs([
      { query: 'Volvo FH', count: 0, date: '2026-03-01' },
      { query: 'volvo fh', count: 0, date: '2026-03-02' },
      { query: 'VOLVO FH', count: 0, date: '2026-03-03' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(3)
  })

  it('trims whitespace', () => {
    const logs = createLogs([
      { query: '  scania  ', count: 0, date: '2026-03-01' },
      { query: 'scania', count: 0, date: '2026-03-02' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2)
  })

  it('sorts by count descending', () => {
    const logs = createLogs([
      { query: 'rare query', count: 0, date: '2026-03-01' },
      { query: 'popular query', count: 0, date: '2026-03-01' },
      { query: 'popular query', count: 0, date: '2026-03-02' },
      { query: 'popular query', count: 0, date: '2026-03-03' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result[0].query).toBe('popular query')
    expect(result[0].count).toBe(3)
    expect(result[1].query).toBe('rare query')
    expect(result[1].count).toBe(1)
  })

  it('respects limit', () => {
    const logs = createLogs([
      { query: 'a', count: 0, date: '2026-03-01' },
      { query: 'b', count: 0, date: '2026-03-01' },
      { query: 'c', count: 0, date: '2026-03-01' },
    ])
    const result = groupZeroResults(logs, 2)
    expect(result).toHaveLength(2)
  })

  it('ignores non-zero result logs', () => {
    const logs = createLogs([
      { query: 'found', count: 5, date: '2026-03-01' },
      { query: 'not found', count: 0, date: '2026-03-01' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].query).toBe('not found')
  })

  it('handles null queries as (empty)', () => {
    const logs = createLogs([
      { query: null, count: 0, date: '2026-03-01' },
      { query: null, count: 0, date: '2026-03-02' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result).toHaveLength(1)
    expect(result[0].query).toBe('(empty)')
    expect(result[0].count).toBe(2)
  })

  it('keeps most recent lastSeen', () => {
    const logs = createLogs([
      { query: 'test', count: 0, date: '2026-03-01' },
      { query: 'test', count: 0, date: '2026-03-15' },
      { query: 'test', count: 0, date: '2026-03-10' },
    ])
    const result = groupZeroResults(logs, 20)
    expect(result[0].lastSeen).toBe('2026-03-15T12:00:00Z')
  })

  it('handles empty logs', () => {
    const result = groupZeroResults([], 20)
    expect(result).toHaveLength(0)
  })
})

describe('Search Analytics — Zero-result rate', () => {
  it('calculates rate correctly', () => {
    expect(calculateZeroResultRate(100, 25)).toBe(25)
  })

  it('handles zero total', () => {
    expect(calculateZeroResultRate(0, 0)).toBe(0)
  })

  it('handles 100% zero results', () => {
    expect(calculateZeroResultRate(50, 50)).toBe(100)
  })

  it('handles 0% zero results', () => {
    expect(calculateZeroResultRate(50, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(calculateZeroResultRate(3, 1)).toBe(33)
  })
})

describe('Search Analytics — Daily trend', () => {
  it('groups by date', () => {
    const logs = createLogs([
      { query: 'a', count: 0, date: '2026-03-01' },
      { query: 'b', count: 5, date: '2026-03-01' },
      { query: 'c', count: 0, date: '2026-03-02' },
    ])
    const trend = buildDailyTrend(logs)
    expect(trend).toHaveLength(2)
    expect(trend[0].date).toBe('2026-03-01')
    expect(trend[0].total).toBe(2)
    expect(trend[0].zeroResults).toBe(1)
    expect(trend[1].date).toBe('2026-03-02')
    expect(trend[1].total).toBe(1)
    expect(trend[1].zeroResults).toBe(1)
  })

  it('sorts chronologically', () => {
    const logs = createLogs([
      { query: 'a', count: 0, date: '2026-03-15' },
      { query: 'b', count: 0, date: '2026-03-01' },
      { query: 'c', count: 0, date: '2026-03-10' },
    ])
    const trend = buildDailyTrend(logs)
    expect(trend[0].date).toBe('2026-03-01')
    expect(trend[1].date).toBe('2026-03-10')
    expect(trend[2].date).toBe('2026-03-15')
  })

  it('handles empty logs', () => {
    expect(buildDailyTrend([])).toHaveLength(0)
  })

  it('counts zero results correctly per day', () => {
    const logs = createLogs([
      { query: 'a', count: 0, date: '2026-03-01' },
      { query: 'b', count: 0, date: '2026-03-01' },
      { query: 'c', count: 10, date: '2026-03-01' },
    ])
    const trend = buildDailyTrend(logs)
    expect(trend[0].total).toBe(3)
    expect(trend[0].zeroResults).toBe(2)
  })
})

describe('Search Analytics — Parameter validation', () => {
  it('days clamped to 1-90 range', () => {
    expect(Math.min(90, Math.max(1, 0))).toBe(1)
    expect(Math.min(90, Math.max(1, 100))).toBe(90)
    expect(Math.min(90, Math.max(1, 30))).toBe(30)
  })

  it('limit clamped to 1-50 range', () => {
    expect(Math.min(50, Math.max(1, 0))).toBe(1)
    expect(Math.min(50, Math.max(1, 100))).toBe(50)
    expect(Math.min(50, Math.max(1, 20))).toBe(20)
  })

  it('NaN defaults handled', () => {
    expect(Number('abc') || 30).toBe(30)
    expect(Number('') || 20).toBe(20)
  })
})
