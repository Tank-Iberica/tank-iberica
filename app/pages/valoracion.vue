<script setup lang="ts">
import { localizedField } from '~/composables/useLocalized'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

usePageSeo({
  title: t('valuation.seoTitle'),
  description: t('valuation.seoDescription'),
  path: '/valoracion',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('valuation.seoTitle'),
    url: 'https://tracciona.com/valoracion',
    description: t('valuation.seoDescription'),
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  },
})

/* ---- Price formatter ---- */
const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

/* ---- Provinces ---- */
const provinces = [
  'Álava',
  'Albacete',
  'Alicante',
  'Almería',
  'Asturias',
  'Ávila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Cáceres',
  'Cádiz',
  'Cantabria',
  'Castellón',
  'Ciudad Real',
  'Córdoba',
  'Cuenca',
  'Gerona',
  'Granada',
  'Guadalajara',
  'Guipúzcoa',
  'Huelva',
  'Huesca',
  'Islas Baleares',
  'Jaén',
  'La Coruña',
  'La Rioja',
  'Las Palmas',
  'León',
  'Lérida',
  'Lugo',
  'Madrid',
  'Málaga',
  'Murcia',
  'Navarra',
  'Orense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Vizcaya',
  'Zamora',
  'Zaragoza',
]

/* ---- Subcategories ---- */
interface SubcategoryRow {
  id: string
  name: Record<string, string> | null
  name_es: string
  slug: string
}

const subcategories = ref<SubcategoryRow[]>([])

async function loadSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('id, name, name_es, slug')
    .eq('vertical', 'tracciona')
    .order('sort_order')

  if (data) {
    subcategories.value = data as SubcategoryRow[]
  }
}

onMounted(() => {
  loadSubcategories()
  if (user.value) {
    loadHistory()
  }
})

/* ---- Form ---- */
interface ValuationForm {
  brand: string
  model: string
  year: number | null
  km: number | null
  province: string
  subcategory: string
  email: string
}

const form = reactive<ValuationForm>({
  brand: '',
  model: '',
  year: null,
  km: null,
  province: '',
  subcategory: '',
  email: '',
})

const formErrors = reactive<Record<string, boolean>>({
  brand: false,
  model: false,
  year: false,
})

const loading = ref(false)
const showResults = ref(false)

/* ---- Result ---- */
interface ValuationResult {
  min: number
  max: number
  median: number
  trend: 'rising' | 'falling' | 'stable'
  trendPct: number
  daysToSell: number
  sampleSize: number
  confidence: 'high' | 'medium' | 'low'
}

const result = ref<ValuationResult | null>(null)
const noData = ref(false)

/* ---- Validation ---- */
function validateForm(): boolean {
  let valid = true

  formErrors.brand = !form.brand.trim()
  formErrors.model = !form.model.trim()
  formErrors.year = !form.year || form.year < 1970 || form.year > new Date().getFullYear() + 1

  if (formErrors.brand || formErrors.model || formErrors.year) {
    valid = false
  }

  return valid
}

