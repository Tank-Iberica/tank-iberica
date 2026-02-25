<script setup lang="ts">
/**
 * Merchandising Interest Page
 * Visual showcase of branded products + interest form.
 * Inserts into service_requests with type='merchandising'.
 * No cart, no payments — measures real demand first.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { dealerProfile, loadDealer } = useDealerDashboard()

// ---------- Types ----------

interface MerchProduct {
  id: string
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  unit_es: string
  unit_en: string
  icon: string
  color: string
}

// ---------- Product catalog ----------

const products: MerchProduct[] = [
  {
    id: 'tarjetas-visita',
    name_es: 'Tarjetas de visita',
    name_en: 'Business cards',
    description_es:
      '500 unidades, papel premium 350g, barniz UV selectivo. Incluye logo, datos de contacto y QR a tu perfil.',
    description_en:
      '500 units, premium 350g paper, selective UV varnish. Includes logo, contact info and QR to your profile.',
    unit_es: '500 uds',
    unit_en: '500 pcs',
    icon: '🪪',
    color: '#dbeafe',
  },
  {
    id: 'imanes-furgoneta',
    name_es: 'Imanes para furgoneta',
    name_en: 'Van magnets',
    description_es:
      '2 unidades, 60×30 cm cada uno. Resistentes a lluvia y sol. Incluyen logo, nombre y teléfono.',
    description_en:
      '2 units, 60×30 cm each. Weather resistant. Include logo, company name and phone.',
    unit_es: '2 uds · 60×30 cm',
    unit_en: '2 pcs · 60×30 cm',
    icon: '🚐',
    color: '#dcfce7',
  },
  {
    id: 'lona-feria',
    name_es: 'Lona para feria',
    name_en: 'Fair banner',
    description_es:
      '1 unidad, 200×100 cm. PVC resistente con ojales. Incluye logo, nombre, teléfono y URL del perfil.',
    description_en:
      '1 unit, 200×100 cm. Durable PVC with eyelets. Includes logo, name, phone and profile URL.',
    unit_es: '1 ud · 200×100 cm',
    unit_en: '1 pc · 200×100 cm',
    icon: '🏳️',
    color: '#fef9c3',
  },
  {
    id: 'pegatinas-qr',
    name_es: 'Pegatinas QR',
    name_en: 'QR stickers',
    description_es:
      '50 unidades, 5×5 cm. Vinilo resistente. QR personalizado que enlaza a tu perfil en Tracciona.',
    description_en: '50 units, 5×5 cm. Durable vinyl. Custom QR linking to your Tracciona profile.',
    unit_es: '50 uds · 5×5 cm',
    unit_en: '50 pcs · 5×5 cm',
    icon: '📱',
    color: '#f3e8ff',
  },
  {
    id: 'roll-up',
    name_es: 'Roll-up expositor',
    name_en: 'Roll-up display',
    description_es:
      '1 unidad, 200×85 cm. Estructura de aluminio con bolsa de transporte. Incluye logo, nombre y catálogo destacado.',
    description_en:
      '1 unit, 200×85 cm. Aluminum structure with carrying bag. Includes logo, name and featured catalog.',
    unit_es: '1 ud · 200×85 cm',
    unit_en: '1 pc · 200×85 cm',
    icon: '📋',
    color: '#ffe4e6',
  },
]

// ---------- State ----------

const pageLoading = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref<string | null>(null)

const form = ref({
  product: '',
  quantity: '',
  email: '',
  notes: '',
})

// ---------- Helpers ----------

function getProductName(product: MerchProduct): string {
  return locale.value === 'en' ? product.name_en : product.name_es
}

function getProductDescription(product: MerchProduct): string {
  return locale.value === 'en' ? product.description_en : product.description_es
}

function getProductUnit(product: MerchProduct): string {
  return locale.value === 'en' ? product.unit_en : product.unit_es
}

// ---------- Submit ----------

async function submitInterest() {
  submitError.value = null

  if (!form.value.product || !form.value.email) {
    submitError.value = t('dashboard.tools.merchandising.errorRequired')
    return
  }

  submitting.value = true
  try {
    const selectedProduct = products.find((p) => p.id === form.value.product)

    const { error: insertError } = await supabase.from('service_requests').insert({
      type: 'merchandising',
      user_id: user.value?.id ?? null,
      status: 'requested',
      details: {
        product_id: form.value.product,
        product_name_es: selectedProduct?.name_es ?? form.value.product,
        product_name_en: selectedProduct?.name_en ?? form.value.product,
        estimated_quantity: form.value.quantity || null,
        contact_email: form.value.email,
        notes: form.value.notes || null,
        dealer_company: dealerProfile.value?.company_name ?? null,
        requested_at: new Date().toISOString(),
      },
    })

    if (insertError) throw insertError

    submitted.value = true
    form.value = { product: '', quantity: '', email: '', notes: '' }
  } catch (err: unknown) {
    const e = err as { message?: string }
    submitError.value = e?.message ?? t('dashboard.tools.merchandising.errorSubmit')
  } finally {
    submitting.value = false
  }
}

// ---------- Lifecycle ----------

onMounted(async () => {
  pageLoading.value = true
  try {
    await loadDealer()
    // Pre-fill email from dealer profile or auth user
    const email = dealerProfile.value?.email ?? user.value?.email ?? ''
    if (email) form.value.email = email
  } finally {
    pageLoading.value = false
  }
})
</script>

<template>
  <div class="merch-page">
    <!-- Header banner -->
    <section class="hero-banner">
      <div class="hero-content">
        <div class="hero-badge">{{ t('dashboard.tools.merchandising.badge') }}</div>
        <h1>{{ t('dashboard.tools.merchandising.title') }}</h1>
        <p class="hero-desc">{{ t('dashboard.tools.merchandising.heroDesc') }}</p>
      </div>
      <div class="hero-icon" aria-hidden="true">🎁</div>
    </section>

    <!-- Loading -->
    <div v-if="pageLoading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <template v-else>
      <!-- Product showcase -->
      <section class="section">
        <h2 class="section-title">{{ t('dashboard.tools.merchandising.catalogTitle') }}</h2>
        <p class="section-desc">{{ t('dashboard.tools.merchandising.catalogDesc') }}</p>

        <div class="product-grid">
          <article
            v-for="product in products"
            :key="product.id"
            class="product-card"
            :style="{ '--card-bg': product.color }"
          >
            <div class="product-icon-wrap">
              <span class="product-icon" aria-hidden="true">{{ product.icon }}</span>
            </div>
            <div class="product-body">
              <h3 class="product-name">{{ getProductName(product) }}</h3>
              <p class="product-desc">{{ getProductDescription(product) }}</p>
              <span class="product-unit">{{ getProductUnit(product) }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Interest form -->
      <section class="section form-section">
        <h2 class="section-title">{{ t('dashboard.tools.merchandising.formTitle') }}</h2>
        <p class="section-desc">{{ t('dashboard.tools.merchandising.formDesc') }}</p>

        <!-- Success state -->
        <div v-if="submitted" class="alert-success">
          <strong>{{ t('dashboard.tools.merchandising.successTitle') }}</strong>
          <p>{{ t('dashboard.tools.merchandising.successDesc') }}</p>
          <button class="btn-reset" @click="submitted = false">
            {{ t('dashboard.tools.merchandising.sendAnother') }}
          </button>
        </div>

        <!-- Form -->
        <form v-else class="interest-form" novalidate @submit.prevent="submitInterest">
          <!-- Product select -->
          <div class="field">
            <label class="field-label" for="merch-product">
              {{ t('dashboard.tools.merchandising.fieldProduct') }}
              <span class="required" aria-hidden="true">*</span>
            </label>
            <select id="merch-product" v-model="form.product" class="field-input" required>
              <option value="" disabled>
                {{ t('dashboard.tools.merchandising.productPlaceholder') }}
              </option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ getProductName(product) }}
              </option>
            </select>
          </div>

          <!-- Estimated quantity -->
          <div class="field">
            <label class="field-label" for="merch-quantity">
              {{ t('dashboard.tools.merchandising.fieldQuantity') }}
            </label>
            <input
              id="merch-quantity"
              v-model="form.quantity"
              type="text"
              class="field-input"
              :placeholder="t('dashboard.tools.merchandising.quantityPlaceholder')"
            >
          </div>

          <!-- Email -->
          <div class="field">
            <label class="field-label" for="merch-email">
              {{ t('dashboard.tools.merchandising.fieldEmail') }}
              <span class="required" aria-hidden="true">*</span>
            </label>
            <input
              id="merch-email"
              v-model="form.email"
              type="email"
              class="field-input"
              :placeholder="t('dashboard.tools.merchandising.emailPlaceholder')"
              required
            >
          </div>

          <!-- Notes -->
          <div class="field">
            <label class="field-label" for="merch-notes">
              {{ t('dashboard.tools.merchandising.fieldNotes') }}
            </label>
            <textarea
              id="merch-notes"
              v-model="form.notes"
              class="field-input field-textarea"
              rows="3"
              :placeholder="t('dashboard.tools.merchandising.notesPlaceholder')"
            />
          </div>

          <!-- Error -->
          <div v-if="submitError" class="alert-error">{{ submitError }}</div>

          <button type="submit" class="btn-submit" :disabled="submitting">
            <span v-if="submitting" class="spinner-sm" aria-hidden="true" />
            {{ submitting ? t('common.saving') : t('dashboard.tools.merchandising.submitBtn') }}
          </button>

          <p class="form-note">{{ t('dashboard.tools.merchandising.formNote') }}</p>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.merch-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Hero banner */
