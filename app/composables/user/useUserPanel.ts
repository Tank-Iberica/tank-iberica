/**
 * useUserPanel
 * Extracts all state and logic from UserPanel.vue (slide-in drawer).
 */

import type { ChatMessage } from '~/composables/useUserChat'
import { useFavorites } from '~/composables/useFavorites'
import { useUserChat } from '~/composables/useUserChat'

export interface ProfileFormData {
  pseudonimo: string
  name: string
  apellidos: string
  telefono: string
  email: string
}

export interface PanelBanner {
  text_es: string
  text_en: string
  url: string
  active: boolean
  from_date: string | null
  to_date: string | null
}

export interface UserDemand {
  id: string
  vehicle_type: string
  status: string
  created_at: string
}

export interface UserAd {
  id: string
  brand: string
  model: string
  status: string
  created_at: string
}

export function useUserPanel(isOpen: () => boolean, onClose: () => void) {
  const { t } = useI18n()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()

  // Favorites
  const { count: favoritesCount } = useFavorites()

  // Chat
  const {
    messages: chatMessages,
    loading: chatLoading,
    sending: chatSending,
    unreadCount: chatUnread,
    fetchMessages,
    sendMessage,
    markAsRead,
    subscribeToRealtime,
    formatTime,
  } = useUserChat()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const activeSection = ref<string | null>(null)

  const profileForm = ref<ProfileFormData>({
    pseudonimo: '',
    name: '',
    apellidos: '',
    telefono: '',
    email: '',
  })
  const profileSaving = ref(false)
  const profileMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

  const userDemands = ref<UserDemand[]>([])
  const userAds = ref<UserAd[]>([])
  const demandsLoading = ref(false)
  const adsLoading = ref(false)

  const subscriptions = ref({
    web: false,
    prensa: false,
    boletines: false,
    destacados: false,
    eventos: false,
    rsc: false,
  })

  const exportLoading = ref(false)
  const deleteModalOpen = ref(false)
  const deleteLoading = ref(false)
  const deleteError = ref<string | null>(null)

  const panelBanner = ref<PanelBanner | null>(null)

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  // Session-based user state — avoids useSupabaseUser() which is reset on every
  // page:start by @nuxtjs/supabase ≤2.0.4 when using HS256 JWTs
  const sessionUser = ref<{
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  } | null>(null)

  onMounted(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    sessionUser.value = session?.user || null
    supabase.auth.onAuthStateChange((_event, session) => {
      sessionUser.value = session?.user || null
    })
  })

  const userDisplayName = computed(() => {
    if (!sessionUser.value) return ''
    return (
      (sessionUser.value.user_metadata?.pseudonimo as string) ||
      (sessionUser.value.user_metadata?.name as string) ||
      sessionUser.value.email?.split('@')[0] ||
      ''
    )
  })

  const userEmail = computed(() => sessionUser.value?.email || '')

  const userInitial = computed(() => {
    const name = userDisplayName.value
    return name ? name.charAt(0).toUpperCase() : 'U'
  })

  // ---------------------------------------------------------------------------
  // Section navigation
  // ---------------------------------------------------------------------------

  function toggleSection(section: string) {
    activeSection.value = activeSection.value === section ? null : section

    if (activeSection.value === 'chat') {
      fetchMessages()
      subscribeToRealtime()
      markAsRead()
    }
    if (activeSection.value === 'solicitudes') loadDemands()
    if (activeSection.value === 'anuncios') loadAds()
  }

  // ---------------------------------------------------------------------------
  // Data loaders
  // ---------------------------------------------------------------------------

  async function loadDemands() {
    if (!sessionUser.value || demandsLoading.value) return
    demandsLoading.value = true
    try {
      const { data } = await supabase
        .from('demands')
        .select('id, vehicle_type, status, created_at')
        .eq('user_id', sessionUser.value.id)
        .order('created_at', { ascending: false })
      userDemands.value = data || []
    } catch {
      /* ignore */
    } finally {
      demandsLoading.value = false
    }
  }

  async function loadAds() {
    if (!sessionUser.value || adsLoading.value) return
    adsLoading.value = true
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('id, brand, model, status, created_at')
        .eq('user_id', sessionUser.value.id)
        .order('created_at', { ascending: false })
      userAds.value = data || []
    } catch {
      /* ignore */
    } finally {
      adsLoading.value = false
    }
  }

  async function loadPanelBanner() {
    try {
      const { data } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'user_panel_banner')
        .single()
      if (data?.value) {
        const config = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        if (!config.active) return
        const now = new Date()
        if (config.from_date && new Date(config.from_date) > now) return
        if (config.to_date && new Date(config.to_date) < now) return
        panelBanner.value = config
      }
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  async function saveProfile(data: ProfileFormData) {
    if (!sessionUser.value) return
    profileSaving.value = true
    profileMessage.value = null
    try {
      const { error } = await supabase
        .from('users')
        .update({
          pseudonimo: data.pseudonimo,
          name: data.name,
          apellidos: data.apellidos,
          phone: data.telefono,
          email: data.email,
        })
        .eq('id', sessionUser.value.id)
      if (error) throw error
      profileMessage.value = { type: 'success', text: t('user.profileSaved') }
    } catch (err) {
      profileMessage.value = {
        type: 'error',
        text: err instanceof Error ? err.message : 'Error',
      }
    } finally {
      profileSaving.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  async function saveSubscriptions() {
    if (!sessionUser.value) return
    try {
      await supabase.from('subscriptions').upsert({
        email: sessionUser.value.email,
        pref_web: subscriptions.value.web,
        pref_press: subscriptions.value.prensa,
        pref_newsletter: subscriptions.value.boletines,
        pref_featured: subscriptions.value.destacados,
        pref_events: subscriptions.value.eventos,
        pref_csr: subscriptions.value.rsc,
      })
    } catch (err) {
      if (import.meta.dev) console.error('Error saving subscriptions:', err)
    }
  }

  // ---------------------------------------------------------------------------
  // GDPR
  // ---------------------------------------------------------------------------

  async function handleExportData() {
    if (exportLoading.value) return
    exportLoading.value = true
    try {
      const response = await $fetch<Blob>('/api/account/export', {
        method: 'GET',
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.download = `tracciona-data-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      /* Silently fail */
    } finally {
      exportLoading.value = false
    }
  }

  function openDeleteModal() {
    deleteError.value = null
    deleteModalOpen.value = true
  }

  async function handleDeleteAccount() {
    deleteLoading.value = true
    deleteError.value = null
    try {
      await $fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'x-requested-with': 'XMLHttpRequest' },
      })
      deleteModalOpen.value = false
      onClose()
      window.location.href = '/'
    } catch {
      deleteError.value = t('gdpr.deleteError')
    } finally {
      deleteLoading.value = false
    }
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  async function handleLogout() {
    await supabase.auth.signOut()
    onClose()
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  watch(isOpen, async (open) => {
    if (open) {
      // Get fresh session in case sessionUser hasn't been set yet (async onMounted)
      if (!sessionUser.value) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        sessionUser.value = session?.user || null
      }
      if (!sessionUser.value) return

      const { data } = await supabase
        .from('users')
        .select('pseudonimo, name, apellidos, phone, email')
        .eq('id', sessionUser.value.id)
        .single()

      if (data) {
        profileForm.value = {
          pseudonimo: data.pseudonimo || '',
          name: data.name || '',
          apellidos: data.apellidos || '',
          telefono: data.phone || '',
          email: data.email || sessionUser.value.email || '',
        }
      }

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('pref_web, pref_press, pref_newsletter, pref_featured, pref_events, pref_csr')
        .eq('email', sessionUser.value.email)
        .single()

      if (subData) {
        subscriptions.value = {
          web: subData.pref_web || false,
          prensa: subData.pref_press || false,
          boletines: subData.pref_newsletter || false,
          destacados: subData.pref_featured || false,
          eventos: subData.pref_events || false,
          rsc: subData.pref_csr || false,
        }
      }
    }
  })

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    loadPanelBanner()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Role awareness (from useAuth shared state)
  // ---------------------------------------------------------------------------

  const { isDealer, isAdmin } = useAuth()

  return {
    // User
    userDisplayName,
    userEmail,
    userInitial,
    isDealer,
    isAdmin,

    // Favorites
    favoritesCount,

    // Chat (from useUserChat)
    chatMessages: chatMessages as Ref<ChatMessage[]>,
    chatLoading,
    chatSending,
    chatUnread,
    sendMessage,
    formatTime,

    // Section
    activeSection,
    toggleSection,

    // Profile
    profileForm,
    profileSaving,
    profileMessage,
    saveProfile,

    // Subscriptions
    subscriptions,
    saveSubscriptions,

    // Demands & Ads
    userDemands,
    demandsLoading,
    userAds,
    adsLoading,

    // GDPR
    exportLoading,
    deleteModalOpen,
    deleteLoading,
    deleteError,
    handleExportData,
    openDeleteModal,
    handleDeleteAccount,

    // Logout
    handleLogout,

    // Banner
    panelBanner,
  }
}