/* ---- Valuation logic ---- */
async function calculateValuation() {
  if (!validateForm()) return

  loading.value = true
  showResults.value = false
  noData.value = false
  result.value = null

  try {
    /* 1. Fetch matching market data */
    let query = supabase
      .from('market_data' as never)
      .select('*')
      .eq('vertical', 'tracciona')
      .eq('brand', form.brand.toLowerCase())

    if (form.subcategory) {
      query = query.eq('subcategory_slug', form.subcategory)
    }
    if (form.province) {
      query = query.eq('province', form.province)
    }

    const { data: marketData } = await query

    const rows = (marketData || []) as Array<Record<string, unknown>>

    if (rows.length === 0) {
      noData.value = true
      showResults.value = true
      return
    }

    /* 2. Compute stats from matching rows */
    const prices = rows.map((r) => Number(r.avg_price)).filter((p) => p > 0 && !Number.isNaN(p))

    if (prices.length === 0) {
      noData.value = true
      showResults.value = true
      return
    }

    const sortedPrices = [...prices].sort((a, b) => a - b)
    const rawMin = Math.min(...prices) * 0.9
    const rawMax = Math.max(...prices) * 1.1
    const rawMedian = sortedPrices[Math.floor(sortedPrices.length / 2)]

    /* 3. Year depreciation: each year older than newest = -5% */
    const currentYear = new Date().getFullYear()
    const vehicleYear = form.year || currentYear
    const ageFactor = Math.max(0.5, 1 - (currentYear - vehicleYear) * 0.05)

    /* 4. Apply factor */
    const estimatedMin = Math.round(rawMin * ageFactor)
    const estimatedMax = Math.round(rawMax * ageFactor)
    const estimatedMedian = Math.round(rawMedian * ageFactor)

    /* 5. Trend: compare last 2 months from price_history */
    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    let trendPct = 0

    try {
      const { data: historyData } = await supabase
        .from('price_history' as never)
        .select('*')
        .eq('brand', form.brand.toLowerCase())
        .order('month', { ascending: false })
        .limit(2)

      const historyRows = (historyData || []) as Array<Record<string, unknown>>

      if (historyRows.length >= 2) {
        const recent = Number(historyRows[0].avg_price) || 0
        const previous = Number(historyRows[1].avg_price) || 0
        if (previous > 0) {
          trendPct = Math.round(((recent - previous) / previous) * 100)
          if (trendPct > 2) trend = 'rising'
          else if (trendPct < -2) trend = 'falling'
          else trend = 'stable'
        }
      }
    } catch {
      // price_history may not exist yet
    }

    /* 6. Confidence: based on sample size */
    const sampleSize = prices.length
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (sampleSize >= 20) confidence = 'high'
    else if (sampleSize >= 10) confidence = 'medium'

    /* Average days to sell (mock based on sample) */
    const avgDaysToSell =
      rows.length > 0
        ? Math.round(
            rows.reduce((sum, r) => sum + (Number(r.avg_days_listed) || 45), 0) / rows.length,
          )
        : 45

    result.value = {
      min: estimatedMin,
      max: estimatedMax,
      median: estimatedMedian,
      trend,
      trendPct,
      daysToSell: avgDaysToSell,
      sampleSize,
      confidence,
    }

    showResults.value = true

    /* Save to valuation_reports */
    try {
      await supabase.from('valuation_reports' as never).insert({
        user_id: user.value?.id || null,
        email: form.email || null,
        brand: form.brand,
        model: form.model,
        year: form.year,
        km: form.km,
        province: form.province,
        subcategory: form.subcategory,
        estimated_min: result.value.min,
        estimated_median: result.value.median,
        estimated_max: result.value.max,
        market_trend: result.value.trend,
        trend_pct: result.value.trendPct,
        avg_days_to_sell: result.value.daysToSell,
        sample_size: result.value.sampleSize,
        confidence: result.value.confidence,
        report_type: 'basic',
      } as never)
    } catch {
      // valuation_reports may not exist yet
    }

    /* Reload history if logged in */
    if (user.value) {
      await loadHistory()
    }
  } finally {
    loading.value = false
  }
}

/* ---- Price bar position (percentage within range) ---- */
function priceBarPosition(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

/* ---- Confidence color ---- */
function confidenceColor(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'var(--color-success)'
    case 'medium':
      return 'var(--color-warning)'
    default:
      return 'var(--color-error)'
  }
}

/* ---- Trend icon ---- */
function trendIcon(trend: string): string {
  switch (trend) {
    case 'rising':
      return '\u2197' // arrow upper right
    case 'falling':
      return '\u2198' // arrow lower right
    default:
      return '\u2192' // arrow right
  }
}

function trendLabel(trend: string): string {
  switch (trend) {
    case 'rising':
      return t('valuation.rising')
    case 'falling':
      return t('valuation.falling')
    default:
      return t('valuation.stable')
  }
}

