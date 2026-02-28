import { formatPrice } from '~/composables/shared/useListingUtils'
import {
  useAdminDemands,
  DEMAND_STATUSES,
  type AdminDemand,
  type DemandStatus,
  type DemandFilters,
} from '~/composables/admin/useAdminDemands'
import { localizedName } from '~/composables/useLocalized'

// Re-export types for subcomponents
export type { AdminDemand, DemandStatus, DemandFilters }
export { DEMAND_STATUSES }

/** State shape for the delete confirmation modal */
export interface DeleteModalState {
  show: boolean
  demand: AdminDemand | null
  confirmText: string
}

/** State shape for the detail/notes modal */
export interface DetailModalState {
  show: boolean
  demand: AdminDemand | null
  notes: string
}

/** Status config entry returned by getStatusConfig */
export interface StatusConfigEntry {
  value: DemandStatus
  label: string
  color: string
}

// --- Pure utility functions (exported for subcomponents) ---

export function getStatusConfig(status: DemandStatus): StatusConfigEntry {
  return DEMAND_STATUSES.find((s) => s.value === status) || DEMAND_STATUSES[0]!
}

export function getTypeLabel(demand: AdminDemand, locale: string): string {
  const demandRecord = demand as unknown as Record<string, unknown>
  const subcategory = demand.subcategory as
    | { name_es: string; name_en: string | null }
    | null
    | undefined
  const typeField = demandRecord.type as
    | { name_es: string; name_en: string | null }
    | null
    | undefined

  if (subcategory || typeField) {
    const parts: string[] = []
    const subcatLabel = localizedName(subcategory, locale)
    const typeLabel = localizedName(typeField, locale)
    if (subcatLabel) parts.push(subcatLabel)
    if (typeLabel) parts.push(typeLabel)
    return parts.join(' > ')
  }
  return demand.vehicle_type || '-'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatPriceRange(min: number | null, max: number | null): string {
  if (!min && !max) return '-'
  if (min && max) return `${formatPrice(min)} - ${formatPrice(max)}`
  if (min) return `Desde ${formatPrice(min)}`
  return `Hasta ${formatPrice(max)}`
}

export function formatYearRange(min: number | null, max: number | null): string {
  if (!min && !max) return '-'
  if (min && max) return `${min} - ${max}`
  if (min) return `Desde ${min}`
  return `Hasta ${max}`
}

// --- Composable ---

export function useAdminSolicitantes() {
  const { locale } = useI18n()

  const {
    demands,
    loading,
    saving,
    error,
    total,
    fetchDemands,
    updateStatus,
    updateNotes,
    deleteDemand,
  } = useAdminDemands()

  // Filters
  const filters = ref<DemandFilters>({
    status: null,
    search: '',
  })

  // Delete confirmation modal
  const deleteModal = ref<DeleteModalState>({
    show: false,
    demand: null,
    confirmText: '',
  })

  // Detail modal
  const detailModal = ref<DetailModalState>({
    show: false,
    demand: null,
    notes: '',
  })

  // Computed
  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  // Watch filters
  watch(
    filters,
    () => {
      fetchDemands(filters.value)
    },
    { deep: true },
  )

  // Quick status update
  async function handleStatusChange(demand: AdminDemand, newStatus: DemandStatus) {
    await updateStatus(demand.id, newStatus)
  }

  // Detail modal actions
  function openDetail(demand: AdminDemand) {
    detailModal.value = {
      show: true,
      demand,
      notes: demand.admin_notes || '',
    }
  }

  function closeDetail() {
    detailModal.value = { show: false, demand: null, notes: '' }
  }

  async function saveNotes() {
    if (!detailModal.value.demand) return
    const success = await updateNotes(detailModal.value.demand.id, detailModal.value.notes)
    if (success) {
      closeDetail()
      await fetchDemands(filters.value)
    }
  }

  // Delete modal actions
  function confirmDelete(demand: AdminDemand) {
    deleteModal.value = { show: true, demand, confirmText: '' }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, demand: null, confirmText: '' }
  }

  async function executeDelete() {
    if (!deleteModal.value.demand || !canDelete.value) return
    const success = await deleteDemand(deleteModal.value.demand.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // Init (replaces onMounted)
  async function init() {
    await fetchDemands()
  }

  return {
    // State
    locale,
    demands,
    loading,
    saving,
    error,
    total,
    filters,
    deleteModal,
    detailModal,
    canDelete,

    // Actions
    init,
    handleStatusChange,
    openDetail,
    closeDetail,
    saveNotes,
    confirmDelete,
    closeDeleteModal,
    executeDelete,
  }
}
