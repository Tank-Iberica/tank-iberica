import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePerfilAlertas } from '../../app/composables/usePerfilAlertas'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubAuth(userId: string | null = 'user-1') {
  vi.stubGlobal('useAuth', () => ({
    userId: { value: userId },
  }))
}

function stubClient({
  selectData = [] as unknown[],
  updateError = null as unknown,
  deleteError = null as unknown,
} = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: selectData, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: updateError }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: deleteError }),
      }),
    }),
  }))
}

const sampleAlert = {
  id: 'a1',
  filters: { brand: 'MAN', price_min: 10000 },
  frequency: 'daily' as const,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
  vi.stubGlobal('useFeatureUnlocks', () => ({
    unlocks: { value: {} },
    loading: { value: false },
    isUnlocked: () => false,
    unlock: vi.fn(),
    fetchStatus: vi.fn(),
  }))
  stubAuth()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('alerts starts as empty array', () => {
    const c = usePerfilAlertas()
    expect(c.alerts.value).toHaveLength(0)
  })

  it('loading starts as true', () => {
    const c = usePerfilAlertas()
    expect(c.loading.value).toBe(true)
  })

  it('error starts as null', () => {
    const c = usePerfilAlertas()
    expect(c.error.value).toBeNull()
  })

  it('editingAlert starts as null', () => {
    const c = usePerfilAlertas()
    expect(c.editingAlert.value).toBeNull()
  })

  it('editForm starts with daily frequency', () => {
    const c = usePerfilAlertas()
    expect(c.editForm.value.frequency).toBe('daily')
  })
})

// ─── filterSummary ────────────────────────────────────────────────────────────

describe('filterSummary', () => {
  it('returns noFilters key when empty filters', () => {
    const c = usePerfilAlertas()
    expect(c.filterSummary({})).toBe('profile.alerts.noFilters')
  })

  it('includes brand in summary', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ brand: 'MAN' })
    expect(result).toContain('MAN')
  })

  it('includes model in summary', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ model: 'TGX' })
    expect(result).toContain('TGX')
  })

  it('includes category in summary', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ category: 'tractoras' })
    expect(result).toContain('tractoras')
  })

  it('includes price range when price_min and price_max are set', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ price_min: 10000, price_max: 50000 })
    expect(result).toContain('€')
    expect(result).toContain('10')
    expect(result).toContain('50')
  })

  it('uses 0 for missing price_min', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ price_max: 50000 })
    expect(result).toContain('0')
  })

  it('uses ... for missing price_max', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ price_min: 10000 })
    expect(result).toContain('...')
  })

  it('includes year range when year_min is set', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ year_min: 2015 })
    expect(result).toContain('2015')
  })

  it('uses ... for missing year values', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ year_min: null, year_max: 2022 })
    expect(result).toContain('...')
    expect(result).toContain('2022')
  })

  it('joins multiple parts with middot separator', () => {
    const c = usePerfilAlertas()
    const result = c.filterSummary({ brand: 'MAN', model: 'TGX' })
    expect(result).toContain('·')
  })
})

// ─── frequencyLabel ───────────────────────────────────────────────────────────

describe('frequencyLabel', () => {
  it('returns i18n key for instant', () => {
    const c = usePerfilAlertas()
    expect(c.frequencyLabel('instant')).toBe('profile.alerts.freq_instant')
  })

  it('returns i18n key for daily', () => {
    const c = usePerfilAlertas()
    expect(c.frequencyLabel('daily')).toBe('profile.alerts.freq_daily')
  })

  it('returns i18n key for weekly', () => {
    const c = usePerfilAlertas()
    expect(c.frequencyLabel('weekly')).toBe('profile.alerts.freq_weekly')
  })
})

// ─── openEdit / closeEdit ─────────────────────────────────────────────────────

describe('openEdit', () => {
  it('sets editingAlert to the given alert', () => {
    const c = usePerfilAlertas()
    c.openEdit(sampleAlert)
    expect(c.editingAlert.value).toBe(sampleAlert)
  })

  it('copies alert frequency into editForm', () => {
    const c = usePerfilAlertas()
    c.openEdit(sampleAlert)
    expect(c.editForm.value.frequency).toBe('daily')
  })

  it('copies alert filters into editForm', () => {
    const c = usePerfilAlertas()
    c.openEdit(sampleAlert)
    expect(c.editForm.value.filters.brand).toBe('MAN')
  })

  it('deep copies filters (not same reference)', () => {
    const c = usePerfilAlertas()
    c.openEdit(sampleAlert)
    expect(c.editForm.value.filters).not.toBe(sampleAlert.filters)
  })
})

