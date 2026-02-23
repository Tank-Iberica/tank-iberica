<script setup lang="ts">
import {
  useAdminVehicles,
  type AdminVehicle,
  type AdminVehicleFilters,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'
import { useGoogleDrive } from '~/composables/admin/useGoogleDrive'
import type { FileNamingData } from '~/utils/fileNaming'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const toast = useToast()

const { vehicles, loading, error, total, fetchVehicles, deleteVehicle, updateStatus } =
  useAdminVehicles()

const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()
const { filters: adminFilterDefs, fetchFilters: fetchAdminFilters } = useAdminFilters()

// Google Drive
const {
  connected: driveConnected,
  loading: driveLoading,
  connect: connectDrive,
  openVehicleFolder,
} = useGoogleDrive()

function vehicleToNaming(v: AdminVehicle): FileNamingData {
  const type = types.value.find((t) => t.id === v.type_id)
  const link = typeSubcategoryLinks.value.find((l) => l.type_id === v.type_id)
  const subcat = link ? subcategories.value.find((s) => s.id === link.subcategory_id) : null
  return {
    id: v.internal_id || v.id,
    brand: v.brand,
    year: v.year,
    plate: v.plate,
    subcategory: subcat?.name_es || null,
    type: type?.name_es || null,
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

// Favorites counts
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

// Filters
const filters = ref<AdminVehicleFilters>({
  status: null,
  category: null,
  type_id: null,
  subcategory_id: null,
  search: '',
  is_online: null,
})

type OnlineFilter = 'all' | 'online' | 'offline'
const onlineFilter = ref<OnlineFilter>('all')

// Column Configuration
interface ColumnDef {
  key: string
  label: string
  width?: string
  sortable?: boolean
  group?: string
}

interface ColumnGroup {
  id: string
  name: string
  icon: string
  columns: string[]
  active: boolean
  required?: boolean
}

const staticColumns: ColumnDef[] = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'image', label: 'Img', width: '56px' },
  { key: 'type', label: 'Online', width: '60px' },
  { key: 'brand', label: 'Marca', sortable: true },
  { key: 'model', label: 'Modelo', sortable: true },
  { key: 'subcategory', label: 'Subcat.' },
  { key: 'typeName', label: 'Tipo' },
  { key: 'year', label: 'Año', width: '70px', sortable: true },
  { key: 'price', label: 'Precio', width: '100px', sortable: true },
  { key: 'plate', label: 'Matrícula', width: '100px', group: 'docs' },
  { key: 'location', label: 'Ubicación', width: '120px', group: 'docs' },
  { key: 'description', label: 'Descripción', width: '150px', group: 'tecnico' },
  { key: 'minPrice', label: 'P. Mínimo', width: '100px', group: 'cuentas' },
  { key: 'cost', label: 'Coste', width: '100px', group: 'cuentas' },
  { key: 'rentalPrice', label: 'P. Alquiler', width: '100px', group: 'alquiler' },
  { key: 'category', label: 'Cat.', width: '80px' },
  { key: 'status', label: 'Estado', width: '110px', sortable: true },
  { key: 'actions', label: 'Acciones', width: '110px' },
]

const dynamicFilterColumns = computed<ColumnDef[]>(() => {
  return (adminFilterDefs.value as AdminFilter[])
    .filter((f) => f.status !== 'archived')
    .map((f) => ({
      key: `filter_${f.name}`,
      label: f.label_es || f.name,
      group: 'filtros',
    }))
})

const allColumns = computed<ColumnDef[]>(() => {
  return [...staticColumns, ...dynamicFilterColumns.value]
})

const activeFilterColumns = computed(() => {
  return (adminFilterDefs.value as AdminFilter[])
    .filter((f) => f.status !== 'archived')
    .map((f) => ({
      key: `filter_${f.name}`,
      filterName: f.name,
      label: f.label_es || f.name,
      unit: f.unit,
    }))
})

const defaultColumnGroups: ColumnGroup[] = [
  {
    id: 'base',
    name: 'Base',
    icon: '📋',
    columns: [
      'checkbox',
      'image',
      'type',
      'brand',
      'model',
      'subcategory',
      'typeName',
      'year',
      'price',
      'category',
      'status',
      'actions',
    ],
    active: true,
    required: true,
  },
  { id: 'docs', name: 'Docs', icon: '📄', columns: ['plate', 'location'], active: false },
  { id: 'tecnico', name: 'Técnico', icon: '🔧', columns: ['description'], active: false },
  { id: 'cuentas', name: 'Cuentas', icon: '💰', columns: ['minPrice', 'cost'], active: false },
  { id: 'alquiler', name: 'Alquiler', icon: '📅', columns: ['rentalPrice'], active: false },
  { id: 'filtros', name: 'Filtros', icon: '🔎', columns: [], active: false },
]

const STORAGE_KEY = 'tracciona-admin-productos-config-v4'

const columnGroups = ref<ColumnGroup[]>(
  defaultColumnGroups.map((g) => ({ ...g, columns: [...g.columns] })),
)
const columnOrder = ref<string[]>(staticColumns.map((c) => c.key))

function loadConfig() {
  if (!import.meta.client) return
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.groups && Array.isArray(parsed.groups)) {
        columnGroups.value = parsed.groups
      }
      if (parsed.order && Array.isArray(parsed.order)) {
        columnOrder.value = parsed.order
      }
    }
  } catch {
    /* use defaults */
  }
}

