// Re-export types and constants for backwards compatibility
import type {
  ValoracionSubcategoryRow,
  ValoracionFormData,
  ValoracionResultData,
  ValoracionHistoryItem,
} from '~/composables/shared/valoracionTypes'
import { PROVINCES } from '~/composables/shared/valoracionTypes'

import {
  priceBarPosition,
  confidenceColor,
  computeValuationPrices,
  computeAvgDaysToSell,
  computeConfidenceLevel,
  fetchTrendData,
  saveValuationReport,
  trendIcon,
} from '~/composables/shared/valoracionHelpers'

import { formatPrice } from '~/utils/formatters'
import { localizedField } from '~/composables/useLocalized'
import { getVerticalSlug } from '~/composables/useVerticalConfig'

export type {
  ConfidenceLevel,
  ValoracionSubcategoryRow,
  ValoracionFormData,
  ValoracionResultData,
  ValoracionHistoryItem,
} from '~/composables/shared/valoracionTypes'
export { PROVINCES } from '~/composables/shared/valoracionTypes'

/* ---- Composable ---- */

export function useValoracion() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /* ---- Subcategories ---- */
  const subcategories = ref<ValoracionSubcategoryRow[]>([])

  async function loadSubcategories(): Promise<void> {
    const { data } = await supabase
      .from('subcategories')
      .select('id, name, name_es, slug')
      .eq('vertical', getVerticalSlug())
      .order('sort_order')

    if (data) {
      subcategories.value = data as ValoracionSubcategoryRow[]
    }
  }

  /* ---- Form state ---- */
  const form = reactive<ValoracionFormData>({
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
  const result = ref<ValoracionResultData | null>(null)
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
  async function calculateValuation(): Promise<void> {
    if (!validateForm()) return

    loading.value = true
    showResults.value = false
    noData.value = false
    result.value = null

    try {
      /* 1. Fetch matching market data */
      let query = supabase
        .from('market_data' as never)
        .select(
          'brand, subcategory_slug, province, avg_price, min_price, max_price, sample_count, last_updated',
        )
        .eq('vertical', getVerticalSlug())
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

      /* 2. Compute price estimates */
      const prices = rows.map((r) => Number(r.avg_price)).filter((p) => p > 0 && !Number.isNaN(p))
      const priceEstimate = computeValuationPrices(prices, form.year)

      if (!priceEstimate) {
        noData.value = true
        showResults.value = true
        return
      }

      /* 3. Trend, confidence, days to sell */
      const { trend, trendPct } = await fetchTrendData(supabase, form.brand)
      const confidence = computeConfidenceLevel(prices.length)

      result.value = {
        ...priceEstimate,
        trend,
        trendPct,
        daysToSell: computeAvgDaysToSell(rows),
        sampleSize: prices.length,
        confidence,
      }

      showResults.value = true

      /* 4. Save report & reload history */
      await saveValuationReport(supabase, form, result.value, user.value?.id || null)
      if (user.value) await loadHistory()
    } finally {
      loading.value = false
    }
  }

  /* ---- Display helpers ---- */

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

  function subcategoryLabel(sub: ValoracionSubcategoryRow): string {
    if (sub.name) {
      return localizedField(sub.name, locale.value)
    }
    return sub.name_es
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  /* ---- History ---- */
  const history = ref<ValoracionHistoryItem[]>([])

  async function loadHistory(): Promise<void> {
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
        history.value = data as unknown as ValoracionHistoryItem[]
      }
    } catch {
      // valuation_reports may not exist yet
    }
  }

  /* ---- Reset form ---- */
  function resetForm(): void {
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

  /* ---- Update a single form field ---- */
  function updateFormField(field: keyof ValoracionFormData, value: string | number | null): void {
    ;(form as Record<string, string | number | null>)[field] = value
  }

  /* ---- Init (call from onMounted in page) ---- */
  async function init(): Promise<void> {
    await loadSubcategories()
    if (user.value) {
      await loadHistory()
    }
  }

  return {
    /* State */
    form,
    formErrors,
    loading,
    showResults,
    result,
    noData,
    subcategories,
    history,
    user,

    /* Actions */
    init,
    calculateValuation,
    resetForm,
    updateFormField,
    validateForm,

    /* Display helpers */
    formatPrice,
    priceBarPosition,
    confidenceColor,
    trendIcon,
    trendLabel,
    confidenceLabel,
    subcategoryLabel,
    formatDate,

    /* Constants */
    provinces: PROVINCES,
  }
}
