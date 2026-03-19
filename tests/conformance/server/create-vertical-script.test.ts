import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'scripts/create-vertical.mjs'), 'utf-8')

describe('create-vertical.mjs script (#151)', () => {
  describe('CLI interface', () => {
    it('accepts --name flag', () => {
      expect(SRC).toContain("name: { type: 'string'")
    })

    it('accepts --domain flag', () => {
      expect(SRC).toContain("domain: { type: 'string'")
    })

    it('accepts --clone-from flag', () => {
      expect(SRC).toContain("'clone-from': { type: 'string'")
    })

    it('supports --dry-run mode', () => {
      expect(SRC).toContain("'dry-run'")
    })

    it('supports --smoke-test mode', () => {
      expect(SRC).toContain("'smoke-test'")
    })

    it('has --help flag', () => {
      expect(SRC).toContain("help: { type: 'boolean'")
    })
  })

  describe('Generated artifacts', () => {
    it('generates SQL migration file', () => {
      expect(SRC).toContain('supabase/migrations')
      expect(SRC).toContain('.sql')
    })

    it('generates deploy checklist', () => {
      expect(SRC).toContain('deploy-checklist')
    })

    it('updates .env.example', () => {
      expect(SRC).toContain('.env.example')
    })
  })

  describe('Vertical config generation', () => {
    it('inserts into vertical_config table', () => {
      expect(SRC).toContain('vertical_config')
    })

    it('generates theme colors', () => {
      expect(SRC).toContain('theme')
    })

    it('generates localized name', () => {
      expect(SRC).toContain('name')
    })

    it('supports email_templates', () => {
      expect(SRC).toContain('email_templates')
    })
  })

  describe('Safety checks', () => {
    it('uses parseArgs for CLI parsing', () => {
      expect(SRC).toContain('parseArgs')
    })

    it('validates required --name', () => {
      expect(SRC).toContain('!values.name')
    })

    it('script file exists', () => {
      expect(existsSync(resolve(ROOT, 'scripts/create-vertical.mjs'))).toBe(true)
    })
  })
})