function saveConfig() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        groups: columnGroups.value,
        order: columnOrder.value,
      }),
    )
  } catch {
    // localStorage may be full or unavailable
  }
}

function syncFilterColumns() {
  const filterKeys = dynamicFilterColumns.value.map((c) => c.key)
  const filtrosGroup = columnGroups.value.find((g) => g.id === 'filtros')
  if (filtrosGroup) {
    for (const key of filterKeys) {
      if (!filtrosGroup.columns.includes(key)) {
        filtrosGroup.columns.push(key)
      }
    }
    filtrosGroup.columns = filtrosGroup.columns.filter(
      (c) => !c.startsWith('filter_') || filterKeys.includes(c),
    )
  }
  for (const key of filterKeys) {
    if (!columnOrder.value.includes(key)) {
      const actionsIdx = columnOrder.value.indexOf('actions')
      if (actionsIdx >= 0) {
        columnOrder.value.splice(actionsIdx, 0, key)
      } else {
        columnOrder.value.push(key)
      }
    }
  }
  columnOrder.value = columnOrder.value.filter(
    (k) => !k.startsWith('filter_') || filterKeys.includes(k),
  )
  saveConfig()
}

onMounted(() => {
  loadConfig()
})

function toggleGroup(groupId: string) {
  const group = columnGroups.value.find((g) => g.id === groupId)
  if (group && !group.required) {
    group.active = !group.active
    saveConfig()
  }
}

function isGroupActive(groupId: string): boolean {
  return columnGroups.value.find((g) => g.id === groupId)?.active || false
}

// Sorting
type SortField = 'brand' | 'model' | 'year' | 'price' | 'status' | 'created_at'
type SortOrder = 'asc' | 'desc'
const sortField = ref<SortField>('created_at')
const sortOrder = ref<SortOrder>('desc')

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const sortedVehicles = computed(() => {
  const list = [...vehicles.value]
  list.sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null

    switch (sortField.value) {
      case 'brand':
        aVal = (a.brand || '').toLowerCase()
        bVal = (b.brand || '').toLowerCase()
        break
      case 'model':
        aVal = (a.model || '').toLowerCase()
        bVal = (b.model || '').toLowerCase()
        break
      case 'year':
        aVal = a.year || 0
        bVal = b.year || 0
        break
      case 'price':
        aVal = a.price || 0
        bVal = b.price || 0
        break
      case 'status':
        aVal = a.status || ''
        bVal = b.status || ''
        break
      case 'created_at':
        aVal = a.created_at || ''
        bVal = b.created_at || ''
        break
    }

    if (aVal === null || bVal === null) return 0
    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  return list
})