describe('closeEdit', () => {
  it('clears editingAlert', () => {
    const c = usePerfilAlertas()
    c.openEdit(sampleAlert)
    c.closeEdit()
    expect(c.editingAlert.value).toBeNull()
  })
})

// ─── updateEditField ──────────────────────────────────────────────────────────

describe('updateEditField', () => {
  it('updates frequency field', () => {
    const c = usePerfilAlertas()
    c.updateEditField('frequency', 'weekly')
    expect(c.editForm.value.frequency).toBe('weekly')
  })

  it('removes filter key when value is empty string', () => {
    const c = usePerfilAlertas()
    c.editForm.value.filters.brand = 'MAN'
    c.updateEditField('brand', '')
    expect(c.editForm.value.filters.brand).toBeUndefined()
  })

  it('converts numeric filter fields to numbers', () => {
    const c = usePerfilAlertas()
    c.updateEditField('price_min', '10000')
    expect(c.editForm.value.filters.price_min).toBe(10000)
  })

  it('converts year_min to number', () => {
    const c = usePerfilAlertas()
    c.updateEditField('year_min', '2015')
    expect(c.editForm.value.filters.year_min).toBe(2015)
  })

  it('stores non-numeric filter fields as strings', () => {
    const c = usePerfilAlertas()
    c.updateEditField('brand', 'Volvo')
    expect(c.editForm.value.filters.brand).toBe('Volvo')
  })
})

// ─── loadAlerts ───────────────────────────────────────────────────────────────

describe('loadAlerts', () => {
  it('does nothing when no userId', async () => {
    stubAuth(null)
    const c = usePerfilAlertas()
    await c.loadAlerts()
    expect(c.alerts.value).toHaveLength(0)
  })

  it('sets alerts from DB rows', async () => {
    stubClient({ selectData: [sampleAlert] })
    const c = usePerfilAlertas()
    await c.loadAlerts()
    expect(c.alerts.value).toHaveLength(1)
    expect((c.alerts.value[0] as typeof sampleAlert).id).toBe('a1')
  })

  it('sets loading to false after success', async () => {
    const c = usePerfilAlertas()
    await c.loadAlerts()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    }))
    const c = usePerfilAlertas()
    await c.loadAlerts()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── deleteAlert ──────────────────────────────────────────────────────────────

describe('deleteAlert', () => {
  it('removes alert from list on success', async () => {
    const c = usePerfilAlertas()
    ;(c.alerts as { value: unknown[] }).value = [sampleAlert, { ...sampleAlert, id: 'a2' }]
    await c.deleteAlert('a1')
    expect(c.alerts.value).toHaveLength(1)
    expect((c.alerts.value[0] as { id: string }).id).toBe('a2')
  })

  it('silently fails on error (no throw)', async () => {
    stubClient({ deleteError: { message: 'DB error' } })
    const c = usePerfilAlertas()
    ;(c.alerts as { value: unknown[] }).value = [sampleAlert]
    await expect(c.deleteAlert('a1')).resolves.toBeUndefined()
  })
})

// ─── toggleActive ─────────────────────────────────────────────────────────────

describe('toggleActive', () => {
  it('flips active from true to false on success', async () => {
    const alert = { ...sampleAlert, active: true }
    const c = usePerfilAlertas()
    await c.toggleActive(alert)
    expect(alert.active).toBe(false)
  })

  it('flips active from false to true on success', async () => {
    const alert = { ...sampleAlert, active: false }
    const c = usePerfilAlertas()
    await c.toggleActive(alert)
    expect(alert.active).toBe(true)
  })

  it('silently fails on error (no throw)', async () => {
    stubClient({ updateError: { message: 'DB error' } })
    const alert = { ...sampleAlert, active: true }
    const c = usePerfilAlertas()
    await expect(c.toggleActive(alert)).resolves.toBeUndefined()
  })
})
