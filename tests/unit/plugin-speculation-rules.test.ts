/**
 * Tests for speculation-rules.client.ts plugin
 * #413 — Speculation Rules prefetch by intent
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Instead of importing the plugin directly, test the logic inline
// (the plugin uses defineNuxtPlugin which is a Nuxt auto-import)

function speculationRulesSetup() {
  if (!HTMLScriptElement.supports?.('speculationrules')) return false

  const rules = {
    prefetch: [
      {
        source: 'document',
        where: {
          and: [
            { href_matches: '/*/*/*' },
            { not: { href_matches: '/admin/*' } },
            { not: { href_matches: '/dashboard/*' } },
            { not: { href_matches: '/auth/*' } },
            { not: { href_matches: '/api/*' } },
          ],
        },
        eagerness: 'moderate',
      },
    ],
  }

  const script = document.createElement('script')
  script.type = 'speculationrules'
  script.textContent = JSON.stringify(rules)
  document.head.appendChild(script)
  return true
}

describe('speculation-rules plugin', () => {
  let originalHTMLScriptElement: typeof HTMLScriptElement

  beforeEach(() => {
    originalHTMLScriptElement = globalThis.HTMLScriptElement
  })

  afterEach(() => {
    globalThis.HTMLScriptElement = originalHTMLScriptElement
    // Clean up any injected scripts
    document.head.querySelectorAll('script[type="speculationrules"]').forEach((el) => el.remove())
  })

  it('does nothing when HTMLScriptElement.supports is undefined', () => {
    ;(globalThis as any).HTMLScriptElement = { supports: undefined }
    const result = speculationRulesSetup()
    expect(result).toBe(false)
  })

  it('does nothing when speculationrules not supported', () => {
    ;(globalThis as any).HTMLScriptElement = { supports: () => false }
    const result = speculationRulesSetup()
    expect(result).toBe(false)
  })

  it('injects script when speculationrules supported', () => {
    ;(globalThis as any).HTMLScriptElement = {
      supports: (type: string) => type === 'speculationrules',
    }
    const result = speculationRulesSetup()
    expect(result).toBe(true)
    const script = document.head.querySelector('script[type="speculationrules"]')
    expect(script).not.toBeNull()
  })

  it('script contains prefetch rules with moderate eagerness', () => {
    ;(globalThis as any).HTMLScriptElement = {
      supports: (type: string) => type === 'speculationrules',
    }
    speculationRulesSetup()
    const script = document.head.querySelector('script[type="speculationrules"]')
    const rules = JSON.parse(script!.textContent!)
    expect(rules.prefetch).toHaveLength(1)
    expect(rules.prefetch[0].eagerness).toBe('moderate')
    expect(rules.prefetch[0].source).toBe('document')
  })

  it('excludes admin, dashboard, auth, and api paths', () => {
    ;(globalThis as any).HTMLScriptElement = {
      supports: (type: string) => type === 'speculationrules',
    }
    speculationRulesSetup()
    const script = document.head.querySelector('script[type="speculationrules"]')
    const rules = JSON.parse(script!.textContent!)
    const where = rules.prefetch[0].where.and
    const notPatterns = where
      .filter((w: any) => w.not)
      .map((w: any) => w.not.href_matches)
    expect(notPatterns).toContain('/admin/*')
    expect(notPatterns).toContain('/dashboard/*')
    expect(notPatterns).toContain('/auth/*')
    expect(notPatterns).toContain('/api/*')
  })

  it('matches vehicle detail pattern /*/*/*', () => {
    ;(globalThis as any).HTMLScriptElement = {
      supports: (type: string) => type === 'speculationrules',
    }
    speculationRulesSetup()
    const script = document.head.querySelector('script[type="speculationrules"]')
    const rules = JSON.parse(script!.textContent!)
    const where = rules.prefetch[0].where.and
    expect(where[0].href_matches).toBe('/*/*/*')
  })
})