// View State
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  document.body.style.overflow = isFullscreen.value ? 'hidden' : ''
}

// Selection
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

// Modals
const activeModal = ref<'delete' | 'export' | 'transaction' | 'config' | null>(null)

const modalData = ref<{
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
}>({})

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

// Config Modal - Group Editing
function createGroup(name: string, columns: string[]) {
  const newGroup: ColumnGroup = {
    id: `custom_${Date.now()}`,
    name,
    icon: '📁',
    columns: [...columns],
    active: false,
  }
  columnGroups.value.push(newGroup)
  saveConfig()
}

function deleteGroup(groupId: string) {
  const group = columnGroups.value.find((g) => g.id === groupId)
  if (group?.required) return
  columnGroups.value = columnGroups.value.filter((g) => g.id !== groupId)
  saveConfig()
}

function resetConfig() {
  columnGroups.value = defaultColumnGroups.map((g) => ({ ...g, columns: [...g.columns] }))
  columnOrder.value = staticColumns.map((c) => c.key)
  syncFilterColumns()
}

// Drag and drop for column ordering
const draggedColumn = ref<string | null>(null)

function onDragStart(key: string) {
  draggedColumn.value = key
}

function onDragOver(e: DragEvent, targetKey: string) {
  e.preventDefault()
  if (!draggedColumn.value || draggedColumn.value === targetKey) return

  const fromIdx = columnOrder.value.indexOf(draggedColumn.value)
  const toIdx = columnOrder.value.indexOf(targetKey)

  if (fromIdx !== -1 && toIdx !== -1) {
    columnOrder.value.splice(fromIdx, 1)
    columnOrder.value.splice(toIdx, 0, draggedColumn.value)
  }
}

function onDragEnd() {
  draggedColumn.value = null
  saveConfig()
}

// Data Loading
onMounted(async () => {
  await Promise.all([
    fetchSubcategories(),
    fetchTypes(),
    fetchTypeSubcategoryLinks(),
    loadVehicles(),
    fetchAdminFilters(),
  ])
  syncFilterColumns()
})

watch([filters, onlineFilter], () => loadVehicles(), { deep: true })

watch(
  () => filters.value.subcategory_id,
  () => {
    if (filters.value.subcategory_id && filters.value.type_id) {
      if (!filteredTypes.value.some((t) => t.id === filters.value.type_id)) {
        filters.value.type_id = null
      }
    }
  },
)

async function loadVehicles() {
  let isOnline: boolean | null = null
  if (onlineFilter.value === 'online') isOnline = true
  if (onlineFilter.value === 'offline') isOnline = false
  await fetchVehicles({ ...filters.value, is_online: isOnline })
  await loadFavoriteCounts(vehicles.value.map((v) => v.id))
}

// Actions
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
    dataToExport = vehicles.value
  } else if (exportScope === 'selected') {
    dataToExport = sortedVehicles.value.filter((v) => selectedIds.value.has(v.id))
  } else {
    dataToExport = sortedVehicles.value
  }

  if (dataToExport.length === 0) {
    toast.warning(t('toast.noVehiclesToExport'))
    return
  }

  if (exportFormat === 'excel') {
    await exportToExcel(dataToExport)
  } else {
    await exportToPdf(dataToExport)
  }

  closeModal()
}

