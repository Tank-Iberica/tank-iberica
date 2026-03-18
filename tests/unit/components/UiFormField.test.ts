import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/FormField.vue'), 'utf-8')

describe('UiFormField', () => {
  describe('Props interface', () => {
    it('has label prop (required string)', () => {
      expect(COMPONENT).toContain('label: string')
    })

    it('has error prop (optional string | null)', () => {
      expect(COMPONENT).toContain('error?: string | null')
    })

    it('has hint prop (optional string | null)', () => {
      expect(COMPONENT).toContain('hint?: string | null')
    })

    it('has required prop (optional boolean)', () => {
      expect(COMPONENT).toContain('required?: boolean')
    })

    it('has fieldId prop for custom ID', () => {
      expect(COMPONENT).toContain('fieldId?: string')
    })
  })

  describe('Label binding', () => {
    it('uses label element with for attribute bound to id', () => {
      expect(COMPONENT).toContain(':for="id"')
    })

    it('shows required asterisk when required', () => {
      expect(COMPONENT).toContain('v-if="required"')
      expect(COMPONENT).toContain('form-field__required')
      expect(COMPONENT).toContain('*')
    })

    it('required asterisk is aria-hidden', () => {
      expect(COMPONENT).toContain('aria-hidden="true"')
    })
  })

  describe('Error display', () => {
    it('shows error message when error prop is set', () => {
      expect(COMPONENT).toContain('v-if="error"')
      expect(COMPONENT).toContain('form-field__error')
    })

    it('error has role="alert" for screen readers', () => {
      expect(COMPONENT).toContain('role="alert"')
    })

    it('error has ID for aria-describedby', () => {
      expect(COMPONENT).toContain(':id="`${id}-error`"')
    })

    it('applies error class to wrapper', () => {
      expect(COMPONENT).toContain("'form-field--error': !!error")
    })

    it('error styles apply to nested inputs via :deep()', () => {
      expect(COMPONENT).toContain('.form-field--error :deep(input)')
      expect(COMPONENT).toContain('.form-field--error :deep(select)')
      expect(COMPONENT).toContain('.form-field--error :deep(textarea)')
      expect(COMPONENT).toContain('border-color: var(--error')
    })
  })

  describe('Hint display', () => {
    it('shows hint when hint prop is set and no error', () => {
      expect(COMPONENT).toContain('v-if="hint && !error"')
    })

    it('hint has ID for aria-describedby', () => {
      expect(COMPONENT).toContain(':id="`${id}-hint`"')
    })
  })

  describe('Aria / Accessibility', () => {
    it('passes aria-invalid to slot based on error', () => {
      expect(COMPONENT).toContain(':aria-invalid="!!error"')
    })

    it('builds aria-describedby from error and hint IDs', () => {
      expect(COMPONENT).toContain('aria-describedby')
      expect(COMPONENT).toContain("`${id}-error`")
      expect(COMPONENT).toContain("`${id}-hint`")
    })

    it('provides id to slot for input binding', () => {
      expect(COMPONENT).toContain(':id="id"')
    })
  })

  describe('ID generation', () => {
    it('uses useId() for auto-generated IDs', () => {
      expect(COMPONENT).toContain('useId()')
    })

    it('falls back to auto ID when fieldId not provided', () => {
      expect(COMPONENT).toContain('props.fieldId || `field-${autoId}`')
    })
  })
})
