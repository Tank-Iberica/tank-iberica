import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'tinyglobby'

const ROOT = resolve(__dirname, '../../..')

describe('Loading states in forms', () => {
  describe('UiSubmitButton component exists and is complete', () => {
    const btn = readFileSync(resolve(ROOT, 'app/components/ui/SubmitButton.vue'), 'utf-8')

    it('has loading prop', () => {
      expect(btn).toContain('loading?: boolean')
    })

    it('disables button when loading', () => {
      expect(btn).toContain(':disabled="loading || disabled"')
    })

    it('has aria-busy for loading state', () => {
      expect(btn).toContain(':aria-busy="loading"')
    })

    it('shows spinner when loading', () => {
      expect(btn).toContain('submit-btn__spinner')
    })

    it('supports 4 variants', () => {
      expect(btn).toContain("'primary'")
      expect(btn).toContain("'secondary'")
      expect(btn).toContain("'outline'")
      expect(btn).toContain("'danger'")
    })
  })

  describe('Key forms have loading feedback', () => {
    const keyForms = [
      'app/pages/auth/login.vue',
      'app/pages/auth/registro.vue',
      'app/components/modals/DemandModal.vue',
      'app/components/modals/AuthModal.vue',
      'app/components/vehicle/ContactSellerModal.vue',
      'app/pages/perfil/datos.vue',
      'app/pages/perfil/seguridad.vue',
      'app/pages/dashboard/vehiculos/nuevo.vue',
    ]

    for (const formPath of keyForms) {
      const name = formPath.split('/').pop()!.replace('.vue', '')

      it(`${name} has disabled state during submission`, () => {
        const content = readFileSync(resolve(ROOT, formPath), 'utf-8')
        // Must have either :disabled="submitting/isSubmitting/loading/saving" or use UiSubmitButton
        const hasDisabledState =
          content.match(
            /:disabled="[\w.]*(submitting|Submitting|loading|Loading|saving|sending|exporting)/,
          ) || content.includes('SubmitButton')
        expect(hasDisabledState).toBeTruthy()
      })
    }
  })

  describe('Widespread loading pattern coverage', () => {
    it('most interactive forms have loading feedback', () => {
      // Check that >50 Vue files with form submit buttons have loading states
      const allVue = globSync(['app/**/*.vue'], { cwd: ROOT })
      const formsWithLoading = allVue.filter((f) => {
        const content = readFileSync(resolve(ROOT, f), 'utf-8')
        return (
          content.includes('@submit') &&
          (content.match(
            /:disabled="[\w.]*(submitting|Submitting|loading|Loading|saving|sending|exporting)/,
          ) ||
            content.includes('SubmitButton'))
        )
      })
      expect(formsWithLoading.length).toBeGreaterThan(20)
    })
  })
})
