import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies that critical form inputs have proper autocomplete attributes.
 * Per HTML spec and WCAG 1.3.5, form fields should have autocomplete
 * for personal data (email, name, password, phone, etc.)
 */
describe('Form autocomplete attributes', () => {
  // Helper: extract all <input> tags from a file's template
  function getInputTags(filePath: string): string[] {
    const content = readFileSync(resolve(__dirname, '../..', filePath), 'utf-8')
    const template = content.match(/<template[\s\S]*<\/template>/)?.[0] ?? ''
    const inputs: string[] = []
    const regex = /<input\b[^>]*>/gi
    let match
    while ((match = regex.exec(template)) !== null) {
      inputs.push(match[0])
    }
    return inputs
  }

  // Helper: check if input has autocomplete (any value)
  function hasAutocomplete(tag: string): boolean {
    return /autocomplete\s*=/.test(tag)
  }

  describe('auth/login.vue', () => {
    const inputs = getInputTags('app/pages/auth/login.vue')

    it('email input has autocomplete="email"', () => {
      const emailInput = inputs.find(i => i.includes('type="email"'))
      expect(emailInput).toBeDefined()
      expect(emailInput).toContain('autocomplete="email"')
    })

    it('password input has autocomplete="current-password"', () => {
      const pwInput = inputs.find(i => i.includes('type="password"'))
      expect(pwInput).toBeDefined()
      expect(pwInput).toContain('autocomplete="current-password"')
    })
  })

  describe('auth/registro.vue', () => {
    const inputs = getInputTags('app/pages/auth/registro.vue')

    it('has autocomplete on name field', () => {
      const nameInput = inputs.find(i => i.includes('id="reg-name"'))
      expect(nameInput).toContain('autocomplete="name"')
    })

    it('has autocomplete on email field', () => {
      const emailInput = inputs.find(i => i.includes('id="reg-email"'))
      expect(emailInput).toContain('autocomplete="email"')
    })

    it('has autocomplete on password field', () => {
      const pwInput = inputs.find(i => i.includes('id="reg-password"'))
      expect(pwInput).toContain('autocomplete="new-password"')
    })

    it('has autocomplete on company field', () => {
      const compInput = inputs.find(i => i.includes('id="reg-company"'))
      expect(compInput).toContain('autocomplete="organization"')
    })

    it('has autocomplete on phone field', () => {
      const phoneInput = inputs.find(i => i.includes('id="reg-phone"'))
      expect(phoneInput).toContain('autocomplete="tel"')
    })
  })

  describe('auth/recuperar.vue', () => {
    it('email input has autocomplete="email"', () => {
      const inputs = getInputTags('app/pages/auth/recuperar.vue')
      const emailInput = inputs.find(i => i.includes('type="email"'))
      expect(emailInput).toContain('autocomplete="email"')
    })
  })

  describe('auth/nueva-password.vue', () => {
    it('password inputs have autocomplete="new-password"', () => {
      const inputs = getInputTags('app/pages/auth/nueva-password.vue')
      const pwInputs = inputs.filter(i => i.includes('type="password"'))
      expect(pwInputs.length).toBeGreaterThanOrEqual(2)
      for (const pw of pwInputs) {
        expect(pw).toContain('autocomplete="new-password"')
      }
    })
  })

  describe('perfil/seguridad.vue', () => {
    const inputs = getInputTags('app/pages/perfil/seguridad.vue')

    it('new password has autocomplete="new-password"', () => {
      const pwInput = inputs.find(i => i.includes('id="new_password"'))
      expect(pwInput).toContain('autocomplete="new-password"')
    })

    it('confirm password has autocomplete="new-password"', () => {
      const confirmInput = inputs.find(i => i.includes('id="confirm_password"'))
      expect(confirmInput).toContain('autocomplete="new-password"')
    })

    it('MFA code has autocomplete="one-time-code"', () => {
      const mfaInput = inputs.find(i => i.includes('id="mfa_code"'))
      expect(mfaInput).toContain('autocomplete="one-time-code"')
    })
  })

  describe('perfil/datos.vue', () => {
    const inputs = getInputTags('app/pages/perfil/datos.vue')

    it('name field has autocomplete="name"', () => {
      const nameInput = inputs.find(i => i.includes('id="name"'))
      expect(nameInput).toContain('autocomplete="name"')
    })

    it('phone field has autocomplete="tel"', () => {
      const phoneInput = inputs.find(i => i.includes('id="phone"'))
      expect(phoneInput).toContain('autocomplete="tel"')
    })
  })

  describe('DealerPortal contact form', () => {
    const inputs = getInputTags('app/components/DealerPortal.vue')

    it('name field has autocomplete="name"', () => {
      const nameInput = inputs.find(i => i.includes('form.name'))
      expect(nameInput).toContain('autocomplete="name"')
    })

    it('phone field has autocomplete="tel"', () => {
      const phoneInput = inputs.find(i => i.includes('form.phone'))
      expect(phoneInput).toContain('autocomplete="tel"')
    })
  })
})
