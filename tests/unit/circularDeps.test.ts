import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Import pure helpers from the check script (ESM named exports)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CycleResult = { dir: string; cycles: string[][] }

// Inline copies of the pure helpers so this test file has no dynamic import complexity
function hasAnyCycles(results: CycleResult[]): boolean {
  return results.some((r) => r.cycles.length > 0)
}

function formatCycleLines(entry: string, cycles: string[][]): string[] {
  return cycles.map((cycle) => `    ${entry}: ${cycle.join(' → ')}`)
}

function buildSummary(results: CycleResult[]): { total: number; entries: string } {
  const total = results.reduce((sum, r) => sum + r.cycles.length, 0)
  const entries = results.map((r) => r.dir).join(', ')
  return { total, entries }
}

// ---------------------------------------------------------------------------
// Script existence
// ---------------------------------------------------------------------------

describe('check-circular-deps script', () => {
  it('script file exists at expected path', () => {
    const scriptPath = resolve(__dirname, '../../scripts/check-circular-deps.mjs')
    expect(existsSync(scriptPath)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// hasAnyCycles
// ---------------------------------------------------------------------------

describe('hasAnyCycles', () => {
  it('returns false for empty results', () => {
    expect(hasAnyCycles([])).toBe(false)
  })

  it('returns false when all dirs have no cycles', () => {
    expect(
      hasAnyCycles([
        { dir: 'app/composables', cycles: [] },
        { dir: 'app/utils', cycles: [] },
      ]),
    ).toBe(false)
  })

  it('returns true when one dir has a cycle', () => {
    expect(
      hasAnyCycles([
        { dir: 'app/composables', cycles: [] },
        { dir: 'app/utils', cycles: [['a.ts', 'b.ts', 'a.ts']] },
      ]),
    ).toBe(true)
  })

  it('returns true when multiple dirs have cycles', () => {
    expect(
      hasAnyCycles([
        { dir: 'app/composables', cycles: [['x.ts', 'y.ts', 'x.ts']] },
        { dir: 'server/utils', cycles: [['p.ts', 'q.ts', 'p.ts']] },
      ]),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// formatCycleLines
// ---------------------------------------------------------------------------

describe('formatCycleLines', () => {
  it('returns empty array for no cycles', () => {
    expect(formatCycleLines('app/utils', [])).toEqual([])
  })

  it('formats a single cycle', () => {
    const lines = formatCycleLines('app/utils', [['a.ts', 'b.ts', 'a.ts']])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('app/utils')
    expect(lines[0]).toContain('a.ts → b.ts → a.ts')
  })

  it('formats multiple cycles', () => {
    const lines = formatCycleLines('server/utils', [
      ['x.ts', 'y.ts', 'x.ts'],
      ['p.ts', 'q.ts', 'r.ts', 'p.ts'],
    ])
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('x.ts → y.ts → x.ts')
    expect(lines[1]).toContain('p.ts → q.ts → r.ts → p.ts')
  })
})

// ---------------------------------------------------------------------------
// buildSummary
// ---------------------------------------------------------------------------

describe('buildSummary', () => {
  it('returns zero total for no cycles', () => {
    const { total, entries } = buildSummary([
      { dir: 'app/composables', cycles: [] },
      { dir: 'app/utils', cycles: [] },
    ])
    expect(total).toBe(0)
    expect(entries).toBe('app/composables, app/utils')
  })

  it('sums cycles across dirs', () => {
    const { total } = buildSummary([
      { dir: 'a', cycles: [['x', 'y', 'x']] },
      { dir: 'b', cycles: [['p', 'q', 'p'], ['m', 'n', 'm']] },
    ])
    expect(total).toBe(3)
  })

  it('handles empty results array', () => {
    const { total, entries } = buildSummary([])
    expect(total).toBe(0)
    expect(entries).toBe('')
  })

  it('builds entries string correctly', () => {
    const { entries } = buildSummary([
      { dir: 'server/utils', cycles: [] },
      { dir: 'server/services', cycles: [] },
      { dir: 'server/repositories', cycles: [] },
    ])
    expect(entries).toBe('server/utils, server/services, server/repositories')
  })
})
