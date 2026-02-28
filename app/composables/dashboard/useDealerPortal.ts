/**
 * Dealer Portal Composable
 * Full self-service portal configuration for dealers.
 * Mirrors useAdminDealerConfig but scoped to the authenticated dealer's own record.
 */

export type PhoneMode = 'visible' | 'click_to_reveal' | 'form_only'
export type CatalogSortOption = 'newest' | 'price_asc' | 'price_desc' | 'featured_first'

export interface DealerCertification {
  id: string
  label: Record<string, string>
  icon: 'badge' | 'shield' | 'star'
  verified: boolean
}

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

  // Identity
  const companyName = ref<Record<string, string>>({ es: '', en: '' })
  const logoUrl = ref('')
  const faviconUrl = ref('')
  const coverImageUrl = ref('')

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

  // Static options
  const phoneModeOptions = [
    { value: 'visible', label: 'Siempre visible' },
    { value: 'click_to_reveal', label: 'Click para revelar' },
    { value: 'form_only', label: 'Solo formulario de contacto' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Más recientes primero' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'featured_first', label: 'Destacados primero' },
  ]

  const iconOptions = [
    { value: 'badge', label: 'Insignia' },
    { value: 'shield', label: 'Escudo' },
    { value: 'star', label: 'Estrella' },
  ]

  function initForm(data: Record<string, unknown>) {
    dealerSlug.value = (data.slug as string) || ''

    // Identity — company_name is JSONB
    const cn = (data.company_name as Record<string, string>) || {}
    companyName.value = { es: cn.es || '', en: cn.en || '' }
    logoUrl.value = (data.logo_url as string) || ''
    faviconUrl.value = (data.favicon_url as string) || ''
    coverImageUrl.value = (data.cover_image_url as string) || ''

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
  }

  async function loadPortal() {
    if (!user.value?.id) {
      loading.value = false
      return
    }

    const { data, error: fetchError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.value.id)
      .single()

    loading.value = false

    if (fetchError || !data) {
      error.value = 'No se encontró tu perfil de dealer.'
      return
    }

    dealerId.value = (data as Record<string, unknown>).id as string
    initForm(data as Record<string, unknown>)
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

  return {
    // UI
    loading,
    saving,
    saved,
    error,
    portalUrl,
    // Identity
    companyName,
    logoUrl,
    faviconUrl,
    coverImageUrl,
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
    // Static
    phoneModeOptions,
    // Actions
    loadPortal,
    save,
    resetThemeColors,
    addCertification,
    removeCertification,
    updateCertificationField,
  }
}
