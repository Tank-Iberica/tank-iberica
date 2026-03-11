import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminBanner } from '../../app/composables/admin/useAdminBanner'

// ─── Mock dependencies ────────────────────────────────────────────────────

vi.mock('~/composables/admin/useAdminConfig', () => ({
  useAdminConfig: () => ({
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    banner: {
      value: {
        text_es: '',
        text_en: '',
        url: null,
        from_date: null,
        to_date: null,
        active: false,
      },
    },
    fetchBanner: vi.fn().mockResolvedValue(undefined),
    saveBanner: vi.fn().mockResolvedValue(true),
    getBannerPreviewHtml: vi.fn().mockReturnValue('<div>Preview</div>'),
  }),
}))

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('showPreview starts as false', () => {
    const c = useAdminBanner()
    expect(c.showPreview.value).toBe(false)
  })

  it('previewLang starts as "es"', () => {
    const c = useAdminBanner()
    expect(c.previewLang.value).toBe('es')
  })

  it('showEmojiPicker starts as false', () => {
    const c = useAdminBanner()
    expect(c.showEmojiPicker.value).toBe(false)
  })

  it('emojiPickerTarget starts as null', () => {
    const c = useAdminBanner()
    expect(c.emojiPickerTarget.value).toBeNull()
  })

  it('formData.active starts as false', () => {
    const c = useAdminBanner()
    expect(c.formData.value.active).toBe(false)
  })

  it('userPanelSaving starts as false', () => {
    const c = useAdminBanner()
    expect(c.userPanelSaving.value).toBe(false)
  })
})

// ─── emojiCategories / quickEmojis ────────────────────────────────────────

describe('emojiCategories', () => {
  it('has 9 categories', () => {
    const c = useAdminBanner()
    expect(c.emojiCategories).toHaveLength(9)
  })

  it('each category has name and emojis array', () => {
    const c = useAdminBanner()
    for (const cat of c.emojiCategories) {
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('emojis')
      expect(Array.isArray(cat.emojis)).toBe(true)
    }
  })
})

describe('quickEmojis', () => {
  it('has 6 quick emoji entries', () => {
    const c = useAdminBanner()
    expect(c.quickEmojis).toHaveLength(6)
  })
})

// ─── togglePreview ────────────────────────────────────────────────────────

describe('togglePreview', () => {
  it('sets showPreview to true on first call', () => {
    const c = useAdminBanner()
    c.togglePreview()
    expect(c.showPreview.value).toBe(true)
  })

  it('toggles back to false on second call', () => {
    const c = useAdminBanner()
    c.togglePreview()
    c.togglePreview()
    expect(c.showPreview.value).toBe(false)
  })
})

// ─── openEmojiPicker / closeEmojiPicker ───────────────────────────────────

describe('openEmojiPicker', () => {
  it('sets showEmojiPicker to true', () => {
    const c = useAdminBanner()
    c.openEmojiPicker('es')
    expect(c.showEmojiPicker.value).toBe(true)
  })

  it('sets emojiPickerTarget to the given lang', () => {
    const c = useAdminBanner()
    c.openEmojiPicker('en')
    expect(c.emojiPickerTarget.value).toBe('en')
  })
})

describe('closeEmojiPicker', () => {
  it('sets showEmojiPicker to false', () => {
    const c = useAdminBanner()
    c.openEmojiPicker('es')
    c.closeEmojiPicker()
    expect(c.showEmojiPicker.value).toBe(false)
  })

  it('clears emojiPickerTarget', () => {
    const c = useAdminBanner()
    c.openEmojiPicker('es')
    c.closeEmojiPicker()
    expect(c.emojiPickerTarget.value).toBeNull()
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates text_es', () => {
    const c = useAdminBanner()
    c.updateFormField('text_es', '¡Oferta especial!')
    expect(c.formData.value.text_es).toBe('¡Oferta especial!')
  })

  it('updates active (boolean)', () => {
    const c = useAdminBanner()
    c.updateFormField('active', true)
    expect(c.formData.value.active).toBe(true)
  })

  it('updates url', () => {
    const c = useAdminBanner()
    c.updateFormField('url', 'https://tracciona.com')
    expect(c.formData.value.url).toBe('https://tracciona.com')
  })
})

// ─── updateUserPanelField ─────────────────────────────────────────────────

describe('updateUserPanelField', () => {
  it('updates text_es on userPanelForm', () => {
    const c = useAdminBanner()
    c.updateUserPanelField('text_es', 'Texto panel')
    expect(c.userPanelForm.value.text_es).toBe('Texto panel')
  })

  it('updates active (boolean) on userPanelForm', () => {
    const c = useAdminBanner()
    c.updateUserPanelField('active', true)
    expect(c.userPanelForm.value.active).toBe(true)
  })
})

// ─── formatDatetimeLocal / parseDatetimeLocal ─────────────────────────────

