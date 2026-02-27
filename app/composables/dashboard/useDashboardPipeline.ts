/**
 * Composable for dealer commercial pipeline (Kanban board).
 * Extracts all state and logic from the pipeline page.
 * Premium/Founding plan only. Uses native HTML5 drag & drop.
 *
 * Does NOT call onMounted — the page is responsible for lifecycle.
 */

// ============ TYPES ============

export type PipelineStage =
  | 'interested'
  | 'contacted'
  | 'negotiating'
  | 'closed_won'
  | 'closed_lost'

export interface PipelineItem {
  id: string
  dealer_id: string
  title: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  estimated_value: number | null
  stage: PipelineStage
  position: number
  vehicle_id: string | null
  lead_id: string | null
  notes: string | null
  close_reason: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PipelineItemForm {
  title: string
  contact_name: string
  contact_phone: string
  contact_email: string
  estimated_value: number | null
  stage: PipelineStage
  vehicle_id: string
  lead_id: string
  notes: string
  close_reason: string
}

// ============ CONSTANTS ============

export const STAGES: PipelineStage[] = [
  'interested',
  'contacted',
  'negotiating',
  'closed_won',
  'closed_lost',
]

export const STAGE_COLORS: Record<PipelineStage, string> = {
  interested: '#3b82f6',
  contacted: '#8b5cf6',
  negotiating: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
}

// ============ COMPOSABLE ============

export function useDashboardPipeline() {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ─── CRUD State ──────────────────────────────────────────────
  const items = ref<PipelineItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const dealerId = computed(() => userId.value || null)

  const isPremiumPlan = computed(
    () => currentPlan.value === 'premium' || currentPlan.value === 'founding',
  )

  const itemsByStage = computed(() => {
    const grouped: Record<PipelineStage, PipelineItem[]> = {
      interested: [],
      contacted: [],
      negotiating: [],
      closed_won: [],
      closed_lost: [],
    }
    for (const item of items.value) {
      if (grouped[item.stage]) {
        grouped[item.stage].push(item)
      }
    }
    for (const stage of STAGES) {
      grouped[stage].sort((a, b) => a.position - b.position)
    }
    return grouped
  })

  const totalsByStage = computed(() => {
    const totals: Record<PipelineStage, number> = {
      interested: 0,
      contacted: 0,
      negotiating: 0,
      closed_won: 0,
      closed_lost: 0,
    }
    for (const item of items.value) {
      totals[item.stage] += item.estimated_value || 0
    }
    return totals
  })

  // ─── CRUD Operations ────────────────────────────────────────
  async function fetchItems(): Promise<void> {
    if (!dealerId.value) return

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('pipeline_items')
        .select('*')
        .eq('dealer_id', dealerId.value)
        .order('position', { ascending: true })

      if (err) throw err
      items.value = (data as never as PipelineItem[]) ?? []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching pipeline items'
    } finally {
      loading.value = false
    }
  }

  async function createItem(
    itemData: Partial<PipelineItemForm> & { stage: PipelineStage },
  ): Promise<PipelineItem | null> {
    if (!dealerId.value) return null

    const stageItems = itemsByStage.value[itemData.stage]
    const maxPosition = stageItems.length > 0 ? Math.max(...stageItems.map((i) => i.position)) : -1

    const payload = {
      dealer_id: dealerId.value,
      title: itemData.title || '',
      contact_name: itemData.contact_name || null,
      contact_phone: itemData.contact_phone || null,
      contact_email: itemData.contact_email || null,
      estimated_value: itemData.estimated_value ?? null,
      stage: itemData.stage,
      position: maxPosition + 1,
      vehicle_id: itemData.vehicle_id || null,
      lead_id: itemData.lead_id || null,
      notes: itemData.notes || null,
      close_reason: itemData.close_reason || null,
    }

    try {
      const { data, error: err } = await supabase
        .from('pipeline_items')
        .insert(payload as never)
        .select()
        .single()

      if (err) throw err
      const newItem = data as never as PipelineItem
      items.value.push(newItem)
      return newItem
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating pipeline item'
      return null
    }
  }

