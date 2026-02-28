/**
 * Admin Productos Sort Composable
 * Manages sort field, order, and sorted vehicle list.
 * Extracted from useAdminProductosPage.ts (Auditoría #7 Iter. 15)
 */
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

export type SortField = 'brand' | 'model' | 'year' | 'price' | 'status' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export function useAdminProductosSort(vehicles: { readonly value: readonly AdminVehicle[] }) {
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

  const sortedVehicles = computed((): AdminVehicle[] => {
    const list = [...vehicles.value] as AdminVehicle[]
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

  return { sortField, sortOrder, toggleSort, sortedVehicles }
}
