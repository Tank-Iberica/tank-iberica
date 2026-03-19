import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies contact preference field exists and works correctly
 * in lead/demand forms across the application.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('Contact preference in lead forms', () => {
  describe('DemandModal has contactPreference', () => {
    const demand = readFile('app/components/modals/DemandModal.vue')

    it('has contactPreference select field', () => {
      expect(demand).toContain('id="contactPreference"')
    })

    it('has i18n label for contactPreference', () => {
      expect(demand).toContain("$t('demand.contactPreference')")
    })

    it('uses contactPreference in form model', () => {
      expect(demand).toContain('v-model="contactPreference"')
    })

    it('submits contact_preference to the API', () => {
      expect(demand).toContain('contact_preference')
    })
  })

  describe('AdvertiseContactSection has contactPreference', () => {
    const advertise = readFile('app/components/modals/advertise/AdvertiseContactSection.vue')

    it('has contactPreference select field', () => {
      expect(advertise).toContain('id="contactPreference"')
    })

    it('has i18n label for contactPreference', () => {
      expect(advertise).toContain("t('advertise.contactPreference')")
    })

    it('binds to form.contactPreference', () => {
      expect(advertise).toContain('v-model="form.contactPreference"')
    })
  })

  describe('Schema validates contactPreference', () => {
    const schemas = readFile('app/utils/schemas.ts')

    it('defines contactPreference enum (email, phone, whatsapp)', () => {
      expect(schemas).toContain("z.enum(['email', 'phone', 'whatsapp'])")
    })

    it('defaults contactPreference to email', () => {
      expect(schemas).toContain(".default('email')")
    })
  })

  describe('Server validates contact_preference', () => {
    const api = readFile('server/api/advertisements.post.ts')

    it('validates contact_preference enum server-side', () => {
      expect(api).toContain("z.enum(['email', 'phone', 'whatsapp'])")
    })

    it('stores contact_preference in the database', () => {
      expect(api).toContain('contact_preference')
    })
  })

  describe('Admin views display contact_preference', () => {
    const anunciantes = readFile('app/components/admin/anunciantes/AnunciantesDetailModal.vue')
    const solicitantes = readFile('app/components/admin/solicitantes/DetailModal.vue')

    it('AnunciantesDetailModal shows contact_preference', () => {
      expect(anunciantes).toContain('contact_preference')
    })

    it('SolicitantesDetailModal shows contact_preference', () => {
      expect(solicitantes).toContain('contact_preference')
    })
  })
})
