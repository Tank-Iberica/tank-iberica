<script setup lang="ts">
/**
 * Dealer Invoice Generator
 * Orchestrator page — logic in useInvoice composable,
 * sub-components for lines editor and history.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

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

// ============ LIFECYCLE ============
onMounted(async () => {
  await Promise.all([loadDealerData(), fetchSubscription()])

  if (!isFreeUser.value) {
    await loadVehicleOptions()
    await generateInvoiceNumber()
    if (invoiceLines.value.length === 0) {
      addInvoiceLine()
    }
    await loadInvoiceHistory()
  }
})
</script>

<template>
  <div class="tool-page">
    <!-- Plan gate banner for free users -->
    <div v-if="isFreeUser" class="plan-gate">
      <div class="plan-gate__icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 class="plan-gate__title">{{ t('dashboard.tools.invoice.upgradeTitle') }}</h2>
      <p class="plan-gate__text">{{ t('dashboard.tools.invoice.upgradeText') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="plan-gate__cta">
        {{ t('dashboard.tools.invoice.upgradeCTA') }}
      </NuxtLink>
    </div>

    <!-- Main content (only for paid plans) -->
    <template v-else>
      <h1 class="tool-page__title">{{ t('dashboard.tools.invoice.title') }}</h1>
      <p class="tool-page__subtitle">{{ t('dashboard.tools.invoice.subtitle') }}</p>

      <!-- Tabs -->
      <div class="tool-tabs">
        <button
          class="tool-tabs__btn"
          :class="{ 'tool-tabs__btn--active': activeTab === 'new' }"
          @click="activeTab = 'new'"
        >
          {{ t('dashboard.tools.invoice.tabNew') }}
        </button>
        <button
          class="tool-tabs__btn"
          :class="{ 'tool-tabs__btn--active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          {{ t('dashboard.tools.invoice.tabHistory') }}
          <span v-if="invoiceHistory.length > 0" class="tool-tabs__badge">{{
            invoiceHistory.length
          }}</span>
        </button>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="message message--error">
        {{ errorMessage }}
        <button class="message__close" @click="errorMessage = null">&times;</button>
      </div>
      <div v-if="successMessage" class="message message--success">
        {{ successMessage }}
        <button class="message__close" @click="successMessage = null">&times;</button>
      </div>

      <!-- New invoice form -->
      <div v-if="activeTab === 'new'" class="invoice-form">
        <!-- Dealer / Company data section -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.dealerData') }}
          </legend>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.companyName')
              }}</label>
              <input v-model="companyName" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.taxId') }}</label>
              <input
                v-model="companyTaxId"
                type="text"
                class="form-field__input"
                placeholder="B12345678"
              >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.phone') }}</label>
              <input v-model="companyPhone" type="tel" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.email') }}</label>
              <input v-model="companyEmail" type="email" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
              <input v-model="companyAddress1" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
              <input v-model="companyAddress2" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
              <input v-model="companyAddress3" type="text" class="form-field__input" >
            </div>
          </div>
        </fieldset>

        <!-- Client data section -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.clientData') }}
          </legend>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-field__label"
                >{{ t('dashboard.tools.invoice.clientName') }} *</label
              >
              <input v-model="clientName" type="text" class="form-field__input" required >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.docType') }}</label>
              <select v-model="clientDocType" class="form-field__select">
                <option value="NIF">NIF</option>
                <option value="DNI">DNI</option>
                <option value="CIF">CIF</option>
                <option value="Pasaporte">{{ t('dashboard.tools.invoice.passport') }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.docNumber') }}</label>
              <input v-model="clientDocNumber" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
              <input v-model="clientAddress1" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
              <input v-model="clientAddress2" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
              <input v-model="clientAddress3" type="text" class="form-field__input" >
            </div>
          </div>
        </fieldset>

        <!-- Vehicle selection & invoice settings -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.invoiceSettings') }}
          </legend>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.invoiceNumber')
              }}</label>
              <input v-model="invoiceNumber" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.invoiceDate')
              }}</label>
              <input v-model="invoiceDate" type="date" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.language') }}</label>
              <select v-model="invoiceLanguage" class="form-field__select">
                <option value="es">{{ t('dashboard.tools.invoice.langES') }}</option>
                <option value="en">{{ t('dashboard.tools.invoice.langEN') }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.conditions') }}</label>
              <input v-model="invoiceConditions" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full form-field--autocomplete">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.vehicle') }}</label>
              <div class="autocomplete-wrapper">
                <input
                  v-model="vehicleSearch"
                  type="text"
                  class="form-field__input"
                  :placeholder="t('dashboard.tools.invoice.vehiclePlaceholder')"
                  @focus="showVehicleDropdown = true"
                  @blur="onVehicleBlur"
                >
                <button
                  v-if="selectedVehicle"
                  class="autocomplete-clear"
                  type="button"
                  @click="clearVehicle"
                >
                  &times;
                </button>
                <ul
                  v-if="showVehicleDropdown && filteredVehicles.length > 0"
                  class="autocomplete-dropdown"
                >
                  <li
                    v-for="v in filteredVehicles"
                    :key="v.id"
                    class="autocomplete-dropdown__item"
                    @mousedown.prevent="selectVehicle(v)"
                  >
                    {{ v.label }}
                  </li>
                </ul>
                <div
                  v-if="showVehicleDropdown && filteredVehicles.length === 0 && vehicleSearch"
                  class="autocomplete-dropdown autocomplete-dropdown--empty"
                >
                  {{ t('dashboard.tools.invoice.noVehicles') }}
                </div>
                <div v-if="loadingVehicles" class="autocomplete-loading">
                  {{ t('dashboard.tools.invoice.loading') }}...
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Invoice lines -->
        <fieldset class="form-section">
          <legend class="form-section__legend">{{ t('dashboard.tools.invoice.lines') }}</legend>
          <DashboardInvoiceInvoiceLinesEditor
            :lines="invoiceLines"
            @add-line="addInvoiceLine"
            @remove-line="removeInvoiceLine"
          />
        </fieldset>

        <!-- Totals -->
        <div class="invoice-totals">
          <div class="invoice-totals__row">
            <span>{{ t('dashboard.tools.invoice.baseAmount') }}</span>
            <span>{{ formatCurrency(invoiceSubtotal) }}</span>
          </div>
          <div class="invoice-totals__row">
            <span>{{ t('dashboard.tools.invoice.totalIVA') }}</span>
            <span>{{ formatCurrency(invoiceTotalIva) }}</span>
          </div>
          <div class="invoice-totals__row invoice-totals__row--grand">
            <span>{{ t('dashboard.tools.invoice.grandTotal') }}</span>
            <span>{{ formatCurrency(invoiceTotal) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="invoice-actions">
          <button
            class="btn btn--primary"
            type="button"
            :disabled="saving"
            @click="handleGeneratePDF"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {{ t('dashboard.tools.invoice.generatePDF') }}
          </button>
          <button
            class="btn btn--secondary"
            type="button"
            :disabled="saving"
            @click="saveInvoice('draft')"
          >
            {{ t('dashboard.tools.invoice.saveDraft') }}
          </button>
          <button class="btn btn--ghost" type="button" @click="resetForm">
            {{ t('dashboard.tools.invoice.reset') }}
          </button>
        </div>
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
/* ============ BASE / MOBILE-FIRST ============ */
.tool-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 0.25rem;
}

