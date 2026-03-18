import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SEND_SRC = readFileSync(resolve(ROOT, 'server/api/email/send.post.ts'), 'utf-8')
const RENDERER_SRC = readFileSync(resolve(ROOT, 'server/services/emailRenderer.ts'), 'utf-8')

describe('Email templates dinámicos per-vertical (N53)', () => {
  describe('send.post.ts loads vertical_config', () => {
    it('reads from vertical_config table', () => {
      expect(SEND_SRC).toContain("from('vertical_config')")
    })

    it('selects email_templates, theme, logo_url, name', () => {
      expect(SEND_SRC).toContain('email_templates')
      expect(SEND_SRC).toContain('theme')
      expect(SEND_SRC).toContain('logo_url')
      expect(SEND_SRC).toContain('name')
    })

    it('uses NUXT_PUBLIC_VERTICAL env', () => {
      expect(SEND_SRC).toContain('NUXT_PUBLIC_VERTICAL')
    })

    it('resolves template by key from vertical_config', () => {
      expect(SEND_SRC).toContain('loadEmailTemplate')
      expect(SEND_SRC).toContain('templateKey')
    })

    it('passes theme to buildEmailHtml', () => {
      expect(SEND_SRC).toContain('theme: typedConfig.theme')
    })

    it('passes logo_url to buildEmailHtml', () => {
      expect(SEND_SRC).toContain('logoUrl: typedConfig.logo_url')
    })

    it('resolves localized site name from vertical_config', () => {
      expect(SEND_SRC).toContain('resolveLocalized(typedConfig.name, locale)')
    })

    it('supports locale-based template resolution', () => {
      expect(SEND_SRC).toContain('resolveLocalized(template.subject, locale)')
      expect(SEND_SRC).toContain('resolveLocalized(template.body, locale)')
    })
  })

  describe('buildEmailHtml uses vertical theme', () => {
    it('uses theme.primary for brand color', () => {
      expect(SEND_SRC).toContain("theme.primary ?? '#23424A'")
    })

    it('uses theme.background for email background', () => {
      expect(SEND_SRC).toContain("theme.background ?? '#f4f4f5'")
    })

    it('uses theme.text for text color', () => {
      expect(SEND_SRC).toContain("theme.text ?? '#1a1a1a'")
    })

    it('uses logoUrl for header image', () => {
      expect(SEND_SRC).toContain('logoUrl')
      expect(SEND_SRC).toContain('<img src=')
    })

    it('falls back to text siteName when no logo', () => {
      expect(SEND_SRC).toContain('siteName')
    })
  })

  describe('emailRenderer.ts shared utilities', () => {
    it('exports EmailTheme interface', () => {
      expect(RENDERER_SRC).toContain('export interface EmailTheme')
    })

    it('EmailTheme has primaryColor', () => {
      expect(RENDERER_SRC).toContain('primaryColor: string')
    })

    it('EmailTheme has logoUrl', () => {
      expect(RENDERER_SRC).toContain('logoUrl: string | null')
    })

    it('has DEFAULT_THEME from BRAND_COLORS', () => {
      expect(RENDERER_SRC).toContain('DEFAULT_THEME')
      expect(RENDERER_SRC).toContain('BRAND_COLORS.primary')
    })

    it('exports resolveLocalizedField', () => {
      expect(RENDERER_SRC).toContain('export function resolveLocalizedField')
    })

    it('resolveLocalizedField falls back es → en → first', () => {
      expect(RENDERER_SRC).toContain("field['es']")
      expect(RENDERER_SRC).toContain("field['en']")
    })

    it('exports substituteVariables', () => {
      expect(RENDERER_SRC).toContain('export function substituteVariables')
    })

    it('exports markdownToEmailHtml', () => {
      expect(RENDERER_SRC).toContain('export function markdownToEmailHtml')
    })
  })

  describe('Email preference check', () => {
    it('checks email_preferences table', () => {
      expect(SEND_SRC).toContain("from('email_preferences')")
    })

    it('skips email when preference is disabled', () => {
      expect(SEND_SRC).toContain('skipped_preference')
    })
  })

  describe('Unsubscribe support', () => {
    it('generates unsubscribe URL', () => {
      expect(SEND_SRC).toContain('unsubscribeUrl')
      expect(SEND_SRC).toContain('/api/email/unsubscribe')
    })

    it('sets List-Unsubscribe header', () => {
      expect(SEND_SRC).toContain('List-Unsubscribe')
      expect(SEND_SRC).toContain('List-Unsubscribe-Post')
    })
  })

  describe('Email logging', () => {
    it('logs sent emails to email_logs', () => {
      expect(SEND_SRC).toContain("from('email_logs')")
      expect(SEND_SRC).toContain("status: 'sent'")
    })

    it('logs failed emails', () => {
      expect(SEND_SRC).toContain("status: 'failed'")
    })
  })
})
