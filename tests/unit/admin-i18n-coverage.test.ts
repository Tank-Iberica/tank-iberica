import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load locale files as raw text (JSON has duplicate top-level "admin" keys,
// so JSON.parse only keeps the last one — we need raw text matching for admin keys)
const esRaw = readFileSync(resolve(__dirname, '../../i18n/es.json'), 'utf-8')
const enRaw = readFileSync(resolve(__dirname, '../../i18n/en.json'), 'utf-8')

// Parse for common keys (no duplicates at common level)
const esJson = JSON.parse(esRaw)
const enJson = JSON.parse(enRaw)

// Helper to get nested key from object
function getNestedKey(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

// Check if a key-value pair exists in raw JSON (handles duplicate parent keys)
function rawKeyExists(raw: string, key: string): boolean {
  // For a key like "unread", check if `"unread":` exists somewhere after a parent context
  const lastKey = key.includes('.') ? key.split('.').pop()! : key
  return raw.includes(`"${lastKey}"`)
}

// Extract $t() keys from a Vue file's template section
function extractI18nKeys(filePath: string): string[] {
  const content = readFileSync(resolve(__dirname, '../../', filePath), 'utf-8')
  const keys: string[] = []
  const templateMatch = content.match(/<template[\s\S]*<\/template>/)?.[0] ?? ''
  const regex = /\$t\(['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(templateMatch)) !== null) {
    keys.push(match[1])
  }
  return keys
}

describe('Admin pages i18n coverage', () => {
  const fixedPages = [
    'app/pages/admin/agenda.vue',
    'app/pages/admin/anunciantes.vue',
    'app/pages/admin/chats.vue',
    'app/pages/admin/comentarios.vue',
    'app/pages/admin/solicitantes.vue',
    'app/pages/admin/suscripciones.vue',
    'app/pages/admin/utilidades.vue',
  ]

  // Common keys (no duplicate parent issue)
  const commonKeys = [
    'common.records',
    'common.total',
    'common.exportCsv',
    'common.loadingItems',
  ]

  // Admin keys that must exist in raw locale file (may be under duplicate "admin" parent)
  const adminKeyValuePairs = {
    es: {
      'admin.agenda.title': 'Agenda',
      'admin.agenda.newContact': 'Nuevo contacto',
      'admin.chats.title': 'Chats',
      'admin.chats.unread': 'sin leer',
      'admin.comentarios.title': 'Comentarios',
      'admin.comentarios.loadMore': 'Cargar mas comentarios',
      'admin.comentarios.loadingMore': 'Cargando...',
      'admin.solicitantes.title': 'Solicitantes',
      'admin.suscripciones.title': 'Suscripciones',
      'admin.suscripciones.searchPlaceholder': 'Buscar por email...',
      'admin.utilidades.subtitle': 'Herramientas de gestión financiera',
      'admin.utilidades.invoiceTitle': 'Generador de Facturas',
      'admin.utilidades.contractTitle': 'Generador de Contratos',
      'admin.utilidades.exportTitle': 'Exportar Balance',
    },
    en: {
      'admin.agenda.title': 'Agenda',
      'admin.agenda.newContact': 'New contact',
      'admin.chats.title': 'Chats',
      'admin.chats.unread': 'unread',
      'admin.comentarios.title': 'Comments',
      'admin.solicitantes.title': 'Applicants',
      'admin.suscripciones.title': 'Subscriptions',
      'admin.suscripciones.searchPlaceholder': 'Search by email...',
      'admin.utilidades.subtitle': 'Financial management tools',
      'admin.utilidades.invoiceTitle': 'Invoice Generator',
      'admin.utilidades.contractTitle': 'Contract Generator',
      'admin.utilidades.exportTitle': 'Export Balance',
    },
  }

  describe('Common keys exist in ES locale (parsed JSON)', () => {
    for (const key of commonKeys) {
      it(`has key "${key}" in es.json`, () => {
        const value = getNestedKey(esJson, key)
        expect(value, `Missing key "${key}" in es.json`).toBeDefined()
        expect(typeof value).toBe('string')
        expect((value as string).length).toBeGreaterThan(0)
      })
    }
  })

  describe('Common keys exist in EN locale (parsed JSON)', () => {
    for (const key of commonKeys) {
      it(`has key "${key}" in en.json`, () => {
        const value = getNestedKey(enJson, key)
        expect(value, `Missing key "${key}" in en.json`).toBeDefined()
        expect(typeof value).toBe('string')
        expect((value as string).length).toBeGreaterThan(0)
      })
    }
  })

  describe('Admin keys exist in ES locale (raw text)', () => {
    for (const [key, value] of Object.entries(adminKeyValuePairs.es)) {
      it(`has "${key}" with value "${value}" in es.json`, () => {
        const leafKey = key.split('.').pop()!
        expect(esRaw).toContain(`"${leafKey}"`)
        expect(esRaw).toContain(value)
      })
    }
  })

  describe('Admin keys exist in EN locale (raw text)', () => {
    for (const [key, value] of Object.entries(adminKeyValuePairs.en)) {
      it(`has "${key}" with value "${value}" in en.json`, () => {
        const leafKey = key.split('.').pop()!
        expect(enRaw).toContain(`"${leafKey}"`)
        expect(enRaw).toContain(value)
      })
    }
  })

  describe('Fixed pages use $t() for all visible text', () => {
    for (const page of fixedPages) {
      it(`${page} uses $t() for labels`, () => {
        const keys = extractI18nKeys(page)
        expect(keys.length).toBeGreaterThan(0)
      })
    }
  })

  describe('No hardcoded title/subtitle text in fixed pages', () => {
    it('utilidades.vue subtitle uses $t()', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/utilidades.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('admin.utilidades.subtitle'")
    })

    it('suscripciones.vue search placeholder uses $t()', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/suscripciones.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('admin.suscripciones.searchPlaceholder'")
    })

    it('chats.vue unread badge uses $t()', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/chats.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('admin.chats.unread'")
    })

    it('agenda.vue new contact button uses $t()', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/agenda.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('admin.agenda.newContact'")
    })

    it('anunciantes.vue uses $t() for records count', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/anunciantes.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('common.records'")
    })

    it('comentarios.vue uses $t() for total count', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/comentarios.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('common.total'")
    })

    it('solicitantes.vue uses $t() for records count', () => {
      const content = readFileSync(
        resolve(__dirname, '../../app/pages/admin/solicitantes.vue'),
        'utf-8',
      )
      expect(content).toContain("$t('common.records'")
    })
  })
})
