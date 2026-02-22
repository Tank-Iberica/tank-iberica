<script setup lang="ts">
/**
 * Dealer Pipeline — Kanban-style commercial pipeline.
 * Premium/Founding plan only. Uses native HTML5 drag & drop.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { userId } = useAuth()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

const supabase = useSupabaseClient()

// ─── Types ──────────────────────────────────────────────────────────
type PipelineStage = 'interested' | 'contacted' | 'negotiating' | 'closed_won' | 'closed_lost'

interface PipelineItem {
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

interface PipelineItemForm {
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

const STAGES: PipelineStage[] = [
  'interested',
  'contacted',
  'negotiating',
  'closed_won',
  'closed_lost',
]

const STAGE_COLORS: Record<PipelineStage, string> = {
  interested: '#3b82f6',
  contacted: '#8b5cf6',
  negotiating: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
}

// ─── Composable: useDealerPipeline ─────────────────────────────────
function useDealerPipeline(dealerId: Ref<string | null>) {
  const items = ref<PipelineItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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
    // Sort each group by position
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
        items.value[idx] = { ...items.value[idx], ...updates } as PipelineItem
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
        items.value[idx].stage = newStage
        items.value[idx].position = newPosition
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

  return {
    items: readonly(items),
    itemsByStage,
    totalsByStage,
    loading: readonly(loading),
    error,
    fetchItems,
    createItem,
    updateItem,
    moveItem,
    deleteItem,
  }
}

// ─── State ──────────────────────────────────────────────────────────
const dealerId = computed(() => userId.value || null)
const {
  itemsByStage,
  totalsByStage,
  loading,
  error,
  fetchItems,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
} = useDealerPipeline(dealerId)

const isPremiumPlan = computed(
  () => currentPlan.value === 'premium' || currentPlan.value === 'founding',
)

// ─── Drag & Drop ────────────────────────────────────────────────────
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
  const newPosition = stageItems.length > 0 ? Math.max(...stageItems.map((i) => i.position)) + 1 : 0

  await moveItem(itemId, stage, newPosition)
}

function onDragEnd(): void {
  dragItemId.value = null
  dragOverStage.value = null
}

// ─── Mobile Accordion ───────────────────────────────────────────────
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

// ─── Modal state ────────────────────────────────────────────────────
const showModal = ref(false)
const editingItem = ref<PipelineItem | null>(null)
const modalStage = ref<PipelineStage>('interested')

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

const saving = ref(false)

function openAddModal(stage: PipelineStage): void {
  editingItem.value = null
  modalStage.value = stage
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

// ─── Helpers ────────────────────────────────────────────────────────
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  await fetchSubscription()
  if (isPremiumPlan.value) {
    await fetchItems()
  }
})
</script>

<template>
  <div class="pipeline-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.pipeline.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.pipeline.subtitle') }}</p>
      </div>
    </header>

    <!-- Plan gate -->
    <div v-if="!isPremiumPlan && !loading" class="upgrade-card">
      <div class="upgrade-icon">&#9733;</div>
      <h2>{{ t('dashboard.pipeline.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.pipeline.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.pipeline.upgradeCta') }}
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <!-- Kanban board -->
    <div v-if="isPremiumPlan && !loading" class="kanban-board">
      <div
        v-for="stage in STAGES"
        :key="stage"
        class="kanban-column"
        :class="{
          'drag-over': dragOverStage === stage,
          expanded: expandedStages.has(stage),
        }"
        @dragover="onDragOver($event, stage)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, stage)"
      >
        <!-- Column header -->
        <div class="column-header" @click="toggleStage(stage)">
          <div class="column-header-left">
            <span class="stage-dot" :style="{ backgroundColor: STAGE_COLORS[stage] }" />
            <h3 class="column-title">{{ t(`dashboard.pipeline.stage.${stage}`) }}</h3>
            <span class="column-count">{{ itemsByStage[stage].length }}</span>
          </div>
          <div class="column-header-right">
            <span class="column-total">{{ formatCurrency(totalsByStage[stage]) }}</span>
            <button
              class="btn-add"
              :aria-label="t('dashboard.pipeline.addItem')"
              @click.stop="openAddModal(stage)"
            >
              +
            </button>
            <span class="accordion-arrow">&#9662;</span>
          </div>
        </div>

        <!-- Cards container -->
        <div class="column-cards">
          <div v-if="itemsByStage[stage].length === 0" class="column-empty">
            <span>{{ t('dashboard.pipeline.emptyColumn') }}</span>
          </div>
          <div
            v-for="item in itemsByStage[stage]"
            :key="item.id"
            class="pipeline-card"
            draggable="true"
            :class="{ dragging: dragItemId === item.id }"
            @dragstart="onDragStart($event, item.id)"
            @dragend="onDragEnd"
            @click="openEditModal(item)"
          >
            <div class="card-drag-handle" :aria-label="t('dashboard.pipeline.dragHandle')">
              <span class="drag-dots">&#8942;&#8942;</span>
            </div>
            <div class="card-body">
              <span class="card-title">{{ item.title }}</span>
              <span v-if="item.contact_name" class="card-contact">{{ item.contact_name }}</span>
              <span v-if="item.estimated_value" class="card-value">
                {{ formatCurrency(item.estimated_value) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add / Edit item -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div
          class="modal-content"
          role="dialog"
          :aria-label="
            editingItem ? t('dashboard.pipeline.editItem') : t('dashboard.pipeline.addItem')
          "
        >
          <div class="modal-header">
            <h2>
              {{ editingItem ? t('dashboard.pipeline.editItem') : t('dashboard.pipeline.addItem') }}
            </h2>
            <button class="btn-close" :aria-label="t('common.close')" @click="closeModal">
              &times;
            </button>
          </div>

          <form class="modal-form" @submit.prevent="saveItem">
            <div class="form-group">
              <label for="pip-title">{{ t('dashboard.pipeline.fieldTitle') }} *</label>
              <input
                id="pip-title"
                v-model="form.title"
                type="text"
                required
                :placeholder="t('dashboard.pipeline.fieldTitlePlaceholder')"
              >
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="pip-contact-name">{{ t('dashboard.pipeline.fieldContactName') }}</label>
                <input
                  id="pip-contact-name"
                  v-model="form.contact_name"
                  type="text"
                  :placeholder="t('dashboard.pipeline.fieldContactNamePlaceholder')"
                >
              </div>
              <div class="form-group">
                <label for="pip-contact-phone">{{
                  t('dashboard.pipeline.fieldContactPhone')
                }}</label>
                <input
                  id="pip-contact-phone"
                  v-model="form.contact_phone"
                  type="tel"
                  :placeholder="t('dashboard.pipeline.fieldContactPhonePlaceholder')"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="pip-contact-email">{{
                  t('dashboard.pipeline.fieldContactEmail')
                }}</label>
                <input
                  id="pip-contact-email"
                  v-model="form.contact_email"
                  type="email"
                  :placeholder="t('dashboard.pipeline.fieldContactEmailPlaceholder')"
                >
              </div>
              <div class="form-group">
                <label for="pip-value">{{ t('dashboard.pipeline.fieldValue') }}</label>
                <input
                  id="pip-value"
                  v-model.number="form.estimated_value"
                  type="number"
                  min="0"
                  step="1"
                  :placeholder="t('dashboard.pipeline.fieldValuePlaceholder')"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="pip-stage">{{ t('dashboard.pipeline.fieldStage') }}</label>
              <select id="pip-stage" v-model="form.stage">
                <option v-for="s in STAGES" :key="s" :value="s">
                  {{ t(`dashboard.pipeline.stage.${s}`) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="pip-notes">{{ t('dashboard.pipeline.fieldNotes') }}</label>
              <textarea
                id="pip-notes"
                v-model="form.notes"
                rows="3"
                :placeholder="t('dashboard.pipeline.fieldNotesPlaceholder')"
              />
            </div>

            <div v-if="form.stage === 'closed_lost'" class="form-group">
              <label for="pip-close-reason">{{ t('dashboard.pipeline.fieldCloseReason') }}</label>
              <input
                id="pip-close-reason"
                v-model="form.close_reason"
                type="text"
                :placeholder="t('dashboard.pipeline.fieldCloseReasonPlaceholder')"
              >
            </div>

            <div class="modal-actions">
              <button
                v-if="editingItem"
                type="button"
                class="btn-danger"
                :disabled="saving"
                @click="removeItem"
              >
                {{ t('common.delete') }}
              </button>
              <div class="modal-actions-right">
                <button type="button" class="btn-secondary" @click="closeModal">
                  {{ t('common.cancel') }}
                </button>
                <button type="submit" class="btn-primary" :disabled="saving || !form.title.trim()">
                  {{ saving ? t('common.loading') + '...' : t('common.save') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.pipeline-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* ── Upgrade gate ──────────────────────────────────────────────── */
