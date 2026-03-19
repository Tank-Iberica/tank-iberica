import { describe, it, expect, vi, beforeEach } from 'vitest'

// BRAND_COLORS, getSiteName, getSiteUrl are Nuxt auto-imports (server/utils/siteConfig)
// Must be hoisted before emailRenderer.ts module-level code evaluates
vi.hoisted(() => {
  ;(globalThis as any).BRAND_COLORS = { primary: '#23424A', secondary: '#1a1a1a' }
  ;(globalThis as any).getSiteName = () => 'Tracciona'
  ;(globalThis as any).getSiteUrl = () => 'https://tracciona.com'
})

import {
  substituteVariables,
  markdownToEmailHtml,
  buildEmailHtml,
  resolveLocalizedField,
  type EmailTheme,
} from '../../../server/services/emailRenderer'

describe('Email templates dinámicos per-vertical (N53)', () => {
  describe('substituteVariables', () => {
    it('replaces {{variable}} with values', () => {
      const result = substituteVariables('Hello {{name}}!', { name: 'Carlos' })
      expect(result).toBe('Hello Carlos!')
    })

    it('replaces multiple variables', () => {
      const result = substituteVariables('{{greeting}} {{name}}, welcome to {{site}}', {
        greeting: 'Hola',
        name: 'Ana',
        site: 'Tracciona',
      })
      expect(result).toBe('Hola Ana, welcome to Tracciona')
    })

    it('replaces missing variables with empty string', () => {
      const result = substituteVariables('Hello {{name}}, your id is {{id}}', { name: 'Test' })
      expect(result).toBe('Hello Test, your id is ')
    })

    it('converts numeric values to string', () => {
      const result = substituteVariables('Price: {{price}}€', { price: 42000 })
      expect(result).toBe('Price: 42000€')
    })

    it('returns text unchanged when no placeholders', () => {
      const result = substituteVariables('No variables here', {})
      expect(result).toBe('No variables here')
    })

    it('handles empty text', () => {
      const result = substituteVariables('', { name: 'test' })
      expect(result).toBe('')
    })
  })

  describe('markdownToEmailHtml', () => {
    it('wraps text in paragraph tags', () => {
      const result = markdownToEmailHtml('Hello world')
      expect(result).toContain('<p')
      expect(result).toContain('Hello world')
      expect(result).toContain('</p>')
    })

    it('converts **bold** to <strong>', () => {
      const result = markdownToEmailHtml('This is **bold** text')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('converts [links](url) to <a> tags', () => {
      const result = markdownToEmailHtml('Click [here](https://example.com)')
      expect(result).toContain('<a href="https://example.com"')
      expect(result).toContain('>here</a>')
    })

    it('converts double newlines to paragraph breaks', () => {
      const result = markdownToEmailHtml('First paragraph\n\nSecond paragraph')
      expect(result).toContain('</p><p')
    })

    it('converts single newlines to <br />', () => {
      const result = markdownToEmailHtml('Line one\nLine two')
      expect(result).toContain('<br />')
    })

    it('handles combined markdown elements', () => {
      const result = markdownToEmailHtml('**Bold** and [link](https://x.com)')
      expect(result).toContain('<strong>Bold</strong>')
      expect(result).toContain('<a href="https://x.com"')
    })
  })

  describe('buildEmailHtml', () => {
    it('returns a complete HTML document', () => {
      const html = buildEmailHtml('<p>Test</p>')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html')
      expect(html).toContain('</html>')
    })

    it('includes the body content', () => {
      const html = buildEmailHtml('<p>My content</p>')
      expect(html).toContain('<p>My content</p>')
    })

    it('uses default primary color when no theme provided', () => {
      const html = buildEmailHtml('<p>Test</p>')
      expect(html).toContain('#23424A')
    })

    it('uses custom primary color from theme', () => {
      const html = buildEmailHtml('<p>Test</p>', { primaryColor: '#FF5733' })
      expect(html).toContain('#FF5733')
    })

    it('renders logo image when logoUrl is provided', () => {
      const html = buildEmailHtml('<p>Test</p>', { logoUrl: 'https://cdn.test.com/logo.png' })
      expect(html).toContain('<img src="https://cdn.test.com/logo.png"')
    })

    it('renders siteName as h1 when no logo', () => {
      const html = buildEmailHtml('<p>Test</p>', { logoUrl: null })
      expect(html).toContain('<h1')
    })

    it('uses custom siteName in fallback h1', () => {
      const html = buildEmailHtml('<p>Test</p>', { siteName: 'MiSitio', logoUrl: null })
      expect(html).toContain('MiSitio')
    })

    it('defaults to Spanish footer text', () => {
      const html = buildEmailHtml('<p>Test</p>')
      expect(html).toContain('Recibes este email')
    })

    it('uses English footer text when locale is en', () => {
      const html = buildEmailHtml('<p>Test</p>', {}, { locale: 'en' })
      expect(html).toContain('You received this email')
    })

    it('includes unsubscribe link when provided', () => {
      const html = buildEmailHtml(
        '<p>Test</p>',
        {},
        {
          unsubscribeUrl: 'https://tracciona.com/api/email/unsubscribe?token=abc',
        },
      )
      expect(html).toContain('href="https://tracciona.com/api/email/unsubscribe?token=abc"')
      expect(html).toContain('Cancelar suscripción')
    })

    it('uses English unsubscribe label when locale is en', () => {
      const html = buildEmailHtml(
        '<p>Test</p>',
        {},
        {
          locale: 'en',
          unsubscribeUrl: 'https://example.com/unsub',
        },
      )
      expect(html).toContain('Unsubscribe')
    })

    it('uses border-top with primary color', () => {
      const html = buildEmailHtml('<p>Test</p>', { primaryColor: '#FF0000' })
      expect(html).toContain('border-top: 4px solid #FF0000')
    })

    it('uses custom footer text when provided', () => {
      const html = buildEmailHtml('<p>Test</p>', {}, { footerText: 'Custom footer' })
      expect(html).toContain('Custom footer')
    })

    it('sets html lang attribute from locale', () => {
      const html = buildEmailHtml('<p>Test</p>', {}, { locale: 'en' })
      expect(html).toContain('lang="en"')
    })
  })

  describe('resolveLocalizedField', () => {
    it('returns empty string for null field', () => {
      expect(resolveLocalizedField(null, 'es')).toBe('')
    })

    it('returns the string directly if field is a plain string', () => {
      expect(resolveLocalizedField('Hello', 'es')).toBe('Hello')
    })

    it('returns the requested locale when available', () => {
      const field = { es: 'Hola', en: 'Hello' }
      expect(resolveLocalizedField(field, 'en')).toBe('Hello')
    })

    it('falls back to es when requested locale not found', () => {
      const field = { es: 'Hola', en: 'Hello' }
      expect(resolveLocalizedField(field, 'fr')).toBe('Hola')
    })

    it('falls back to en when es not found', () => {
      const field = { en: 'Hello', de: 'Hallo' }
      expect(resolveLocalizedField(field, 'fr')).toBe('Hello')
    })

    it('falls back to first value when neither es nor en found', () => {
      const field = { de: 'Hallo', fr: 'Bonjour' }
      expect(resolveLocalizedField(field, 'it')).toBe('Hallo')
    })

    it('returns empty string for empty object', () => {
      expect(resolveLocalizedField({}, 'es')).toBe('')
    })
  })
})