function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case 'high':
      return t('valuation.confidenceHigh')
    case 'medium':
      return t('valuation.confidenceMedium')
    default:
      return t('valuation.confidenceLow')
  }
}

/* ---- History ---- */
interface HistoryItem {
  id: string
  created_at: string
  brand: string
  model: string
  year: number
  estimated_min: number
  estimated_max: number
  estimated_median: number
  confidence: string
}

const history = ref<HistoryItem[]>([])

async function loadHistory() {
  if (!user.value) return

  try {
    const { data } = await supabase
      .from('valuation_reports' as never)
      .select(
        'id, created_at, brand, model, year, estimated_min, estimated_max, estimated_median, confidence',
      )
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      history.value = data as unknown as HistoryItem[]
    }
  } catch {
    // valuation_reports may not exist yet
  }
}

/* ---- Reset form ---- */
function resetForm() {
  form.brand = ''
  form.model = ''
  form.year = null
  form.km = null
  form.province = ''
  form.subcategory = ''
  form.email = ''
  showResults.value = false
  result.value = null
  noData.value = false
  Object.keys(formErrors).forEach((key) => {
    formErrors[key] = false
  })
}

/* ---- Subcategory label ---- */
function subcategoryLabel(sub: SubcategoryRow): string {
  if (sub.name) {
    return localizedField(sub.name, locale.value)
  }
  return sub.name_es
}

