<script setup lang="ts">
import {
  useAdminVehicles,
  type AdminVehicle,
  type AdminVehicleFilters,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  vehicles,
  loading,
  error,
  total,
  fetchVehicles,
  deleteVehicle,
  updateStatus,
} = useAdminVehicles()

const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()

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

// ============================================
// COLUMN CONFIGURATION
// ============================================
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

const allColumns: ColumnDef[] = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'image', label: 'Img', width: '56px' },
  { key: 'type', label: 'Tipo', width: '60px' },
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

const defaultColumnGroups: ColumnGroup[] = [
  { id: 'base', name: 'Base', icon: '📋', columns: ['checkbox', 'image', 'type', 'brand', 'model', 'subcategory', 'typeName', 'year', 'price', 'category', 'status', 'actions'], active: true, required: true },
  { id: 'docs', name: 'Docs', icon: '📄', columns: ['plate', 'location'], active: false },
  { id: 'tecnico', name: 'Técnico', icon: '🔧', columns: ['description'], active: false },
  { id: 'cuentas', name: 'Cuentas', icon: '💰', columns: ['minPrice', 'cost'], active: false },
  { id: 'alquiler', name: 'Alquiler', icon: '📅', columns: ['rentalPrice'], active: false },
]

const STORAGE_KEY = 'tank-admin-productos-config-v3'

const columnGroups = ref<ColumnGroup[]>(defaultColumnGroups.map(g => ({ ...g, columns: [...g.columns] })))
const columnOrder = ref<string[]>(allColumns.map(c => c.key))

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
  }
  catch { /* use defaults */ }
}

function saveConfig() {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    groups: columnGroups.value,
    order: columnOrder.value,
  }))
}

onMounted(() => {
  loadConfig()
})

function toggleGroup(groupId: string) {
  const group = columnGroups.value.find(g => g.id === groupId)
  if (group && !group.required) {
    group.active = !group.active
    saveConfig()
  }
}

function isGroupActive(groupId: string): boolean {
  return columnGroups.value.find(g => g.id === groupId)?.active || false
}

// Visible columns based on active groups
const _visibleColumns = computed(() => {
  const _activeGroupIds = columnGroups.value.filter(g => g.active).map(g => g.id)
  const visibleKeys = new Set<string>()

  columnGroups.value
    .filter(g => g.active || g.required)
    .forEach(g => g.columns.forEach(c => visibleKeys.add(c)))

  // Return columns in order
  return columnOrder.value
    .filter(key => visibleKeys.has(key))
    .map(key => allColumns.find(c => c.key === key)!)
    .filter(Boolean)
})

// ============================================
// SORTING
// ============================================
type SortField = 'brand' | 'model' | 'year' | 'price' | 'status' | 'created_at'
type SortOrder = 'asc' | 'desc'
const sortField = ref<SortField>('created_at')
const sortOrder = ref<SortOrder>('desc')

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return '⇅'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

function isSortActive(field: string): boolean {
  return sortField.value === field
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

// ============================================
// VIEW STATE
// ============================================
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  document.body.style.overflow = isFullscreen.value ? 'hidden' : ''
}

// ============================================
// SELECTION
// ============================================
const selectedIds = ref<Set<string>>(new Set())

const selectAll = computed({
  get: () => sortedVehicles.value.length > 0 && sortedVehicles.value.every(v => selectedIds.value.has(v.id)),
  set: (val: boolean) => {
    if (val) {
      sortedVehicles.value.forEach(v => selectedIds.value.add(v.id))
    }
    else {
      selectedIds.value.clear()
    }
    selectedIds.value = new Set(selectedIds.value)
  },
})

function toggleSelection(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  }
  else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

// ============================================
// MODALS
// ============================================
const activeModal = ref<'delete' | 'export' | 'transaction' | 'config' | null>(null)
const configTab = ref<'grupos' | 'ordenar'>('grupos')

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
  configTab.value = 'grupos'
  activeModal.value = 'config'
}

function closeModal() {
  activeModal.value = null
  modalData.value = {}
}

// Editing group in config modal
const editingGroup = ref<ColumnGroup | null>(null)
const newGroupName = ref('')
const newGroupColumns = ref<string[]>([])

function startEditGroup(group: ColumnGroup) {
  editingGroup.value = { ...group, columns: [...group.columns] }
}

function cancelEditGroup() {
  editingGroup.value = null
}

