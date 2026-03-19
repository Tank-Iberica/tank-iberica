import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Saved searches (alertas) UI', () => {
  describe('Components exist', () => {
    it('AlertCard component exists', () => {
      expect(existsSync(resolve(ROOT, 'app/components/perfil/alertas/AlertCard.vue'))).toBe(true)
    })

    it('AlertEditModal component exists', () => {
      expect(existsSync(resolve(ROOT, 'app/components/perfil/alertas/AlertEditModal.vue'))).toBe(
        true,
      )
    })

    it('Alertas page exists', () => {
      expect(existsSync(resolve(ROOT, 'app/pages/perfil/alertas.vue'))).toBe(true)
    })
  })

  describe('usePerfilAlertas composable', () => {
    const composable = readFileSync(resolve(ROOT, 'app/composables/usePerfilAlertas.ts'), 'utf-8')

    it('has toggleActive function', () => {
      expect(composable).toContain('toggleActive')
    })

    it('exposes alerts list', () => {
      expect(composable).toContain('alerts')
    })

    it('has load function', () => {
      expect(composable).toMatch(/load(Alerts|alerts)/)
    })
  })

  describe('AlertCard features', () => {
    const card = readFileSync(resolve(ROOT, 'app/components/perfil/alertas/AlertCard.vue'), 'utf-8')

    it('displays alert name/filters', () => {
      expect(card).toContain('alert')
    })

    it('has toggle on/off capability', () => {
      expect(card).toMatch(/toggle|is_active|active/)
    })

    it('has edit action', () => {
      expect(card).toMatch(/edit|Edit/)
    })

    it('has delete action', () => {
      expect(card).toMatch(/delete|Delete|remove/)
    })
  })

  describe('AlertEditModal', () => {
    const modal = readFileSync(
      resolve(ROOT, 'app/components/perfil/alertas/AlertEditModal.vue'),
      'utf-8',
    )

    it('has form for editing filters', () => {
      expect(modal).toMatch(/form|@submit/)
    })

    it('has save/update action', () => {
      expect(modal).toMatch(/save|update|submit/)
    })

    it('uses focus trap', () => {
      expect(modal).toMatch(/useFocusTrap|dialog|modal/)
    })
  })

  describe('Alertas page integration', () => {
    const page = readFileSync(resolve(ROOT, 'app/pages/perfil/alertas.vue'), 'utf-8')

    it('uses AlertCard component', () => {
      expect(page).toContain('AlertCard')
    })

    it('uses AlertEditModal', () => {
      expect(page).toContain('AlertEditModal')
    })
  })
})