/* ---- Format date ---- */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="valuation-page">
    <!-- Hero -->
    <section class="valuation-hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ $t('valuation.heroTitle') }}</h1>
        <p class="hero-subtitle">{{ $t('valuation.heroSubtitle') }}</p>
      </div>
    </section>

    <div class="valuation-container">
      <!-- Form -->
      <section v-if="!showResults" class="valuation-form-section">
        <form class="valuation-form" @submit.prevent="calculateValuation">
          <!-- Brand -->
          <div class="form-group" :class="{ 'form-group--error': formErrors.brand }">
            <label for="val-brand" class="form-label">
              {{ $t('valuation.brand') }} <span class="required">*</span>
            </label>
            <input
              id="val-brand"
              v-model="form.brand"
              type="text"
              class="form-input"
              :placeholder="$t('valuation.brandPlaceholder')"
              autocomplete="off"
            >
            <span v-if="formErrors.brand" class="form-error">{{
              $t('valuation.requiredField')
            }}</span>
          </div>

          <!-- Model -->
          <div class="form-group" :class="{ 'form-group--error': formErrors.model }">
            <label for="val-model" class="form-label">
              {{ $t('valuation.model') }} <span class="required">*</span>
            </label>
            <input
              id="val-model"
              v-model="form.model"
              type="text"
              class="form-input"
              :placeholder="$t('valuation.modelPlaceholder')"
              autocomplete="off"
            >
            <span v-if="formErrors.model" class="form-error">{{
              $t('valuation.requiredField')
            }}</span>
          </div>

          <!-- Year -->
          <div class="form-group" :class="{ 'form-group--error': formErrors.year }">
            <label for="val-year" class="form-label">
              {{ $t('valuation.year') }} <span class="required">*</span>
            </label>
            <input
              id="val-year"
              v-model.number="form.year"
              type="number"
              class="form-input"
              :placeholder="$t('valuation.yearPlaceholder')"
              min="1970"
              :max="new Date().getFullYear() + 1"
            >
            <span v-if="formErrors.year" class="form-error">{{
              $t('valuation.requiredField')
            }}</span>
          </div>

          <!-- Kilometres -->
          <div class="form-group">
            <label for="val-km" class="form-label">{{ $t('valuation.km') }}</label>
            <input
              id="val-km"
              v-model.number="form.km"
              type="number"
              class="form-input"
              :placeholder="$t('valuation.kmPlaceholder')"
              min="0"
            >
          </div>

          <!-- Province -->
          <div class="form-group">
            <label for="val-province" class="form-label">{{ $t('valuation.province') }}</label>
            <select id="val-province" v-model="form.province" class="form-input form-select">
              <option value="">{{ $t('valuation.provincePlaceholder') }}</option>
              <option v-for="prov in provinces" :key="prov" :value="prov">{{ prov }}</option>
            </select>
          </div>

          <!-- Subcategory -->
          <div class="form-group">
            <label for="val-subcategory" class="form-label">{{
              $t('valuation.subcategory')
            }}</label>
            <select id="val-subcategory" v-model="form.subcategory" class="form-input form-select">
              <option value="">{{ $t('valuation.subcategoryPlaceholder') }}</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.slug">
                {{ subcategoryLabel(sub) }}
              </option>
            </select>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="val-email" class="form-label">{{ $t('valuation.email') }}</label>
            <input
              id="val-email"
              v-model="form.email"
              type="email"
              class="form-input"
              :placeholder="$t('valuation.emailPlaceholder')"
              autocomplete="email"
            >
            <span class="form-hint">{{ $t('valuation.emailHint') }}</span>
          </div>

          <!-- Submit -->
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner" aria-hidden="true" />
            {{ loading ? $t('valuation.calculating') : $t('valuation.calculate') }}
          </button>
        </form>
      </section>

      <!-- Results -->
      <section v-if="showResults" class="valuation-results-section">
        <!-- No data -->
        <div v-if="noData" class="no-data-card">
          <div class="no-data-icon" aria-hidden="true">&#128269;</div>
          <h2 class="no-data-title">{{ $t('valuation.noData') }}</h2>
          <p class="no-data-desc">{{ $t('valuation.noDataDesc') }}</p>
          <button class="submit-btn" @click="resetForm">
            {{ $t('valuation.newValuation') }}
          </button>
        </div>

        <!-- Result card -->
        <div v-else-if="result" class="result-card">
          <div class="result-header">
            <h2 class="result-title">{{ $t('valuation.resultTitle') }}</h2>
            <p class="result-vehicle">{{ form.brand }} {{ form.model }} ({{ form.year }})</p>
          </div>

          <!-- Price range bar -->
          <div class="price-range-section">
            <h3 class="section-label">{{ $t('valuation.priceRange') }}</h3>
            <div class="price-bar-container">
              <div class="price-bar">
                <div
                  class="price-bar-marker"
                  :style="{ left: priceBarPosition(result.median, result.min, result.max) + '%' }"
                >
                  <span class="marker-label">{{ formatPrice(result.median) }}</span>
                </div>
              </div>
              <div class="price-bar-labels">
                <span class="price-label price-label--min">
                  <span class="price-label-title">{{ $t('valuation.minPrice') }}</span>
                  <span class="price-label-value">{{ formatPrice(result.min) }}</span>
                </span>
                <span class="price-label price-label--max">
                  <span class="price-label-title">{{ $t('valuation.maxPrice') }}</span>
                  <span class="price-label-value">{{ formatPrice(result.max) }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="stats-grid">
            <!-- Median -->
            <div class="stat-card stat-card--primary">
              <span class="stat-label">{{ $t('valuation.estimatedPrice') }}</span>
              <span class="stat-value stat-value--large">{{ formatPrice(result.median) }}</span>
            </div>

            <!-- Trend -->
            <div class="stat-card">
              <span class="stat-label">{{ $t('valuation.trend') }}</span>
              <span class="stat-value">
                <span class="trend-icon" aria-hidden="true">{{ trendIcon(result.trend) }}</span>
                {{ trendLabel(result.trend) }}
                <span v-if="result.trendPct !== 0" class="trend-pct">
                  ({{ result.trendPct > 0 ? '+' : '' }}{{ result.trendPct }}%)
                </span>
              </span>
            </div>

            <!-- Days to sell -->
            <div class="stat-card">
              <span class="stat-label">{{ $t('valuation.daysToSell') }}</span>
              <span class="stat-value">{{ result.daysToSell }} {{ $t('valuation.days') }}</span>
            </div>

            <!-- Sample size -->
            <div class="stat-card">
              <span class="stat-label">{{ $t('valuation.sampleSize') }}</span>
              <span class="stat-value">{{ result.sampleSize }} {{ $t('valuation.vehicles') }}</span>
            </div>

            <!-- Confidence -->
            <div class="stat-card">
              <span class="stat-label">{{ $t('valuation.confidence') }}</span>
              <span class="stat-value">
                <span
                  class="confidence-dot"
                  :style="{ backgroundColor: confidenceColor(result.confidence) }"
                  aria-hidden="true"
                />
                {{ confidenceLabel(result.confidence) }}
              </span>
            </div>
          </div>

          <!-- Detailed report preview (blurred) -->
          <div class="detailed-preview">
            <div class="detailed-preview-content">
              <div class="blurred-chart" aria-hidden="true">
                <div class="fake-bar" style="height: 40%" />
                <div class="fake-bar" style="height: 55%" />
                <div class="fake-bar" style="height: 70%" />
                <div class="fake-bar" style="height: 60%" />
                <div class="fake-bar" style="height: 80%" />
                <div class="fake-bar" style="height: 65%" />
                <div class="fake-bar" style="height: 75%" />
                <div class="fake-bar" style="height: 90%" />
              </div>
              <div class="blurred-table" aria-hidden="true">
                <div class="fake-row" />
                <div class="fake-row" />
                <div class="fake-row" />
                <div class="fake-row" />
              </div>
            </div>
            <div class="detailed-preview-overlay">
              <div class="overlay-content">
                <h3 class="overlay-title">{{ $t('valuation.detailedReport') }}</h3>
                <p class="overlay-desc">{{ $t('valuation.detailedReportDesc') }}</p>
                <button class="detailed-cta">
                  {{ $t('valuation.getDetailedReport') }} — {{ $t('valuation.detailedPrice') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Disclaimer -->
          <p class="disclaimer">{{ $t('valuation.disclaimer') }}</p>

          <!-- New valuation button -->
          <button class="submit-btn submit-btn--outline" @click="resetForm">
            {{ $t('valuation.newValuation') }}
          </button>
        </div>
      </section>

      <!-- History -->
      <section v-if="user && history.length > 0" class="history-section">
        <h2 class="history-title">{{ $t('valuation.history') }}</h2>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item">
            <div class="history-item-info">
              <span class="history-vehicle"
                >{{ item.brand }} {{ item.model }} ({{ item.year }})</span
              >
              <span class="history-date">{{ formatDate(item.created_at) }}</span>
            </div>
            <div class="history-item-price">
              <span class="history-range">
                {{ formatPrice(item.estimated_min) }} — {{ formatPrice(item.estimated_max) }}
              </span>
              <span
                class="confidence-dot confidence-dot--small"
                :style="{ backgroundColor: confidenceColor(item.confidence) }"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="user && showResults && history.length === 0" class="history-section">
        <h2 class="history-title">{{ $t('valuation.history') }}</h2>
        <p class="no-history">{{ $t('valuation.noHistory') }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   Valuation Page — Mobile-first (360px base)
   ================================================ */

.valuation-page {
  min-height: 60vh;
  background: var(--bg-secondary);
}

/* ---- Hero ---- */
.valuation-hero {
  background: var(--color-primary);
  padding: var(--spacing-10) var(--spacing-4) var(--spacing-8);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  margin-bottom: var(--spacing-3);
  line-height: var(--line-height-tight);
}

.hero-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-on-dark-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 560px;
  margin: 0 auto;
}

/* ---- Container ---- */
.valuation-container {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-16);
}

/* ---- Form Section ---- */
.valuation-form-section {
  margin-top: calc(var(--spacing-6) * -1);
}

.valuation-form {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-group--error .form-input {
  border-color: var(--color-error);
}

.form-group--error .form-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.required {
  color: var(--color-error);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-input::placeholder {
  color: var(--text-disabled);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-4) center;
  padding-right: var(--spacing-10);
  cursor: pointer;
}

.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* ---- Submit Button ---- */
.submit-btn {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  min-height: 48px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn--outline {
  background: transparent;
  color: var(--color-primary);
  margin-top: var(--spacing-4);
}

.submit-btn--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ---- Spinner ---- */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- No Data ---- */
.no-data-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8) var(--spacing-6);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  line-height: 1;
}

.no-data-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.no-data-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-6);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* ---- Result Card ---- */
.result-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.result-header {
  text-align: center;
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
}

.result-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.result-vehicle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* ---- Price Range Bar ---- */
.price-range-section {
  margin-bottom: var(--spacing-6);
}

.section-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-bar-container {
  position: relative;
}

.price-bar {
  height: 12px;
  border-radius: var(--border-radius-full);
  background: linear-gradient(
    90deg,
    var(--color-success) 0%,
    var(--color-warning) 50%,
    var(--color-error) 100%
  );
  position: relative;
  margin-bottom: var(--spacing-6);
}

.price-bar-marker {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-bar-marker::after {
  content: '';
  width: 20px;
  height: 20px;
  background: var(--color-white);
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  display: block;
}

.marker-label {
  position: absolute;
  top: -32px;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  background: var(--bg-primary);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
}

.price-bar-labels {
  display: flex;
  justify-content: space-between;
}

.price-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label--max {
  text-align: right;
}

.price-label-title {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
}

.price-label-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* ---- Stats Grid ---- */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.stat-card--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.stat-card--primary .stat-label {
  color: var(--text-on-dark-secondary);
}

.stat-card--primary .stat-value {
  color: var(--color-white);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.stat-value--large {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.trend-icon {
  font-size: var(--font-size-lg);
  line-height: 1;
}

.trend-pct {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-normal);
}

.confidence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.confidence-dot--small {
  width: 8px;
  height: 8px;
}

/* ---- Detailed Report Preview (Blurred) ---- */
.detailed-preview {
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-6);
  border: 1px solid var(--border-color-light);
}

.detailed-preview-content {
  padding: var(--spacing-6);
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.blurred-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
  height: 120px;
  margin-bottom: var(--spacing-4);
}

.fake-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary-light) 100%);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  min-width: 20px;
}