async function exportToExcel(data: AdminVehicle[]) {
  const ExcelJS = await import('exceljs')

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Productos')

  worksheet.columns = [
    { header: 'Online', key: 'online', width: 10 },
    { header: 'Marca', key: 'brand', width: 15 },
    { header: 'Modelo', key: 'model', width: 20 },
    { header: 'Tipo', key: 'type', width: 20 },
    { header: 'Año', key: 'year', width: 10 },
    { header: 'Precio', key: 'price', width: 12 },
    { header: 'Categoría', key: 'category', width: 15 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Matrícula', key: 'plate', width: 12 },
    { header: 'Ubicación', key: 'location', width: 15 },
    { header: 'Precio Mín.', key: 'min_price', width: 12 },
    { header: 'Coste', key: 'acquisition_cost', width: 12 },
    { header: 'Precio Alquiler', key: 'rental_price', width: 15 },
  ]

  data.forEach((v) => {
    worksheet.addRow({
      online: v.is_online ? 'Online' : 'Offline',
      brand: v.brand,
      model: v.model,
      type: getSubcategoryName(v.type_id),
      year: v.year,
      price: v.price,
      category: v.category,
      status: getStatusLabel(v.status),
      plate: v.plate || '-',
      location: v.location || '-',
      min_price: v.min_price || '-',
      acquisition_cost: v.acquisition_cost || '-',
      rental_price: v.rental_price || '-',
    })
  })

  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

async function exportToPdf(data: AdminVehicle[]) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF('l', 'mm', 'a4')
  doc.setFontSize(16)
  doc.text('Tracciona - Productos', 14, 15)
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} · ${data.length} productos`, 14, 22)

  const headers = ['Online', 'Marca', 'Modelo', 'Tipo', 'Año', 'Precio', 'Cat.', 'Estado']
  const rows = data.map((v) => [
    v.is_online ? 'ON' : 'OFF',
    v.brand || '-',
    v.model || '-',
    getSubcategoryName(v.type_id),
    v.year || '-',
    formatPrice(v.price),
    v.category || '-',
    getStatusLabel(v.status),
  ])

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [35, 66, 74] },
  })

  doc.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`)
}

