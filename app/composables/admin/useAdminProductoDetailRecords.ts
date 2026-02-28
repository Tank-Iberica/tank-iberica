/**
 * Admin Producto Detail — Records & Documents sub-composable
 * Handles: maintenance records, rental records, document uploads (Drive), financial totals.
 * Extracted from useAdminProductoDetail.ts (Auditoría #7 Iter. 15)
 */
import { useGoogleDrive } from '~/composables/admin/useGoogleDrive'
import type {
  VehicleFormData,
  MaintenanceEntry,
  RentalEntry,
  DocumentEntry,
} from '~/composables/admin/useAdminVehicles'
import type { FileNamingData } from '~/utils/fileNaming'

export function useAdminProductoDetailRecords(params: {
  formData: Ref<VehicleFormData>
  fileNamingData: ComputedRef<FileNamingData>
  documents: Ref<DocumentEntry[]>
}) {
  const { formData, fileNamingData, documents } = params

  const {
    connected: driveConnected,
    loading: driveLoading,
    error: driveError,
    connect: connectDrive,
    uploadDocument: driveUploadDocument,
    uploadInvoice: driveUploadInvoice,
    openDocumentsFolder,
    openVehicleFolder,
  } = useGoogleDrive()

  const driveSection = computed(() =>
    formData.value.is_online ? ('Vehiculos' as const) : ('Intermediacion' as const),
  )

  const docTypeToUpload = ref('ITV')
  const docTypeOptions = [
    'ITV',
    'Ficha-Tecnica',
    'Contrato',
    'Permiso-Circulacion',
    'Seguro',
    'Otro',
  ]

  // -------------------------------------------------------------------------
  // Document upload (Google Drive)
  // -------------------------------------------------------------------------

  async function handleDocUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    if (!driveConnected.value) {
      const ok = await connectDrive()
      if (!ok) {
        input.value = ''
        return
      }
    }

    const files = Array.from(input.files)
    for (const file of files) {
      try {
        const result = await driveUploadDocument(
          file,
          fileNamingData.value,
          docTypeToUpload.value,
          driveSection.value,
        )
        documents.value.push({
          id: crypto.randomUUID(),
          name: result.name,
          url: result.url,
          type: docTypeToUpload.value,
          uploaded_at: new Date().toISOString(),
        })
      } catch {
        // error is set in the composable
      }
    }
    input.value = ''
  }

  function removeDocument(id: string) {
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  // -------------------------------------------------------------------------
  // Maintenance invoice upload
  // -------------------------------------------------------------------------

  async function handleMaintInvoiceUpload(maintId: string, e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    if (!driveConnected.value) {
      const ok = await connectDrive()
      if (!ok) {
        input.value = ''
        return
      }
    }

    const file = input.files[0]!
    const maint = formData.value.maintenance_records?.find((r) => r.id === maintId)
    try {
      const result = await driveUploadInvoice(
        file,
        fileNamingData.value,
        'Mantenimiento',
        maint?.date,
        driveSection.value,
      )
      updateMaint(maintId, 'invoice_url' as keyof MaintenanceEntry, result.url)
    } catch {
      // error set in composable
    }
    input.value = ''
  }

  // -------------------------------------------------------------------------
  // Rental invoice upload
  // -------------------------------------------------------------------------

  async function handleRentalInvoiceUpload(rentalId: string, e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    if (!driveConnected.value) {
      const ok = await connectDrive()
      if (!ok) {
        input.value = ''
        return
      }
    }

    const file = input.files[0]!
    const rental = formData.value.rental_records?.find((r) => r.id === rentalId)
    try {
      const result = await driveUploadInvoice(
        file,
        fileNamingData.value,
        'Renta',
        rental?.from_date,
        driveSection.value,
      )
      updateRental(rentalId, 'invoice_url' as keyof RentalEntry, result.url)
    } catch {
      // error set in composable
    }
    input.value = ''
  }

  // -------------------------------------------------------------------------
  // Maintenance records
  // -------------------------------------------------------------------------

  function addMaint() {
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

  function removeMaint(id: string) {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.filter((r) => r.id !== id) || []
  }

  function updateMaint(id: string, field: keyof MaintenanceEntry, val: string | number) {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) ||
      []
  }

  const totalMaint = computed(() =>
    (formData.value.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0),
  )

  // -------------------------------------------------------------------------
  // Rental records
  // -------------------------------------------------------------------------

  function addRental() {
    const today = new Date().toISOString().split('T')[0] ?? ''
    formData.value.rental_records = [
      ...(formData.value.rental_records || []),
      {
        id: crypto.randomUUID(),
        from_date: today,
        to_date: today,
        amount: 0,
        notes: '',
      },
    ]
  }

  function removeRental(id: string) {
    formData.value.rental_records = formData.value.rental_records?.filter((r) => r.id !== id) || []
  }

  function updateRental(id: string, field: keyof RentalEntry, val: string | number) {
    formData.value.rental_records =
      formData.value.rental_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) || []
  }

  const totalRental = computed(() =>
    (formData.value.rental_records || []).reduce((s, r) => s + (r.amount || 0), 0),
  )

  // -------------------------------------------------------------------------
  // Financial totals
  // -------------------------------------------------------------------------

  const totalCost = computed(
    () => (formData.value.acquisition_cost || 0) + totalMaint.value - totalRental.value,
  )

  return {
    // Drive state
    driveConnected,
    driveLoading,
    driveError,
    driveSection,
    connectDrive,
    openVehicleFolder,
    openDocumentsFolder,
    // Document types
    docTypeToUpload,
    docTypeOptions,
    // Document functions
    handleDocUpload,
    removeDocument,
    handleMaintInvoiceUpload,
    handleRentalInvoiceUpload,
    // Maintenance
    addMaint,
    removeMaint,
    updateMaint,
    totalMaint,
    // Rental
    addRental,
    removeRental,
    updateRental,
    totalRental,
    // Financial
    totalCost,
  }
}
