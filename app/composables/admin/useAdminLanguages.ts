/**
 * Composable for the admin Languages config page.
 * Owns all reactive state and business logic for locale management,
 * translation engine configuration, translation progress, and pending queue.
 */
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

export interface LocaleProgress {
  locale: string
  label: string
  existing: number
  expected: number
  percentage: number
}

export interface LocaleOption {
  value: string
  label: string
}

export interface EngineOption {
  value: string
  label: string
}

export const availableLocales: LocaleOption[] = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'it', label: 'Italiano' },
]

export const translationEngines: EngineOption[] = [
  { value: 'gpt4omini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude_haiku', label: 'Claude Haiku (Anthropic)' },
  { value: 'deepl', label: 'DeepL' },
]

export function useAdminLanguages() {
  const supabase = useSupabaseClient()
  const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

  // --- Local form state ---
  const activeLocales = ref<string[]>([])
  const defaultLocale = ref('es')
  const translationEngine = ref('gpt4omini')
  const translationApiKey = ref('')
  const autoTranslateOnPublish = ref(false)

  // --- Translation progress state ---
  const translationProgress = ref<LocaleProgress[]>([])
  const loadingProgress = ref(false)

  // --- Pending translations queue state ---
  const pendingVehicles = ref(0)
  const pendingArticles = ref(0)
  const translating = ref(false)
  const translateSuccess = ref(false)

  // --- Computed ---
  const defaultLocaleOptions = computed(() => {
    return availableLocales.filter((loc) => activeLocales.value.includes(loc.value))
  })

  const translatableLocales = computed(() => {
    return activeLocales.value.filter((l) => l !== defaultLocale.value)
  })

  const translateAllDisabled = computed(() => {
    return (pendingVehicles.value === 0 && pendingArticles.value === 0) || !translationApiKey.value
  })

  const hasChanges = computed(() => {
    if (!config.value) return false
    const origLocales = config.value.active_locales || ['es']
    const origDefault = config.value.default_locale || 'es'
    const origEngine = config.value.translation_engine || 'gpt4omini'
    const origKey = config.value.translation_api_key_encrypted || ''
    const origAutoTranslate = config.value.auto_translate_on_publish ?? false

    if (activeLocales.value.length !== origLocales.length) return true
    if (activeLocales.value.some((l) => !origLocales.includes(l))) return true
    if (origLocales.some((l: string) => !activeLocales.value.includes(l))) return true
    if (defaultLocale.value !== origDefault) return true
    if (translationEngine.value !== origEngine) return true
    if (translationApiKey.value !== origKey) return true
    if (autoTranslateOnPublish.value !== origAutoTranslate) return true
    return false
  })

  // --- Data fetching ---
  async function fetchTranslationProgress(): Promise<void> {
    loadingProgress.value = true
    try {
      const locales = translatableLocales.value
      if (locales.length === 0) {
        translationProgress.value = []
        return
      }

      // Count active vehicles
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')

      // Count published articles
      const { count: articleCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')

      const totalVehicles = vehicleCount ?? 0
      const totalArticles = articleCount ?? 0

      // Translatable fields: vehicles = 1 (description), articles = 3 (content, description, excerpt)
      const vehicleFields = 1
      const articleFields = 3

      const progressList: LocaleProgress[] = []

      for (const locale of locales) {
        // Count existing translations for this locale
        const { count: vehicleTranslations } = await supabase
          .from('content_translations')
          .select('id', { count: 'exact', head: true })
          .eq('entity_type', 'vehicle')
          .eq('locale', locale)

        const { count: articleTranslations } = await supabase
          .from('content_translations')
          .select('id', { count: 'exact', head: true })
          .eq('entity_type', 'article')
          .eq('locale', locale)

        const existing = (vehicleTranslations ?? 0) + (articleTranslations ?? 0)
        const expected = totalVehicles * vehicleFields + totalArticles * articleFields
        const percentage = expected > 0 ? Math.round((existing / expected) * 100) : 0

        const localeInfo = availableLocales.find((l) => l.value === locale)
        progressList.push({
          locale,
          label: localeInfo?.label ?? locale,
          existing,
          expected,
          percentage: Math.min(percentage, 100),
        })
      }

      translationProgress.value = progressList
    } catch {
      // Silently fail \u2014 progress is informational
      translationProgress.value = []
    } finally {
      loadingProgress.value = false
    }
  }

  async function fetchPendingCounts(): Promise<void> {
    try {
      const { count: vCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('pending_translations', true)

      const { count: aCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('pending_translations', true)

      pendingVehicles.value = vCount ?? 0
      pendingArticles.value = aCount ?? 0
    } catch {
      pendingVehicles.value = 0
      pendingArticles.value = 0
    }
  }

  // --- Actions ---
  async function handleTranslateAll(): Promise<void> {
    if (translateAllDisabled.value) return
    translating.value = true
    translateSuccess.value = false

    try {
      // Placeholder: clear pending_translations flags
      if (pendingVehicles.value > 0) {
        await supabase
          .from('vehicles')
          .update({ pending_translations: false } as never)
          .eq('pending_translations', true)
      }

      if (pendingArticles.value > 0) {
        await supabase
          .from('articles')
          .update({ pending_translations: false } as never)
          .eq('pending_translations', true)
      }

      pendingVehicles.value = 0
      pendingArticles.value = 0
      translateSuccess.value = true

      // Hide success message after 4 seconds
      setTimeout(() => {
        translateSuccess.value = false
      }, 4000)
    } catch {
      // Error handling \u2014 keep current state
    } finally {
      translating.value = false
    }
  }

  async function handleSave(): Promise<void> {
    if (activeLocales.value.length === 0) {
      return
    }
    await saveFields({
      active_locales: [...activeLocales.value],
      default_locale: defaultLocale.value,
      translation_engine: translationEngine.value,
      translation_api_key_encrypted: translationApiKey.value || null,
      auto_translate_on_publish: autoTranslateOnPublish.value,
    })
  }

  // --- Watchers ---
  // If the default locale is deselected, reset to first active
  watch(activeLocales, (newLocales) => {
    if (!newLocales.includes(defaultLocale.value)) {
      defaultLocale.value = newLocales[0] || 'es'
    }
  })

  // Re-fetch translation progress when active locales or default locale changes
  watch([activeLocales, defaultLocale], () => {
    fetchTranslationProgress()
  })

  // --- Init (call from page onMounted) ---
  async function init(): Promise<void> {
    const cfg = await loadConfig()
    if (cfg) {
      activeLocales.value = [...(cfg.active_locales || ['es'])]
      defaultLocale.value = cfg.default_locale || 'es'
      translationEngine.value = cfg.translation_engine || 'gpt4omini'
      translationApiKey.value = cfg.translation_api_key_encrypted || ''
      autoTranslateOnPublish.value = cfg.auto_translate_on_publish ?? false
    }

    // Fetch translation progress and pending counts after config loads
    await Promise.all([fetchTranslationProgress(), fetchPendingCounts()])
  }

  return {
    // State from vertical config
    loading,
    saving,
    error,
    saved,

    // Local form state
    activeLocales,
    defaultLocale,
    translationEngine,
    translationApiKey,
    autoTranslateOnPublish,

    // Translation progress
    translationProgress,
    loadingProgress,

    // Pending queue
    pendingVehicles,
    pendingArticles,
    translating,
    translateSuccess,

    // Computed
    defaultLocaleOptions,
    translatableLocales,
    translateAllDisabled,
    hasChanges,

    // Actions
    handleTranslateAll,
    handleSave,

    // Init
    init,
  }
}