describe('formatDatetimeLocal', () => {
  it('returns empty string for null', () => {
    const c = useAdminBanner()
    expect(c.formatDatetimeLocal(null)).toBe('')
  })

  it('returns ISO string sliced to 16 chars for valid date', () => {
    const c = useAdminBanner()
    const result = c.formatDatetimeLocal('2026-06-15T10:30:00Z')
    expect(result).toHaveLength(16)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})

describe('parseDatetimeLocal', () => {
  it('returns null for empty string', () => {
    const c = useAdminBanner()
    expect(c.parseDatetimeLocal('')).toBeNull()
  })

  it('returns ISO string for valid datetime-local string', () => {
    const c = useAdminBanner()
    const result = c.parseDatetimeLocal('2026-06-15T10:30')
    expect(typeof result).toBe('string')
    expect(result).toContain('2026')
  })
})

// ─── statusText / statusClass (computed, one-shot) ────────────────────────

describe('statusText — one-shot', () => {
  it('returns "Banner desactivado" when active is false', () => {
    const c = useAdminBanner()
    expect(c.statusText.value).toBe('Banner desactivado')
  })
})

describe('statusClass — one-shot', () => {
  it('returns "status-inactive" when active is false', () => {
    const c = useAdminBanner()
    expect(c.statusClass.value).toBe('status-inactive')
  })
})

// ─── statusText / statusClass with reactive stubs ────────────────────────

describe('statusText — reactive branches', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('returns "Sin texto configurado" when active but no text', () => {
    const c = useAdminBanner()
    c.formData.value = { text_es: '', text_en: '', url: null, from_date: null, to_date: null, active: true }
    expect(c.statusText.value).toBe('Sin texto configurado')
  })

  it('returns "Activo ahora" when active with text and no dates', () => {
    const c = useAdminBanner()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: null, to_date: null, active: true }
    expect(c.statusText.value).toBe('Activo ahora')
  })

  it('returns "Programado para:" when from_date is in the future', () => {
    const c = useAdminBanner()
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: futureDate, to_date: null, active: true }
    expect(c.statusText.value).toContain('Programado para:')
  })

  it('returns "Periodo expirado" when to_date is in the past', () => {
    const c = useAdminBanner()
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: null, to_date: pastDate, active: true }
    expect(c.statusText.value).toBe('Periodo expirado')
  })

  it('returns "Activo hasta:" when to_date is in the future', () => {
    const c = useAdminBanner()
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: null, to_date: futureDate, active: true }
    expect(c.statusText.value).toContain('Activo hasta:')
  })
})

describe('statusClass — reactive branches', () => {
  beforeEach(() => {
    vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
    vi.stubGlobal('ref', (v: unknown) => {
      let _v = v
      return { get value() { return _v }, set value(x: unknown) { _v = x } }
    })
  })

  it('returns "status-inactive" when no text configured', () => {
    const c = useAdminBanner()
    c.formData.value = { text_es: '', text_en: '', url: null, from_date: null, to_date: null, active: true }
    expect(c.statusClass.value).toBe('status-inactive')
  })

  it('returns "status-active" when active with text and no limiting dates', () => {
    const c = useAdminBanner()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: null, to_date: null, active: true }
    expect(c.statusClass.value).toBe('status-active')
  })

  it('returns "status-scheduled" when from_date is in the future', () => {
    const c = useAdminBanner()
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: futureDate, to_date: null, active: true }
    expect(c.statusClass.value).toBe('status-scheduled')
  })

  it('returns "status-expired" when to_date is in the past', () => {
    const c = useAdminBanner()
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    c.formData.value = { text_es: 'Promo', text_en: '', url: null, from_date: null, to_date: pastDate, active: true }
    expect(c.statusClass.value).toBe('status-expired')
  })
})

// ─── handleSave ──────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('calls saveBanner and succeeds', async () => {
    const c = useAdminBanner()
    await c.handleSave()
    expect(c.saving.value).toBe(false)
  })
})

// ─── saveUserPanelBanner ─────────────────────────────────────────────────

describe('saveUserPanelBanner', () => {
  it('sets userPanelSaving to false after success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useAdminBanner()
    await c.saveUserPanelBanner()
    expect(c.userPanelSaving.value).toBe(false)
  })

  it('sets userPanelSaving to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        upsert: () => Promise.reject(new Error('Save failed')),
      }),
    }))
    const c = useAdminBanner()
    await c.saveUserPanelBanner()
    expect(c.userPanelSaving.value).toBe(false)
  })
})

// ─── init ────────────────────────────────────────────────────────────────

describe('init', () => {
  it('runs without throwing', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }))
    const c = useAdminBanner()
    await expect(c.init()).resolves.toBeUndefined()
  })
})

// ─── insertEmoji — edge cases ────────────────────────────────────────────

describe('insertEmoji', () => {
  it('does nothing when no target is set', () => {
    const c = useAdminBanner()
    // No emojiPickerTarget and no explicit target → early return
    expect(() => c.insertEmoji('🚛')).not.toThrow()
  })

  it('does nothing when document.getElementById returns null', () => {
    vi.stubGlobal('document', { getElementById: () => null })
    const c = useAdminBanner()
    // Even with explicit target, no input found → no crash
    expect(() => c.insertEmoji('🚛', 'es')).not.toThrow()
  })
})