function saveEditGroup() {
  if (!editingGroup.value) return
  const idx = columnGroups.value.findIndex(g => g.id === editingGroup.value!.id)
  if (idx >= 0) {
    columnGroups.value[idx] = { ...editingGroup.value }
    saveConfig()
  }
  editingGroup.value = null
}

function toggleColumnInEdit(colKey: string) {
  if (!editingGroup.value) return
  const idx = editingGroup.value.columns.indexOf(colKey)
  if (idx >= 0) {
    editingGroup.value.columns.splice(idx, 1)
  }
  else {
    editingGroup.value.columns.push(colKey)
  }
}

function createGroup() {
  if (!newGroupName.value.trim() || newGroupColumns.value.length === 0) return
  const newGroup: ColumnGroup = {
    id: `custom_${Date.now()}`,
    name: newGroupName.value.trim(),
    icon: '📁',
    columns: [...newGroupColumns.value],
    active: false,
  }
  columnGroups.value.push(newGroup)
  newGroupName.value = ''
  newGroupColumns.value = []
  saveConfig()
}

function deleteGroup(groupId: string) {
  const group = columnGroups.value.find(g => g.id === groupId)
  if (group?.required) return
  columnGroups.value = columnGroups.value.filter(g => g.id !== groupId)
  saveConfig()
}

function resetConfig() {
  columnGroups.value = defaultColumnGroups.map(g => ({ ...g, columns: [...g.columns] }))
  columnOrder.value = allColumns.map(c => c.key)
  saveConfig()
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

// ============================================
// OPTIONS
// ============================================
const statusOptions = [
  { value: null, label: 'Todos' },
  { value: 'published', label: 'Publicado' },
  { value: 'draft', label: 'Oculto' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'maintenance', label: 'Taller' },
  { value: 'sold', label: 'Vendido' },
]

const categoryOptions = [
  { value: null, label: 'Todas' },
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'terceros', label: 'Terceros' },
]

// ============================================
// DATA LOADING
// ============================================
onMounted(async () => {
  await Promise.all([fetchSubcategories(), fetchTypes(), fetchTypeSubcategoryLinks(), loadVehicles()])
})

watch([filters, onlineFilter], () => loadVehicles(), { deep: true })

// When subcategory filter changes, reset type_id if not in filtered types
watch(() => filters.value.subcategory_id, () => {
  if (filters.value.subcategory_id && filters.value.type_id) {
    if (!filteredTypes.value.some(t => t.id === filters.value.type_id)) {
      filters.value.type_id = null
    }
  }
})

async function loadVehicles() {
  let isOnline: boolean | null = null
  if (onlineFilter.value === 'online') isOnline = true
  if (onlineFilter.value === 'offline') isOnline = false
  await fetchVehicles({ ...filters.value, is_online: isOnline })
}

// ============================================
// ACTIONS
// ============================================
async function executeDelete() {
  if (!modalData.value.vehicle || modalData.value.confirmText?.toLowerCase() !== 'borrar') return
  const success = await deleteVehicle(modalData.value.vehicle.id)
  if (success) closeModal()
}

async function executeTransaction() {
  if (!modalData.value.vehicle) return

  if (modalData.value.transactionType === 'rent') {
    await updateStatus(modalData.value.vehicle.id, 'rented')
  }
  else {
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
  }
  else if (exportScope === 'selected') {
    dataToExport = sortedVehicles.value.filter(v => selectedIds.value.has(v.id))
  }
  else {
    dataToExport = sortedVehicles.value
  }

  if (dataToExport.length === 0) {
    alert('No hay vehículos para exportar')
    return
  }

  if (exportFormat === 'excel') {
    await exportToExcel(dataToExport)
  }
  else {
    await exportToPdf(dataToExport)
  }

  closeModal()
}

