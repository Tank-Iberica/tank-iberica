/**
 * Admin Productos Columns Composable
 * Manages column configuration, groups, ordering, and drag-and-drop.
 * Extracted from useAdminProductosPage.ts (Auditoría #7 Iter. 15)
 */
import type { AdminFilter } from '~/composables/admin/useAdminFilters'

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface ColumnDef {
  key: string
  label: string
  width?: string
  sortable?: boolean
  group?: string
}

export interface ColumnGroup {
  id: string
  name: string
  icon: string
  columns: string[]
  active: boolean
  required?: boolean
}

// -------------------------------------------------------------------------
// Static data
// -------------------------------------------------------------------------

export const STATIC_COLUMNS: ColumnDef[] = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'image', label: 'Img', width: '56px' },
  { key: 'type', label: 'Online', width: '60px' },
  { key: 'brand', label: 'Marca', sortable: true },
  { key: 'model', label: 'Modelo', sortable: true },
  { key: 'subcategory', label: 'Subcat.' },
  { key: 'typeName', label: 'Tipo' },
  { key: 'year', label: 'A\u00F1o', width: '70px', sortable: true },
  { key: 'price', label: 'Precio', width: '100px', sortable: true },
  { key: 'plate', label: 'Matr\u00EDcula', width: '100px', group: 'docs' },
  { key: 'location', label: 'Ubicaci\u00F3n', width: '120px', group: 'docs' },
  { key: 'description', label: 'Descripci\u00F3n', width: '150px', group: 'tecnico' },
  { key: 'minPrice', label: 'P. M\u00EDnimo', width: '100px', group: 'cuentas' },
  { key: 'cost', label: 'Coste', width: '100px', group: 'cuentas' },
  { key: 'rentalPrice', label: 'P. Alquiler', width: '100px', group: 'alquiler' },
  { key: 'category', label: 'Cat.', width: '80px' },
  { key: 'status', label: 'Estado', width: '110px', sortable: true },
  { key: 'actions', label: 'Acciones', width: '110px' },
]

const DEFAULT_COLUMN_GROUPS: ColumnGroup[] = [
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
  { id: 'tecnico', name: 'T\u00E9cnico', icon: '🔧', columns: ['description'], active: false },
  { id: 'cuentas', name: 'Cuentas', icon: '💰', columns: ['minPrice', 'cost'], active: false },
  { id: 'alquiler', name: 'Alquiler', icon: '📅', columns: ['rentalPrice'], active: false },
  { id: 'filtros', name: 'Filtros', icon: '🔎', columns: [], active: false },
]

const STORAGE_KEY = 'tracciona-admin-productos-config-v4'

// -------------------------------------------------------------------------
// Composable
// -------------------------------------------------------------------------

export function useAdminProductosColumns(adminFilterDefs: {
  readonly value: readonly AdminFilter[]
}) {
  // --- Derived column definitions ----------------------------------------

  const dynamicFilterColumns = computed<ColumnDef[]>(() => {
    return adminFilterDefs.value
      .filter((f) => f.status !== 'archived')
      .map((f) => ({
        key: `filter_${f.name}`,
        label: f.label_es || f.name,
        group: 'filtros',
      }))
  })

  const allColumns = computed<ColumnDef[]>(() => {
    return [...STATIC_COLUMNS, ...dynamicFilterColumns.value]
  })

  const activeFilterColumns = computed(() => {
    return adminFilterDefs.value
      .filter((f) => f.status !== 'archived')
      .map((f) => ({
        key: `filter_${f.name}`,
        filterName: f.name,
        label: f.label_es || f.name,
        unit: f.unit ?? undefined,
      }))
  })

  const availableColumnsForGroups = computed(() =>
    allColumns.value.filter((c) => !['checkbox', 'actions'].includes(c.key)),
  )

  // --- State -------------------------------------------------------------

  const columnGroups = ref<ColumnGroup[]>(
    DEFAULT_COLUMN_GROUPS.map((g) => ({ ...g, columns: [...g.columns] })),
  )
  const columnOrder = ref<string[]>(STATIC_COLUMNS.map((c) => c.key))

  // --- Persistence -------------------------------------------------------

  function loadConfig() {
    if (!import.meta.client) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.groups && Array.isArray(parsed.groups)) columnGroups.value = parsed.groups
        if (parsed.order && Array.isArray(parsed.order)) columnOrder.value = parsed.order
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
        JSON.stringify({ groups: columnGroups.value, order: columnOrder.value }),
      )
    } catch {
      // localStorage may be full or unavailable
    }
  }

  // --- Sync filter columns with dynamic filters --------------------------

  function syncFilterColumns() {
    const filterKeys = dynamicFilterColumns.value.map((c) => c.key)
    const filtrosGroup = columnGroups.value.find((g) => g.id === 'filtros')
    if (filtrosGroup) {
      for (const key of filterKeys) {
        if (!filtrosGroup.columns.includes(key)) filtrosGroup.columns.push(key)
      }
      filtrosGroup.columns = filtrosGroup.columns.filter(
        (c) => !c.startsWith('filter_') || filterKeys.includes(c),
      )
    }
    for (const key of filterKeys) {
      if (!columnOrder.value.includes(key)) {
        const actionsIdx = columnOrder.value.indexOf('actions')
        if (actionsIdx >= 0) columnOrder.value.splice(actionsIdx, 0, key)
        else columnOrder.value.push(key)
      }
    }
    columnOrder.value = columnOrder.value.filter(
      (k) => !k.startsWith('filter_') || filterKeys.includes(k),
    )
    saveConfig()
  }

  // --- Group management --------------------------------------------------

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
    columnGroups.value = DEFAULT_COLUMN_GROUPS.map((g) => ({ ...g, columns: [...g.columns] }))
    columnOrder.value = STATIC_COLUMNS.map((c) => c.key)
    syncFilterColumns()
  }

  // --- Drag & drop -------------------------------------------------------

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

  // --- Return ------------------------------------------------------------

  return {
    // State
    allColumns,
    activeFilterColumns,
    columnGroups,
    columnOrder,
    availableColumnsForGroups,
    draggedColumn,
    // Actions
    loadConfig,
    syncFilterColumns,
    toggleGroup,
    isGroupActive,
    createGroup,
    deleteGroup,
    resetConfig,
    onDragStart,
    onDragOver,
    onDragEnd,
  }
}
