<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()

// ============================================
// TYPES
// ============================================
interface VerticalConfig {
  subscription_prices: Record<string, Record<string, number>>
  commission_rates: Record<string, number>
}

// ============================================
// DEFINITIONS
// ============================================
const planDefinitions = [
  { key: 'founding', labelKey: 'admin.configPricing.planFounding', readonly: true },
  { key: 'basic', labelKey: 'admin.configPricing.planBasic', readonly: false },
  { key: 'premium', labelKey: 'admin.configPricing.planPremium', readonly: false },
]

const commissionDefinitions = [
  { key: 'sale_pct', labelKey: 'admin.configPricing.salePct', type: 'pct' as const },
  {
    key: 'auction_buyer_premium_pct',
    labelKey: 'admin.configPricing.auctionBuyerPremiumPct',
    type: 'pct' as const,
  },
  {
    key: 'transport_commission_pct',
    labelKey: 'admin.configPricing.transportCommissionPct',
    type: 'pct' as const,
  },
  {
    key: 'transfer_commission_pct',
    labelKey: 'admin.configPricing.transferCommissionPct',
    type: 'pct' as const,
  },
  {
    key: 'verification_level1_cents',
    labelKey: 'admin.configPricing.verificationLevel1',
    type: 'cents' as const,
  },
  {
    key: 'verification_level2_cents',
    labelKey: 'admin.configPricing.verificationLevel2',
    type: 'cents' as const,
  },
  {
    key: 'verification_level3_cents',
    labelKey: 'admin.configPricing.verificationLevel3',
    type: 'cents' as const,
  },
]

// ============================================
// STATE
// ============================================
const loading = ref(true)
const savingPrices = ref(false)
const savingCommissions = ref(false)
const error = ref<string | null>(null)
const successPrices = ref(false)
const successCommissions = ref(false)
const originalConfig = ref<VerticalConfig | null>(null)

// Subscription prices form (values displayed in euros)
const subscriptionPrices = ref<Record<string, { monthly: number; annual: number }>>({
  founding: { monthly: 0, annual: 0 },
  basic: { monthly: 0, annual: 0 },
  premium: { monthly: 0, annual: 0 },
})

// Commission rates form
const commissionRates = ref<Record<string, number>>({
  sale_pct: 0,
  auction_buyer_premium_pct: 0,
  transport_commission_pct: 0,
  transfer_commission_pct: 0,
  verification_level1_cents: 0,
  verification_level2_cents: 0,
  verification_level3_cents: 0,
})

// ============================================
// HELPERS
// ============================================
function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}

function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

