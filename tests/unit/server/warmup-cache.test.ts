import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'scripts/warmup-cache.mjs'), 'utf-8')

describe('Post-deploy cache warm-up script (N85)', () => {
  describe('Configuration', () => {
    it('uses SITE_URL env or CLI arg', () => {
      expect(SRC).toContain('SITE_URL')
      expect(SRC).toContain("getArg('--site')")
    })

    it('supports concurrency config', () => {
      expect(SRC).toContain('CONCURRENCY')
      expect(SRC).toContain("getArg('--concurrency')")
    })

    it('has timeout per request', () => {
      expect(SRC).toContain('TIMEOUT_MS')
      expect(SRC).toContain('15_000')
    })

    it('defaults to tracciona.com', () => {
      expect(SRC).toContain('https://tracciona.com')
    })
  })

  describe('Static pages', () => {
    it('warms homepage', () => {
      expect(SRC).toContain("'/'")
    })

    it('warms catalogo', () => {
      expect(SRC).toContain('/catalogo')
    })

    it('warms auth pages', () => {
      expect(SRC).toContain('/auth/login')
      expect(SRC).toContain('/auth/registro')
    })

    it('warms blog', () => {
      expect(SRC).toContain('/blog')
    })

    it('warms offline page', () => {
      expect(SRC).toContain('/offline')
    })
  })

  describe('API routes', () => {
    it('warms featured vehicles endpoint', () => {
      expect(SRC).toContain('/api/vehicles/featured')
    })

    it('warms search endpoint', () => {
      expect(SRC).toContain('/api/vehicles/search')
    })

    it('warms articles endpoint', () => {
      expect(SRC).toContain('/api/articles/latest')
    })
  })

  describe('Dynamic vehicle pages', () => {
    it('fetches top vehicles for detail page warm-up', () => {
      expect(SRC).toContain('fetchTopVehicleUrls')
    })

    it('generates /vehiculo/ URLs from slugs', () => {
      expect(SRC).toContain('/vehiculo/')
      expect(SRC).toContain('v.slug || v.id')
    })

    it('limits to 10 vehicle pages', () => {
      expect(SRC).toContain('slice(0, 10)')
    })
  })

  describe('Concurrency and batching', () => {
    it('batches requests by concurrency', () => {
      expect(SRC).toContain('warmupBatch')
      expect(SRC).toContain('i += concurrency')
    })

    it('uses AbortController for timeouts', () => {
      expect(SRC).toContain('AbortController')
      expect(SRC).toContain('controller.abort()')
    })

    it('tracks elapsed time per request', () => {
      expect(SRC).toContain('elapsed')
      expect(SRC).toContain('Date.now() - start')
    })
  })

  describe('Reporting', () => {
    it('reports pass/fail count', () => {
      expect(SRC).toContain('passed')
      expect(SRC).toContain('failed')
    })

    it('calculates average response time', () => {
      expect(SRC).toContain('avgTime')
      expect(SRC).toContain('Average response time')
    })

    it('exits with code 1 on majority failures', () => {
      expect(SRC).toContain('process.exit(1)')
    })

    it('uses warmup user-agent', () => {
      expect(SRC).toContain('Tracciona-Warmup')
    })
  })
})
