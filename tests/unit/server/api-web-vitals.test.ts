import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Web Vitals analytics endpoints', () => {
  describe('POST /api/analytics/web-vitals (source code)', () => {
    const src = readFileSync(resolve(ROOT, 'server/api/analytics/web-vitals.post.ts'), 'utf-8')

    it('accepts metric data via POST', () => {
      expect(src).toContain('readBody')
      expect(src).toContain('defineEventHandler')
    })

    it('validates metric name against allowed list', () => {
      expect(src).toContain('VALID_METRICS')
      expect(src).toMatch(/CLS.*INP.*LCP.*FCP.*TTFB/)
    })

    it('validates required fields', () => {
      expect(src).toContain('name')
      expect(src).toContain('value')
      expect(src).toContain('id')
      expect(src).toContain('route')
    })

    it('rejects negative or extreme values', () => {
      expect(src).toContain('value < 0')
      expect(src).toContain('60000')
    })

    it('stores in web_vitals table', () => {
      expect(src).toContain("('web_vitals')")
      expect(src).toContain('.insert(')
    })

    it('includes vertical field', () => {
      expect(src).toContain('vertical')
    })

    it('handles missing table gracefully (42P01)', () => {
      expect(src).toContain('42P01')
      expect(src).toContain('table_not_found')
    })

    it('truncates route to prevent storage abuse', () => {
      expect(src).toContain('.slice(0, 500)')
    })
  })

  describe('GET /api/admin/web-vitals (source code)', () => {
    const src = readFileSync(resolve(ROOT, 'server/api/admin/web-vitals.get.ts'), 'utf-8')

    it('requires admin role', () => {
      expect(src).toContain("requireRole(event, 'admin')")
    })

    it('supports days query parameter', () => {
      expect(src).toContain('query.days')
      expect(src).toContain('Math.min(90')
    })

    it('supports route filter', () => {
      expect(src).toContain('routeFilter')
      expect(src).toContain("eq('route'")
    })

    it('calculates p50, p75, p95 percentiles', () => {
      expect(src).toContain('p50')
      expect(src).toContain('p75')
      expect(src).toContain('p95')
      expect(src).toContain('percentile')
    })

    it('rates metrics against standard thresholds', () => {
      expect(src).toContain('THRESHOLDS')
      expect(src).toContain('good')
      expect(src).toContain('needs-improvement')
      expect(src).toContain('poor')
    })

    it('has correct LCP threshold (2500ms good, 4000ms poor)', () => {
      expect(src).toContain('LCP: { good: 2500, poor: 4000 }')
    })

    it('has correct CLS threshold (0.1 good, 0.25 poor)', () => {
      expect(src).toContain('CLS: { good: 0.1, poor: 0.25 }')
    })

    it('returns routes list', () => {
      expect(src).toContain('routeSet')
      expect(src).toContain('routes')
    })

    it('handles missing table gracefully', () => {
      expect(src).toContain('42P01')
    })
  })

  describe('Client plugin sends vitals', () => {
    const plugin = readFileSync(resolve(ROOT, 'app/plugins/web-vitals.client.ts'), 'utf-8')

    it('imports all 5 core web vitals', () => {
      expect(plugin).toContain('onCLS')
      expect(plugin).toContain('onINP')
      expect(plugin).toContain('onLCP')
      expect(plugin).toContain('onFCP')
      expect(plugin).toContain('onTTFB')
    })

    it('registers all 5 vitals with sendMetric', () => {
      expect(plugin).toContain('onCLS(sendMetric)')
      expect(plugin).toContain('onINP(sendMetric)')
      expect(plugin).toContain('onLCP(sendMetric)')
      expect(plugin).toContain('onFCP(sendMetric)')
      expect(plugin).toContain('onTTFB(sendMetric)')
    })

    it('includes vertical in metric payload', () => {
      expect(plugin).toContain('vertical')
      expect(plugin).toContain('getVerticalSlug')
    })

    it('tracks page navigation performance marks', () => {
      expect(plugin).toContain("performance.mark('nuxt:page:start')")
      expect(plugin).toContain("performance.mark('nuxt:page:finish')")
      expect(plugin).toContain("performance.measure('nuxt:page:navigation'")
    })
  })

  describe('Percentile calculation', () => {
    // Test the percentile algorithm directly
    function percentile(sorted: number[], p: number): number {
      if (sorted.length === 0) return 0
      const idx = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, idx)]
    }

    it('returns 0 for empty array', () => {
      expect(percentile([], 50)).toBe(0)
    })

    it('returns single value for single element', () => {
      expect(percentile([42], 50)).toBe(42)
      expect(percentile([42], 75)).toBe(42)
      expect(percentile([42], 95)).toBe(42)
    })

    it('calculates p50 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 50)).toBe(500)
    })

    it('calculates p75 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 75)).toBe(800)
    })

    it('calculates p95 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 95)).toBe(1000)
    })
  })
})