// ============================================
// DATA LOADING
// ============================================
async function loadConfig() {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('vertical_config')
      .select('subscription_prices, commission_rates')
      .eq('vertical', getVerticalSlug())
      .single()

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    const cfg = data as VerticalConfig
    originalConfig.value = JSON.parse(JSON.stringify(cfg))

    // Load subscription prices (stored as cents, display as euros)
    const prices = cfg.subscription_prices || {}
    for (const plan of planDefinitions) {
      const planData = prices[plan.key] as Record<string, number> | undefined
      if (planData) {
        subscriptionPrices.value[plan.key] = {
          monthly: centsToEuros(planData.monthly_cents || 0),
          annual: centsToEuros(planData.annual_cents || 0),
        }
      }
    }

    // Load commission rates
    const rates = cfg.commission_rates || {}
    for (const def of commissionDefinitions) {
      if (def.type === 'cents') {
        commissionRates.value[def.key] = centsToEuros((rates[def.key] as number) || 0)
      } else {
        commissionRates.value[def.key] = (rates[def.key] as number) || 0
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConfig()
})

// ============================================
// SAVE ACTIONS
// ============================================
async function savePrices() {
  savingPrices.value = true
  error.value = null
  successPrices.value = false

  try {
    // Build subscription_prices payload in cents
    const pricesPayload: Record<string, Record<string, number>> = {}
    for (const plan of planDefinitions) {
      const localPlan = subscriptionPrices.value[plan.key]
      pricesPayload[plan.key] = {
        monthly_cents: plan.readonly ? 0 : eurosToCents(localPlan.monthly),
        annual_cents: plan.readonly ? 0 : eurosToCents(localPlan.annual),
      }
    }

    const { error: updateError } = await supabase
      .from('vertical_config')
      .update({ subscription_prices: pricesPayload })
      .eq('vertical', getVerticalSlug())

    if (updateError) {
      error.value = updateError.message
      return
    }

    successPrices.value = true
    setTimeout(() => {
      successPrices.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    savingPrices.value = false
  }
}

async function saveCommissions() {
  savingCommissions.value = true
  error.value = null
  successCommissions.value = false

  try {
    // Build commission_rates payload
    const ratesPayload: Record<string, number> = {}
    for (const def of commissionDefinitions) {
      if (def.type === 'cents') {
        ratesPayload[def.key] = eurosToCents(commissionRates.value[def.key])
      } else {
        ratesPayload[def.key] = commissionRates.value[def.key]
      }
    }

    const { error: updateError } = await supabase
      .from('vertical_config')
      .update({ commission_rates: ratesPayload })
      .eq('vertical', getVerticalSlug())

    if (updateError) {
      error.value = updateError.message
      return
    }

    successCommissions.value = true
    setTimeout(() => {
      successCommissions.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    savingCommissions.value = false
  }
}
</script>

<template>
  <div class="config-pricing-page">
    <!-- Header -->
    <div class="section-header">
      <h1>{{ t('admin.configPricing.title') }}</h1>
      <p class="section-subtitle">
        {{ t('admin.configPricing.subtitle') }}
      </p>
    </div>

    <!-- Current config info -->
    <div class="info-banner">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>{{ t('admin.configPricing.stripeSyncNote') }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}</span>
    </div>

    <template v-else>
      <!-- Error banner -->
      <div v-if="error" class="alert-error">
        {{ error }}
        <button class="dismiss-btn" @click="error = null">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Subscription Prices Section -->
      <div class="config-card">
        <h2 class="card-title">{{ t('admin.configPricing.subscriptionPricesTitle') }}</h2>
        <p class="card-description">
          {{ t('admin.configPricing.subscriptionPricesDesc') }}
        </p>

        <div class="pricing-table-wrapper">
          <table class="pricing-table">
            <thead>
              <tr>
                <th>{{ t('admin.configPricing.plan') }}</th>
                <th>{{ t('admin.configPricing.monthlyPrice') }}</th>
                <th>{{ t('admin.configPricing.annualPrice') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="plan in planDefinitions"
                :key="plan.key"
                :class="{ 'row-readonly': plan.readonly }"
              >
                <td class="plan-name">
                  {{ t(plan.labelKey) }}
                  <span v-if="plan.readonly" class="plan-free-tag">
                    {{ t('admin.configPricing.alwaysFree') }}
                  </span>
                </td>
                <td>
                  <div v-if="plan.readonly" class="price-readonly">0,00 &euro;</div>
                  <div v-else class="input-euro">
                    <input
                      v-model.number="subscriptionPrices[plan.key].monthly"
                      type="number"
                      min="0"
                      step="0.01"
                      class="price-input"
                    >
                    <span class="euro-symbol">&euro;/{{ t('admin.configPricing.month') }}</span>
                  </div>
                </td>
                <td>
                  <div v-if="plan.readonly" class="price-readonly">0,00 &euro;</div>
                  <div v-else class="input-euro">
                    <input
                      v-model.number="subscriptionPrices[plan.key].annual"
                      type="number"
                      min="0"
                      step="0.01"
                      class="price-input"
                    >
                    <span class="euro-symbol">&euro;/{{ t('admin.configPricing.year') }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Save prices success -->
        <div v-if="successPrices" class="success-banner">
          {{ t('admin.configPricing.pricesSaved') }}
        </div>

        <div class="save-section">
          <button class="btn-primary" :disabled="savingPrices" @click="savePrices">
            {{
              savingPrices ? t('admin.configPricing.saving') : t('admin.configPricing.savePrices')
            }}
          </button>
        </div>
      </div>

      <!-- Commission Rates Section -->
      <div class="config-card">
        <h2 class="card-title">{{ t('admin.configPricing.commissionRatesTitle') }}</h2>
        <p class="card-description">
          {{ t('admin.configPricing.commissionRatesDesc') }}
        </p>

        <div class="commission-grid">
          <div v-for="def in commissionDefinitions" :key="def.key" class="commission-field">
            <label :for="`commission-${def.key}`" class="commission-label">
              {{ t(def.labelKey) }}
            </label>
            <div class="input-with-suffix">
              <input
                :id="`commission-${def.key}`"
                v-model.number="commissionRates[def.key]"
                type="number"
                min="0"
                :step="def.type === 'pct' ? '0.1' : '0.01'"
                class="commission-input"
              >
              <span class="input-suffix">{{ def.type === 'pct' ? '%' : '&euro;' }}</span>
            </div>
          </div>
        </div>

        <!-- Save commissions success -->
        <div v-if="successCommissions" class="success-banner">
          {{ t('admin.configPricing.commissionsSaved') }}
        </div>

        <div class="save-section">
          <button class="btn-primary" :disabled="savingCommissions" @click="saveCommissions">
            {{
              savingCommissions
                ? t('admin.configPricing.saving')
                : t('admin.configPricing.saveCommissions')
            }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT
   ============================================ */
.config-pricing-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}

/* ============================================
   HEADER
   ============================================ */
.section-header {
  margin-bottom: 8px;
}

.section-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

/* ============================================
   INFO BANNER
   ============================================ */
.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
}

.info-banner svg {
  flex-shrink: 0;
}

/* ============================================
   ALERTS & STATES
   ============================================ */
.alert-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
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
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 12px;
}

/* ============================================
   CONFIG CARDS
   ============================================ */
.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.card-description {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.875rem;
}

/* ============================================
   PRICING TABLE
   ============================================ */
.pricing-table-wrapper {
  overflow-x: auto;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 360px;
}

.pricing-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.pricing-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.row-readonly {
  background: #f9fafb;
}

.plan-name {
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.plan-free-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.price-readonly {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
}

.input-euro {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
}

.price-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.price-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.euro-symbol {
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.85rem;
}

/* ============================================
   COMMISSION GRID
   ============================================ */
.commission-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.commission-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.commission-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 200px;
}

.commission-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.commission-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.input-suffix {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.95rem;
  flex-shrink: 0;
  min-width: 20px;
}

/* ============================================
   SAVE SECTION
   ============================================ */
.save-section {
  margin-top: 16px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 768px) {
  .commission-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .input-with-suffix {
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .config-card {
    padding: 16px;
  }

  .pricing-table th,
  .pricing-table td {
    padding: 10px 12px;
  }

  .input-euro {
    max-width: 140px;
  }

  .input-with-suffix {
    max-width: 100%;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }

  .section-header h1 {
    font-size: 1.35rem;
  }
}
</style>
