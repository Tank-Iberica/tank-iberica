/**
 * Composable for loading and using vertical configuration.
 * Reads from vertical_config table and provides theme/feature helpers.
 */

/** Current vertical slug — reads from NUXT_PUBLIC_VERTICAL env or defaults to 'tracciona' */
export function getVerticalSlug(): string {
  try {
    return (useRuntimeConfig().public.vertical as string) || 'tracciona'
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
  [key: string]: unknown
}

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

  function applyTheme(theme: Record<string, string>) {
    if (!import.meta.client) return
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/_/g, '-')}`, value)
    })
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

  return { config, loadConfig, applyTheme, isSectionActive, isLocaleActive, isActionActive }
}
