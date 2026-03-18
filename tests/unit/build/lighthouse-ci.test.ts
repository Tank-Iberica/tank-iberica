import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const WORKFLOW = readFileSync(resolve(ROOT, '.github/workflows/lighthouse.yml'), 'utf-8')
const CONFIG = readFileSync(resolve(ROOT, '.lighthouserc.js'), 'utf-8')

describe('Lighthouse CI', () => {
  describe('Workflow', () => {
    it('runs on push to main', () => {
      expect(WORKFLOW).toContain('push:')
      expect(WORKFLOW).toContain('branches: [main]')
    })

    it('runs on weekly schedule', () => {
      expect(WORKFLOW).toContain('schedule:')
    })

    it('uses lhci autorun', () => {
      expect(WORKFLOW).toContain('lhci autorun')
    })

    it('uploads report artifacts', () => {
      expect(WORKFLOW).toContain('upload-artifact')
      expect(WORKFLOW).toContain('.lighthouseci/')
    })
  })

  describe('Config thresholds', () => {
    it('config file exists', () => {
      expect(existsSync(resolve(ROOT, '.lighthouserc.js'))).toBe(true)
    })

    it('performance score ≥90', () => {
      expect(CONFIG).toContain("'categories:performance': ['error', { minScore: 0.9 }]")
    })

    it('accessibility score ≥90', () => {
      expect(CONFIG).toContain("'categories:accessibility': ['error', { minScore: 0.9 }]")
    })

    it('SEO score ≥90', () => {
      expect(CONFIG).toContain("'categories:seo': ['error', { minScore: 0.9 }]")
    })

    it('LCP threshold < 2.5s', () => {
      expect(CONFIG).toContain("'largest-contentful-paint': ['error', { maxNumericValue: 2500 }]")
    })

    it('CLS threshold < 0.1', () => {
      expect(CONFIG).toContain("'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]")
    })

    it('INP threshold < 200ms', () => {
      expect(CONFIG).toContain("'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }]")
    })
  })

  describe('Config routes', () => {
    it('tests key pages', () => {
      expect(CONFIG).toContain("'/'")
      expect(CONFIG).toContain("'/noticias'")
      expect(CONFIG).toContain("'/sobre-nosotros'")
    })

    it('tests vehicle detail page', () => {
      expect(CONFIG).toContain('/vehiculo/')
    })

    it('uses mobile form factor', () => {
      expect(CONFIG).toContain("formFactor: 'mobile'")
    })

    it('runs multiple times for consistency', () => {
      expect(CONFIG).toContain('numberOfRuns: 3')
    })
  })
})
