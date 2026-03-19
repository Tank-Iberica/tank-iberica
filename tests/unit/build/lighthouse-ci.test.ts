import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '../../..')

describe('Lighthouse CI', () => {
  let workflow: Record<string, any>
  let lhConfig: Record<string, any>

  beforeAll(async () => {
    const workflowRaw = readFileSync(resolve(ROOT, '.github/workflows/lighthouse.yml'), 'utf-8')
    workflow = parseYaml(workflowRaw)

    // Dynamic import of .lighthouserc.js config
    const mod = await import(`${ROOT}/.lighthouserc.js`)
    lhConfig = mod.default || mod
  })

  describe('Workflow', () => {
    it('runs on push to main', () => {
      expect(workflow.on.push.branches).toEqual(expect.arrayContaining(['main']))
    })

    it('runs on weekly schedule', () => {
      expect(workflow.on.schedule).toBeDefined()
    })

    it('uses lhci autorun', () => {
      const steps = workflow.jobs.lighthouse.steps
      const lhciStep = steps.find((s: any) => s.run?.includes('lhci autorun'))
      expect(lhciStep).toBeDefined()
    })

    it('uploads report artifacts', () => {
      const steps = workflow.jobs.lighthouse.steps
      const uploadStep = steps.find((s: any) => s.uses?.includes('upload-artifact'))
      expect(uploadStep).toBeDefined()
      expect(uploadStep.with.path).toMatch(/\.lighthouseci\//)
    })
  })

  describe('Config thresholds', () => {
    it('config file exists', () => {
      expect(existsSync(resolve(ROOT, '.lighthouserc.js'))).toBeTruthy()
    })

    it('performance score >= 90', () => {
      const assertion = lhConfig.ci.assert.assertions['categories:performance']
      expect(assertion[0]).toBe('error')
      expect(assertion[1].minScore).toBeGreaterThanOrEqual(0.9)
    })

    it('accessibility score >= 90', () => {
      const assertion = lhConfig.ci.assert.assertions['categories:accessibility']
      expect(assertion[0]).toBe('error')
      expect(assertion[1].minScore).toBeGreaterThanOrEqual(0.9)
    })

    it('SEO score >= 90', () => {
      const assertion = lhConfig.ci.assert.assertions['categories:seo']
      expect(assertion[0]).toBe('error')
      expect(assertion[1].minScore).toBeGreaterThanOrEqual(0.9)
    })

    it('LCP threshold < 2.5s', () => {
      const assertion = lhConfig.ci.assert.assertions['largest-contentful-paint']
      expect(assertion[1].maxNumericValue).toBeLessThanOrEqual(2500)
    })

    it('CLS threshold < 0.1', () => {
      const assertion = lhConfig.ci.assert.assertions['cumulative-layout-shift']
      expect(assertion[1].maxNumericValue).toBeLessThanOrEqual(0.1)
    })

    it('INP threshold < 200ms', () => {
      const assertion = lhConfig.ci.assert.assertions['interaction-to-next-paint']
      expect(assertion[1].maxNumericValue).toBeLessThanOrEqual(200)
    })
  })

  describe('Config routes', () => {
    it('tests key pages', () => {
      const urls = lhConfig.ci.collect.url
      expect(urls).toEqual(expect.arrayContaining(['/', '/noticias', '/sobre-nosotros']))
    })

    it('tests vehicle detail page', () => {
      const urls = lhConfig.ci.collect.url
      expect(urls.some((u: string) => u.includes('/vehiculo/'))).toBeTruthy()
    })

    it('uses mobile form factor', () => {
      expect(lhConfig.ci.collect.settings.formFactor).toBe('mobile')
    })

    it('runs multiple times for consistency', () => {
      expect(lhConfig.ci.collect.numberOfRuns).toBe(3)
    })
  })
})
