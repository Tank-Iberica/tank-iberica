import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('composable-inventory.mjs (F44)', () => {
  it('script executes without errors', () => {
    const output = execSync('node scripts/composable-inventory.mjs', {
      cwd: ROOT,
      encoding: 'utf-8',
    })
    expect(output).toContain('Composable inventory generated')
  })

  it('generates markdown output', () => {
    expect(existsSync(resolve(ROOT, 'docs/composable-inventory.md'))).toBe(true)
    const md = readFileSync(resolve(ROOT, 'docs/composable-inventory.md'), 'utf-8')
    expect(md).toContain('# Composable Inventory')
    expect(md).toContain('Summary by Domain')
    expect(md).toContain('Full Inventory')
  })

  it('generates JSON output', () => {
    expect(existsSync(resolve(ROOT, 'docs/composable-inventory.json'))).toBe(true)
    const json = JSON.parse(readFileSync(resolve(ROOT, 'docs/composable-inventory.json'), 'utf-8'))
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(200)
  })

  it('each entry has required fields', () => {
    const json = JSON.parse(readFileSync(resolve(ROOT, 'docs/composable-inventory.json'), 'utf-8'))
    for (const entry of json.slice(0, 10)) {
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('file')
      expect(entry).toHaveProperty('lines')
      expect(entry).toHaveProperty('domain')
      expect(entry).toHaveProperty('exports')
      expect(entry).toHaveProperty('dependencies')
      expect(entry).toHaveProperty('hasTests')
      expect(entry.name).toMatch(/^use[A-Z]/)
    }
  })

  it('classifies domains correctly', () => {
    const json = JSON.parse(readFileSync(resolve(ROOT, 'docs/composable-inventory.json'), 'utf-8'))
    const domains = [...new Set(json.map((e: { domain: string }) => e.domain))]
    expect(domains.length).toBeGreaterThanOrEqual(3)
    // Should have at least admin and core domains
    expect(domains).toContain('admin')
    expect(domains).toContain('core')
  })

  it('detects test coverage status', () => {
    const json = JSON.parse(readFileSync(resolve(ROOT, 'docs/composable-inventory.json'), 'utf-8'))
    const tested = json.filter((e: { hasTests: boolean }) => e.hasTests)
    const ratio = tested.length / json.length
    expect(ratio).toBeGreaterThan(0.5) // >50% should have tests
  })
})

describe('coupling-metrics.mjs (F48)', () => {
  it('script executes without errors', () => {
    const output = execSync('node scripts/coupling-metrics.mjs', { cwd: ROOT, encoding: 'utf-8' })
    expect(output).toContain('Coupling metrics')
  })

  it('generates report with module data', () => {
    const md = readFileSync(resolve(ROOT, 'docs/coupling-metrics.md'), 'utf-8')
    expect(md).toContain('# Coupling Metrics Report')
    expect(md).toContain('Ca (incoming)')
    expect(md).toContain('Ce (outgoing)')
    expect(md).toContain('Instability')
  })

  it('analyzes all expected modules', () => {
    const md = readFileSync(resolve(ROOT, 'docs/coupling-metrics.md'), 'utf-8')
    expect(md).toContain('composables')
    expect(md).toContain('server-utils')
    expect(md).toContain('api')
  })

  it('includes dependency details section', () => {
    const md = readFileSync(resolve(ROOT, 'docs/coupling-metrics.md'), 'utf-8')
    expect(md).toContain('Dependency Details')
  })

  it('supports threshold parameter', () => {
    const output = execSync('node scripts/coupling-metrics.mjs --threshold 1', {
      cwd: ROOT,
      encoding: 'utf-8',
    })
    // With threshold 1, some modules should be flagged
    expect(output).toContain('Coupling metrics')
  })
})

describe('changelog-by-module.mjs (F16)', () => {
  it('script executes without errors', () => {
    const output = execSync('node scripts/changelog-by-module.mjs --since 2026-03-01 --limit 20', {
      cwd: ROOT,
      encoding: 'utf-8',
    })
    expect(output).toContain('Changelog by module')
  })

  it('generates report with commits', () => {
    const md = readFileSync(resolve(ROOT, 'docs/changelog-by-module.md'), 'utf-8')
    expect(md).toContain('# Changelog by Module')
    expect(md).toContain('Summary')
    expect(md).toContain('Total commits')
  })

  it('classifies commits by type', () => {
    const md = readFileSync(resolve(ROOT, 'docs/changelog-by-module.md'), 'utf-8')
    expect(md).toContain('Features')
    expect(md).toContain('Fixes')
  })

  it('groups by module', () => {
    const md = readFileSync(resolve(ROOT, 'docs/changelog-by-module.md'), 'utf-8')
    // Should have at least some modules with activity
    const moduleHeaders = md.match(/^## \w/gm)
    expect(moduleHeaders?.length).toBeGreaterThanOrEqual(2)
  })
})
