/**
 * useDashboardFactura
 *
 * All reactive state, computed properties and helpers for the
 * Invoice Generator page (/dashboard/herramientas/factura).
 *
 * Wraps useInvoice() and exposes init() for lifecycle management.
 * The composable does NOT call onMounted — lifecycle stays in the page.
 */

import type { VehicleOption } from '~/composables/dashboard/useInvoice'

export type {
  InvoiceLine,
  VehicleOption,
  DealerInvoiceRow,
} from '~/composables/dashboard/useInvoice'

/** Fields emitted by the dealer section */
export type DealerField =
  | 'companyName'
  | 'companyTaxId'
  | 'companyAddress1'
  | 'companyAddress2'
  | 'companyAddress3'
  | 'companyPhone'
  | 'companyEmail'

/** Fields emitted by the client section */
export type ClientField =
  | 'clientName'
  | 'clientDocType'
  | 'clientDocNumber'
  | 'clientAddress1'
  | 'clientAddress2'
  | 'clientAddress3'

/** Fields emitted by the settings section */
export type SettingsField =
  | 'invoiceNumber'
  | 'invoiceDate'
  | 'invoiceLanguage'
  | 'invoiceConditions'
  | 'vehicleSearch'

export function useDashboardFactura() {
  const {
    // State
    activeTab,
    saving,
    loadingHistory,
    loadingVehicles,
    invoiceHistory,
    errorMessage,
    successMessage,
    companyName,
    companyTaxId,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    clientName,
    clientDocType,
    clientDocNumber,
    clientAddress1,
    clientAddress2,
    clientAddress3,
    invoiceDate,
    invoiceNumber,
    invoiceConditions,
    invoiceLanguage,
    selectedVehicle,
    invoiceLines,
    vehicleSearch,
    showVehicleDropdown,
    // Computed
    filteredVehicles,
    isFreeUser,
    invoiceSubtotal,
    invoiceTotalIva,
    invoiceTotal,
    // Methods
    addInvoiceLine,
    removeInvoiceLine,
    selectVehicle,
    clearVehicle,
    formatCurrency,
    handleGeneratePDF,
    saveInvoice,
    resetForm,
    onVehicleBlur,
    loadDealerData,
    loadVehicleOptions,
    generateInvoiceNumber,
    loadInvoiceHistory,
    fetchSubscription,
  } = useInvoice()

  // ── Init (replaces onMounted in the page) ──────
  async function init(): Promise<void> {
    await Promise.all([loadDealerData(), fetchSubscription()])

    if (!isFreeUser.value) {
      await loadVehicleOptions()
      await generateInvoiceNumber()
      if (invoiceLines.value.length === 0) {
        addInvoiceLine()
      }
      await loadInvoiceHistory()
    }
  }

  // ── Field update helpers for subcomponents ─────
  function updateDealerField(field: DealerField, value: string): void {
    const map: Record<DealerField, Ref<string>> = {
      companyName,
      companyTaxId,
      companyAddress1,
      companyAddress2,
      companyAddress3,
      companyPhone,
      companyEmail,
    }
    map[field].value = value
  }

  function updateClientField(field: ClientField, value: string): void {
    const map: Record<ClientField, Ref<string>> = {
      clientName,
      clientDocType: clientDocType as unknown as Ref<string>,
      clientDocNumber,
      clientAddress1,
      clientAddress2,
      clientAddress3,
    }
    map[field].value = value
  }

  function updateSettingsField(field: SettingsField, value: string): void {
    const map: Record<SettingsField, Ref<string>> = {
      invoiceNumber,
      invoiceDate,
      invoiceLanguage: invoiceLanguage as unknown as Ref<string>,
      invoiceConditions,
      vehicleSearch,
    }
    map[field].value = value
  }

  function openVehicleDropdown(): void {
    showVehicleDropdown.value = true
  }

  function handleSelectVehicle(vehicle: VehicleOption): void {
    selectVehicle(vehicle)
  }

  function dismissError(): void {
    errorMessage.value = null
  }

  function dismissSuccess(): void {
    successMessage.value = null
  }

  return {
    // State
    activeTab,
    saving,
    loadingHistory,
    loadingVehicles,
    invoiceHistory,
    errorMessage,
    successMessage,
    companyName,
    companyTaxId,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    clientName,
    clientDocType,
    clientDocNumber,
    clientAddress1,
    clientAddress2,
    clientAddress3,
    invoiceDate,
    invoiceNumber,
    invoiceConditions,
    invoiceLanguage,
    selectedVehicle,
    invoiceLines,
    vehicleSearch,
    showVehicleDropdown,

    // Computed
    filteredVehicles,
    isFreeUser,
    invoiceSubtotal,
    invoiceTotalIva,
    invoiceTotal,

    // Methods
    init,
    addInvoiceLine,
    removeInvoiceLine,
    selectVehicle: handleSelectVehicle,
    clearVehicle,
    formatCurrency,
    handleGeneratePDF,
    saveInvoice,
    resetForm,
    onVehicleBlur,
    openVehicleDropdown,
    updateDealerField,
    updateClientField,
    updateSettingsField,
    dismissError,
    dismissSuccess,
  }
}