  async function updateItem(id: string, updates: Partial<PipelineItemForm>): Promise<boolean> {
    try {
      const { error: err } = await supabase
        .from('pipeline_items')
        .update(updates as never)
        .eq('id', id)

      if (err) throw err

      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = {
          ...items.value[idx],
          ...updates,
        } as PipelineItem
      }
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating pipeline item'
      return false
    }
  }

  async function moveItem(
    itemId: string,
    newStage: PipelineStage,
    newPosition: number,
  ): Promise<boolean> {
    try {
      const { error: err } = await supabase
        .from('pipeline_items')
        .update({ stage: newStage, position: newPosition } as never)
        .eq('id', itemId)

      if (err) throw err

      const idx = items.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) {
        items.value[idx]!.stage = newStage
        items.value[idx]!.position = newPosition
      }
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error moving pipeline item'
      return false
    }
  }

  async function deleteItem(id: string): Promise<boolean> {
    try {
      const { error: err } = await supabase.from('pipeline_items').delete().eq('id', id)

      if (err) throw err
      items.value = items.value.filter((i) => i.id !== id)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting pipeline item'
      return false
    }
  }

  // ─── Drag & Drop ────────────────────────────────────────────
  const dragItemId = ref<string | null>(null)
  const dragOverStage = ref<PipelineStage | null>(null)

  function onDragStart(event: DragEvent, itemId: string): void {
    dragItemId.value = itemId
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', itemId)
    }
  }

  function onDragOver(event: DragEvent, stage: PipelineStage): void {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    dragOverStage.value = stage
  }

  function onDragLeave(): void {
    dragOverStage.value = null
  }

  async function onDrop(event: DragEvent, stage: PipelineStage): Promise<void> {
    event.preventDefault()
    dragOverStage.value = null

    const itemId = dragItemId.value
    dragItemId.value = null

    if (!itemId) return

    const stageItems = itemsByStage.value[stage]
    const newPosition =
      stageItems.length > 0 ? Math.max(...stageItems.map((i) => i.position)) + 1 : 0

    await moveItem(itemId, stage, newPosition)
  }

  function onDragEnd(): void {
    dragItemId.value = null
    dragOverStage.value = null
  }

  // ─── Mobile Accordion ───────────────────────────────────────
  const expandedStages = ref<Set<PipelineStage>>(new Set(['interested']))

  function toggleStage(stage: PipelineStage): void {
    if (expandedStages.value.has(stage)) {
      expandedStages.value.delete(stage)
    } else {
      expandedStages.value.add(stage)
    }
    // Trigger reactivity
    expandedStages.value = new Set(expandedStages.value)
  }

  // ─── Modal state ────────────────────────────────────────────
  const showModal = ref(false)
  const editingItem = ref<PipelineItem | null>(null)
  const modalStage = ref<PipelineStage>('interested')
  const saving = ref(false)

  const form = reactive<PipelineItemForm>({
    title: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    estimated_value: null,
    stage: 'interested',
    vehicle_id: '',
    lead_id: '',
    notes: '',
    close_reason: '',
  })

  function resetForm(stage: PipelineStage): void {
    form.title = ''
    form.contact_name = ''
    form.contact_phone = ''
    form.contact_email = ''
    form.estimated_value = null
    form.stage = stage
    form.vehicle_id = ''
    form.lead_id = ''
    form.notes = ''
    form.close_reason = ''
  }

  function openAddModal(stage: PipelineStage): void {
    editingItem.value = null
    modalStage.value = stage
    resetForm(stage)
    showModal.value = true
  }

  function openEditModal(item: PipelineItem): void {
    editingItem.value = item
    modalStage.value = item.stage
    form.title = item.title
    form.contact_name = item.contact_name || ''
    form.contact_phone = item.contact_phone || ''
    form.contact_email = item.contact_email || ''
    form.estimated_value = item.estimated_value
    form.stage = item.stage
    form.vehicle_id = item.vehicle_id || ''
    form.lead_id = item.lead_id || ''
    form.notes = item.notes || ''
    form.close_reason = item.close_reason || ''
    showModal.value = true
  }

  function closeModal(): void {
    showModal.value = false
    editingItem.value = null
  }

  async function saveItem(): Promise<void> {
    saving.value = true
    try {
      if (editingItem.value) {
        await updateItem(editingItem.value.id, { ...form })
      } else {
        await createItem({ ...form })
      }
      closeModal()
    } finally {
      saving.value = false
    }
  }

  async function removeItem(): Promise<void> {
    if (!editingItem.value) return
    saving.value = true
    try {
      await deleteItem(editingItem.value.id)
      closeModal()
    } finally {
      saving.value = false
    }
  }

  function updateFormField<K extends keyof PipelineItemForm>(
    key: K,
    value: PipelineItemForm[K],
  ): void {
    ;(form as Record<string, unknown>)[key] = value
  }

  // ─── Helpers ────────────────────────────────────────────────
  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // ─── Init (called by page in onMounted) ─────────────────────
  async function init(): Promise<void> {
    await fetchSubscription()
    if (isPremiumPlan.value) {
      await fetchItems()
    }
  }

  return {
    // State
    items: readonly(items),
    itemsByStage,
    totalsByStage,
    loading: readonly(loading),
    error,
    isPremiumPlan,

    // Drag & Drop
    dragItemId: readonly(dragItemId),
    dragOverStage: readonly(dragOverStage),
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,

    // Accordion
    expandedStages,
    toggleStage,

    // Modal
    showModal: readonly(showModal),
    editingItem: readonly(editingItem),
    modalStage: readonly(modalStage),
    form,
    saving: readonly(saving),
    openAddModal,
    openEditModal,
    closeModal,
    saveItem,
    removeItem,
    updateFormField,

    // Helpers
    formatCurrency,

    // Lifecycle
    init,
  }
}
