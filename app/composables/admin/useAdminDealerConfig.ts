/**
 * Admin Dealer Config Composable
 * Manages all state and logic for the dealer configuration page.
 */

export interface Certification {
  id: string
  label: Record<string, string>
  icon: 'badge' | 'shield' | 'star'
  verified: boolean
}

export type PhoneMode = 'visible' | 'click_to_reveal' | 'form_only'
export type CatalogSortOption = 'newest' | 'price_asc' | 'price_desc' | 'featured_first'

export interface IconOption {
  value: 'badge' | 'shield' | 'star'
  label: string
}

export interface SelectOption {
  value: string
  label: string
}

export function useAdminDealerConfig() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // --- UI STATE ---
  const saving = ref(false)
  const saved = ref(false)
  const error = ref<string | null>(null)
  const loading = ref(true)
  const dealerExists = ref(true)
  const dealerId = ref<string | null>(null)
  const dealerSlug = ref<string>('')

  // --- IDENTITY ---
  const logoUrl = ref('')
  const coverImageUrl = ref('')
  const companyName = ref<Record<string, string>>({ es: '', en: '' })

  // --- THEME ---
  const themePrimary = ref('#23424A')
  const themeAccent = ref('#7FD1C8')

  // --- BIO ---
  const bio = ref<Record<string, string>>({ es: '', en: '' })

  // --- CONTACT ---
  const phone = ref('')
  const email = ref('')
  const website = ref('')
  const address = ref('')
  const whatsapp = ref('')
  const workingHours = ref<Record<string, string>>({ es: '', en: '' })
  const phoneMode = ref<PhoneMode>('visible')
  const ctaText = ref<Record<string, string>>({ es: '', en: '' })

  // --- SOCIAL LINKS ---
  const socialLinkedIn = ref('')
  const socialInstagram = ref('')
  const socialFacebook = ref('')
  const socialYouTube = ref('')

  // --- CERTIFICATIONS ---
  const certifications = ref<Certification[]>([])

  // --- CATALOG ---
  const catalogSort = ref<CatalogSortOption>('newest')
  const pinnedVehicles = ref<string[]>([])
  const newPinnedUuid = ref('')

  // --- AUTO REPLY ---
  const autoReplyMessage = ref<Record<string, string>>({ es: '', en: '' })

  // --- NOTIFICATIONS ---
  const emailOnLead = ref(false)
  const emailOnSale = ref(false)
  const emailWeeklyStats = ref(false)
  const emailAuctionUpdates = ref(false)

  // --- STATIC OPTIONS ---
  const iconOptions: IconOption[] = [
    { value: 'badge', label: 'Insignia' },
    { value: 'shield', label: 'Escudo' },
    { value: 'star', label: 'Estrella' },
  ]

  const sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Mas recientes primero' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'featured_first', label: 'Destacados primero' },
  ]

  const phoneModeOptions: SelectOption[] = [
    { value: 'visible', label: 'Visible siempre' },
    { value: 'click_to_reveal', label: 'Click para revelar' },
    { value: 'form_only', label: 'Solo formulario' },
  ]

  // --- INIT FORM ---
  function initForm(data: Record<string, unknown>) {
    dealerSlug.value = (data.slug as string) || ''

    // Identity
    logoUrl.value = (data.logo_url as string) || ''
    coverImageUrl.value = (data.cover_image_url as string) || ''
    const cn = (data.company_name as Record<string, string>) || {}
    companyName.value = { es: cn.es || '', en: cn.en || '' }

    // Theme
    const th = (data.theme as Record<string, string>) || {}
    themePrimary.value = th.primary || '#23424A'
    themeAccent.value = th.accent || '#7FD1C8'

    // Bio
    const b = (data.bio as Record<string, string>) || {}
    bio.value = { es: b.es || '', en: b.en || '' }

    // Contact
    phone.value = (data.phone as string) || ''
    email.value = (data.email as string) || ''
    website.value = (data.website as string) || ''
    address.value = (data.address as string) || ''
    whatsapp.value = (data.whatsapp as string) || ''
    const cc = (data.contact_config as Record<string, unknown>) || {}
    phoneMode.value = (cc.phone_mode as PhoneMode) || 'visible'
    const wh = (cc.working_hours as Record<string, string>) || {}
    workingHours.value = { es: wh.es || '', en: wh.en || '' }
    const cta = (cc.cta_text as Record<string, string>) || {}
    ctaText.value = { es: cta.es || '', en: cta.en || '' }

    // Social links
    const sl = (data.social_links as Record<string, string>) || {}
    socialLinkedIn.value = sl.linkedin || ''
    socialInstagram.value = sl.instagram || ''
    socialFacebook.value = sl.facebook || ''
    socialYouTube.value = sl.youtube || ''

    // Certifications
    const certs = (data.certifications as Certification[]) || []
    certifications.value = certs.map((c) => ({
      id: c.id || crypto.randomUUID(),
      label: { es: c.label?.es || '', en: c.label?.en || '' },
      icon: c.icon || 'badge',
      verified: c.verified ?? false,
    }))

    // Catalog
    catalogSort.value = (data.catalog_sort as CatalogSortOption) || 'newest'
    pinnedVehicles.value = (data.pinned_vehicles as string[]) || []

    // Auto reply
    const ar = (data.auto_reply_message as Record<string, string>) || {}
    autoReplyMessage.value = { es: ar.es || '', en: ar.en || '' }

    // Notifications
    const nc = (data.notification_config as Record<string, boolean>) || {}
    emailOnLead.value = nc.email_on_lead ?? false
    emailOnSale.value = nc.email_on_sale ?? false
    emailWeeklyStats.value = nc.email_weekly_stats ?? false
    emailAuctionUpdates.value = nc.email_auction_updates ?? false
  }

  // --- FETCH DEALER ---
  async function init() {
    if (!user.value?.id) {
      loading.value = false
      dealerExists.value = false
      return
    }

    const { data, error: fetchError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.value.id)
      .single()

    loading.value = false

    if (fetchError || !data) {
      dealerExists.value = false
      return
    }

    dealerExists.value = true
    dealerId.value = (data as Record<string, unknown>).id as string
    initForm(data as Record<string, unknown>)
  }

  // --- CERTIFICATIONS MANAGEMENT ---
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

  function updateCertificationIcon(id: string, icon: Certification['icon']) {
    const cert = certifications.value.find((c) => c.id === id)
    if (cert) cert.icon = icon
  }

  function updateCertificationVerified(id: string, verified: boolean) {
    const cert = certifications.value.find((c) => c.id === id)
    if (cert) cert.verified = verified
  }

  function updateCertificationLabel(id: string, lang: string, value: string) {
    const cert = certifications.value.find((c) => c.id === id)
    if (cert) cert.label[lang] = value
  }

  // --- PINNED VEHICLES ---
  function addPinnedVehicle() {
    const uuid = newPinnedUuid.value.trim()
    if (!uuid) return
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      error.value = 'El UUID introducido no tiene un formato valido'
      return
    }
    if (pinnedVehicles.value.includes(uuid)) {
      error.value = 'Este vehiculo ya esta fijado'
      return
    }
    pinnedVehicles.value.push(uuid)
    newPinnedUuid.value = ''
    error.value = null
  }

  function removePinnedVehicle(uuid: string) {
    pinnedVehicles.value = pinnedVehicles.value.filter((v) => v !== uuid)
  }

  // --- THEME RESET ---
  function resetThemeColors() {
    themePrimary.value = '#23424A'
    themeAccent.value = '#7FD1C8'
  }

  // --- SAVE ---
  async function handleSave() {
    if (!dealerId.value) return

    saving.value = true
    saved.value = false
    error.value = null

    const updatePayload = {
      logo_url: logoUrl.value || null,
      cover_image_url: coverImageUrl.value || null,
      company_name: companyName.value,
      theme: {
        primary: themePrimary.value,
        accent: themeAccent.value,
      },
      bio: bio.value,
      phone: phone.value || null,
      email: email.value || null,
      website: website.value || null,
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
      pinned_vehicles: pinnedVehicles.value,
      auto_reply_message: autoReplyMessage.value,
      notification_config: {
        email_on_lead: emailOnLead.value,
        email_on_sale: emailOnSale.value,
        email_weekly_stats: emailWeeklyStats.value,
        email_auction_updates: emailAuctionUpdates.value,
      },
    }

    const { error: updateError } = await supabase
      .from('dealers')
      .update(updatePayload)
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
    // UI State
    saving,
    saved,
    error,
    loading,
    dealerExists,
    dealerId,
    dealerSlug,

    // Identity
    logoUrl,
    coverImageUrl,
    companyName,

    // Theme
    themePrimary,
    themeAccent,

    // Bio
    bio,

    // Contact
    phone,
    email,
    website,
    address,
    whatsapp,
    workingHours,
    phoneMode,
    ctaText,

    // Social Links
    socialLinkedIn,
    socialInstagram,
    socialFacebook,
    socialYouTube,

    // Certifications
    certifications,

    // Catalog
    catalogSort,
    pinnedVehicles,
    newPinnedUuid,

    // Auto Reply
    autoReplyMessage,

    // Notifications
    emailOnLead,
    emailOnSale,
    emailWeeklyStats,
    emailAuctionUpdates,

    // Static Options
    iconOptions,
    sortOptions,
    phoneModeOptions,

    // Actions
    init,
    addCertification,
    removeCertification,
    updateCertificationIcon,
    updateCertificationVerified,
    updateCertificationLabel,
    addPinnedVehicle,
    removePinnedVehicle,
    resetThemeColors,
    handleSave,
  }
}
