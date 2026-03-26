import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '../../helpers/nuxtConfig'

describe('ISR (SWR) route rules', () => {
  let config: Record<string, any>

  beforeAll(async () => {
    config = await loadNuxtConfig()
  })

  describe('Vehicle pages', () => {
    it('has SWR rule for /vehiculo/**', () => {
      expect(config.routeRules['/vehiculo/**'].swr).toBeDefined()
    })

    it('vehicle SWR TTL is 5 minutes (300s)', () => {
      expect(config.routeRules['/vehiculo/**'].swr).toBe(300)
    })
  })

  describe('Homepage', () => {
    it('has SWR rule for homepage', () => {
      expect(config.routeRules['/'].swr).toBeDefined()
    })

    it('homepage SWR TTL is 10 minutes (600s)', () => {
      expect(config.routeRules['/'].swr).toBe(600)
    })
  })

  describe('News/Articles pages', () => {
    it('has SWR for /noticias', () => {
      expect(config.routeRules['/noticias'].swr).toBeDefined()
    })

    it('has SWR for /noticias/** (individual articles)', () => {
      expect(config.routeRules['/noticias/**'].swr).toBeDefined()
    })
  })

  describe('Guide pages', () => {
    it('has SWR for /guia/**', () => {
      expect(config.routeRules['/guia/**'].swr).toBeDefined()
    })
  })

  describe('Static pages use prerender', () => {
    it('/sobre-nosotros is prerendered', () => {
      expect(config.routeRules['/sobre-nosotros'].prerender).toBe(true)
    })

    it('/legal/** is prerendered', () => {
      expect(config.routeRules['/legal/**'].prerender).toBe(true)
    })

    it('/preguntas-frecuentes uses SWR', () => {
      expect(config.routeRules['/preguntas-frecuentes'].swr).toBeDefined()
    })
  })

  describe('Admin pages', () => {
    it('admin routes are CSR only (ssr: false)', () => {
      expect(config.routeRules['/admin/**'].ssr).toBe(false)
    })
  })

  describe('Security headers', () => {
    it('all routes have X-Content-Type-Options', () => {
      expect(config.routeRules['/**'].headers['X-Content-Type-Options']).toBe('nosniff')
    })

    it('all routes have X-Frame-Options', () => {
      expect(config.routeRules['/**'].headers['X-Frame-Options']).toBe('SAMEORIGIN')
    })

    it('all routes have Referrer-Policy', () => {
      expect(config.routeRules['/**'].headers['Referrer-Policy']).toBe(
        'strict-origin-when-cross-origin',
      )
    })
  })
})
