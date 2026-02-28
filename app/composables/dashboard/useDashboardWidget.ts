export interface CategoryOption {
  id: string
  slug: string
  name_es: string
  name_en: string | null
}

export function useDashboardWidget() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canUseWidget, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  const categories = ref<CategoryOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const copySuccess = ref(false)

  // Widget configuration
  const vehicleCount = ref<number>(6)
  const theme = ref<'light' | 'dark'>('light')
  const selectedCategory = ref<string>('')
  const widgetWidth = ref<string>('100%')
  const widgetHeight = ref<string>('600')
  const useAutoHeight = ref(true)

  const VEHICLE_COUNT_OPTIONS = [3, 6, 9, 12]

  const dealerSlug = computed<string>(() => dealerProfile.value?.slug || '')

  const embedUrl = computed<string>(() => {
    if (!dealerSlug.value) return ''
    const params = new URLSearchParams()
    params.set('limit', String(vehicleCount.value))
    params.set('theme', theme.value)
    if (selectedCategory.value) params.set('category', selectedCategory.value)
    return `https://tracciona.com/embed/${dealerSlug.value}?${params.toString()}`
  })

  const iframeHeight = computed<string>(() =>
    useAutoHeight.value ? '600' : widgetHeight.value || '600',
  )

  const iframeWidth = computed<string>(() => widgetWidth.value || '100%')

  const embedCode = computed<string>(() => {
    if (!embedUrl.value) return ''
    const w = iframeWidth.value
    const h = iframeHeight.value
    return `<iframe src="${embedUrl.value}" width="${w}" height="${h}" frameborder="0" title="${t('dashboard.widget.iframeTitle')}"></iframe>`
  })

  const previewUrl = computed<string>(() => {
    if (!dealerSlug.value) return ''
    const params = new URLSearchParams()
    params.set('limit', String(vehicleCount.value))
    params.set('theme', theme.value)
    if (selectedCategory.value) params.set('category', selectedCategory.value)
    return `/embed/${dealerSlug.value}?${params.toString()}`
  })

  async function loadCategories(): Promise<void> {
    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('id, slug, name_es, name_en')
        .order('sort_order', { ascending: true })
      if (err) throw err
      categories.value = (data || []) as CategoryOption[]
    } catch {
      categories.value = []
    }
  }

  async function init(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await Promise.all([loadDealer(), loadCategories(), fetchSubscription()])
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('dashboard.widget.errorLoading')
    } finally {
      loading.value = false
    }
  }

  async function handleCopyCode(): Promise<void> {
    if (!embedCode.value) return
    try {
      await navigator.clipboard.writeText(embedCode.value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = embedCode.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  }

  return {
    categories,
    loading,
    error,
    copySuccess,
    vehicleCount,
    theme,
    selectedCategory,
    widgetWidth,
    widgetHeight,
    useAutoHeight,
    VEHICLE_COUNT_OPTIONS,
    canUseWidget,
    embedCode,
    previewUrl,
    iframeWidth,
    init,
    handleCopyCode,
  }
}
