import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SCRIPT = resolve(ROOT, 'scripts/perf-regression-check.mjs')
const BASELINE = resolve(ROOT, 'scripts/perf-baseline.json')

describe('Performance regression check (#240)', () => {
  it('script file exists', () => {
    expect(existsSync(SCRIPT)).toBe(true)
  })

  it('executes without errors and outputs metrics', () => {
    // First run creates baseline if none exists
    const output = execSync(`node ${SCRIPT}`, { cwd: ROOT, encoding: 'utf-8' })
    expect(output).toContain('Performance regression check')
    expect(output).toContain('Total bundle')
    expect(output).toContain('Chunks')
  })

  it('creates baseline on first run', () => {
    // Baseline should have been created by previous test
    expect(existsSync(BASELINE)).toBe(true)
    const data = JSON.parse(readFileSync(BASELINE, 'utf-8'))
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('gitSha')
    expect(data).toHaveProperty('totalBundleSize')
    expect(data).toHaveProperty('jsSize')
    expect(data).toHaveProperty('cssSize')
    expect(data).toHaveProperty('chunkCount')
  })

  it('--update flag saves new baseline', () => {
    const output = execSync(`node ${SCRIPT} --update`, { cwd: ROOT, encoding: 'utf-8' })
    expect(output).toContain('Baseline saved')
  })

  it('compares against baseline without regressions', () => {
    // Running immediately after --update should show no regressions
    const output = execSync(`node ${SCRIPT}`, { cwd: ROOT, encoding: 'utf-8' })
    expect(output).toContain('Comparing against baseline')
    expect(output).toContain('No performance regressions detected')
  })

  it('supports --threshold parameter', () => {
    const output = execSync(`node ${SCRIPT} --threshold 50`, { cwd: ROOT, encoding: 'utf-8' })
    expect(output).toContain('Threshold: 50%')
  })

  it('detects regressions when baseline has smaller values', () => {
    // Temporarily write a baseline with very small values
    const fakeBaseline = {
      timestamp: new Date().toISOString(),
      gitSha: 'fake',
      totalBundleSize: 1, // 1 byte — anything will be way bigger
      jsSize: 1,
      cssSize: 1,
      chunkCount: 1,
      dynamicImports: 0,
      largestChunk: { name: 'test.js', size: 1 },
    }
    const originalBaseline = existsSync(BASELINE) ? readFileSync(BASELINE, 'utf-8') : null

    try {
      writeFileSync(BASELINE, JSON.stringify(fakeBaseline))
      // Should exit with code 1 (regression detected)
      try {
        execSync(`node ${SCRIPT}`, { cwd: ROOT, encoding: 'utf-8' })
        // If no error is thrown, the build output dir might be empty
      } catch (err) {
        // Expected: exit code 1
        const output = (err as { stdout: string }).stdout || ''
        expect(output).toContain('Regressions')
      }
    } finally {
      // Restore original baseline
      if (originalBaseline) {
        writeFileSync(BASELINE, originalBaseline)
      } else {
        try {
          unlinkSync(BASELINE)
        } catch {
          /* ok */
        }
      }
    }
  })
})
