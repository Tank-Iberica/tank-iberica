import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))

const mockCurrentPlan = { value: 'premium' }
const mockFetchSubscription = vi.fn()

vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: mockCurrentPlan,
  fetchSubscription: mockFetchSubscription,
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useDashboardPipeline,
  STAGES,
  STAGE_COLORS,
  type PipelineItem,
  type PipelineStage,
} from '../../app/composables/dashboard/useDashboardPipeline'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'update', 'delete', 'insert', 'single']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<PipelineItem> = {}): PipelineItem {
  return {
    id: 'item-1',
    dealer_id: 'user-1',
    title: 'Lead from Madrid',
    contact_name: 'Juan García',
    contact_phone: '600000001',
    contact_email: 'juan@example.com',
    estimated_value: 50000,
    stage: 'interested',
    position: 0,
    vehicle_id: null,
    lead_id: null,
    notes: null,
    close_reason: null,
    created_at: '2026-01-01',
    updated_at: null,
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockCurrentPlan.value = 'premium'
  mockFetchSubscription.mockResolvedValue(undefined)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── Exported constants ───────────────────────────────────────────────────

describe('STAGES', () => {
  it('has 5 stages', () => {
    expect(STAGES).toHaveLength(5)
  })

  it('contains all expected stages', () => {
    expect(STAGES).toContain('interested')
    expect(STAGES).toContain('contacted')
    expect(STAGES).toContain('negotiating')
    expect(STAGES).toContain('closed_won')
    expect(STAGES).toContain('closed_lost')
  })
})

describe('STAGE_COLORS', () => {
  it('has a non-empty color for every stage', () => {
    for (const stage of STAGES) {
      expect(STAGE_COLORS[stage]).toBeTruthy()
    }
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('returns dash for null', () => {
    const c = useDashboardPipeline()
    expect(c.formatCurrency(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    const c = useDashboardPipeline()
    expect(c.formatCurrency(undefined)).toBe('-')
  })

  it('formats positive number as EUR', () => {
    const c = useDashboardPipeline()
    const result = c.formatCurrency(50000)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })

  it('formats zero', () => {
    const c = useDashboardPipeline()
    expect(c.formatCurrency(0)).toBeTruthy()
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts false', () => {
    const c = useDashboardPipeline()
    expect(c.loading.value).toBe(false)
  })

  it('items starts empty', () => {
    const c = useDashboardPipeline()
    expect(c.items.value).toEqual([])
  })

  it('error starts null', () => {
    const c = useDashboardPipeline()
    expect(c.error.value).toBeNull()
  })

  it('showModal starts false', () => {
    const c = useDashboardPipeline()
    expect(c.showModal.value).toBe(false)
  })

  it('editingItem starts null', () => {
    const c = useDashboardPipeline()
    expect(c.editingItem.value).toBeNull()
  })

  it('saving starts false', () => {
    const c = useDashboardPipeline()
    expect(c.saving.value).toBe(false)
  })

  it('expandedStages starts with interested', () => {
    const c = useDashboardPipeline()
    expect(c.expandedStages.value.has('interested')).toBe(true)
  })
})

// ─── isPremiumPlan (one-shot computed) ────────────────────────────────────

describe('isPremiumPlan', () => {
  it('is true when plan is premium at creation', () => {
    mockCurrentPlan.value = 'premium'
    const c = useDashboardPipeline()
    expect(c.isPremiumPlan.value).toBe(true)
  })

  it('is true when plan is founding at creation', () => {
    mockCurrentPlan.value = 'founding'
    const c = useDashboardPipeline()
    expect(c.isPremiumPlan.value).toBe(true)
  })

  it('is false when plan is basic at creation', () => {
    mockCurrentPlan.value = 'basic'
    const c = useDashboardPipeline()
    expect(c.isPremiumPlan.value).toBe(false)
  })

  it('is false when plan is free at creation', () => {
    mockCurrentPlan.value = 'free'
    const c = useDashboardPipeline()
    expect(c.isPremiumPlan.value).toBe(false)
  })
})

// ─── itemsByStage / totalsByStage ─────────────────────────────────────────
// Note: one-shot computed stubs — evaluated once at creation when items=[].
// Dynamic behavior is exercised indirectly via saveItem/onDrop/removeItem.

describe('itemsByStage', () => {
  it('starts with all stages empty', () => {
    const c = useDashboardPipeline()
    const byStage = c.itemsByStage.value
    for (const stage of STAGES) {
      expect(byStage[stage]).toEqual([])
    }
  })
})

describe('totalsByStage', () => {
  it('starts with all stage totals at 0', () => {
    const c = useDashboardPipeline()
    const totals = c.totalsByStage.value
    for (const stage of STAGES) {
      expect(totals[stage]).toBe(0)
    }
  })
})

// ─── Modal operations ─────────────────────────────────────────────────────

describe('openAddModal', () => {
  it('shows modal with reset form for given stage', () => {
    const c = useDashboardPipeline()
    c.openAddModal('negotiating')
    expect(c.showModal.value).toBe(true)
    expect(c.editingItem.value).toBeNull()
    expect(c.form.stage).toBe('negotiating')
    expect(c.form.title).toBe('')
    expect(c.form.estimated_value).toBeNull()
  })
})

describe('openEditModal', () => {
  it('populates form from item and shows modal', () => {
    const c = useDashboardPipeline()
    const item = makeItem({
      title: 'Madrid Lead',
      contact_name: 'Ana López',
      stage: 'contacted',
      estimated_value: 45000,
    })
    c.openEditModal(item)
    expect(c.showModal.value).toBe(true)
    expect(c.editingItem.value).toBe(item)
    expect(c.form.title).toBe('Madrid Lead')
    expect(c.form.contact_name).toBe('Ana López')
    expect(c.form.estimated_value).toBe(45000)
  })

  it('converts null optional fields to empty strings', () => {
    const c = useDashboardPipeline()
    const item = makeItem({
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      notes: null,
      close_reason: null,
    })
    c.openEditModal(item)
    expect(c.form.contact_name).toBe('')
    expect(c.form.contact_phone).toBe('')
    expect(c.form.contact_email).toBe('')
    expect(c.form.notes).toBe('')
    expect(c.form.close_reason).toBe('')
  })
})

describe('closeModal', () => {
  it('hides modal and clears editingItem', () => {
    const c = useDashboardPipeline()
    c.openAddModal('interested')
    c.closeModal()
    expect(c.showModal.value).toBe(false)
    expect(c.editingItem.value).toBeNull()
  })
})

// ─── toggleStage ──────────────────────────────────────────────────────────

describe('toggleStage', () => {
  it('adds stage to expandedStages when not present', () => {
    const c = useDashboardPipeline()
    expect(c.expandedStages.value.has('negotiating')).toBe(false)
    c.toggleStage('negotiating')
    expect(c.expandedStages.value.has('negotiating')).toBe(true)
  })

  it('removes stage from expandedStages when already present', () => {
    const c = useDashboardPipeline()
    // 'interested' is in set by default
    c.toggleStage('interested')
    expect(c.expandedStages.value.has('interested')).toBe(false)
  })

  it('can toggle multiple stages independently', () => {
    const c = useDashboardPipeline()
    c.toggleStage('contacted')
    c.toggleStage('closed_won')
    expect(c.expandedStages.value.has('contacted')).toBe(true)
    expect(c.expandedStages.value.has('closed_won')).toBe(true)
    expect(c.expandedStages.value.has('interested')).toBe(true)
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates title field', () => {
    const c = useDashboardPipeline()
    c.updateFormField('title', 'New Title')
    expect(c.form.title).toBe('New Title')
  })

  it('updates estimated_value field', () => {
    const c = useDashboardPipeline()
    c.updateFormField('estimated_value', 99000)
    expect(c.form.estimated_value).toBe(99000)
  })

  it('updates stage field', () => {
    const c = useDashboardPipeline()
    c.updateFormField('stage', 'closed_won' as PipelineStage)
    expect(c.form.stage).toBe('closed_won')
  })
})

// Note: fetchItems, createItem, updateItem, moveItem, deleteItem are internal.
// They are exercised via exported wrappers: init, saveItem, onDrop, removeItem.

// ─── Drag & Drop ──────────────────────────────────────────────────────────

describe('drag & drop', () => {
  it('onDragStart sets dragItemId and dataTransfer', () => {
    const c = useDashboardPipeline()
    const mockEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
    } as unknown as DragEvent
    c.onDragStart(mockEvent, 'item-1')
    expect(c.dragItemId.value).toBe('item-1')
    expect(mockEvent.dataTransfer!.setData).toHaveBeenCalledWith('text/plain', 'item-1')
  })

  it('onDragLeave clears dragOverStage', () => {
    const c = useDashboardPipeline()
    c.dragOverStage.value = 'interested'
    c.onDragLeave()
    expect(c.dragOverStage.value).toBeNull()
  })

  it('onDragEnd clears dragItemId and dragOverStage', () => {
    const c = useDashboardPipeline()
    c.dragItemId.value = 'item-1'
    c.dragOverStage.value = 'contacted'
    c.onDragEnd()
    expect(c.dragItemId.value).toBeNull()
    expect(c.dragOverStage.value).toBeNull()
  })

  it('onDragOver sets dragOverStage and prevents default', () => {
    const c = useDashboardPipeline()
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as DragEvent
    c.onDragOver(mockEvent, 'negotiating')
    expect(c.dragOverStage.value).toBe('negotiating')
    expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
  })

  it('onDrop moves item to target stage', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardPipeline()
    c.items.value = [makeItem({ id: 'drag-item', stage: 'interested', position: 0 })]
    c.dragItemId.value = 'drag-item'
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    await c.onDrop(mockEvent, 'closed_won')
    expect(c.items.value[0]!.stage).toBe('closed_won')
    expect(c.dragItemId.value).toBeNull()
  })

  it('onDrop does nothing when dragItemId is null', async () => {
    const c = useDashboardPipeline()
    c.dragItemId.value = null
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    await c.onDrop(mockEvent, 'interested')
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ─── saveItem ─────────────────────────────────────────────────────────────

describe('saveItem', () => {
  it('creates item when editingItem is null and closes modal', async () => {
    const newItem = makeItem({ id: 'new-save' })
    mockFrom.mockImplementation(() => makeChain({ data: newItem, error: null }))
    const c = useDashboardPipeline()
    c.editingItem.value = null
    c.form.title = 'New Lead'
    c.form.stage = 'interested'
    await c.saveItem()
    expect(mockFrom).toHaveBeenCalledWith('pipeline_items')
    expect(c.showModal.value).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('updates item when editingItem is set and closes modal', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardPipeline()
    const existing = makeItem({ id: 'edit-item' })
    c.items.value = [existing]
    c.editingItem.value = existing
    c.form.title = 'Updated Title'
    await c.saveItem()
    expect(c.showModal.value).toBe(false)
    expect(c.saving.value).toBe(false)
  })
})

// ─── removeItem ───────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('does nothing when editingItem is null', async () => {
    const c = useDashboardPipeline()
    c.editingItem.value = null
    await c.removeItem()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('deletes item and closes modal when editingItem is set', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardPipeline()
    const item = makeItem({ id: 'rm-item' })
    c.items.value = [item]
    c.editingItem.value = item
    await c.removeItem()
    expect(c.items.value).toHaveLength(0)
    expect(c.showModal.value).toBe(false)
    expect(c.saving.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('fetches subscription and items when plan is premium', async () => {
    mockCurrentPlan.value = 'premium'
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardPipeline()
    await c.init()
    expect(mockFetchSubscription).toHaveBeenCalledOnce()
    expect(mockFrom).toHaveBeenCalledWith('pipeline_items')
  })

  it('fetches subscription but skips items when plan is not premium', async () => {
    mockCurrentPlan.value = 'basic'
    const c = useDashboardPipeline()
    await c.init()
    expect(mockFetchSubscription).toHaveBeenCalledOnce()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('also fetches items when plan is founding', async () => {
    mockCurrentPlan.value = 'founding'
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardPipeline()
    await c.init()
    expect(mockFrom).toHaveBeenCalledWith('pipeline_items')
  })
})
