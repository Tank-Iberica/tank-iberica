import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

/** Forms that should have aria-describedby for error messages */
const FORM_FILES = [
  { path: 'app/pages/auth/login.vue', name: 'Login' },
  { path: 'app/pages/auth/registro.vue', name: 'Registro' },
  { path: 'app/pages/auth/recuperar.vue', name: 'Recuperar' },
  { path: 'app/pages/auth/nueva-password.vue', name: 'Nueva Password' },
  { path: 'app/pages/perfil/seguridad.vue', name: 'Seguridad' },
  { path: 'app/pages/perfil/datos.vue', name: 'Datos' },
  { path: 'app/components/modals/DemandModal.vue', name: 'DemandModal' },
  { path: 'app/components/modals/AuthModal.vue', name: 'AuthModal' },
  { path: 'app/components/vehicle/ContactSellerModal.vue', name: 'ContactSellerModal' },
  { path: 'app/components/vehicle/InspectionRequestForm.vue', name: 'InspectionRequestForm' },
  { path: 'app/components/valoracion/ValoracionForm.vue', name: 'ValoracionForm' },
  { path: 'app/components/modals/advertise/AdvertiseContactSection.vue', name: 'AdvertiseContactSection' },
]

describe('aria-describedby on form error messages', () => {
  for (const { path, name } of FORM_FILES) {
    it(`${name} has aria-describedby`, () => {
      const content = readFileSync(resolve(ROOT, path), 'utf-8')
      expect(content).toContain('aria-describedby')
    })
  }

  describe('UiFormField provides aria-describedby via slot', () => {
    const formField = readFileSync(resolve(ROOT, 'app/components/ui/FormField.vue'), 'utf-8')

    it('builds aria-describedby from error and hint IDs', () => {
      expect(formField).toContain('aria-describedby')
    })

    it('error element has matching ID', () => {
      expect(formField).toContain(':id="`${id}-error`"')
    })

    it('hint element has matching ID', () => {
      expect(formField).toContain(':id="`${id}-hint`"')
    })

    it('passes aria-invalid to slot', () => {
      expect(formField).toContain(':aria-invalid="!!error"')
    })

    it('error message has role="alert"', () => {
      expect(formField).toContain('role="alert"')
    })
  })
})
