import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

/**
 * Verifies the composable dependency graph script works correctly.
 */

const ROOT = resolve(__dirname, '../../..')
const SCRIPT = resolve(ROOT, 'scripts/composable-deps.mjs')
const OUTPUT = resolve(ROOT, 'docs/composable-deps.md')

describe('Composable dependency graph script', () => {
  it('script file exists', () => {
    expect(existsSync(SCRIPT)).toBe(true)
  })

  it('script executes without errors', () => {
    const result = execSync(`node "${SCRIPT}"`, { cwd: ROOT, encoding: 'utf-8' })
    expect(result).toContain('Generated dependency graph')
  })

  it('output file is generated', () => {
    expect(existsSync(OUTPUT)).toBe(true)
  })

  it('output contains Mermaid diagram', () => {
    const content = readFileSync(OUTPUT, 'utf-8')
    expect(content).toContain('```mermaid')
    expect(content).toContain('flowchart')
  })

  it('output contains composable statistics', () => {
    const content = readFileSync(OUTPUT, 'utf-8')
    expect(content).toContain('Total composables:')
    expect(content).toContain('Total dependencies:')
    // Should find >100 composables
    const countMatch = content.match(/Total composables:\*\* (\d+)/)
    expect(countMatch).not.toBeNull()
    expect(parseInt(countMatch![1]!)).toBeGreaterThan(100)
  })

  it('output has subgraphs for directory grouping', () => {
    const content = readFileSync(OUTPUT, 'utf-8')
    expect(content).toContain('subgraph')
  })
})