async function exportVehicleFicha(vehicle: AdminVehicle) {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(35, 66, 74)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Tracciona', 14, 20)
  doc.setFontSize(12)
  doc.text('Ficha de Producto', 14, 30)

  doc.setTextColor(35, 66, 74)
  doc.setFontSize(20)
  doc.text(`${vehicle.brand} ${vehicle.model}`, 14, 55)

  if (vehicle.year) {
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(`Año: ${vehicle.year}`, 14, 63)
  }

  if (vehicle.price) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(pageWidth - 80, 45, 66, 25, 3, 3, 'F')
    doc.setTextColor(35, 66, 74)
    doc.setFontSize(16)
    doc.text(formatPrice(vehicle.price), pageWidth - 75, 60)
  }

  let yPos = 80
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  const details = [
    ['Categoría', vehicle.category?.toUpperCase() || '-'],
    ['Tipo', getSubcategoryName(vehicle.type_id)],
    ['Estado', getStatusLabel(vehicle.status)],
    ['Visibilidad', vehicle.is_online ? 'Online (Web)' : 'Offline (Intermediación)'],
  ]

  if (vehicle.location) details.push(['Ubicación', vehicle.location])
  if (vehicle.plate) details.push(['Matrícula', vehicle.plate])
  if (vehicle.rental_price)
    details.push(['Precio Alquiler', `${formatPrice(vehicle.rental_price)}/día`])

  doc.setFontSize(14)
  doc.setTextColor(35, 66, 74)
  doc.text('Datos del Vehículo', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  for (const [label, value] of details) {
    doc.setTextColor(100, 100, 100)
    doc.text(`${label}:`, 14, yPos)
    doc.setTextColor(50, 50, 50)
    doc.text(String(value), 60, yPos)
    yPos += 7
  }

  if (vehicle.description_es) {
    yPos += 10
    doc.setFontSize(14)
    doc.setTextColor(35, 66, 74)
    doc.text('Descripción', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    const descLines = doc.splitTextToSize(vehicle.description_es, pageWidth - 28)
    doc.text(descLines, 14, yPos)
    yPos += descLines.length * 5
  }

  if (vehicle.acquisition_cost || vehicle.min_price) {
    yPos += 15
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(14, yPos - 5, pageWidth - 28, 35, 3, 3, 'F')
    doc.setFontSize(12)
    doc.setTextColor(146, 64, 14)
    doc.text('Información Financiera (Interno)', 18, yPos + 3)
    yPos += 10
    doc.setFontSize(10)
    if (vehicle.acquisition_cost) {
      doc.text(`Coste Adquisición: ${formatPrice(vehicle.acquisition_cost)}`, 18, yPos)
      yPos += 6
    }
    if (vehicle.min_price) {
      doc.text(`Precio Mínimo: ${formatPrice(vehicle.min_price)}`, 18, yPos)
      yPos += 6
    }
    if (vehicle.price && vehicle.acquisition_cost) {
      const margin = vehicle.price - vehicle.acquisition_cost
      doc.text(`Margen: ${formatPrice(margin)}`, 18, yPos)
    }
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} · Tracciona`, 14, 285)

  doc.save(`ficha_${vehicle.brand}_${vehicle.model}_${vehicle.year || ''}.pdf`)
}

// Keyboard
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) toggleFullscreen()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// Helpers
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

function getStatusLabel(status: string): string {
  const statusOptions = [
    { value: 'published', label: 'Publicado' },
    { value: 'draft', label: 'Oculto' },
    { value: 'rented', label: 'Alquilado' },
    { value: 'maintenance', label: 'Taller' },
    { value: 'sold', label: 'Vendido' },
  ]
  return statusOptions.find((s) => s.value === status)?.label || status
}

function getCategoryClass(category: string): string {
  const classes: Record<string, string> = {
    venta: 'cat-venta',
    alquiler: 'cat-alquiler',
    terceros: 'cat-terceros',
  }
  return classes[category] || ''
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function getSubcategoryName(id: string | null): string {
  if (!id) return '-'
  return types.value.find((s) => s.id === id)?.name_es || '-'
}

function getThumbnail(vehicle: AdminVehicle): string | null {
  const images = vehicle.vehicle_images as { url: string; position: number }[] | undefined
  if (!images?.length) return null
  return [...images].sort((a, b) => a.position - b.position)[0]?.url || null
}

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

const hasActiveFilters = computed(
  () =>
    filters.value.status ||
    filters.value.category ||
    filters.value.type_id ||
    filters.value.subcategory_id ||
    filters.value.search ||
    onlineFilter.value !== 'all',
)

// Junction data: type ↔ subcategory links
const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

async function fetchTypeSubcategoryLinks() {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('subcategory_categories')
    .select('subcategory_id, category_id')
  typeSubcategoryLinks.value = (data as { type_id: string; subcategory_id: string }[]) || []
}

function getSubcategoryForVehicle(typeId: string | null): string {
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
  return types.value.filter((t) => linkedTypeIds.has(t.id))
})

const availableColumnsForGroups = computed(() =>
  allColumns.value.filter((c) => !['checkbox', 'actions'].includes(c.key)),
)

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
</script>

<template>
  <div class="productos-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Productos</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <NuxtLink to="/admin/productos/nuevo" class="btn-primary"> + Nuevo Producto </NuxtLink>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <!-- Filters -->
      <AdminProductosFilters
        v-model:filters="filters"
        v-model:online-filter="onlineFilter"
        :subcategories="subcategories"
        :filtered-types="filteredTypes"
        :has-active-filters="hasActiveFilters"
        @clear="clearFilters"
      />

      <!-- Toolbar Actions -->
      <AdminProductosToolbar
        :column-groups="columnGroups"
        :drive-connected="driveConnected"
        :drive-loading="driveLoading"
        :selected-count="selectedIds.size"
        :is-fullscreen="isFullscreen"
        @toggle-group="toggleGroup"
        @connect-drive="connectDrive"
        @open-config="openConfigModal"
        @open-export="openExportModal"
        @toggle-fullscreen="toggleFullscreen"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Cargando productos...</span>
    </div>

    <!-- Table -->
    <AdminProductosTable
      v-else
      :vehicles="sortedVehicles"
      :selected-ids="selectedIds"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :is-group-active="isGroupActive"
      :active-filter-columns="activeFilterColumns"
      :fav-counts="favCounts"
      :has-active-filters="hasActiveFilters"
      :drive-loading="driveLoading"
      :get-subcategory-for-vehicle="getSubcategoryForVehicle"
      :get-subcategory-name="getSubcategoryName"
      :format-price="formatPrice"
      :get-filter-value="getFilterValue"
      :get-status-class="getStatusClass"
      :get-category-class="getCategoryClass"
      :get-thumbnail="getThumbnail"
      @update:select-all="updateSelectAll"
      @toggle-selection="toggleSelection"
      @toggle-sort="toggleSort"
      @status-change="handleStatusChange"
      @delete="openDeleteModal"
      @export-ficha="exportVehicleFicha"
      @transaction="openTransactionModal"
      @open-drive-folder="openDriveFolder"
      @clear-filters="clearFilters"
    />

    <!-- Delete Modal -->
    <AdminProductosDeleteModal
      :show="activeModal === 'delete'"
      :vehicle="modalData.vehicle || null"
      :confirm-text="modalData.confirmText || ''"
      @update:confirm-text="(v) => (modalData.confirmText = v)"
      @close="closeModal"
      @confirm="executeDelete"
    />

    <!-- Export Modal -->
    <AdminProductosExportModal
      :show="activeModal === 'export'"
      :export-format="modalData.exportFormat || 'pdf'"
      :export-scope="modalData.exportScope || 'filtered'"
      :filtered-count="sortedVehicles.length"
      :selected-count="selectedIds.size"
      :total-count="total"
      @update:export-format="(v) => (modalData.exportFormat = v)"
      @update:export-scope="(v) => (modalData.exportScope = v)"
      @close="closeModal"
      @confirm="executeExport"
    />

    <!-- Transaction Modal -->
    <AdminProductosTransactionModal
      :show="activeModal === 'transaction'"
      :vehicle="modalData.vehicle || null"
      :transaction-type="modalData.transactionType || 'rent'"
      :rent-from="modalData.rentFrom || ''"
      :rent-to="modalData.rentTo || ''"
      :rent-client="modalData.rentClient || ''"
      :rent-amount="modalData.rentAmount || ''"
      :sell-date="modalData.sellDate || ''"
      :sell-buyer="modalData.sellBuyer || ''"
      :sell-price="modalData.sellPrice || ''"
      @update:transaction-type="(v) => (modalData.transactionType = v)"
      @update:rent-from="(v) => (modalData.rentFrom = v)"
      @update:rent-to="(v) => (modalData.rentTo = v)"
      @update:rent-client="(v) => (modalData.rentClient = v)"
      @update:rent-amount="(v) => (modalData.rentAmount = v)"
      @update:sell-date="(v) => (modalData.sellDate = v)"
      @update:sell-buyer="(v) => (modalData.sellBuyer = v)"
      @update:sell-price="(v) => (modalData.sellPrice = v)"
      @close="closeModal"
      @confirm="executeTransaction"
    />

    <!-- Config Modal -->
    <AdminProductosConfigModal
      :show="activeModal === 'config'"
      :column-groups="columnGroups"
      :column-order="columnOrder"
      :all-columns="allColumns"
      :available-columns-for-groups="availableColumnsForGroups"
      :dragged-column="draggedColumn"
      @update:column-groups="(v) => (columnGroups = v)"
      @update:column-order="(v) => (columnOrder = v)"
      @drag-start="onDragStart"
      @drag-over="onDragOver"
      @drag-end="onDragEnd"
      @create-group="createGroup"
      @delete-group="deleteGroup"
      @reset-config="resetConfig"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
/* Base Layout */
.productos-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.productos-page.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #f8fafc;
  padding: 20px;
  overflow: auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Error */
.alert-error {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state span {
  color: #64748b;
  font-size: 16px;
}
</style>
