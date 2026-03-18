import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const CONFIG = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

describe('ISR (SWR) route rules', () => {
  describe('Vehicle pages', () => {
    it('has SWR rule for /vehiculo/**', () => {
      expect(CONFIG).toContain("'/vehiculo/**': { swr:")
    })

    it('vehicle SWR TTL is 5 minutes', () => {
      const match = CONFIG.match(/vehiculo\/\*\*.*?swr:\s*([^}]+)/)
      expect(match).toBeTruthy()
      if (match) {
        expect(match[1].trim()).toContain('60 * 5')
      }
    })
  })

  describe('Homepage', () => {
    it('has SWR rule for homepage', () => {
      expect(CONFIG).toContain("'/': { swr:")
    })

    it('homepage SWR TTL is 10 minutes', () => {
      const match = CONFIG.match(/'\/': \{ swr:\s*([^}]+)/)
      expect(match).toBeTruthy()
      if (match) {
        expect(match[1].trim()).toContain('60 * 10')
      }
    })
  })

  describe('News/Articles pages', () => {
    it('has SWR for /noticias', () => {
      expect(CONFIG).toContain("'/noticias': { swr:")
    })

    it('has SWR for /noticias/** (individual articles)', () => {
      expect(CONFIG).toContain("'/noticias/**': { swr:")
    })
  })

  describe('Guide pages', () => {
    it('has SWR for /guia/**', () => {
      expect(CONFIG).toContain("'/guia/**': { swr:")
    })
  })

  describe('Static pages use prerender', () => {
    it('/sobre-nosotros is prerendered', () => {
      expect(CONFIG).toContain("'/sobre-nosotros': { prerender: true }")
    })

    it('/legal/** is prerendered', () => {
      expect(CONFIG).toContain("'/legal/**': { prerender: true }")
    })

    it('/preguntas-frecuentes is prerendered', () => {
      expect(CONFIG).toContain("'/preguntas-frecuentes': { prerender: true }")
    })
  })

  describe('Admin pages', () => {
    it('admin routes are CSR only (ssr: false)', () => {
      expect(CONFIG).toContain("'/admin/**': { ssr: false }")
    })
  })

  describe('Security headers', () => {
    it('all routes have X-Content-Type-Options', () => {
      expect(CONFIG).toContain("'X-Content-Type-Options': 'nosniff'")
    })

    it('all routes have X-Frame-Options', () => {
      expect(CONFIG).toContain("'X-Frame-Options': 'SAMEORIGIN'")
    })

    it('all routes have Referrer-Policy', () => {
      expect(CONFIG).toContain("'Referrer-Policy': 'strict-origin-when-cross-origin'")
    })
  })
})
