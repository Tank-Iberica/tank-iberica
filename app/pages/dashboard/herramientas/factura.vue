<script setup lang="ts">
/**
 * Dealer Invoice Generator
 * Orchestrator page — logic in useDashboardFactura composable,
 * sub-components for each form section, totals, actions, and history.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */
import { useDashboardFactura } from '~/composables/dashboard/useDashboardFactura'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
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
  filteredVehicles,
  isFreeUser,
  invoiceSubtotal,
  invoiceTotalIva,
  invoiceTotal,
  init,
  addInvoiceLine,
  removeInvoiceLine,
  selectVehicle,
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
} = useDashboardFactura()

onMounted(init)
</script>

<template>
  <div class="tool-page">
    <!-- Plan gate banner for free users -->
    <DashboardHerramientasFacturaFacturaPlanGate v-if="isFreeUser" />

    <!-- Main content (only for paid plans) -->
    <template v-else>
      <h1 class="tool-page__title">{{ t('dashboard.tools.invoice.title') }}</h1>
      <p class="tool-page__subtitle">{{ t('dashboard.tools.invoice.subtitle') }}</p>

      <DashboardHerramientasFacturaFacturaTabs
        :active-tab="activeTab"
        :history-count="invoiceHistory.length"
        @change="activeTab = $event"
      />

      <DashboardHerramientasFacturaFacturaMessages
        :error-message="errorMessage"
        :success-message="successMessage"
        @dismiss-error="dismissError"
        @dismiss-success="dismissSuccess"
      />

      <!-- New invoice form -->
      <div v-if="activeTab === 'new'" class="invoice-form">
        <DashboardHerramientasFacturaFacturaDealerSection
          :company-name="companyName"
          :company-tax-id="companyTaxId"
          :company-address1="companyAddress1"
          :company-address2="companyAddress2"
          :company-address3="companyAddress3"
          :company-phone="companyPhone"
          :company-email="companyEmail"
          @update="updateDealerField"
        />

        <DashboardHerramientasFacturaFacturaClientSection
          :client-name="clientName"
          :client-doc-type="clientDocType"
          :client-doc-number="clientDocNumber"
          :client-address1="clientAddress1"
          :client-address2="clientAddress2"
          :client-address3="clientAddress3"
          @update="updateClientField"
        />

        <DashboardHerramientasFacturaFacturaSettingsSection
          :invoice-number="invoiceNumber"
          :invoice-date="invoiceDate"
          :invoice-language="invoiceLanguage"
          :invoice-conditions="invoiceConditions"
          :vehicle-search="vehicleSearch"
          :show-vehicle-dropdown="showVehicleDropdown"
          :selected-vehicle="selectedVehicle"
          :filtered-vehicles="filteredVehicles"
          :loading-vehicles="loadingVehicles"
          @update="updateSettingsField"
          @select-vehicle="selectVehicle"
          @clear-vehicle="clearVehicle"
          @open-dropdown="openVehicleDropdown"
          @blur-vehicle="onVehicleBlur"
        />

        <DashboardHerramientasFacturaFacturaLinesSection
          :lines="invoiceLines"
          @add-line="addInvoiceLine"
          @remove-line="removeInvoiceLine"
        />

        <DashboardHerramientasFacturaFacturaTotals
          :subtotal="invoiceSubtotal"
          :total-iva="invoiceTotalIva"
          :total="invoiceTotal"
          :format-currency="formatCurrency"
        />

        <DashboardHerramientasFacturaFacturaActions
          :saving="saving"
          @generate-pdf="handleGeneratePDF"
          @save-draft="saveInvoice('draft')"
          @reset="resetForm"
        />
      </div>

      <!-- Invoice history tab -->
      <DashboardInvoiceInvoiceHistory
        v-if="activeTab === 'history'"
        :invoices="invoiceHistory"
        :loading="loadingHistory"
      />
    </template>
  </div>
</template>

<style scoped>
.tool-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, var(--color-primary));
  margin-bottom: 0.25rem;
}

.tool-page__subtitle {
  font-size: 0.9rem;
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .tool-page {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .tool-page__title {
    font-size: 1.75rem;
  }
}
</style>
