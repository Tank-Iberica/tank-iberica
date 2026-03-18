/**
 * useAdminProductRecords
 * Manages maintenance and rental record entries for the product form.
 * Extracted from useAdminProductForm for size reduction (#121).
 */
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'

interface RecordsFormData {
  maintenance_records?: MaintenanceEntry[]
  rental_records?: RentalEntry[]
}

/**
 * Composable for admin product records.
 *
 * @param formData
 */
export function useAdminProductRecords(formData: Ref<RecordsFormData>) {
  // ── Maintenance ─────────────────────────────────────────────
  function addMaint(): void {
    formData.value.maintenance_records = [
      ...(formData.value.maintenance_records || []),
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0] ?? '',
        reason: '',
        cost: 0,
        invoice_url: undefined,
      },
    ]
  }

  function removeMaint(id: string): void {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.filter((r) => r.id !== id) || []
  }

  function updateMaint(id: string, field: keyof MaintenanceEntry, val: string | number): void {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) ||
      []
  }

  // ── Rentals ─────────────────────────────────────────────────
  function addRental(): void {
    const today = new Date().toISOString().split('T')[0] ?? ''
    formData.value.rental_records = [
      ...(formData.value.rental_records || []),
      { id: crypto.randomUUID(), from_date: today, to_date: today, amount: 0, notes: '' },
    ]
  }

  function removeRental(id: string): void {
    formData.value.rental_records = formData.value.rental_records?.filter((r) => r.id !== id) || []
  }

  function updateRental(id: string, field: keyof RentalEntry, val: string | number): void {
    formData.value.rental_records =
      formData.value.rental_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) || []
  }

  return { addMaint, removeMaint, updateMaint, addRental, removeRental, updateRental }
}
