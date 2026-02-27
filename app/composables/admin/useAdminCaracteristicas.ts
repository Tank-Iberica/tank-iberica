/**
 * Composable for the admin Caracteristicas (attributes/filters) page.
 * Owns all reactive state, computed properties, and business logic.
 * The page and subcomponents are thin wrappers that connect to this composable.
 */
import {
  useAdminFilters,
  type AdminFilter,
  type FilterFormData,
  type FilterType,
  type FilterStatus,
  type ChoicesSource,
  FILTER_TYPES,
  FILTER_STATUSES,
} from '~/composables/admin/useAdminFilters'

/** State for the delete confirmation modal */
export interface DeleteModalState {
  show: boolean
  filter: AdminFilter | null
  confirmText: string
}

function createEmptyFormData(): FilterFormData {
  return {
    name: '',
    type: 'caja',
    label_es: '',
    label_en: '',
    unit: '',
    default_value: '',
    extra_filters: [],
    hides: [],
    status: 'published',
    is_extra: false,
    is_hidden: false,
    choices: [],
    choices_source: 'manual',
    step: null,
  }
}

export function useAdminCaracteristicas() {
  const { t } = useI18n()
  const toast = useToast()

  const {
    filters,
    loading,
    saving,
    error,
    fetchFilters,
    createFilter,
    updateFilter,
    deleteFilter,
    moveUp,
    moveDown,
    getAvailableFilters,
  } = useAdminFilters()

  // ---------------------------------------------------------------------------
  // Reactive state
  // ---------------------------------------------------------------------------

  const showModal = ref(false)
  const editingId = ref<string | null>(null)
  const formData = ref<FilterFormData>(createEmptyFormData())
  const choiceInput = ref('')

  const deleteModal = ref<DeleteModalState>({
    show: false,
    filter: null,
    confirmText: '',
  })

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

  const availableFiltersForSelection = computed(() =>
    getAvailableFilters(editingId.value || undefined),
  )

  const showTickOptions = computed(() => formData.value.type === 'tick')

  const showChoicesOptions = computed(
    () => formData.value.type === 'desplegable' || formData.value.type === 'desplegable_tick',
  )

  const showCalcOptions = computed(() => formData.value.type === 'calc')

  const showSliderInfo = computed(() => formData.value.type === 'slider')

  // ---------------------------------------------------------------------------
  // Modal functions
  // ---------------------------------------------------------------------------

  function openNewModal() {
    editingId.value = null
    formData.value = createEmptyFormData()
    choiceInput.value = ''
    showModal.value = true
  }

  function openEditModal(filter: AdminFilter) {
    editingId.value = filter.id
    formData.value = {
      name: filter.name,
      type: filter.type,
      label_es: filter.label_es || '',
      label_en: filter.label_en || '',
      unit: filter.unit || '',
      default_value: String(filter.options?.default_value || ''),
      extra_filters: filter.options?.extra_filters || [],
      hides: filter.options?.hides || [],
      status: filter.status,
      is_extra: filter.is_extra,
      is_hidden: filter.is_hidden,
      choices: filter.options?.choices || [],
      choices_source: (filter.options?.choices_source as ChoicesSource) || 'manual',
      step: (filter.options?.step as number) || null,
    }
    choiceInput.value = ''
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    editingId.value = null
  }

  async function saveFilter() {
    if (!formData.value.name.trim()) {
      toast.warning(t('toast.nameRequired'))
      return
    }
    if (!formData.value.type) {
      toast.warning(t('toast.typeRequired'))
      return
    }

    // Auto-set label_es if empty
    if (!formData.value.label_es) {
      formData.value.label_es = formData.value.name
    }

    let success: boolean | string | null
    if (editingId.value) {
      success = await updateFilter(editingId.value, formData.value)
    } else {
      success = await createFilter(formData.value)
    }

    if (success) {
      closeModal()
      await fetchFilters()
    }
  }

  // ---------------------------------------------------------------------------
  // Form field updates (for subcomponents that cannot v-model on props)
  // ---------------------------------------------------------------------------

  function updateFormField(field: keyof FilterFormData, value: string | number | boolean | null) {
    const fd = formData.value
    switch (field) {
      case 'name':
      case 'label_es':
      case 'label_en':
      case 'unit':
      case 'default_value':
        fd[field] = value as string
        break
      case 'type':
        fd.type = value as FilterType
        break
      case 'status':
        fd.status = value as FilterStatus
        break
      case 'choices_source':
        fd.choices_source = value as ChoicesSource
        break
      case 'is_extra':
      case 'is_hidden':
        fd[field] = value as boolean
        break
      case 'step':
        fd.step = value as number | null
        break
      default:
        break
    }
  }

  function toggleArrayItem(field: 'extra_filters' | 'hides', id: string) {
    const arr = formData.value[field]
    const idx = arr.indexOf(id)
    if (idx === -1) {
      formData.value[field] = [...arr, id]
    } else {
      formData.value[field] = arr.filter((_, i) => i !== idx)
    }
  }

  function updateChoiceInput(value: string) {
    choiceInput.value = value
  }

  // ---------------------------------------------------------------------------
  // Choice management
  // ---------------------------------------------------------------------------

  function addChoice() {
    const val = choiceInput.value.trim()
    if (val && !formData.value.choices.includes(val)) {
      formData.value.choices = [...formData.value.choices, val]
    }
    choiceInput.value = ''
  }

  function removeChoice(index: number) {
    formData.value.choices = formData.value.choices.filter((_, i) => i !== index)
  }

  // ---------------------------------------------------------------------------
  // Delete modal
  // ---------------------------------------------------------------------------

  function closeDeleteModal() {
    deleteModal.value = { show: false, filter: null, confirmText: '' }
  }

  function confirmDeleteFilter(filter: AdminFilter) {
    deleteModal.value = { show: true, filter, confirmText: '' }
  }

  function updateDeleteConfirmText(value: string) {
    deleteModal.value.confirmText = value
  }

  async function executeDelete() {
    if (!deleteModal.value.filter || !canDelete.value) return

    const success = await deleteFilter(deleteModal.value.filter.id)
    if (success) {
      closeDeleteModal()
    }
  }

  // ---------------------------------------------------------------------------
  // Reorder
  // ---------------------------------------------------------------------------

  async function handleMoveUp(id: string) {
    await moveUp(id)
  }

  async function handleMoveDown(id: string) {
    await moveDown(id)
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  function getTypeLabel(type: FilterType): string {
    return FILTER_TYPES.find((ft) => ft.value === type)?.label || type
  }

  function getStatusClass(status: FilterStatus): string {
    switch (status) {
      case 'published':
        return 'status-published'
      case 'draft':
        return 'status-draft'
      case 'archived':
        return 'status-archived'
      default:
        return ''
    }
  }

  function getStatusLabel(status: FilterStatus): string {
    return FILTER_STATUSES.find((s) => s.value === status)?.label || status
  }

  function getExtraFiltersDisplay(filter: AdminFilter): string {
    const extras = filter.options?.extra_filters || []
    if (!extras.length) return '-'
    return extras
      .map((id) => {
        const f = filters.value.find((x) => x.id === id || x.name === id)
        return f?.label_es || f?.name || id
      })
      .join(', ')
  }

  function getHidesDisplay(filter: AdminFilter): string {
    const hides = filter.options?.hides || []
    if (!hides.length) return '-'
    return hides
      .map((id) => {
        const f = filters.value.find((x) => x.id === id || x.name === id)
        return f?.label_es || f?.name || id
      })
      .join(', ')
  }

  // ---------------------------------------------------------------------------
  // Initialization (replaces onMounted)
  // ---------------------------------------------------------------------------

  async function init() {
    await fetchFilters()
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    // State
    filters,
    loading,
    saving,
    error,
    showModal,
    editingId,
    formData,
    choiceInput,
    deleteModal,

    // Computed
    canDelete,
    availableFiltersForSelection,
    showTickOptions,
    showChoicesOptions,
    showCalcOptions,
    showSliderInfo,

    // Constants (re-exported for subcomponents)
    FILTER_TYPES,
    FILTER_STATUSES,

    // Modal
    openNewModal,
    openEditModal,
    closeModal,
    saveFilter,

    // Form field updates
    updateFormField,
    toggleArrayItem,
    updateChoiceInput,

    // Choice management
    addChoice,
    removeChoice,

    // Delete
    closeDeleteModal,
    confirmDeleteFilter,
    updateDeleteConfirmText,
    executeDelete,

    // Reorder
    handleMoveUp,
    handleMoveDown,

    // Display helpers
    getTypeLabel,
    getStatusClass,
    getStatusLabel,
    getExtraFiltersDisplay,
    getHidesDisplay,

    // Init
    init,
  }
}
