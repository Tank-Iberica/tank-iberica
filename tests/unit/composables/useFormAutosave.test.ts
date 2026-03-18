import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useFormAutosave.ts'), 'utf-8')

describe('Auto-save formularios largos (#281)', () => {
  describe('Configuration', () => {
    it('default interval is 30 seconds', () => {
      expect(SRC).toContain('interval = 30_000')
    })

    it('uses localStorage for persistence', () => {
      expect(SRC).toContain('localStorage')
    })

    it('uses a storage prefix', () => {
      expect(SRC).toContain("STORAGE_PREFIX = 'tracciona_draft_'")
    })

    it('supports custom interval', () => {
      expect(SRC).toContain('interval?: number')
    })

    it('supports beforeSave transform', () => {
      expect(SRC).toContain('beforeSave')
    })

    it('supports onRestore callback', () => {
      expect(SRC).toContain('onRestore')
    })
  })

  describe('Save draft', () => {
    it('exports saveDraft function', () => {
      expect(SRC).toContain('saveDraft')
    })

    it('saves timestamp alongside data', () => {
      expect(SRC).toContain('savedAt: Date.now()')
    })

    it('applies beforeSave transform if provided', () => {
      expect(SRC).toContain('beforeSave ? beforeSave(form.value) : form.value')
    })

    it('handles serialization errors silently', () => {
      expect(SRC).toContain('Quota exceeded')
    })

    it('only saves on client side', () => {
      expect(SRC).toContain('import.meta.client')
    })
  })

  describe('Load/Restore draft', () => {
    it('exports restoreDraft function', () => {
      expect(SRC).toContain('restoreDraft')
    })

    it('merges draft into form reactively', () => {
      expect(SRC).toContain('form.value = { ...form.value, ...data }')
    })

    it('calls onRestore after restoration', () => {
      expect(SRC).toContain('onRestore?.(data)')
    })

    it('clears draft after restore', () => {
      expect(SRC).toContain('clearDraft()')
    })

    it('exports hasDraft reactive ref', () => {
      expect(SRC).toContain('hasDraft')
      expect(SRC).toContain('ref(false)')
    })
  })

  describe('Clear draft', () => {
    it('exports clearDraft function', () => {
      expect(SRC).toContain('clearDraft')
    })

    it('removes from localStorage', () => {
      expect(SRC).toContain('localStorage.removeItem(storageKey)')
    })

    it('resets hasDraft to false', () => {
      expect(SRC).toContain('hasDraft.value = false')
    })
  })

  describe('Lifecycle', () => {
    it('checks for existing draft on mount', () => {
      expect(SRC).toContain('onMounted')
      expect(SRC).toContain('loadDraft()')
    })

    it('starts interval on mount', () => {
      expect(SRC).toContain('setInterval(saveDraft, interval)')
    })

    it('saves on beforeunload', () => {
      expect(SRC).toContain("addEventListener('beforeunload', saveDraft)")
    })

    it('cleans up interval on unmount', () => {
      expect(SRC).toContain('onUnmounted')
      expect(SRC).toContain('clearInterval(intervalId)')
    })

    it('removes beforeunload listener on unmount', () => {
      expect(SRC).toContain("removeEventListener('beforeunload', saveDraft)")
    })
  })

  describe('draftSavedAt helper', () => {
    it('exports draftSavedAt function', () => {
      expect(SRC).toContain('draftSavedAt')
    })

    it('returns Date or null', () => {
      expect(SRC).toContain('new Date(entry.savedAt)')
    })
  })
})