.hero-banner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(135deg, #23424a 0%, #1a5f6e 100%);
  border-radius: 16px;
  padding: 24px 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  align-self: flex-start;
}

.hero-banner h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.hero-desc {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
  line-height: 1.5;
}

.hero-icon {
  font-size: 3rem;
  line-height: 1;
  align-self: flex-end;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.35;
  pointer-events: none;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Section */
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.section-desc {
  margin: -8px 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.product-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  padding: 16px;
  transition: box-shadow 0.15s;
  border: 1px solid #f1f5f9;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-icon-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: var(--card-bg, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.product-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.product-desc {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
}

.product-unit {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Form section */
.form-section {
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  border: 1px solid #e2e8f0;
}

.interest-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.field-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.12);
}

.field-textarea {
  min-height: 88px;
  resize: vertical;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

.alert-success {
  padding: 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #15803d;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-success strong {
  font-size: 1rem;
  font-weight: 700;
}

.alert-success p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Submit button */
.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
  width: 100%;
}

.btn-submit:hover:not(:disabled) {
  background: #1a3238;
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Reset button */
.btn-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  background: transparent;
  color: #15803d;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s;
}

.btn-reset:hover {
  background: #dcfce7;
}

.form-note {
  margin: 0;
  font-size: 0.78rem;
  color: #9ca3af;
  text-align: center;
  font-style: italic;
}

/* Responsive */
@media (min-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .btn-submit {
    width: auto;
    align-self: flex-start;
  }
}

@media (min-width: 768px) {
  .merch-page {
    padding: 24px;
  }

  .hero-banner {
    flex-direction: row;
    align-items: center;
    padding: 32px 32px;
  }

  .hero-icon {
    position: static;
    transform: none;
    opacity: 0.5;
    font-size: 5rem;
    margin-left: auto;
  }

  .hero-banner h1 {
    font-size: 1.75rem;
  }

  .form-section {
    padding: 32px;
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
