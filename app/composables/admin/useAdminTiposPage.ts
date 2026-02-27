/**
 * Page-level composable for admin/config/tipos.vue
 * Orchestrates CRUD, modals, subcategory links and display helpers.
 * Does NOT call onMounted — exposes init() instead.
 */
import { useAdminTypes, type AdminType, type TypeFormData } from '~/composables/admin/useAdminTypes'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'
import {
  useAdminSubcategories,
  type AdminSubcategory,
} from '~/composables/admin/useAdminSubcategories'

// ── Re-export types needed by subcomponents ────────────────────────
export type { AdminType, TypeFormData, AdminFilter, AdminSubcategory }

export interface TiposFormData extends TypeFormData {
  subcategory_ids: string[]
}

export interface DeleteModalState {
  show: boolean
  type: AdminType | null
  confirmText: string
}

// ── Composable ─────────────────────────────────────────────────────
export function useAdminTiposPage() {
  const { t } = useI18n()
  const toast = useToast()
  const supabase = useSupabaseClient()

  // Core CRUD composables
  const {
    types,
    loading,
    saving,
    error,
    fetchTypes,
    createType,
    updateType,
    deleteType,
    toggleStatus,
    moveUp,
    moveDown,
  } = useAdminTypes()

  const { filters: allFilters, fetchFilters } = useAdminFilters()
  const { subcategories: allSubcategories, fetchSubcategories } = useAdminSubcategories()

  // ── Modal state ──────────────────────────────────────────────────
  const showModal = ref(false)
  const editingId = ref<string | null>(null)

  const formData = ref<TiposFormData>({
    name_es: '',
    name_en: '',
    slug: '',
    applicable_categories: [],
    applicable_filters: [],
    status: 'published',
    sort_order: 0,
    subcategory_ids: [],
  })

  // Subcategory links loaded per type for display in the table
  const typeSubcategoryLinks = ref<Map<string, string[]>>(new Map())

  // Delete confirmation modal
  const deleteModal = ref<DeleteModalState>({
    show: false,
    type: null,
    confirmText: '',
  })

  // ── Computed helpers ─────────────────────────────────────────────
  const availableFilters = computed(() => {
    const coreFilters = [
      'precio',
      'marca',
      'ano',
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

  const availableSubcategories = computed(() => {
    return allSubcategories.value.filter((s) => s.status !== 'archived')
  })

  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  // ── Init (replaces onMounted) ────────────────────────────────────
  async function init() {
    await Promise.all([fetchTypes(), fetchFilters(), fetchSubcategories()])
    await loadAllTypeSubcategoryLinks()
  }

  // ── Subcategory link helpers ─────────────────────────────────────
  async function loadAllTypeSubcategoryLinks() {
    try {
      const { data } = await supabase
        .from('subcategory_categories')
        .select('subcategory_id, category_id')

      const links = new Map<string, string[]>()
      if (data) {
        for (const link of data as { subcategory_id: string; category_id: string }[]) {
          if (!links.has(link.subcategory_id)) {
            links.set(link.subcategory_id, [])
          }
          links.get(link.subcategory_id)!.push(link.category_id)
        }
      }
      typeSubcategoryLinks.value = links
    } catch {
      // Silently fail - links will just show as empty
    }
  }

  function getSubcategoryNames(typeId: string): string {
    const subcatIds = typeSubcategoryLinks.value.get(typeId)
    if (!subcatIds?.length) return '-'
    const names = subcatIds
      .map((id) => {
        const subcat = allSubcategories.value.find((s) => s.id === id)
        return subcat?.name_es || null
      })
      .filter(Boolean)
    return names.length ? names.join(', ') : '-'
  }

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

  // ── Modal functions ──────────────────────────────────────────────
  function openNewModal() {
    editingId.value = null
    formData.value = {
      name_es: '',
      name_en: '',
      slug: '',
      applicable_categories: [],
      applicable_filters: [],
      status: 'published',
      sort_order: types.value.length,
      subcategory_ids: [],
    }
    showModal.value = true
  }

  async function openEditModal(type: AdminType) {
    editingId.value = type.id

    // Load current subcategory links for this type
    let subcatIds: string[] = []
    try {
      const { data } = await supabase
        .from('subcategory_categories')
        .select('category_id')
        .eq('subcategory_id', type.id)

      if (data) {
        subcatIds = (data as { category_id: string }[]).map((d) => d.category_id)
      }
    } catch {
      // Use empty array on error
    }

    formData.value = {
      name_es: type.name_es,
      name_en: type.name_en || '',
      slug: type.slug,
      applicable_categories: type.applicable_categories || [],
      applicable_filters: type.applicable_filters || [],
      status: type.status,
      sort_order: type.sort_order,
      subcategory_ids: subcatIds,
    }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    editingId.value = null
  }

  // ── Form field updaters (called from component emits) ────────────
  function updateFormField(field: keyof TiposFormData, value: string | number) {
    ;(formData.value as Record<string, unknown>)[field] = value
  }

  function toggleFormArrayItem(field: 'subcategory_ids' | 'applicable_filters', itemId: string) {
    const arr = formData.value[field]
    const idx = arr.indexOf(itemId)
    if (idx >= 0) {
      arr.splice(idx, 1)
    } else {
      arr.push(itemId)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function saveType() {
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

    // Extract subcategory_ids before saving (not part of type table)
    const subcategoryIds = formData.value.subcategory_ids
    const typeData: TypeFormData = {
      name_es: formData.value.name_es,
      name_en: formData.value.name_en,
      slug: formData.value.slug,
      applicable_categories: formData.value.applicable_categories,
      applicable_filters: formData.value.applicable_filters,
      status: formData.value.status,
      sort_order: formData.value.sort_order,
    }

    let success: boolean | string | null
    let typeId: string | null = null

    if (editingId.value) {
      success = await updateType(editingId.value, typeData)
      typeId = editingId.value
    } else {
      typeId = await createType(typeData)
      success = !!typeId
    }

    if (success && typeId) {
      await updateTypeSubcategoryLinks(typeId, subcategoryIds)
      closeModal()
      await fetchTypes()
      await loadAllTypeSubcategoryLinks()
    }
  }

  async function updateTypeSubcategoryLinks(typeId: string, subcategoryIds: string[]) {
    try {
      // Delete existing links for this type
      await supabase.from('subcategory_categories').delete().eq('subcategory_id', typeId)

      // Insert new links
      if (subcategoryIds.length > 0) {
        const links = subcategoryIds.map((subcatId) => ({
          subcategory_id: typeId,
          category_id: subcatId,
        }))

        await supabase.from('subcategory_categories').insert(links as never)
      }
    } catch (err) {
      if (import.meta.dev) console.error('Error updating subcategory links:', err)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────
  function confirmDelete(type: AdminType) {
    deleteModal.value = { show: true, type, confirmText: '' }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, type: null, confirmText: '' }
  }

  function updateDeleteConfirmText(value: string) {
    deleteModal.value.confirmText = value
  }

  async function executeDelete() {
    if (!deleteModal.value.type || !canDelete.value) return

    const success = await deleteType(deleteModal.value.type.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // ── Status toggle ────────────────────────────────────────────────
  async function handleToggleStatus(type: AdminType) {
    const newStatus = type.status === 'published' ? 'draft' : 'published'
    await toggleStatus(type.id, newStatus)
    await fetchTypes()
  }

  // ── Reorder ──────────────────────────────────────────────────────
  async function handleMoveUp(id: string) {
    await moveUp(id)
  }

  async function handleMoveDown(id: string) {
    await moveDown(id)
  }

  return {
    // State
    types,
    loading,
    saving,
    error,
    showModal,
    editingId,
    formData,
    deleteModal,
    // Computed
    availableFilters,
    availableSubcategories,
    canDelete,
    // Init
    init,
    // Display helpers
    getSubcategoryNames,
    getFilterNames,
    // Modal actions
    openNewModal,
    openEditModal,
    closeModal,
    // Form field updaters
    updateFormField,
    toggleFormArrayItem,
    // CRUD actions
    saveType,
    confirmDelete,
    closeDeleteModal,
    updateDeleteConfirmText,
    executeDelete,
    handleToggleStatus,
    handleMoveUp,
    handleMoveDown,
  }
}
