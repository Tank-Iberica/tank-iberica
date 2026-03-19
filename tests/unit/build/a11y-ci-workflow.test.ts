import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '../../..')

describe('Accessibility CI workflow (axe-core)', () => {
  let workflow: Record<string, any>

  beforeAll(() => {
    const workflowRaw = readFileSync(resolve(ROOT, '.github/workflows/a11y-audit.yml'), 'utf-8')
    workflow = parseYaml(workflowRaw)
  })

  it('runs on push to main', () => {
    expect(workflow.on.push.branches).toEqual(expect.arrayContaining(['main']))
  })

  it('runs on pull requests', () => {
    expect(workflow.on.pull_request).toBeDefined()
  })

  it('runs on weekly schedule', () => {
    expect(workflow.on.schedule).toBeDefined()
    expect(workflow.on.schedule[0].cron).toBeDefined()
  })

  it('installs axe-core CLI', () => {
    const steps = workflow.jobs.a11y.steps
    const installStep = steps.find((s: any) => s.run?.includes('@axe-core/cli'))
    expect(installStep).toBeDefined()
  })

  it('tests WCAG 2.0 AA compliance', () => {
    const steps = workflow.jobs.a11y.steps
    const axeStep = steps.find((s: any) => s.name?.includes('Run axe'))
    expect(axeStep).toBeDefined()
    expect(axeStep.run).toMatch(/wcag2a/)
    expect(axeStep.run).toMatch(/wcag2aa/)
  })

  it('tests at least 10 routes', () => {
    const steps = workflow.jobs.a11y.steps
    const axeStep = steps.find((s: any) => s.name?.includes('Run axe'))
    const pageMatches = axeStep.run.match(/http:\/\/localhost:3000\//g)
    expect(pageMatches!.length).toBeGreaterThanOrEqual(10)
  })

  it('includes key public pages', () => {
    const steps = workflow.jobs.a11y.steps
    const axeStep = steps.find((s: any) => s.name?.includes('Run axe'))
    expect(axeStep.run).toMatch(/\/catalogo/)
    expect(axeStep.run).toMatch(/\/auth\/login/)
    expect(axeStep.run).toMatch(/\/auth\/registro/)
  })

  it('fails CI on violations (--exit flag)', () => {
    const steps = workflow.jobs.a11y.steps
    const axeStep = steps.find((s: any) => s.name?.includes('Run axe'))
    expect(axeStep.run).toMatch(/--exit/)
    expect(axeStep.run).toMatch(/exit 1/)
  })

  it('builds the project before testing', () => {
    const steps = workflow.jobs.a11y.steps
    const buildStep = steps.find((s: any) => s.run?.includes('npm run build'))
    expect(buildStep).toBeDefined()
  })
})
