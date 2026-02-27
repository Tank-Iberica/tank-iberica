/**
 * Composable for the "Nuevo Producto" page.
 * Thin wrapper over useAdminProductForm that adds page-specific
 * bridge handlers for the financial section emits.
 */
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'
import { useAdminProductForm } from '~/composables/admin/useAdminProductForm'

export type { MaintenanceEntry, RentalEntry }
export type {
  CharacteristicEntry,
  PendingImage,
  SectionState,
} from '~/composables/admin/useAdminProductForm'

export function useAdminProductoNuevo() {
  const form = useAdminProductForm()

  // ── Financial bridge handlers ─────────────────────────
  function onUpdateMinPrice(val: number | null) {
    form.formData.value.min_price = val
  }

  function onUpdateAcquisitionCost(val: number | null) {
    form.formData.value.acquisition_cost = val
  }

  function onUpdateAcquisitionDate(val: string | null) {
    form.formData.value.acquisition_date = val
  }

  function onUpdateMaint(id: string, field: keyof MaintenanceEntry, val: string | number) {
    form.updateMaint(id, field, val)
  }

  function onUpdateRental(id: string, field: keyof RentalEntry, val: string | number) {
    form.updateRental(id, field, val)
  }

  return {
    ...form,

    // Bridge handlers
    onUpdateMinPrice,
    onUpdateAcquisitionCost,
    onUpdateAcquisitionDate,
    onUpdateMaint,
    onUpdateRental,
  }
}