.blurred-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.fake-row {
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.fake-row:nth-child(odd) {
  width: 100%;
}

.fake-row:nth-child(even) {
  width: 85%;
}

.detailed-preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: var(--spacing-4);
}

.overlay-content {
  text-align: center;
  max-width: 360px;
}

.overlay-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.overlay-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
}

.detailed-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.detailed-cta:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

/* ---- Disclaimer ---- */
.disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--color-warning);
  margin-bottom: var(--spacing-4);
}

/* ---- History Section ---- */
.history-section {
  margin-top: var(--spacing-8);
}

.history-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-sm);
}

.history-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-vehicle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.history-date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.history-item-price {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.history-range {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.no-history {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
  text-align: center;
}

/* ================================================
   Responsive — 480px (large mobile)
   ================================================ */
@media (min-width: 480px) {
  .valuation-container {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }

  .history-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ================================================
   Responsive — 768px (tablet)
   ================================================ */
@media (min-width: 768px) {
  .valuation-hero {
    padding: var(--spacing-16) var(--spacing-6) var(--spacing-12);
  }

  .hero-title {
    font-size: var(--font-size-3xl);
  }

  .hero-subtitle {
    font-size: var(--font-size-lg);
  }

  .valuation-form {
    padding: var(--spacing-8);
  }

  .valuation-form-section {
    margin-top: calc(var(--spacing-8) * -1);
  }

  .result-card {
    padding: var(--spacing-8);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card--primary {
    grid-column: span 2;
  }

  .blurred-chart {
    height: 160px;
  }
}

/* ================================================
   Responsive — 1024px (desktop)
   ================================================ */
@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--font-size-4xl);
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-card--primary {
    grid-column: span 1;
  }
}
</style>
