import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies security posture around third-party scripts.
 *
 * SRI (Subresource Integrity) is NOT used for Turnstile, Stripe.js, or
 * Google Analytics because these providers dynamically update their scripts.
 * SRI hashes would break on every provider update.
 *
 * Instead, we rely on:
 * - CSP (Content-Security-Policy) restricting allowed script sources
 * - HTTPS-only loading for all third-party scripts
 * - frame-src restrictions for embedded iframes
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('Third-party script security', () => {
  describe('CSP restricts script sources', () => {
    const secHeaders = readFile('server/middleware/security-headers.ts')

    it('CSP includes script-src directive', () => {
      expect(secHeaders).toContain("script-src 'self'")
    })

    it('only allows known third-party script domains', () => {
      // Extract script-src from CSP
      const scriptSrcMatch = secHeaders.match(/script-src\s+'self'[^"]*/)
      expect(scriptSrcMatch).not.toBeNull()
      const scriptSrc = scriptSrcMatch![0]

      // Verify only expected domains are listed
      const allowedDomains = [
        'https://js.stripe.com',
        'https://challenges.cloudflare.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ]

      for (const domain of allowedDomains) {
        expect(scriptSrc).toContain(domain)
      }

      // No wildcard domains in script-src
      expect(scriptSrc).not.toContain('*.stripe.com')
      expect(scriptSrc).not.toContain('* ')
    })

    it('CSP includes frame-src to restrict iframes', () => {
      expect(secHeaders).toContain('frame-src https://js.stripe.com https://challenges.cloudflare.com')
    })

    it('CSP includes frame-ancestors none', () => {
      expect(secHeaders).toContain("frame-ancestors 'none'")
    })

    it('CSP has report-uri for violation monitoring', () => {
      expect(secHeaders).toContain('report-uri /api/infra/csp-report')
    })
  })

  describe('Turnstile script loads securely', () => {
    const turnstile = readFile('app/components/ui/TurnstileWidget.vue')

    it('loads from HTTPS only', () => {
      expect(turnstile).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js')
      expect(turnstile).not.toContain('http://challenges.cloudflare.com')
    })

    it('uses explicit render mode', () => {
      expect(turnstile).toContain('render=explicit')
    })

    it('loads script asynchronously', () => {
      expect(turnstile).toContain('script.async = true')
      expect(turnstile).toContain('script.defer = true')
    })

    it('has error handling for script load failure', () => {
      expect(turnstile).toContain('script.onerror')
      expect(turnstile).toContain("Failed to load Turnstile script")
    })
  })

  describe('Cloudflare Pages _headers are consistent', () => {
    const headers = readFile('public/_headers')

    it('has CSP in _headers matching middleware domains', () => {
      expect(headers).toContain('Content-Security-Policy')
      expect(headers).toContain('challenges.cloudflare.com')
      expect(headers).toContain('js.stripe.com')
    })

    it('forces HSTS', () => {
      expect(headers).toContain('Strict-Transport-Security')
      expect(headers).toContain('max-age=31536000')
    })
  })

  describe('No insecure script loading patterns', () => {
    const turnstile = readFile('app/components/ui/TurnstileWidget.vue')

    it('Turnstile does not use innerHTML to inject scripts', () => {
      expect(turnstile).not.toContain('innerHTML')
    })

    it('Turnstile does not use eval', () => {
      expect(turnstile).not.toMatch(/\beval\s*\(/)
    })
  })
})
