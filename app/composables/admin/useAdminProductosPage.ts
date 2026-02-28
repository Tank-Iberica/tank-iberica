/**
 * Admin Productos Page Composable
 * Orchestrates page-level logic for admin/productos/index.vue.
 * Column management → useAdminProductosColumns
 * Export functions  → utils/adminProductosExport
 */
import { formatPrice } from '~/composables/shared/useListingUtils'
import {
  useAdminVehicles,
  type AdminVehicle,
  type AdminVehicleFilters,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'
import { useGoogleDrive } from '~/composables/admin/useGoogleDrive'
import { useAdminProductosColumns } from '~/composables/admin/useAdminProductosColumns'
import { useAdminProductosSort } from '~/composables/admin/useAdminProductosSort'
import {
  exportToExcel,
  exportToPdf,
  exportVehicleFicha as exportVehicleFichaUtil,
  type ExportHelpers,
} from '~/utils/adminProductosExport'
import type { FileNamingData } from '~/utils/fileNaming'

// -------------------------------------------------------------------------
// Types used only by this module
// -------------------------------------------------------------------------

export type OnlineFilter = 'all' | 'online' | 'offline'
export type ModalType = 'delete' | 'export' | 'transaction' | 'config'

// Re-export sort types so consumers have one import point
export type { SortField, SortOrder } from '~/composables/admin/useAdminProductosSort'

export interface ModalData {
  vehicle?: AdminVehicle
  confirmText?: string
  transactionType?: 'rent' | 'sell'
  exportFormat?: 'pdf' | 'excel'
  exportScope?: 'all' | 'filtered' | 'selected'
  rentFrom?: string
  rentTo?: string
  rentClient?: string
  rentAmount?: string
  sellDate?: string
  sellBuyer?: string
  sellPrice?: string
}

// Re-export column types so consumers have one import point
export type { ColumnDef, ColumnGroup } from '~/composables/admin/useAdminProductosColumns'

// -------------------------------------------------------------------------
// Composable
// -------------------------------------------------------------------------

export function useAdminProductosPage() {
  const { t } = useI18n()
  const toast = useToast()

  // --- Sub-composables ---------------------------------------------------

  const { vehicles, loading, error, total, fetchVehicles, deleteVehicle, updateStatus } =
    useAdminVehicles()

  const { types, fetchTypes } = useAdminTypes()
  const { subcategories, fetchSubcategories } = useAdminSubcategories()
  const { filters: adminFilterDefs, fetchFilters: fetchAdminFilters } = useAdminFilters()

  const {
    connected: driveConnected,
    loading: driveLoading,
    connect: connectDrive,
    openVehicleFolder,
  } = useGoogleDrive()

  // Type cast needed: Supabase readonly generics are incompatible with mutable Ref<T[]>
  const columns = useAdminProductosColumns(adminFilterDefs as Ref<AdminFilter[]>)
  const { sortField, sortOrder, toggleSort, sortedVehicles } = useAdminProductosSort(
    vehicles as Ref<AdminVehicle[]>,
  )

  // --- Google Drive helpers ----------------------------------------------

  function vehicleToNaming(v: AdminVehicle): FileNamingData {
    const vType = types.value.find((tp) => tp.id === v.type_id)
    const link = typeSubcategoryLinks.value.find((l) => l.type_id === v.type_id)
    const subcat = link ? subcategories.value.find((s) => s.id === link.subcategory_id) : null
    return {
      id: v.internal_id || v.id,
      brand: v.brand,
      year: v.year,
      plate: v.plate,
      subcategory: subcat?.name_es || null,
      type: vType?.name_es || null,
    }
  }

  async function openDriveFolder(v: AdminVehicle) {
    if (!driveConnected.value) {
      const ok = await connectDrive()
      if (!ok) return
    }
    const section = v.is_online ? ('Vehiculos' as const) : ('Intermediacion' as const)
    await openVehicleFolder(vehicleToNaming(v), section)
  }

  // --- Favorites counts --------------------------------------------------

  const favCounts = ref<Record<string, number>>({})

  async function loadFavoriteCounts(vehicleIds: string[]): Promise<void> {
    if (!vehicleIds.length) {
      favCounts.value = {}
      return
    }
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('favorites')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)

    const counts: Record<string, number> = {}
    for (const row of (data || []) as Array<{ vehicle_id: string }>) {
      counts[row.vehicle_id] = (counts[row.vehicle_id] || 0) + 1
    }
    favCounts.value = counts
  }

  // --- Filters -----------------------------------------------------------

  const filters = ref<AdminVehicleFilters>({
    status: null,
    category: null,
    type_id: null,
    subcategory_id: null,
    search: '',
    is_online: null,
  })

  const onlineFilter = ref<OnlineFilter>('all')

  const hasActiveFilters = computed(
    () =>
      !!(
        filters.value.status ||
        filters.value.category ||
        filters.value.type_id ||
        filters.value.subcategory_id ||
        filters.value.search ||
        onlineFilter.value !== 'all'
      ),
  )

  function clearFilters() {
    filters.value = {
      status: null,
      category: null,
      type_id: null,
      subcategory_id: null,
      search: '',
      is_online: null,
    }
    onlineFilter.value = 'all'
  }

  // --- Junction data: type <-> subcategory links -------------------------

  const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

  async function fetchTypeSubcategoryLinks() {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('subcategory_categories')
      .select('subcategory_id, category_id')
    typeSubcategoryLinks.value =
      (data as unknown as { type_id: string; subcategory_id: string }[]) || []
  }

  function getSubcategoryForVehicle(typeId: string | null | undefined): string {
    if (!typeId) return '-'
    const link = typeSubcategoryLinks.value.find((l) => l.type_id === typeId)
    if (!link) return '-'
    return subcategories.value.find((s) => s.id === link.subcategory_id)?.name_es || '-'
  }

  const filteredTypes = computed(() => {
    if (!filters.value.subcategory_id) return types.value
    const linkedTypeIds = new Set(
      typeSubcategoryLinks.value
        .filter((l) => l.subcategory_id === filters.value.subcategory_id)
        .map((l) => l.type_id),
    )
    return types.value.filter((tp) => linkedTypeIds.has(tp.id))
  })

  // --- View State --------------------------------------------------------

  const isFullscreen = ref(false)

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
    document.body.style.overflow = isFullscreen.value ? 'hidden' : ''
  }

  // --- Selection ---------------------------------------------------------

  const selectedIds = ref<Set<string>>(new Set())

  function toggleSelection(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
    selectedIds.value = new Set(selectedIds.value)
  }

  function updateSelectAll(val: boolean) {
    if (val) {
      sortedVehicles.value.forEach((v) => selectedIds.value.add(v.id))
    } else {
      selectedIds.value.clear()
    }
    selectedIds.value = new Set(selectedIds.value)
  }

  // --- Modals ------------------------------------------------------------

  const activeModal = ref<ModalType | null>(null)
  const modalData = ref<ModalData>({})

  function openDeleteModal(vehicle: AdminVehicle) {
    modalData.value = { vehicle, confirmText: '' }
    activeModal.value = 'delete'
  }

  function openExportModal() {
    modalData.value = {
      exportFormat: 'pdf',
      exportScope: selectedIds.value.size > 0 ? 'selected' : 'filtered',
    }
    activeModal.value = 'export'
  }

  function openTransactionModal(vehicle: AdminVehicle, type: 'rent' | 'sell') {
    modalData.value = {
      vehicle,
      transactionType: type,
      rentFrom: '',
      rentTo: '',
      rentClient: '',
      rentAmount: '',
      sellDate: new Date().toISOString().split('T')[0],
      sellBuyer: '',
      sellPrice: vehicle.price?.toString() || '',
    }
    activeModal.value = 'transaction'
  }

  function openConfigModal() {
    activeModal.value = 'config'
  }

  function closeModal() {
    activeModal.value = null
    modalData.value = {}
  }

  // --- Data Loading ------------------------------------------------------

  async function loadVehicles() {
    let isOnline: boolean | null = null
    if (onlineFilter.value === 'online') isOnline = true
    if (onlineFilter.value === 'offline') isOnline = false
    await fetchVehicles({ ...filters.value, is_online: isOnline })
    await loadFavoriteCounts(vehicles.value.map((v) => v.id))
  }

  // --- Actions -----------------------------------------------------------

  async function executeDelete() {
    if (!modalData.value.vehicle || modalData.value.confirmText?.toLowerCase() !== 'borrar') return
    const success = await deleteVehicle(modalData.value.vehicle.id)
    if (success) closeModal()
  }

  async function executeTransaction() {
    if (!modalData.value.vehicle) return
    if (modalData.value.transactionType === 'rent') {
      await updateStatus(modalData.value.vehicle.id, 'rented')
    } else {
      await updateStatus(modalData.value.vehicle.id, 'sold')
    }
    closeModal()
    await loadVehicles()
  }

  async function handleStatusChange(vehicle: AdminVehicle, newStatus: string) {
    await updateStatus(vehicle.id, newStatus)
    await loadVehicles()
  }

  async function executeExport() {
    const { exportFormat, exportScope } = modalData.value

    let dataToExport: AdminVehicle[]
    if (exportScope === 'all') {
      dataToExport = vehicles.value as AdminVehicle[]
    } else if (exportScope === 'selected') {
      dataToExport = sortedVehicles.value.filter((v) =>
        selectedIds.value.has(v.id),
      ) as AdminVehicle[]
    } else {
      dataToExport = sortedVehicles.value as AdminVehicle[]
    }

    if (dataToExport.length === 0) {
      toast.warning(t('toast.noVehiclesToExport'))
      return
    }

    const helpers: ExportHelpers = { getSubcategoryName }

    if (exportFormat === 'excel') {
      await exportToExcel(dataToExport, helpers)
    } else {
      await exportToPdf(dataToExport, helpers)
    }

    closeModal()
  }

  function exportVehicleFicha(vehicle: AdminVehicle): Promise<void> {
    return exportVehicleFichaUtil(vehicle, { getSubcategoryName })
  }

  // --- Helpers -----------------------------------------------------------

  function getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      published: 'status-published',
      draft: 'status-draft',
      rented: 'status-rented',
      maintenance: 'status-maintenance',
      sold: 'status-sold',
    }
    return classes[status] || ''
  }

  function getCategoryClass(category: string): string {
    const classes: Record<string, string> = {
      venta: 'cat-venta',
      alquiler: 'cat-alquiler',
      terceros: 'cat-terceros',
    }
    return classes[category] || ''
  }

  function getSubcategoryName(id: string | null | undefined): string {
    if (!id) return '-'
    return types.value.find((s) => s.id === id)?.name_es || '-'
  }

  function getThumbnail(vehicle: AdminVehicle): string | null {
    const images = vehicle.vehicle_images as { url: string; position: number }[] | undefined
    if (!images?.length) return null
    return [...images].sort((a, b) => a.position - b.position)[0]?.url || null
  }

  function getFilterValue(vehicle: AdminVehicle, filterName: string): string {
    const json = vehicle.attributes_json as Record<string, unknown> | null
    if (!json) return '-'
    const val = json[filterName]
    if (val === null || val === undefined || val === '') return '-'
    if (typeof val === 'object' && val !== null) {
      const obj = val as { es?: string; en?: string }
      return obj.es || obj.en || '-'
    }
    return String(val)
  }

  // --- Keyboard ----------------------------------------------------------

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isFullscreen.value) toggleFullscreen()
  }

  // --- Watchers ----------------------------------------------------------

  watch([filters, onlineFilter], () => loadVehicles(), { deep: true })

  watch(
    () => filters.value.subcategory_id,
    () => {
      if (filters.value.subcategory_id && filters.value.type_id) {
        if (!filteredTypes.value.some((tp) => tp.id === filters.value.type_id)) {
          filters.value.type_id = null
        }
      }
    },
  )

  // --- Init & Cleanup ----------------------------------------------------

  async function init() {
    columns.loadConfig()
    await Promise.all([
      fetchSubcategories(),
      fetchTypes(),
      fetchTypeSubcategoryLinks(),
      loadVehicles(),
      fetchAdminFilters(),
    ])
    columns.syncFilterColumns()
    window.addEventListener('keydown', handleKeydown)
  }

  function cleanup() {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }

  // --- Return ------------------------------------------------------------

  return {
    // State
    vehicles,
    loading,
    error,
    total,
    filters,
    onlineFilter,
    hasActiveFilters,
    subcategories,
    filteredTypes,
    sortField,
    sortOrder,
    sortedVehicles,
    isFullscreen,
    selectedIds,
    activeModal,
    modalData,
    favCounts,
    driveConnected,
    driveLoading,
    // From columns composable
    ...columns,
    // Actions
    init,
    cleanup,
    clearFilters,
    toggleSort,
    toggleFullscreen,
    toggleSelection,
    updateSelectAll,
    openDeleteModal,
    openExportModal,
    openTransactionModal,
    openConfigModal,
    closeModal,
    executeDelete,
    executeExport,
    executeTransaction,
    handleStatusChange,
    exportVehicleFicha,
    openDriveFolder,
    connectDrive,
    // Helpers
    formatPrice,
    getSubcategoryForVehicle,
    getSubcategoryName,
    getFilterValue,
    getStatusClass,
    getCategoryClass,
    getThumbnail,
  }
}
