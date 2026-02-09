/**
 * Admin Config Composable
 * Manage config settings including banner
 */

export interface BannerConfig {
  text_es: string
  text_en: string
  url: string | null
  from_date: string | null
  to_date: string | null
  active: boolean
}

export interface ConfigValue {
  banner?: BannerConfig
  [key: string]: unknown
}

export function useAdminConfig() {
  const supabase = useSupabaseClient()

  const config = ref<ConfigValue>({})
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all config values
   */
  async function fetchConfig() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('config')
        .select('key, value')

      if (err) throw err

      // Convert array to object
      const configData = (data as { key: string; value: unknown }[]) || []
      const result: ConfigValue = {}
      for (const item of configData) {
        result[item.key] = item.value
      }
      config.value = result
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching config'
      config.value = {}
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get a specific config value
   */
  async function getConfigValue<T>(key: string): Promise<T | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('config')
        .select('value')
        .eq('key', key)
        .single()

      if (err && err.code !== 'PGRST116') throw err // PGRST116 = not found

      return (data as { value: T } | null)?.value || null
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching config'
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Set a config value (upsert)
   */
  async function setConfigValue(key: string, value: unknown): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('config')
        .upsert({ key, value } as never)

      if (err) throw err

      // Update local cache
      config.value = { ...config.value, [key]: value }

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error saving config'
      return false
    }
    finally {
      saving.value = false
    }
  }

  // =====================
  // Banner-specific methods
  // =====================

  const banner = computed<BannerConfig>(() => {
    const b = config.value.banner as BannerConfig | undefined
    return {
      text_es: b?.text_es || '',
      text_en: b?.text_en || '',
      url: b?.url || null,
      from_date: b?.from_date || null,
      to_date: b?.to_date || null,
      active: b?.active || false,
    }
  })

  /**
   * Check if banner is currently active (considering dates)
   */
  const isBannerActive = computed(() => {
    if (!banner.value.active) return false
    if (!banner.value.text_es && !banner.value.text_en) return false

    const now = new Date()

    if (banner.value.from_date) {
      const fromDate = new Date(banner.value.from_date)
      if (now < fromDate) return false
    }

    if (banner.value.to_date) {
      const toDate = new Date(banner.value.to_date)
      if (now > toDate) return false
    }

    return true
  })

  /**
   * Fetch banner config
   */
  async function fetchBanner(): Promise<BannerConfig> {
    const value = await getConfigValue<BannerConfig>('banner')
    if (value) {
      config.value = { ...config.value, banner: value }
    }
    return banner.value
  }

  /**
   * Save banner config
   */
  async function saveBanner(bannerData: BannerConfig): Promise<boolean> {
    return setConfigValue('banner', bannerData)
  }

  /**
   * Toggle banner active status
   */
  async function toggleBannerActive(): Promise<boolean> {
    const current = banner.value
    return saveBanner({
      ...current,
      active: !current.active,
    })
  }

  /**
   * Generate banner preview HTML
   */
  function getBannerPreviewHtml(lang: 'es' | 'en' = 'es'): string {
    const text = lang === 'es' ? banner.value.text_es : banner.value.text_en
    if (!text) return ''

    let html = escapeHtml(text)

    if (banner.value.url) {
      const linkText = lang === 'es' ? 'Más información' : 'More info'
      const isExternal = !banner.value.url.startsWith('/')
      const target = isExternal ? ' target="_blank" rel="noopener"' : ''
      html += ` <a href="${escapeHtml(banner.value.url)}"${target} style="color:#0F2A2E;font-weight:600;text-decoration:underline">${linkText}</a>`
    }

    return html
  }

  return {
    config: readonly(config),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchConfig,
    getConfigValue,
    setConfigValue,
    // Banner-specific
    banner,
    isBannerActive,
    fetchBanner,
    saveBanner,
    toggleBannerActive,
    getBannerPreviewHtml,
  }
}

// Helper function to escape HTML (SSR-safe)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
