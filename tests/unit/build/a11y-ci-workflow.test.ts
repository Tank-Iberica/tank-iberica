import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const WORKFLOW = readFileSync(resolve(ROOT, '.github/workflows/a11y-audit.yml'), 'utf-8')

describe('Accessibility CI workflow (axe-core)', () => {
  it('runs on push to main', () => {
    expect(WORKFLOW).toContain('push:')
    expect(WORKFLOW).toContain('branches: [main]')
  })

  it('runs on pull requests', () => {
    expect(WORKFLOW).toContain('pull_request:')
  })

  it('runs on weekly schedule', () => {
    expect(WORKFLOW).toContain('schedule:')
    expect(WORKFLOW).toContain('cron:')
  })

  it('installs axe-core CLI', () => {
    expect(WORKFLOW).toContain('@axe-core/cli')
  })

  it('tests WCAG 2.0 AA compliance', () => {
    expect(WORKFLOW).toContain('wcag2a')
    expect(WORKFLOW).toContain('wcag2aa')
  })

  it('tests at least 10 routes', () => {
    const pageMatches = WORKFLOW.match(/http:\/\/localhost:3000\//g)
    expect(pageMatches).not.toBeNull()
    expect(pageMatches!.length).toBeGreaterThanOrEqual(10)
  })

  it('includes key public pages', () => {
    expect(WORKFLOW).toContain('/catalogo')
    expect(WORKFLOW).toContain('/auth/login')
    expect(WORKFLOW).toContain('/auth/registro')
  })

  it('fails CI on violations (--exit flag)', () => {
    expect(WORKFLOW).toContain('--exit')
    expect(WORKFLOW).toContain('exit 1')
  })

  it('builds the project before testing', () => {
    expect(WORKFLOW).toContain('npm run build')
  })
})
