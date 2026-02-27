/**
 * Admin Anunciantes Page Composable
 * Manages all state and logic for the admin anunciantes page.
 * Extracted from app/pages/admin/anunciantes.vue — pure structural refactor.
 */
import {
  useAdminAdvertisements,
  ADVERTISEMENT_STATUSES,
  type AdminAdvertisement,
  type AdvertisementStatus,
  type AdvertisementFilters,
} from '~/composables/admin/useAdminAdvertisements'

export { ADVERTISEMENT_STATUSES }
export type { AdminAdvertisement, AdvertisementStatus, AdvertisementFilters }

export interface DeleteModalState {
  show: boolean
  advertisement: AdminAdvertisement | null
  confirmText: string
}

export interface DetailModalState {
  show: boolean
  advertisement: AdminAdvertisement | null
  notes: string
}

export function useAdminAnunciantes() {
  const {
    advertisements,
    loading,
    saving,
    error,
    total,
    fetchAdvertisements,
    updateStatus,
    updateNotes,
    deleteAdvertisement,
  } = useAdminAdvertisements()

  // Filters
  const filters = ref<AdvertisementFilters>({
    status: null,
    search: '',
  })

  // Delete confirmation modal
  const deleteModal = ref<DeleteModalState>({
    show: false,
    advertisement: null,
    confirmText: '',
  })

  // Detail modal
  const detailModal = ref<DetailModalState>({
    show: false,
    advertisement: null,
    notes: '',
  })

  // Computed
  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  // Watch filters
  watch(
    filters,
    () => {
      fetchAdvertisements(filters.value)
    },
    { deep: true },
  )

  // Status helpers
  function getStatusConfig(status: AdvertisementStatus) {
    return ADVERTISEMENT_STATUSES.find((s) => s.value === status) || ADVERTISEMENT_STATUSES[0]
  }

  // Quick status update
  async function handleStatusChange(ad: AdminAdvertisement, newStatus: AdvertisementStatus) {
    await updateStatus(ad.id, newStatus)
  }

  // Detail modal functions
  function openDetail(ad: AdminAdvertisement) {
    detailModal.value = {
      show: true,
      advertisement: ad,
      notes: ad.admin_notes || '',
    }
  }

  function closeDetail() {
    detailModal.value = { show: false, advertisement: null, notes: '' }
  }

  async function saveNotes() {
    if (!detailModal.value.advertisement) return
    const success = await updateNotes(detailModal.value.advertisement.id, detailModal.value.notes)
    if (success) {
      closeDetail()
      await fetchAdvertisements(filters.value)
    }
  }

  function updateDetailNotes(notes: string) {
    detailModal.value.notes = notes
  }

  // Delete functions
  function confirmDelete(ad: AdminAdvertisement) {
    deleteModal.value = { show: true, advertisement: ad, confirmText: '' }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, advertisement: null, confirmText: '' }
  }

  function updateDeleteConfirmText(text: string) {
    deleteModal.value.confirmText = text
  }

  async function executeDelete() {
    if (!deleteModal.value.advertisement || !canDelete.value) return
    const success = await deleteAdvertisement(deleteModal.value.advertisement.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // Format helpers
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Filter update functions
  function setStatusFilter(status: AdvertisementStatus | null) {
    filters.value.status = status
  }

  function setSearchFilter(search: string) {
    filters.value.search = search
  }

  // Init function (replaces onMounted)
  async function init() {
    await fetchAdvertisements()
  }

  return {
    // State
    advertisements,
    loading,
    saving,
    error,
    total,
    filters,
    deleteModal,
    detailModal,
    canDelete,

    // Init
    init,

    // Filter actions
    setStatusFilter,
    setSearchFilter,

    // Status
    getStatusConfig,
    handleStatusChange,

    // Detail modal
    openDetail,
    closeDetail,
    saveNotes,
    updateDetailNotes,

    // Delete modal
    confirmDelete,
    closeDeleteModal,
    updateDeleteConfirmText,
    executeDelete,

    // Helpers
    formatDate,
  }
}
