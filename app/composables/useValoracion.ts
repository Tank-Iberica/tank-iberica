/**
 * Composable for the vehicle valuation page.
 * Extracts all logic from valoracion.vue: form state, validation,
 * market-data calculations, history, and display helpers.
 */
import { localizedField } from '~/composables/useLocalized'

/* ---- Types ---- */

export interface ValoracionSubcategoryRow {
  id: string
  name: Record<string, string> | null
  name_es: string
  slug: string
}

export interface ValoracionFormData {
  brand: string
  model: string
  year: number | null
  km: number | null
  province: string
  subcategory: string
  email: string
}

export interface ValoracionResultData {
  min: number
  max: number
  median: number
  trend: 'rising' | 'falling' | 'stable'
  trendPct: number
  daysToSell: number
  sampleSize: number
  confidence: 'high' | 'medium' | 'low'
}

export interface ValoracionHistoryItem {
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

/* ---- Provinces ---- */

export const PROVINCES: readonly string[] = [
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
] as const

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
      .eq('vertical', 'tracciona')
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
      const rawMedian = sortedPrices[Math.floor(sortedPrices.length / 2)] ?? sortedPrices[0]!

      /* 3. Year depreciation: each year older than newest = -5% */
      const currentYear = new Date().getFullYear()
      const vehicleYear = form.year || currentYear
      const ageFactor = Math.max(0.5, 1 - (currentYear - vehicleYear) * 0.05)

      /* 4. Apply factor */
      const estimatedMin = Math.round(rawMin * ageFactor)
      const estimatedMax = Math.round(rawMax * ageFactor)
      const estimatedMedian = Math.round((rawMedian ?? 0) * ageFactor)

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
          const recent = Number(historyRows[0]!.avg_price) || 0
          const previous = Number(historyRows[1]!.avg_price) || 0
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

  /* ---- Display helpers ---- */

  function formatPrice(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  function priceBarPosition(value: number, min: number, max: number): number {
    if (max === min) return 50
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  }

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

  function trendIcon(trend: string): string {
    switch (trend) {
      case 'rising':
        return '\u2197'
      case 'falling':
        return '\u2198'
      default:
        return '\u2192'
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