async function exportToExcel(data: AdminVehicle[]) {
  const XLSX = await import('xlsx')

  const rows = data.map(v => ({
    'Tipo': v.is_online ? 'Online' : 'Offline',
    'Marca': v.brand,
    'Modelo': v.model,
    'Tipo': getSubcategoryName(v.type_id),
    'Año': v.year,
    'Precio': v.price,
    'Categoría': v.category,
    'Estado': getStatusLabel(v.status),
    'Matrícula': v.plate || '-',
    'Ubicación': v.location || '-',
    'Precio Mín.': v.min_price || '-',
    'Coste': v.acquisition_cost || '-',
    'Precio Alquiler': v.rental_price || '-',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`)
}

async function exportToPdf(data: AdminVehicle[]) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF('l', 'mm', 'a4')
  doc.setFontSize(16)
  doc.text('Tank Iberica - Productos', 14, 15)
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} · ${data.length} productos`, 14, 22)

  const headers = ['Online', 'Marca', 'Modelo', 'Tipo', 'Año', 'Precio', 'Cat.', 'Estado']
  const rows = data.map(v => [
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

  // Header
  doc.setFillColor(35, 66, 74)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('Tank Iberica', 14, 20)
  doc.setFontSize(12)
  doc.text('Ficha de Producto', 14, 30)

  // Vehicle title
  doc.setTextColor(35, 66, 74)
  doc.setFontSize(20)
  doc.text(`${vehicle.brand} ${vehicle.model}`, 14, 55)

  if (vehicle.year) {
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(`Año: ${vehicle.year}`, 14, 63)
  }

  // Price box
  if (vehicle.price) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(pageWidth - 80, 45, 66, 25, 3, 3, 'F')
    doc.setTextColor(35, 66, 74)
    doc.setFontSize(16)
    doc.text(formatPrice(vehicle.price), pageWidth - 75, 60)
  }

  // Details section
  let yPos = 80
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  const details = [
    ['Categoría', vehicle.category?.toUpperCase() || '-'],
    ['Tipo', getSubcategoryName(vehicle.type_id)],
    ['Estado', getStatusLabel(vehicle.status)],
    ['Tipo', vehicle.is_online ? 'Online (Web)' : 'Offline (Intermediación)'],
  ]

  if (vehicle.location) details.push(['Ubicación', vehicle.location])
  if (vehicle.plate) details.push(['Matrícula', vehicle.plate])
  if (vehicle.rental_price) details.push(['Precio Alquiler', `${formatPrice(vehicle.rental_price)}/día`])

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

  // Description
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

  // Financial info (admin only section)
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

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} · Tank Iberica`, 14, 285)

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

// ============================================
// HELPERS
// ============================================
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
  return statusOptions.find(s => s.value === status)?.label || status
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
  return types.value.find(s => s.id === id)?.name_es || '-'
}

function getThumbnail(vehicle: AdminVehicle): string | null {
  const images = vehicle.vehicle_images as { url: string; position: number }[] | undefined
  if (!images?.length) return null
  return [...images].sort((a, b) => a.position - b.position)[0]?.url || null
}

function clearFilters() {
  filters.value = { status: null, category: null, type_id: null, subcategory_id: null, search: '', is_online: null }
  onlineFilter.value = 'all'
}

const hasActiveFilters = computed(() =>
  filters.value.status || filters.value.category || filters.value.type_id || filters.value.subcategory_id || filters.value.search || onlineFilter.value !== 'all',
)

// Junction data: type ↔ subcategory links
const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

async function fetchTypeSubcategoryLinks() {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('type_subcategories')
    .select('type_id, subcategory_id')
  typeSubcategoryLinks.value = (data as { type_id: string; subcategory_id: string }[]) || []
}

// Get subcategory name for a vehicle (via type → junction → subcategory)
function getSubcategoryForVehicle(typeId: string | null): string {
  if (!typeId) return '-'
  const link = typeSubcategoryLinks.value.find(l => l.type_id === typeId)
  if (!link) return '-'
  return subcategories.value.find(s => s.id === link.subcategory_id)?.name_es || '-'
}

// Types filtered by selected subcategory
const filteredTypes = computed(() => {
  if (!filters.value.subcategory_id) return types.value
  const linkedTypeIds = new Set(
    typeSubcategoryLinks.value
      .filter(l => l.subcategory_id === filters.value.subcategory_id)
      .map(l => l.type_id)
  )
  return types.value.filter(t => linkedTypeIds.has(t.id))
})

// Get available columns for group editing (exclude base columns)
const availableColumnsForGroups = computed(() =>
  allColumns.filter(c => !['checkbox', 'actions'].includes(c.key)),
)
</script>

<template>
  <div class="productos-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Productos</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <NuxtLink to="/admin/productos/nuevo" class="btn-primary">
        + Nuevo Producto
      </NuxtLink>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <!-- Row 1: Search + Filters -->
      <div class="toolbar-row">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar marca, modelo..."
          >
          <button v-if="filters.search" class="clear-btn" @click="filters.search = ''">×</button>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo:</label>
          <div class="segment-control">
            <button
              v-for="opt in [{ value: 'all', label: 'Todos' }, { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]"
              :key="opt.value"
              :class="{ active: onlineFilter === opt.value }"
              @click="onlineFilter = opt.value as OnlineFilter"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Categoría:</label>
          <select v-model="filters.category">
            <option v-for="opt in categoryOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Estado:</label>
          <select v-model="filters.status">
            <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Subcat.:</label>
          <select v-model="filters.subcategory_id">
            <option :value="null">Todas</option>
            <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
              {{ sub.name_es }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo:</label>
          <select v-model="filters.type_id">
            <option :value="null">Todos</option>
            <option v-for="t in filteredTypes" :key="t.id" :value="t.id">
              {{ t.name_es }}
            </option>
          </select>
        </div>

        <button v-if="hasActiveFilters" class="btn-text-danger" @click="clearFilters">
          ✕ Limpiar
        </button>
      </div>

      <!-- Row 2: Column groups + Actions -->
      <div class="toolbar-row toolbar-row-secondary">
        <div class="column-toggles">
          <span class="toggles-label">Columnas:</span>
          <button
            v-for="group in columnGroups.filter(g => !g.required)"
            :key="group.id"
            class="column-toggle"
            :class="{ active: group.active }"
            @click="toggleGroup(group.id)"
          >
            {{ group.name }}
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="btn-tool" title="Configurar tabla" @click="openConfigModal">
            ⚙️ Configurar
          </button>
          <button class="btn-tool" title="Exportar" @click="openExportModal">
            📥 Exportar
            <span v-if="selectedIds.size > 0" class="badge">{{ selectedIds.size }}</span>
          </button>
          <button class="btn-tool" :title="isFullscreen ? 'Salir' : 'Pantalla completa'" @click="toggleFullscreen">
            {{ isFullscreen ? '✕' : '⛶' }}
          </button>
        </div>
      </div>
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
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input v-model="selectAll" type="checkbox" title="Seleccionar todos">
            </th>
            <th class="col-img">
              Img
            </th>
            <th class="col-type">
              Tipo
            </th>
            <th class="sortable" @click="toggleSort('brand')">
              Marca <span class="sort-icon" :class="{ active: isSortActive('brand') }">{{ getSortIcon('brand') }}</span>
            </th>
            <th class="sortable" @click="toggleSort('model')">
              Modelo <span class="sort-icon" :class="{ active: isSortActive('model') }">{{ getSortIcon('model') }}</span>
            </th>
            <th>Subcat.</th>
            <th>Tipo</th>
            <th class="sortable col-num" @click="toggleSort('year')">
              Año <span class="sort-icon" :class="{ active: isSortActive('year') }">{{ getSortIcon('year') }}</span>
            </th>
            <th class="sortable col-num" @click="toggleSort('price')">
              Precio <span class="sort-icon" :class="{ active: isSortActive('price') }">{{ getSortIcon('price') }}</span>
            </th>
            <!-- Optional columns -->
            <th v-if="isGroupActive('docs')">
              Matrícula
            </th>
            <th v-if="isGroupActive('docs')">
              Ubicación
            </th>
            <th v-if="isGroupActive('tecnico')">
              Descripción
            </th>
            <th v-if="isGroupActive('cuentas')" class="col-num">
              P. Mín.
            </th>
            <th v-if="isGroupActive('cuentas')" class="col-num">
              Coste
            </th>
            <th v-if="isGroupActive('alquiler')" class="col-num">
              P. Alq.
            </th>
            <th>Cat.</th>
            <th class="sortable" @click="toggleSort('status')">
              Estado <span class="sort-icon" :class="{ active: isSortActive('status') }">{{ getSortIcon('status') }}</span>
            </th>
            <th class="col-actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in sortedVehicles" :key="v.id" :class="{ selected: selectedIds.has(v.id) }">
            <td class="col-checkbox">
              <input type="checkbox" :checked="selectedIds.has(v.id)" @change="toggleSelection(v.id)">
            </td>
            <td class="col-img">
              <div class="thumb">
                <img v-if="getThumbnail(v)" :src="getThumbnail(v)!" :alt="v.brand">
                <span v-else class="thumb-empty">📷</span>
              </div>
            </td>
            <td class="col-type">
              <span class="type-pill" :class="v.is_online ? 'online' : 'offline'">
                {{ v.is_online ? 'ON' : 'OFF' }}
              </span>
            </td>
            <td>
              <NuxtLink :to="`/admin/productos/${v.id}`" class="vehicle-link">
                <strong>{{ v.brand }}</strong>
              </NuxtLink>
              <span v-if="!v.is_online && v.owner_name" class="owner-tag">👤 {{ v.owner_name }}</span>
            </td>
            <td class="text-muted">
              {{ v.model }}
            </td>
            <td class="text-small">
              {{ getSubcategoryForVehicle(v.type_id) }}
            </td>
            <td class="text-small">
              {{ getSubcategoryName(v.type_id) }}
            </td>
            <td class="col-num">
              {{ v.year || '-' }}
            </td>
            <td class="col-num">
              <strong>{{ formatPrice(v.price) }}</strong>
            </td>
            <!-- Optional columns -->
            <td v-if="isGroupActive('docs')">
              {{ v.plate || '-' }}
            </td>
            <td v-if="isGroupActive('docs')" class="text-small">
              {{ v.location || '-' }}
            </td>
            <td v-if="isGroupActive('tecnico')" class="col-desc">
              <span class="truncate">{{ v.description_es || '-' }}</span>
            </td>
            <td v-if="isGroupActive('cuentas')" class="col-num text-muted">
              {{ formatPrice(v.min_price) }}
            </td>
            <td v-if="isGroupActive('cuentas')" class="col-num text-muted">
              {{ formatPrice(v.acquisition_cost) }}
            </td>
            <td v-if="isGroupActive('alquiler')" class="col-num">
              {{ formatPrice(v.rental_price) }}
            </td>
            <td>
              <span class="cat-pill" :class="getCategoryClass(v.category)">{{ v.category }}</span>
            </td>
            <td>
              <select
                :value="v.status"
                class="status-select"
                :class="getStatusClass(v.status)"
                @change="handleStatusChange(v, ($event.target as HTMLSelectElement).value)"
              >
                <option value="published">Publicado</option>
                <option value="draft">Oculto</option>
                <option value="rented">Alquilado</option>
                <option value="maintenance">Taller</option>
                <option value="sold">Vendido</option>
              </select>
            </td>
            <td class="col-actions">
              <div class="row-actions">
                <NuxtLink :to="`/admin/productos/${v.id}`" class="action-btn" title="Editar">✏️</NuxtLink>
                <button class="action-btn" title="Exportar ficha" @click="exportVehicleFicha(v)">📄</button>
                <button
                  class="action-btn"
                  :title="v.category === 'alquiler' ? 'Alquilar' : 'Vender'"
                  @click="openTransactionModal(v, v.category === 'alquiler' ? 'rent' : 'sell')"
                >
                  💰
                </button>
                <button class="action-btn delete" title="Eliminar" @click="openDeleteModal(v)">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="sortedVehicles.length === 0">
            <td :colspan="11 + (isGroupActive('docs') ? 2 : 0) + (isGroupActive('tecnico') ? 1 : 0) + (isGroupActive('cuentas') ? 2 : 0) + (isGroupActive('alquiler') ? 1 : 0)" class="empty-cell">
              <div class="empty-state">
                <span class="empty-icon">📦</span>
                <p>No hay productos que coincidan con los filtros</p>
                <button v-if="hasActiveFilters" class="btn-secondary" @click="clearFilters">Limpiar filtros</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'delete'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-sm">
          <div class="modal-header danger">
            <h3>Eliminar producto</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <p>¿Eliminar <strong>{{ modalData.vehicle?.brand }} {{ modalData.vehicle?.model }}</strong>?</p>
            <p class="text-danger">Se eliminarán también las imágenes. Esta acción no se puede deshacer.</p>
            <div class="form-group">
              <label>Escribe <strong>borrar</strong> para confirmar:</label>
              <input v-model="modalData.confirmText" type="text" placeholder="borrar" autocomplete="off">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button class="btn-danger" :disabled="modalData.confirmText?.toLowerCase() !== 'borrar'" @click="executeDelete">Eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Export Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'export'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3>Exportar productos</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Formato</label>
              <div class="option-buttons">
                <button :class="{ active: modalData.exportFormat === 'pdf' }" @click="modalData.exportFormat = 'pdf'">📄 PDF</button>
                <button :class="{ active: modalData.exportFormat === 'excel' }" @click="modalData.exportFormat = 'excel'">📊 Excel</button>
              </div>
            </div>
            <div class="form-group">
              <label>Productos</label>
              <div class="option-buttons vertical">
                <button :class="{ active: modalData.exportScope === 'filtered' }" @click="modalData.exportScope = 'filtered'">
                  Filtrados ({{ sortedVehicles.length }})
                </button>
                <button v-if="selectedIds.size > 0" :class="{ active: modalData.exportScope === 'selected' }" @click="modalData.exportScope = 'selected'">
                  Seleccionados ({{ selectedIds.size }})
                </button>
                <button :class="{ active: modalData.exportScope === 'all' }" @click="modalData.exportScope = 'all'">
                  Todos ({{ total }})
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button class="btn-primary" @click="executeExport">Exportar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Transaction Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'transaction'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-md">
          <div class="modal-header">
            <h3>{{ modalData.transactionType === 'rent' ? 'Registrar alquiler' : 'Registrar venta' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="vehicle-badge">
              <strong>{{ modalData.vehicle?.brand }} {{ modalData.vehicle?.model }}</strong>
              <span>{{ modalData.vehicle?.year }}</span>
            </div>

            <div class="tab-buttons">
              <button :class="{ active: modalData.transactionType === 'rent' }" @click="modalData.transactionType = 'rent'">🔑 Alquilar</button>
              <button :class="{ active: modalData.transactionType === 'sell' }" @click="modalData.transactionType = 'sell'">💰 Vender</button>
            </div>

            <div v-if="modalData.transactionType === 'rent'" class="form-grid">
              <div class="form-group half">
                <label>Fecha desde</label>
                <input v-model="modalData.rentFrom" type="date">
              </div>
              <div class="form-group half">
                <label>Fecha hasta</label>
                <input v-model="modalData.rentTo" type="date">
              </div>
              <div class="form-group">
                <label>Cliente</label>
                <input v-model="modalData.rentClient" type="text" placeholder="Nombre del cliente">
              </div>
              <div class="form-group">
                <label>Importe (€)</label>
                <input v-model="modalData.rentAmount" type="number" step="0.01" placeholder="0.00">
              </div>
            </div>

            <div v-else class="form-grid">
              <div class="form-group">
                <label>Fecha de venta</label>
                <input v-model="modalData.sellDate" type="date">
              </div>
              <div class="form-group">
                <label>Comprador</label>
                <input v-model="modalData.sellBuyer" type="text" placeholder="Nombre del comprador">
              </div>
              <div class="form-group">
                <label>Precio de venta (€)</label>
                <input v-model="modalData.sellPrice" type="number" step="0.01">
              </div>
              <div class="info-warning">⚠️ Esto marcará el vehículo como vendido y lo moverá al histórico.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button class="btn-primary" @click="executeTransaction">{{ modalData.transactionType === 'rent' ? 'Registrar alquiler' : 'Registrar venta' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Config Modal -->
    <Teleport to="body">
      <div v-if="activeModal === 'config'" class="modal-overlay" @click.self="closeModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3>⚙️ Configurar tabla</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body config-body">
            <!-- Tabs -->
            <div class="config-tabs">
              <button :class="{ active: configTab === 'grupos' }" @click="configTab = 'grupos'">
                📁 Grupos de columnas
              </button>
              <button :class="{ active: configTab === 'ordenar' }" @click="configTab = 'ordenar'">
                📊 Ordenar tabla
              </button>
            </div>

            <!-- Groups Tab -->
            <div v-if="configTab === 'grupos'" class="config-section">
              <!-- Editing a group -->
              <div v-if="editingGroup" class="edit-group-panel">
                <h4>Editando: {{ editingGroup.name }}</h4>
                <div class="form-group">
                  <label>Nombre del grupo</label>
                  <input v-model="editingGroup.name" type="text" :disabled="editingGroup.required">
                </div>
                <div class="form-group">
                  <label>Columnas incluidas</label>
                  <div class="columns-grid">
                    <label v-for="col in availableColumnsForGroups" :key="col.key" class="column-checkbox">
                      <input type="checkbox" :checked="editingGroup.columns.includes(col.key)" @change="toggleColumnInEdit(col.key)">
                      {{ col.label }}
                    </label>
                  </div>
                </div>
                <div class="edit-group-actions">
                  <button class="btn-secondary" @click="cancelEditGroup">Cancelar</button>
                  <button class="btn-primary" @click="saveEditGroup">Guardar</button>
                </div>
              </div>

              <!-- Groups list -->
              <div v-else>
                <div class="groups-list">
                  <div v-for="group in columnGroups" :key="group.id" class="group-item" :class="{ required: group.required }">
                    <div class="group-info">
                      <span class="group-icon">{{ group.icon }}</span>
                      <span class="group-name">{{ group.name }}</span>
                      <span class="group-count">{{ group.columns.length }} col.</span>
                      <span v-if="group.required" class="tag tag-gray">Obligatorio</span>
                    </div>
                    <div class="group-actions">
                      <button class="btn-sm" @click="startEditGroup(group)">✏️</button>
                      <button v-if="!group.required" class="btn-sm btn-danger-sm" @click="deleteGroup(group.id)">🗑️</button>
                    </div>
                  </div>
                </div>

                <!-- Create new group -->
                <div class="new-group-form">
                  <h4>Crear nuevo grupo</h4>
                  <div class="form-row">
                    <input v-model="newGroupName" type="text" placeholder="Nombre del grupo">
                  </div>
                  <div class="form-group">
                    <label>Columnas</label>
                    <div class="columns-grid">
                      <label v-for="col in availableColumnsForGroups" :key="col.key" class="column-checkbox">
                        <input v-model="newGroupColumns" type="checkbox" :value="col.key">
                        {{ col.label }}
                      </label>
                    </div>
                  </div>
                  <button class="btn-primary" :disabled="!newGroupName.trim() || newGroupColumns.length === 0" @click="createGroup">
                    + Crear grupo
                  </button>
                </div>
              </div>
            </div>

            <!-- Ordenar Tab -->
            <div v-if="configTab === 'ordenar'" class="config-section">
              <p class="hint">Arrastra las columnas para cambiar su orden en la tabla.</p>
              <div class="sortable-list">
                <div
                  v-for="key in columnOrder"
                  :key="key"
                  class="sortable-item"
                  :class="{ dragging: draggedColumn === key }"
                  draggable="true"
                  @dragstart="onDragStart(key)"
                  @dragover="(e) => onDragOver(e, key)"
                  @dragend="onDragEnd"
                >
                  <span class="drag-handle">⋮⋮</span>
                  <span class="col-name">{{ allColumns.find(c => c.key === key)?.label || key }}</span>
                  <span v-if="allColumns.find(c => c.key === key)?.sortable" class="tag tag-blue">Ordenable</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-danger-outline" @click="resetConfig">Restaurar valores</button>
            <button class="btn-primary" @click="closeModal">Cerrar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
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

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  background: var(--color-primary, #23424A);
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.toolbar-row-secondary {
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* Search */
.search-box {
  position: relative;
  width: 280px;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

/* Filters */
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.filter-group select {
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
}

.segment-control {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.segment-control button {
  padding: 7px 12px;
  border: none;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.segment-control button:not(:last-child) {
  border-right: 1px solid #e2e8f0;
}

.segment-control button.active {
  background: var(--color-primary, #23424A);
  color: white;
}

.segment-control button:hover:not(.active) {
  background: #f8fafc;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 7px 12px;
  border-radius: 6px;
}

.btn-text-danger:hover {
  background: #fef2f2;
}

/* Column toggles */
.column-toggles {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toggles-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.column-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
}

.column-toggle:hover {
  background: #f8fafc;
}

.column-toggle.active {
  background: #f0f9ff;
  border-color: #0ea5e9;
  color: #0369a1;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.btn-tool {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s;
  position: relative;
}

.btn-tool:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-tool .badge {
  background: var(--color-primary, #23424A);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

/* ============================================
   TABLE
   ============================================ */
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
  border-top-color: var(--color-primary, #23424A);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
}

.data-table tr:hover {
  background: #f8fafc;
}

.data-table tr.selected {
  background: #eff6ff;
}

.col-checkbox { width: 40px; text-align: center; }
.col-img { width: 56px; }
.col-type { width: 60px; }
.col-num { text-align: right; font-variant-numeric: tabular-nums; }
.col-desc { max-width: 140px; }
.col-actions { width: 110px; }

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: #f1f5f9;
}

.sort-icon {
  margin-left: 4px;
  opacity: 0.3;
  font-size: 0.75rem;
}

.sort-icon.active {
  opacity: 1;
  color: var(--color-primary, #23424A);
}

/* Cell styles */
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-empty {
  font-size: 18px;
  opacity: 0.4;
}

.type-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.type-pill.online {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-pill.offline {
  background: #fef3c7;
  color: #92400e;
}

.vehicle-link {
  color: #1e293b;
  text-decoration: none;
}

.vehicle-link:hover {
  color: var(--color-primary, #23424A);
  text-decoration: underline;
}

.owner-tag {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}

.text-muted { color: #64748b; }
.text-small { font-size: 0.8rem; }

.truncate {
  display: block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.cat-venta { background: #dbeafe; color: #1d4ed8; }
.cat-alquiler { background: #fef3c7; color: #92400e; }
.cat-terceros { background: #f3e8ff; color: #7c3aed; }

.status-select {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
}

.status-select.status-published { background: #dcfce7; color: #16a34a; }
.status-select.status-draft { background: #f1f5f9; color: #64748b; }
.status-select.status-rented { background: #dbeafe; color: #1d4ed8; }
.status-select.status-maintenance { background: #fee2e2; color: #dc2626; }
.status-select.status-sold { background: #e2e8f0; color: #475569; }

.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #f8fafc;
}

.action-btn.delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 16px 0;
}

/* ============================================
   MODALS
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-sm { max-width: 420px; }
.modal-md { max-width: 520px; }
.modal-lg { max-width: 700px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header.danger {
  background: #fef2f2;
  border-color: #fecaca;
}

.modal-header.danger h3 {
  color: #dc2626;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

/* Buttons */
.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-outline {
  background: white;
  color: #dc2626;
  border: 1px solid #dc2626;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

/* Form elements */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group.half {
  display: inline-block;
  width: calc(50% - 8px);
  margin-right: 16px;
}

.form-group.half:last-child {
  margin-right: 0;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.text-danger {
  color: #dc2626;
  font-size: 0.875rem;
}

.info-warning {
  padding: 12px 16px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 0.875rem;
}

/* Option buttons */
.option-buttons {
  display: flex;
  gap: 8px;
}

.option-buttons.vertical {
  flex-direction: column;
}

.option-buttons button {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s;
}

.option-buttons button:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.option-buttons button.active {
  border-color: var(--color-primary, #23424A);
  background: rgba(35, 66, 74, 0.05);
  color: var(--color-primary, #23424A);
}

/* Tab buttons */
.tab-buttons {
  display: flex;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.tab-buttons button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
}

.tab-buttons button.active {
  background: var(--color-primary, #23424A);
  color: white;
}

.tab-buttons button:not(.active):hover {
  background: #f8fafc;
}

.vehicle-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 16px;
}

.vehicle-badge strong {
  font-size: 1rem;
}

.vehicle-badge span {
  color: #64748b;
}

/* ============================================
   CONFIG MODAL
   ============================================ */
.config-body {
  padding: 0;
}

.config-tabs {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
}

.config-tabs button {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.config-tabs button.active {
  color: var(--color-primary, #23424A);
  border-bottom-color: var(--color-primary, #23424A);
}

.config-tabs button:hover:not(.active) {
  background: #f8fafc;
}

.config-section {
  padding: 24px;
}

.hint {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

/* Groups list */
.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.group-item.required {
  background: #f8fafc;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  font-size: 16px;
}

.group-name {
  font-weight: 600;
  color: #334155;
}

.group-count {
  font-size: 0.8rem;
  color: #94a3b8;
}

.tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.tag-gray {
  background: #e2e8f0;
  color: #64748b;
}

.tag-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.group-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.btn-sm:hover {
  background: #f8fafc;
}

.btn-danger-sm:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* Edit group panel */
.edit-group-panel {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.edit-group-panel h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #334155;
}

.edit-group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.column-checkbox:hover {
  background: #f8fafc;
}

.column-checkbox:has(input:checked) {
  background: var(--color-primary, #23424A);
  color: white;
  border-color: var(--color-primary, #23424A);
}

/* New group form */
.new-group-form {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.new-group-form h4 {
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #64748b;
}

/* Sortable list */
.sortable-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sortable-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.15s;
}

.sortable-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sortable-item.dragging {
  opacity: 0.5;
  background: #dbeafe;
}

.drag-handle {
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: -2px;
}

.col-name {
  flex: 1;
  font-weight: 500;
  color: #334155;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-group select {
    flex: 1;
  }

  .toolbar-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .column-toggles {
    flex-wrap: wrap;
  }

  .columns-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-group.half {
    width: 100%;
    margin-right: 0;
  }

  .modal {
    margin: 10px;
  }
}
</style>
