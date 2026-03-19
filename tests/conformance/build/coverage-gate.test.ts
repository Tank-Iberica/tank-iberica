import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SCRIPT = resolve(ROOT, 'scripts/check-coverage-gate.mjs')

describe('Coverage Gate CI (#122)', () => {
  it('script file exists', () => {
    expect(existsSync(SCRIPT)).toBe(true)
  })

  const source = readFileSync(SCRIPT, 'utf-8')

  it('reads coverage-summary.json', () => {
    expect(source).toContain('coverage-summary.json')
  })

  it('has absolute floor thresholds', () => {
    expect(source).toContain('ABSOLUTE_FLOOR')
    expect(source).toContain('lines: 50')
    expect(source).toContain('statements: 50')
    expect(source).toContain('functions: 50')
    expect(source).toContain('branches: 35')
  })

  it('supports --update flag to save new baseline', () => {
    expect(source).toContain("'--update'")
    expect(source).toContain('coverage-gate-min.json')
  })

  it('loads stored minimum and compares against it', () => {
    expect(source).toContain('MIN_PATH')
    expect(source).toContain('minimum')
  })

  it('uses Math.max to ratchet minimum upward only', () => {
    expect(source).toContain('Math.max(minimum')
  })

  it('exits with code 1 when coverage drops below minimum', () => {
    expect(source).toContain('process.exit(1)')
    expect(source).toContain('DROPPED')
  })

  it('exits with code 0 when coverage is above minimum', () => {
    expect(source).toContain('Coverage gate passed')
  })
})
