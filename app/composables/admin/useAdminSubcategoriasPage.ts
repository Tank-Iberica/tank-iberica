/**
 * Page-level composable for admin/config/subcategorias.vue
 * Orchestrates CRUD, modals, and display helpers for subcategories.
 * Does NOT call onMounted -- exposes init() instead.
 */
import {
  useAdminSubcategories,
  type AdminSubcategory,
  type SubcategoryFormData,
} from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'

// -- Re-export types needed by subcomponents ---------------------------------
export type { AdminSubcategory, SubcategoryFormData, AdminFilter }

export interface DeleteModalState {
  show: boolean
  subcategory: AdminSubcategory | null
  confirmText: string
}

export interface VehicleCategory {
  id: string
  label: string
}

// -- Constants ---------------------------------------------------------------
export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  { id: 'alquiler', label: 'Alquiler' },
  { id: 'venta', label: 'Venta' },
  { id: 'terceros', label: 'Terceros' },
]

// -- Composable --------------------------------------------------------------
export function useAdminSubcategoriasPage() {
  const { t } = useI18n()
  const toast = useToast()

  // Core CRUD composables
  const {
    subcategories,
    loading,
    saving,
    error,
    fetchSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleStatus,
    moveUp,
    moveDown,
    clearError,
  } = useAdminSubcategories()

  const { filters: allFilters, fetchFilters } = useAdminFilters()

  // -- Modal state -----------------------------------------------------------
  const showModal = ref(false)
  const editingId = ref<string | null>(null)

  const formData = ref<SubcategoryFormData>({
    name_es: '',
    name_en: '',
    slug: '',
    applicable_categories: [],
    applicable_filters: [],
    status: 'published',
    sort_order: 0,
  })

  // Delete confirmation modal
  const deleteModal = ref<DeleteModalState>({
    show: false,
    subcategory: null,
    confirmText: '',
  })

  // -- Computed helpers -------------------------------------------------------
  const availableFilters = computed(() => {
    const coreFilters = [
      'precio',
      'marca',
      'a\u00F1o',
      'ubicacion',
      'price',
      'brand',
      'year',
      'location',
    ]
    return allFilters.value.filter(
      (f) => f.status !== 'archived' && !coreFilters.includes(f.name.toLowerCase()),
    )
  })

  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  // -- Init (replaces onMounted) ---------------------------------------------
  async function init() {
    await Promise.all([fetchSubcategories(), fetchFilters()])
  }

  // -- Display helpers -------------------------------------------------------
  function getFilterNames(filterIds: string[] | undefined): string {
    if (!filterIds?.length) return '-'
    const names = filterIds
      .map((id) => {
        const filter = allFilters.value.find((f) => f.id === id)
        return filter?.label_es || filter?.name || null
      })
      .filter(Boolean)
    return names.length ? names.join(', ') : '-'
  }

  function getCategoryLabels(categoryIds: string[] | undefined): string {
    if (!categoryIds?.length) return '-'
    const labels = categoryIds
      .map((id) => {
        const cat = VEHICLE_CATEGORIES.find((c) => c.id === id)
        return cat?.label || null
      })
      .filter(Boolean)
    return labels.length ? labels.join(', ') : '-'
  }

  // -- Modal functions -------------------------------------------------------
  function openNewModal() {
    clearError()
    editingId.value = null
    formData.value = {
      name_es: '',
      name_en: '',
      slug: '',
      applicable_categories: ['alquiler', 'venta', 'terceros'],
      applicable_filters: [],
      status: 'published',
      sort_order: subcategories.value.length,
    }
    showModal.value = true
  }

  function openEditModal(subcategory: AdminSubcategory) {
    clearError()
    editingId.value = subcategory.id
    formData.value = {
      name_es: subcategory.name_es,
      name_en: subcategory.name_en || '',
      slug: subcategory.slug,
      applicable_categories: subcategory.applicable_categories || [],
      applicable_filters: subcategory.applicable_filters || [],
      status: subcategory.status,
      sort_order: subcategory.sort_order,
    }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    editingId.value = null
  }

  // -- Form field updaters (called from component emits) ---------------------
  function updateFormField(field: keyof SubcategoryFormData, value: string | number) {
    ;(formData.value as Record<string, unknown>)[field] = value
  }

  function toggleFormArrayItem(
    field: 'applicable_categories' | 'applicable_filters',
    itemId: string,
  ) {
    const arr = formData.value[field]
    const idx = arr.indexOf(itemId)
    if (idx >= 0) {
      arr.splice(idx, 1)
    } else {
      arr.push(itemId)
    }
  }

  // -- Save ------------------------------------------------------------------
  async function saveSubcategory() {
    if (!formData.value.name_es.trim()) {
      toast.warning(t('toast.nameRequired'))
      return
    }

    // Auto-generate slug if empty
    if (!formData.value.slug) {
      formData.value.slug = formData.value.name_es
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036F]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }

    let success: boolean | string | null
    if (editingId.value) {
      success = await updateSubcategory(editingId.value, formData.value)
    } else {
      success = await createSubcategory(formData.value)
    }

    if (success) {
      closeModal()
      await fetchSubcategories()
    } else if (error.value) {
      if (import.meta.dev) console.error('Save subcategory failed:', error.value)
    }
  }

  // -- Delete ----------------------------------------------------------------
  function confirmDelete(subcategory: AdminSubcategory) {
    deleteModal.value = { show: true, subcategory, confirmText: '' }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, subcategory: null, confirmText: '' }
  }

  function updateDeleteConfirmText(value: string) {
    deleteModal.value.confirmText = value
  }

  async function executeDelete() {
    if (!deleteModal.value.subcategory || !canDelete.value) return

    const success = await deleteSubcategory(deleteModal.value.subcategory.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // -- Status toggle ---------------------------------------------------------
  async function handleToggleStatus(subcategory: AdminSubcategory) {
    const newStatus = subcategory.status === 'published' ? 'draft' : 'published'
    await toggleStatus(subcategory.id, newStatus)
    await fetchSubcategories()
  }

  // -- Reorder ---------------------------------------------------------------
  async function handleMoveUp(id: string) {
    await moveUp(id)
  }

  async function handleMoveDown(id: string) {
    await moveDown(id)
  }

  return {
    // State
    subcategories,
    loading,
    saving,
    error,
    showModal,
    editingId,
    formData,
    deleteModal,
    // Computed
    availableFilters,
    canDelete,
    // Init
    init,
    // Display helpers
    getFilterNames,
    getCategoryLabels,
    // Modal actions
    openNewModal,
    openEditModal,
    closeModal,
    // Form field updaters
    updateFormField,
    toggleFormArrayItem,
    // CRUD actions
    saveSubcategory,
    confirmDelete,
    closeDeleteModal,
    updateDeleteConfirmText,
    executeDelete,
    handleToggleStatus,
    handleMoveUp,
    handleMoveDown,
  }
}
