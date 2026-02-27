/**
 * Composable for the admin Navigation config page.
 * Owns all reactive state and business logic for header links,
 * footer text, footer links, and social links.
 */
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

export interface LinkItem {
  label_es: string
  label_en: string
  url: string
  visible: boolean
}

export type LinkField = keyof LinkItem

export function useAdminNavigation() {
  const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

  // --- Local form state ---
  const headerLinks = ref<LinkItem[]>([])
  const footerText = ref<Record<string, string>>({ es: '', en: '' })
  const footerLinks = ref<LinkItem[]>([])
  const socialLinks = ref<Record<string, string>>({
    linkedin: '',
    instagram: '',
    facebook: '',
    x: '',
  })

  function populateForm(): void {
    if (!config.value) return

    headerLinks.value = Array.isArray(config.value.header_links)
      ? config.value.header_links.map((link) => ({
          label_es: (link.label_es as string) || '',
          label_en: (link.label_en as string) || '',
          url: (link.url as string) || '',
          visible: link.visible !== false,
        }))
      : []

    footerText.value = { es: '', en: '', ...(config.value.footer_text || {}) }

    footerLinks.value = Array.isArray(config.value.footer_links)
      ? config.value.footer_links.map((link) => ({
          label_es: (link.label_es as string) || '',
          label_en: (link.label_en as string) || '',
          url: (link.url as string) || '',
          visible: link.visible !== false,
        }))
      : []

    socialLinks.value = {
      linkedin: '',
      instagram: '',
      facebook: '',
      x: '',
      ...(config.value.social_links || {}),
    }
  }

  /** Call this from the page's onMounted. Does NOT call onMounted itself. */
  async function init(): Promise<void> {
    await loadConfig()
    populateForm()
  }

  // --- Header links helpers ---
  function addHeaderLink(): void {
    headerLinks.value.push({ label_es: '', label_en: '', url: '', visible: true })
  }

  function removeHeaderLink(index: number): void {
    headerLinks.value.splice(index, 1)
  }

  function moveHeaderLink(index: number, direction: -1 | 1): void {
    const target = index + direction
    if (target < 0 || target >= headerLinks.value.length) return
    const items = [...headerLinks.value]
    const temp = items[index] as LinkItem
    items[index] = items[target] as LinkItem
    items[target] = temp
    headerLinks.value = items
  }

  // --- Footer links helpers ---
  function addFooterLink(): void {
    footerLinks.value.push({ label_es: '', label_en: '', url: '', visible: true })
  }

  function removeFooterLink(index: number): void {
    footerLinks.value.splice(index, 1)
  }

  function moveFooterLink(index: number, direction: -1 | 1): void {
    const target = index + direction
    if (target < 0 || target >= footerLinks.value.length) return
    const items = [...footerLinks.value]
    const temp = items[index] as LinkItem
    items[index] = items[target] as LinkItem
    items[target] = temp
    footerLinks.value = items
  }

  // --- Generic update helpers ---
  function updateLinkField(
    links: Ref<LinkItem[]>,
    index: number,
    field: LinkField,
    value: string | boolean,
  ): void {
    const link = links.value[index]
    if (!link) return
    if (field === 'visible') {
      link.visible = value as boolean
    } else {
      link[field] = value as string
    }
  }

  function updateHeaderLinkField(index: number, field: LinkField, value: string | boolean): void {
    updateLinkField(headerLinks, index, field, value)
  }

  function updateFooterLinkField(index: number, field: LinkField, value: string | boolean): void {
    updateLinkField(footerLinks, index, field, value)
  }

  function updateFooterText(lang: string, value: string): void {
    footerText.value[lang] = value
  }

  function updateSocialLink(key: string, value: string): void {
    socialLinks.value[key] = value
  }

  async function handleSave(): Promise<void> {
    const fields: Record<string, unknown> = {
      header_links: headerLinks.value,
      footer_text: footerText.value,
      footer_links: footerLinks.value,
      social_links: socialLinks.value,
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
    headerLinks,
    footerText,
    footerLinks,
    socialLinks,

    // Init
    init,

    // Header links
    addHeaderLink,
    removeHeaderLink,
    moveHeaderLink,
    updateHeaderLinkField,

    // Footer links
    addFooterLink,
    removeFooterLink,
    moveFooterLink,
    updateFooterLinkField,

    // Footer text
    updateFooterText,

    // Social links
    updateSocialLink,

    // Save
    handleSave,
  }
}
