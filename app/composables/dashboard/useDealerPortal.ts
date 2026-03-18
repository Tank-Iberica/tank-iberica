/**
 * Dealer Portal Composable
 * Full self-service portal configuration for dealers.
 * Mirrors useAdminDealerConfig but scoped to the authenticated dealer's own record.
 */
import type { LogoTextSettings } from '~/components/shared/LogoTextConfig.vue'

export type PhoneMode = 'visible' | 'click_to_reveal' | 'form_only'
export type CatalogSortOption = 'newest' | 'price_asc' | 'price_desc' | 'featured_first'

const DEFAULT_LOGO_TEXT: LogoTextSettings = {
  font_family: 'Inter',
  font_weight: '700',
  letter_spacing: '0em',
  italic: false,
  uppercase: false,
}

export interface DealerCertification {
  id: string
  label: Record<string, string>
  icon: 'badge' | 'shield' | 'star'
  verified: boolean
}

/** Composable for dealer portal. */
export function useDealerPortal() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // UI state
  const loading = ref(true)
  const saving = ref(false)
  const saved = ref(false)
  const error = ref<string | null>(null)
  const dealerId = ref<string | null>(null)
  const dealerSlug = ref('')
  const needsProfile = ref(false)

  // Identity
  const companyName = ref<Record<string, string>>({ es: '', en: '' })
  const logoUrl = ref('')
  const faviconUrl = ref('')
  const coverImageUrl = ref('')
  const logoTextConfig = ref<LogoTextSettings>({ ...DEFAULT_LOGO_TEXT })

  // Theme
  const themePrimary = ref('#23424A')
  const themeAccent = ref('#7FD1C8')

  // Bio
  const bio = ref<Record<string, string>>({ es: '', en: '' })

  // Contact
  const phone = ref('')
  const email = ref('')
  const address = ref('')
  const whatsapp = ref('')
  const phoneMode = ref<PhoneMode>('visible')
  const workingHours = ref<Record<string, string>>({ es: '', en: '' })
  const ctaText = ref<Record<string, string>>({ es: 'Contactar', en: 'Contact' })

  // Social
  const socialLinkedIn = ref('')
  const socialInstagram = ref('')
  const socialFacebook = ref('')
  const socialYouTube = ref('')

  // Certifications
  const certifications = ref<DealerCertification[]>([])

  // Catalog
  const catalogSort = ref<CatalogSortOption>('newest')

  // Auto reply
  const autoReplyMessage = ref<Record<string, string>>({ es: '', en: '' })

  // Notifications
  const emailOnLead = ref(false)
  const emailOnSale = ref(false)
  const emailWeeklyStats = ref(false)
  const emailAuctionUpdates = ref(false)

  // Brokerage
  const brokerageOptOut = ref(false)

  // Simple mode — auto-renew, no CRM, publish-and-forget
  const simpleMode = ref(false)

  const { t } = useI18n()

  // Static options — labels from i18n
  const phoneModeOptions = computed(() => [
    { value: 'visible', label: t('dealer.phoneModeVisible') },
    { value: 'click_to_reveal', label: t('dealer.phoneModeReveal') },
    { value: 'form_only', label: t('dealer.phoneModeForm') },
  ])

  const sortOptions = computed(() => [
    { value: 'newest', label: t('dealer.sortNewest') },
    { value: 'price_asc', label: t('dealer.sortPriceAsc') },
    { value: 'price_desc', label: t('dealer.sortPriceDesc') },
    { value: 'featured_first', label: t('dealer.sortFeatured') },
  ])

  const iconOptions = computed(() => [
    { value: 'badge', label: t('dealer.iconBadge') },
    { value: 'shield', label: t('dealer.iconShield') },
    { value: 'star', label: t('dealer.iconStar') },
  ])

  function initForm(data: Record<string, unknown>) {
    dealerSlug.value = (data.slug as string) || ''

    // Identity — company_name is JSONB
    const cn = (data.company_name as Record<string, string>) || {}
    companyName.value = { es: cn.es || '', en: cn.en || '' }
    logoUrl.value = (data.logo_url as string) || ''
    faviconUrl.value = (data.favicon_url as string) || ''
    coverImageUrl.value = (data.cover_image_url as string) || ''
    const ltc = (data.logo_text_config as Partial<LogoTextSettings>) || {}
    logoTextConfig.value = { ...DEFAULT_LOGO_TEXT, ...ltc }

    // Theme
    const th = (data.theme as Record<string, string>) || {}
    themePrimary.value = th.primary || '#23424A'
    themeAccent.value = th.accent || '#7FD1C8'

    // Bio — JSONB
    const b = (data.bio as Record<string, string>) || {}
    bio.value = { es: b.es || '', en: b.en || '' }

    // Contact
    phone.value = (data.phone as string) || ''
    email.value = (data.email as string) || ''
    address.value = (data.address as string) || ''
    whatsapp.value = (data.whatsapp as string) || ''
    const cc = (data.contact_config as Record<string, unknown>) || {}
    phoneMode.value = (cc.phone_mode as PhoneMode) || 'visible'
    const wh = (cc.working_hours as Record<string, string>) || {}
    workingHours.value = { es: wh.es || '', en: wh.en || '' }
    const cta = (cc.cta_text as Record<string, string>) || {}
    ctaText.value = { es: cta.es || 'Contactar', en: cta.en || 'Contact' }

    // Social
    const sl = (data.social_links as Record<string, string>) || {}
    socialLinkedIn.value = sl.linkedin || ''
    socialInstagram.value = sl.instagram || ''
    socialFacebook.value = sl.facebook || ''
    socialYouTube.value = sl.youtube || ''

    // Certifications
    const certs = (data.certifications as DealerCertification[]) || []
    certifications.value = certs.map((c) => ({
      id: c.id || crypto.randomUUID(),
      label: { es: c.label?.es || '', en: c.label?.en || '' },
      icon: c.icon || 'badge',
      verified: c.verified ?? false,
    }))

    // Catalog
    catalogSort.value = (data.catalog_sort as CatalogSortOption) || 'newest'

    // Auto reply
    const ar = (data.auto_reply_message as Record<string, string>) || {}
    autoReplyMessage.value = { es: ar.es || '', en: ar.en || '' }

    // Notifications
    const nc = (data.notification_config as Record<string, boolean>) || {}
    emailOnLead.value = nc.email_on_lead ?? true
    emailOnSale.value = nc.email_on_sale ?? true
    emailWeeklyStats.value = nc.email_weekly_stats ?? true
    emailAuctionUpdates.value = nc.email_auction_updates ?? false

    // Brokerage
    brokerageOptOut.value = (data.brokerage_opt_out as boolean) ?? false

    // Simple mode
    simpleMode.value = (data.simple_mode as boolean) ?? false
  }

  async function loadPortal() {
    if (!user.value?.id) {
      loading.value = false
      return
    }

    const { data, error: fetchError } = await supabase
      .from('dealers')
      .select(
        'id, slug, company_name, logo_url, favicon_url, cover_image_url, logo_text_config, theme, bio, phone, email, address, whatsapp, contact_config, social_links, certifications, catalog_sort',
      )
      .eq('user_id', user.value.id)
      .single()

    loading.value = false

    if (fetchError || !data) {
      needsProfile.value = true
      loading.value = false
      return
    }

    dealerId.value = (data as unknown as Record<string, unknown>).id as string
    initForm(data as unknown as Record<string, unknown>)
  }

  // Certifications
  function addCertification() {
    certifications.value.push({
      id: crypto.randomUUID(),
      label: { es: '', en: '' },
      icon: 'badge',
      verified: false,
    })
  }

  function removeCertification(id: string) {
    certifications.value = certifications.value.filter((c) => c.id !== id)
  }

  function updateCertificationField(id: string, field: keyof DealerCertification, value: unknown) {
    const cert = certifications.value.find((c) => c.id === id)
    if (!cert) return
    if (field === 'label' && typeof value === 'object') {
      cert.label = value as Record<string, string>
    } else if (field === 'icon') {
      cert.icon = value as DealerCertification['icon']
    } else if (field === 'verified') {
      cert.verified = value as boolean
    }
  }

  function resetThemeColors() {
    themePrimary.value = '#23424A'
    themeAccent.value = '#7FD1C8'
  }

  const portalUrl = computed(() => (dealerSlug.value ? `/${dealerSlug.value}` : null))

  async function save() {
    if (!dealerId.value) return

    saving.value = true
    saved.value = false
    error.value = null

    const payload = {
      company_name: companyName.value,
      logo_url: logoUrl.value || null,
      favicon_url: faviconUrl.value || null,
      cover_image_url: coverImageUrl.value || null,
      logo_text_config: logoTextConfig.value,
      theme: { primary: themePrimary.value, accent: themeAccent.value },
      bio: bio.value,
      phone: phone.value || null,
      email: email.value || null,
      address: address.value || null,
      whatsapp: whatsapp.value || null,
      contact_config: {
        phone_mode: phoneMode.value,
        working_hours: workingHours.value,
        cta_text: ctaText.value,
      },
      social_links: {
        linkedin: socialLinkedIn.value || null,
        instagram: socialInstagram.value || null,
        facebook: socialFacebook.value || null,
        youtube: socialYouTube.value || null,
      },
      certifications: certifications.value.map((c) => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        verified: c.verified,
      })),
      catalog_sort: catalogSort.value,
      auto_reply_message: autoReplyMessage.value,
      notification_config: {
        email_on_lead: emailOnLead.value,
        email_on_sale: emailOnSale.value,
        email_weekly_stats: emailWeeklyStats.value,
        email_auction_updates: emailAuctionUpdates.value,
      },
      brokerage_opt_out: brokerageOptOut.value,
      brokerage_opt_out_at: brokerageOptOut.value ? new Date().toISOString() : null,
      simple_mode: simpleMode.value,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('dealers')
      .update(payload)
      .eq('id', dealerId.value)

    saving.value = false

    if (updateError) {
      error.value = updateError.message
      return
    }

    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 3000)
  }

  async function toggleBrokerageOptOut(newValue: boolean) {
    brokerageOptOut.value = newValue

    // Log consent change for GDPR traceability
    if (user.value?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      await sb.from('brokerage_consent_log').insert({
        user_id: user.value.id,
        consent_type: newValue ? 'seller_brokerage_optout' : 'seller_brokerage_optin',
        granted: !newValue,
        legal_basis: 'consent_art6_1a',
        channel: 'web',
        evidence: { source: 'dealer_portal_toggle', timestamp: new Date().toISOString() },
      })
    }
  }

  async function createDealerProfile(name: string): Promise<boolean> {
    if (!user.value?.id) return false
    saving.value = true
    error.value = null
    try {
      const slug = name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replace(/^-/, '')
        .replace(/-$/, '')
      const { data: newDealer, error: insertError } = await supabase
        .from('dealers')
        .insert({
          user_id: user.value.id,
          slug,
          company_name: { es: name, en: name },
          status: 'active',
        } as never)
        .select('id')
        .single()
      if (insertError) throw insertError
      dealerId.value = (newDealer as { id: string }).id
      needsProfile.value = false
      // Reload the full portal data
      await loadPortal()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating dealer profile'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    // UI
    loading,
    saving,
    saved,
    error,
    needsProfile,
    portalUrl,
    // Identity
    companyName,
    logoUrl,
    faviconUrl,
    coverImageUrl,
    logoTextConfig,
    // Theme
    themePrimary,
    themeAccent,
    // Bio
    bio,
    // Contact
    phone,
    email,
    address,
    whatsapp,
    phoneMode,
    workingHours,
    ctaText,
    // Social
    socialLinkedIn,
    socialInstagram,
    socialFacebook,
    socialYouTube,
    // Certifications
    certifications,
    iconOptions,
    // Catalog
    catalogSort,
    sortOptions,
    // Auto reply
    autoReplyMessage,
    // Notifications
    emailOnLead,
    emailOnSale,
    emailWeeklyStats,
    emailAuctionUpdates,
    // Brokerage
    brokerageOptOut,
    toggleBrokerageOptOut,
    // Simple mode
    simpleMode,
    // Static
    phoneModeOptions,
    // Actions
    loadPortal,
    createDealerProfile,
    save,
    resetThemeColors,
    addCertification,
    removeCertification,
    updateCertificationField,
  }
}
