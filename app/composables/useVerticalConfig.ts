/**
 * Composable for loading and using vertical configuration.
 * Reads from vertical_config table and provides theme/feature helpers.
 */

/** Current vertical slug — reads from NUXT_PUBLIC_VERTICAL env or defaults to 'tracciona' */
function applyTheme(theme: Record<string, string>) {
  if (!import.meta.client) return
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key.replaceAll('_', '-')}`, value)
  })
}

export function getVerticalSlug(): string {
  try {
    return useRuntimeConfig().public.vertical || 'tracciona'
  } catch {
    return 'tracciona'
  }
}

interface VerticalConfig {
  id: string
  vertical: string
  name: Record<string, string>
  tagline: Record<string, string> | null
  meta_description: Record<string, string> | null
  logo_url: string | null
  logo_dark_url: string | null
  favicon_url: string | null
  og_image_url: string | null
  theme: Record<string, string>
  font_preset: string | null
  header_links: Array<Record<string, unknown>>
  footer_text: Record<string, string> | null
  footer_links: Array<Record<string, unknown>>
  social_links: Record<string, string>
  hero_title: Record<string, string> | null
  hero_subtitle: Record<string, string> | null
  hero_cta_text: Record<string, string> | null
  hero_cta_url: string | null
  hero_image_url: string | null
  homepage_sections: Record<string, boolean>
  active_locales: string[]
  default_locale: string
  active_actions: string[]
  google_analytics_id: string | null
  subscription_prices: Record<string, Record<string, number>>
  commission_rates: Record<string, number>
  require_vehicle_approval: boolean
  require_article_approval: boolean
  auto_translate_on_publish: boolean
  auto_publish_social: boolean
  default_currency: string | null
  [key: string]: unknown
}

/** Composable for vertical config. */
export function useVerticalConfig() {
  const config = useState<VerticalConfig | null>('vertical_config', () => null)

  async function loadConfig() {
    if (config.value) return config.value
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('vertical_config')
      .select('*')
      .eq('vertical', getVerticalSlug())
      .single()
    config.value = data as VerticalConfig | null
    return data
  }

  function isSectionActive(section: string): boolean {
    return config.value?.homepage_sections?.[section] ?? false
  }

  function isLocaleActive(locale: string): boolean {
    return config.value?.active_locales?.includes(locale) ?? false
  }

  function isActionActive(action: string): boolean {
    return config.value?.active_actions?.includes(action) ?? false
  }

  function getCurrency(): string {
    return config.value?.default_currency || 'EUR'
  }

  /**
   * Get a vertical-specific localized term.
   * Falls back to i18n defaults if vertical_config.terms is not set.
   *
   * Usage: localizedTerm('product', 'singular') → "vehículo" (for Tracciona ES)
   *                                              → "equipo" (for Horecaria ES)
   */
  function localizedTerm(
    key: string,
    form: 'singular' | 'plural' = 'singular',
    locale?: string,
  ): string {
    const loc = locale || (useI18n?.().locale?.value ?? 'es')

    // Try reading from vertical_config.terms JSONB
    const terms = (config.value as Record<string, unknown>)?.terms as
      | Record<string, Record<string, Record<string, string>>>
      | undefined

    if (terms?.[key]?.[form]?.[loc]) {
      return terms[key]![form]![loc]!
    }

    // Defaults per vertical
    const defaults: Record<string, Record<string, Record<string, Record<string, string>>>> = {
      tracciona: {
        product: {
          singular: { es: 'vehículo', en: 'vehicle' },
          plural: { es: 'vehículos', en: 'vehicles' },
        },
      },
      horecaria: {
        product: {
          singular: { es: 'equipo', en: 'equipment' },
          plural: { es: 'equipos', en: 'equipment' },
        },
      },
    }

    const slug = getVerticalSlug()
    return defaults[slug]?.[key]?.[form]?.[loc] ?? defaults.tracciona?.[key]?.[form]?.[loc] ?? key
  }

  return {
    config,
    loadConfig,
    applyTheme,
    isSectionActive,
    isLocaleActive,
    isActionActive,
    getCurrency,
    localizedTerm,
  }
}