.tool-page__subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

/* ============ PLAN GATE ============ */
.plan-gate {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin-top: 2rem;
}

.plan-gate__icon {
  color: #94a3b8;
  margin-bottom: 1rem;
}

.plan-gate__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 0.5rem;
}

.plan-gate__text {
  color: #64748b;
  margin-bottom: 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.plan-gate__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 2rem;
  background: var(--primary, #23424a);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.plan-gate__cta:hover {
  opacity: 0.9;
}

/* ============ TABS ============ */
.tool-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.tool-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tool-tabs__btn:hover {
  color: var(--primary, #23424a);
}

.tool-tabs__btn--active {
  color: var(--primary, #23424a);
  border-bottom-color: var(--primary, #23424a);
  font-weight: 600;
}

.tool-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary, #23424a);
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* ============ MESSAGES ============ */
.message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.message--error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.message--success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.message__close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============ FORM SECTIONS ============ */
.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section__legend {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.form-field__input,
.form-field__select {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
  width: 100%;
}

.form-field__input:focus,
.form-field__select:focus {
  outline: none;
  border-color: var(--primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

/* ============ AUTOCOMPLETE ============ */
.form-field--autocomplete {
  position: relative;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  list-style: none;
  margin: 0;
  padding: 0;
}

.autocomplete-dropdown--empty {
  padding: 0.75rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.autocomplete-dropdown__item {
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.autocomplete-dropdown__item:hover {
  background: #f1f5f9;
}

.autocomplete-loading {
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ============ INVOICE TOTALS ============ */
.invoice-totals {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  max-width: 360px;
  margin-left: auto;
}

.invoice-totals__row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.9rem;
  color: #475569;
}

.invoice-totals__row--grand {
  border-top: 2px solid var(--primary, #23424a);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary, #23424a);
}

/* ============ ACTIONS ============ */
.invoice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

/* ============ BUTTONS ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--primary, #23424a);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: #e2e8f0;
  color: #334155;
}

.btn--secondary:hover:not(:disabled) {
  background: #cbd5e1;
}

.btn--ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #d1d5db;
}

.btn--ghost:hover:not(:disabled) {
  background: #f1f5f9;
}

/* ============ DESKTOP BREAKPOINT (768px+) ============ */
@media (min-width: 768px) {
  .tool-page {
    padding: 2rem;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* ============ LARGE DESKTOP (1024px+) ============ */
@media (min-width: 1024px) {
  .tool-page__title {
    font-size: 1.75rem;
  }

  .form-section {
    padding: 1.5rem;
  }
}
</style>