.upgrade-card {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.upgrade-icon {
  font-size: 2.5rem;
  color: #f59e0b;
  margin-bottom: 12px;
}

.upgrade-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: #1e293b;
}

.upgrade-card p {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.95rem;
}

/* ── Error / Loading ───────────────────────────────────────────── */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Kanban Board ──────────────────────────────────────────────── */
.kanban-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-column {
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid transparent;
  transition:
    border-color 0.2s,
    background 0.2s;
  overflow: hidden;
}

.kanban-column.drag-over {
  border-color: var(--color-primary, #23424a);
  background: #f1f5f9;
}

/* ── Column header ─────────────────────────────────────────────── */
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  min-height: 48px;
  user-select: none;
}

.column-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.column-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.column-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  border-radius: 10px;
  padding: 1px 8px;
}

.column-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-total {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary, #23424a);
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-add:hover {
  background: #1a3238;
}

.accordion-arrow {
  font-size: 1rem;
  color: #94a3b8;
  transition: transform 0.2s;
}

.kanban-column.expanded .accordion-arrow {
  transform: rotate(180deg);
}

/* ── Cards container (mobile accordion) ────────────────────────── */
.column-cards {
  display: none;
  padding: 0 12px 12px;
  flex-direction: column;
  gap: 8px;
}

.kanban-column.expanded .column-cards {
  display: flex;
}

.column-empty {
  text-align: center;
  padding: 16px 8px;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* ── Pipeline card ─────────────────────────────────────────────── */
.pipeline-card {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    opacity 0.15s;
  min-height: 44px;
  overflow: hidden;
}

.pipeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.pipeline-card.dragging {
  opacity: 0.5;
}

.card-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-height: 44px;
  flex-shrink: 0;
  cursor: grab;
  color: #94a3b8;
  background: #f8fafc;
  touch-action: none;
}

.card-drag-handle:active {
  cursor: grabbing;
}

.drag-dots {
  font-size: 1.1rem;
  letter-spacing: -3px;
  line-height: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  min-width: 0;
  flex: 1;
}

.card-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-contact {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary, #23424a);
}

/* ── Modal ─────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.modal-content {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
}

.btn-close:hover {
  background: #f1f5f9;
}

.modal-form {
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ── Buttons ───────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #fee2e2;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 768px) {
  .pipeline-page {
    padding: 24px;
  }

  .kanban-board {
    flex-direction: row;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .kanban-column {
    min-width: 240px;
    flex: 1;
  }

  /* On desktop, always show cards — no accordion */
  .column-cards {
    display: flex;
  }

  .accordion-arrow {
    display: none;
  }

  .column-header {
    cursor: default;
  }

  /* Modal centered on desktop */
  .modal-overlay {
    align-items: center;
    padding: 24px;
  }

  .modal-content {
    border-radius: 16px;
    max-height: 85vh;
  }

  .form-row {
    flex-direction: row;
  }

  .form-row .form-group {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .kanban-column {
    min-width: 260px;
  }
}
</style>
