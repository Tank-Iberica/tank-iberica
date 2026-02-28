/**
 * Admin composable for editing vertical_config table.
 * Used by /admin/config/* pages for branding, navigation, homepage, etc.
 */
// getVerticalSlug() is auto-imported from ~/composables/useVerticalConfig

export interface VerticalConfigRow {
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
  google_search_console: string | null
  google_adsense_id: string | null
  cloudinary_cloud_name: string | null
  translation_engine: string | null
  translation_api_key_encrypted: string | null
  subscription_prices: Record<string, Record<string, number>>
  commission_rates: Record<string, number>
  email_templates: Record<string, Record<string, unknown>>
  banners: Array<Record<string, unknown>>
  require_vehicle_approval: boolean
  require_article_approval: boolean
  auto_translate_on_publish: boolean
  auto_publish_social: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export function useAdminVerticalConfig() {
  const supabase = useSupabaseClient()
  const config = useState<VerticalConfigRow | null>('admin-vertical-config', () => null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const saved = ref(false)

  async function loadConfig(): Promise<VerticalConfigRow | null> {
    if (config.value) return config.value
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('vertical_config')
        .select('*')
        .eq('vertical', getVerticalSlug())
        .single()
      if (err) throw err
      config.value = data as VerticalConfigRow
      return config.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading config'
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveFields(fields: Partial<VerticalConfigRow>): Promise<boolean> {
    if (!config.value?.id) return false
    saving.value = true
    error.value = null
    saved.value = false
    try {
      const { error: err } = await supabase
        .from('vertical_config')
        .update(fields as never)
        .eq('id', config.value.id)
      if (err) throw err
      Object.assign(config.value, fields)
      saved.value = true
      setTimeout(() => {
        saved.value = false
      }, 3000)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error saving config'
      return false
    } finally {
      saving.value = false
    }
  }

  function invalidateCache() {
    config.value = null
  }

  return {
    config,
    loading,
    saving,
    error,
    saved,
    loadConfig,
    saveFields,
    invalidateCache,
  }
}
