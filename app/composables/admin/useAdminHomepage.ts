/**
 * Composable for the admin Homepage config page.
 * Owns all reactive state and business logic for the hero section,
 * homepage sections toggles, and promotional banners.
 */
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

export interface BannerItem {
  id: string
  content_es: string
  content_en: string
  url: string
  bg_color: string
  text_color: string
  active: boolean
  starts_at: string
  ends_at: string
}

export type BannerField = keyof BannerItem

export interface SectionDefinition {
  key: string
  label: string
  description: string
}

export const sectionDefinitions: SectionDefinition[] = [
  {
    key: 'featured_vehicles',
    label: 'Vehiculos destacados',
    description: 'Carrusel de vehiculos destacados',
  },
  {
    key: 'categories_grid',
    label: 'Grid de categorias',
    description: 'Rejilla de subcategorias con imagen',
  },
  { key: 'latest_news', label: 'Ultimas noticias', description: 'Seccion de noticias recientes' },
  {
    key: 'comparatives',
    label: 'Comparativas',
    description: 'Seccion de comparativas de vehiculos',
  },
  { key: 'auctions', label: 'Subastas', description: 'Seccion de subastas activas' },
  {
    key: 'stats_counter',
    label: 'Contador de estadisticas',
    description: 'Numeros del marketplace',
  },
  {
    key: 'dealer_logos',
    label: 'Logos de distribuidores',
    description: 'Carrusel de logos de concesionarios',
  },
  {
    key: 'newsletter_cta',
    label: 'Newsletter CTA',
    description: 'Seccion de suscripcion al boletin',
  },
]

export function useAdminHomepage() {
  const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

  // --- Local form state ---
  const heroTitle = ref<Record<string, string>>({ es: '', en: '' })
  const heroSubtitle = ref<Record<string, string>>({ es: '', en: '' })
  const heroCtaText = ref<Record<string, string>>({ es: '', en: '' })
  const heroCtaUrl = ref('')
  const heroImageUrl = ref('')
  const homepageSections = ref<Record<string, boolean>>({})
  const banners = ref<BannerItem[]>([])

  function generateBannerId(): string {
    return `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  }

  function populateForm(): void {
    if (!config.value) return

    heroTitle.value = { es: '', en: '', ...(config.value.hero_title || {}) }
    heroSubtitle.value = { es: '', en: '', ...(config.value.hero_subtitle || {}) }
    heroCtaText.value = { es: '', en: '', ...(config.value.hero_cta_text || {}) }
    heroCtaUrl.value = config.value.hero_cta_url || ''
    heroImageUrl.value = config.value.hero_image_url || ''

    // Sections: default all to false, then overlay saved values
    const sections: Record<string, boolean> = {}
    for (const def of sectionDefinitions) {
      sections[def.key] = false
    }
    if (config.value.homepage_sections) {
      Object.assign(sections, config.value.homepage_sections)
    }
    homepageSections.value = sections

    banners.value = Array.isArray(config.value.banners)
      ? config.value.banners.map((b) => ({
          id: (b.id as string) || generateBannerId(),
          content_es: (b.content_es as string) || '',
          content_en: (b.content_en as string) || '',
          url: (b.url as string) || '',
          bg_color: (b.bg_color as string) || '#23424A',
          text_color: (b.text_color as string) || '#FFFFFF',
          active: b.active !== false,
          starts_at: (b.starts_at as string) || '',
          ends_at: (b.ends_at as string) || '',
        }))
      : []
  }

  /** Call this from the page's onMounted. Does NOT call onMounted itself. */
  async function init(): Promise<void> {
    await loadConfig()
    populateForm()
  }

  // --- Hero update helpers ---
  function updateHeroTitle(lang: string, value: string): void {
    heroTitle.value[lang] = value
  }

  function updateHeroSubtitle(lang: string, value: string): void {
    heroSubtitle.value[lang] = value
  }

  function updateHeroCtaText(lang: string, value: string): void {
    heroCtaText.value[lang] = value
  }

  function updateHeroCtaUrl(value: string): void {
    heroCtaUrl.value = value
  }

  function updateHeroImageUrl(value: string): void {
    heroImageUrl.value = value
  }

  // --- Sections helpers ---
  function toggleSection(key: string, value: boolean): void {
    homepageSections.value[key] = value
  }

  // --- Banner helpers ---
  function addBanner(): void {
    banners.value.push({
      id: generateBannerId(),
      content_es: '',
      content_en: '',
      url: '',
      bg_color: '#23424A',
      text_color: '#FFFFFF',
      active: true,
      starts_at: '',
      ends_at: '',
    })
  }

  function removeBanner(index: number): void {
    banners.value.splice(index, 1)
  }

  function updateBannerField(index: number, field: BannerField, value: string | boolean): void {
    const banner = banners.value[index]
    if (!banner) return
    if (field === 'active') {
      banner.active = value as boolean
    } else {
      banner[field] = value as string
    }
  }

  async function handleSave(): Promise<void> {
    const fields: Record<string, unknown> = {
      hero_title: heroTitle.value,
      hero_subtitle: heroSubtitle.value,
      hero_cta_text: heroCtaText.value,
      hero_cta_url: heroCtaUrl.value || null,
      hero_image_url: heroImageUrl.value || null,
      homepage_sections: homepageSections.value,
      banners: banners.value,
    }
    await saveFields(fields)
  }

  return {
    // State from vertical config
    config,
    loading,
    saving,
    error,
    saved,

    // Local form state
    heroTitle,
    heroSubtitle,
    heroCtaText,
    heroCtaUrl,
    heroImageUrl,
    homepageSections,
    banners,

    // Init
    init,

    // Hero updates
    updateHeroTitle,
    updateHeroSubtitle,
    updateHeroCtaText,
    updateHeroCtaUrl,
    updateHeroImageUrl,

    // Sections
    toggleSection,

    // Banners
    addBanner,
    removeBanner,
    updateBannerField,

    // Save
    handleSave,
  }
}
