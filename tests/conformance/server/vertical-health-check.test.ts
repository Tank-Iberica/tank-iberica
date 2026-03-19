import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies the vertical health check script exists and is correctly structured.
 * The script itself requires Supabase connection so we verify structure only.
 */

const ROOT = resolve(__dirname, '../../..')
const SCRIPT_PATH = resolve(ROOT, 'scripts/vertical-health-check.mjs')

describe('Vertical health check script', () => {
  it('script file exists', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true)
  })

  const content = readFileSync(SCRIPT_PATH, 'utf-8')

  it('checks vertical_config existence', () => {
    expect(content).toContain("from('vertical_config')")
  })

  it('checks categories count', () => {
    expect(content).toContain("from('categories')")
  })

  it('checks subcategories count', () => {
    expect(content).toContain("from('subcategories')")
  })

  it('checks active vehicles', () => {
    expect(content).toContain("eq('status', 'active')")
  })

  it('validates required config fields (name, theme, locales)', () => {
    expect(content).toContain('name is set')
    expect(content).toContain('theme is configured')
    expect(content).toContain('active_locales configured')
  })

  it('exits with code 1 on failures', () => {
    expect(content).toContain('process.exit(1)')
  })

  it('defaults to tracciona vertical slug', () => {
    expect(content).toContain("|| 'tracciona'")
  })
})
