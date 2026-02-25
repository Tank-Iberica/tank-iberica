<script setup lang="ts">
import { useFavorites } from '~/composables/useFavorites'
import { useUserChat } from '~/composables/useUserChat'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t, locale } = useI18n()
const user = useSupabaseUser()
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

// Active section (accordion)
const activeSection = ref<string | null>(null)

// Profile form
const profileForm = ref({
  pseudonimo: '',
  name: '',
  apellidos: '',
  telefono: '',
  email: '',
})
const profileSaving = ref(false)
const profileMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// User's demands & advertisements
const userDemands = ref<
  Array<{ id: string; vehicle_type: string; status: string; created_at: string }>
>([])
const userAds = ref<
  Array<{ id: string; brand: string; model: string; status: string; created_at: string }>
>([])
const demandsLoading = ref(false)
const adsLoading = ref(false)

// Chat input
const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)

// User display info
const userDisplayName = computed(() => {
  if (!user.value) return ''
  return (
    user.value.user_metadata?.pseudonimo ||
    user.value.user_metadata?.name ||
    user.value.email?.split('@')[0] ||
    ''
  )
})

const userEmail = computed(() => user.value?.email || '')

const userInitial = computed(() => {
  const name = userDisplayName.value
  return name ? name.charAt(0).toUpperCase() : 'U'
})

// Subscriptions state
const subscriptions = ref({
  web: false,
  prensa: false,
  boletines: false,
  destacados: false,
  eventos: false,
  rsc: false,
})

// Toggle section
function toggleSection(section: string) {
  activeSection.value = activeSection.value === section ? null : section

  // Load data when opening specific sections
  if (activeSection.value === 'chat') {
    fetchMessages()
    subscribeToRealtime()
    markAsRead()
    nextTick(() => scrollChatToBottom())
  }
  if (activeSection.value === 'solicitudes') {
    loadDemands()
  }
  if (activeSection.value === 'anuncios') {
    loadAds()
  }
}

// Load user's demands
async function loadDemands() {
  if (!user.value || demandsLoading.value) return
  demandsLoading.value = true
  try {
    const { data } = await supabase
      .from('demands')
      .select('id, vehicle_type, status, created_at')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    userDemands.value = data || []
  } catch {
    /* ignore */
  } finally {
    demandsLoading.value = false
  }
}

// Load user's advertisements
async function loadAds() {
  if (!user.value || adsLoading.value) return
  adsLoading.value = true
  try {
    const { data } = await supabase
      .from('advertisements')
      .select('id, brand, model, status, created_at')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
    userAds.value = data || []
  } catch {
    /* ignore */
  } finally {
    adsLoading.value = false
  }
}

// Scroll chat to bottom
function scrollChatToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Send chat message
async function handleSendChat() {
  if (!chatInput.value.trim()) return

  const success = await sendMessage(chatInput.value)
  if (success) {
    chatInput.value = ''
    nextTick(() => scrollChatToBottom())
  }
}

// Save profile
async function saveProfile() {
  if (!user.value) return

  profileSaving.value = true
  profileMessage.value = null

  try {
    const { error } = await supabase
      .from('users')
      .update({
        pseudonimo: profileForm.value.pseudonimo,
        name: profileForm.value.name,
        apellidos: profileForm.value.apellidos,
        phone: profileForm.value.telefono,
        email: profileForm.value.email,
      })
      .eq('id', user.value.id)

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

// Save subscriptions
async function saveSubscriptions() {
  if (!user.value) return

  try {
    await supabase.from('subscriptions').upsert({
      email: user.value.email,
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

// ── GDPR: Data export & Account deletion ─────────────────────────────────────
const exportLoading = ref(false)
const deleteModalOpen = ref(false)
const deleteConfirmText = ref('')
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)

/** Export all user data as JSON download */
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
    const dateStr = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `tracciona-data-export-${dateStr}.json`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    // Silently fail — the user will see no download
  } finally {
    exportLoading.value = false
  }
}

/** Open the delete account confirmation modal */
function openDeleteModal() {
  deleteConfirmText.value = ''
  deleteError.value = null
  deleteModalOpen.value = true
}

/** Handle account deletion after confirmation */
async function handleDeleteAccount() {
  if (deleteConfirmText.value !== 'ELIMINAR') {
    deleteError.value = t('gdpr.deleteConfirmError')
    return
  }

  deleteLoading.value = true
  deleteError.value = null

  try {
    await $fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
    })
    deleteModalOpen.value = false
    emit('update:modelValue', false)
    // Force reload to clear any cached session state
    window.location.href = '/'
  } catch {
    deleteError.value = t('gdpr.deleteError')
  } finally {
    deleteLoading.value = false
  }
}

// Logout
async function handleLogout() {
  await supabase.auth.signOut()
  emit('update:modelValue', false)
}

// Load profile data when panel opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && user.value) {
      // Load user profile
      const { data } = await supabase
        .from('users')
        .select('pseudonimo, name, apellidos, phone, email')
        .eq('id', user.value.id)
        .single()

      if (data) {
        profileForm.value.pseudonimo = data.pseudonimo || ''
        profileForm.value.name = data.name || ''
        profileForm.value.apellidos = data.apellidos || ''
        profileForm.value.telefono = data.phone || ''
        profileForm.value.email = data.email || user.value.email || ''
      }

      // Load subscriptions
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('pref_web, pref_press, pref_newsletter, pref_featured, pref_events, pref_csr')
        .eq('email', user.value.email)
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
  },
)

// User panel banner
const panelBanner = ref<{
  text_es: string
  text_en: string
  url: string
  active: boolean
  from_date: string | null
  to_date: string | null
} | null>(null)

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

// Close on escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadPanelBanner()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="modelValue" class="user-panel-wrapper">
        <!-- Overlay -->
        <div class="user-panel-overlay" @click="emit('update:modelValue', false)" />

        <!-- Panel -->
        <aside class="user-panel">
          <!-- Close button -->
          <button class="panel-close" @click="emit('update:modelValue', false)">&times;</button>

          <!-- Configurable banner -->
          <a
            v-if="panelBanner"
            :href="panelBanner.url || undefined"
            class="panel-banner"
            :target="panelBanner.url ? '_blank' : undefined"
            :rel="panelBanner.url ? 'noopener' : undefined"
          >
            {{ locale === 'en' ? panelBanner.text_en : panelBanner.text_es }}
          </a>

          <!-- Header -->
          <div class="panel-header">
            <div class="user-avatar">
              <span>{{ userInitial }}</span>
            </div>
            <div class="user-info">
              <h2>{{ userDisplayName }}</h2>
              <p>{{ userEmail }}</p>
            </div>
          </div>

          <!-- Menu sections -->
          <div class="panel-menu">
            <!-- PERFIL -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'perfil' }"
                @click="toggleSection('perfil')"
              >
                <span>{{ t('user.profile') }}</span>
                <span class="section-arrow">{{ activeSection === 'perfil' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'perfil'" class="section-content">
                  <div class="form-field">
                    <label>{{ t('user.pseudonym') }}</label>
                    <input v-model="profileForm.pseudonimo" type="text" >
                  </div>
                  <div class="form-field">
                    <label>{{ t('user.fullName') }}</label>
                    <div class="form-row">
                      <input v-model="profileForm.name" type="text" :placeholder="t('user.name')" >
                      <input
                        v-model="profileForm.apellidos"
                        type="text"
                        :placeholder="t('user.surname')"
                      >
                    </div>
                  </div>
                  <div class="form-field">
                    <label>{{ t('user.phone') }}</label>
                    <input
                      v-model="profileForm.telefono"
                      type="tel"
                      placeholder="+34 600 000 000"
                    >
                  </div>
                  <div class="form-field">
                    <label>{{ t('user.email') }}</label>
                    <input v-model="profileForm.email" type="email" >
                  </div>
                  <button class="btn-primary" :disabled="profileSaving" @click="saveProfile">
                    {{ profileSaving ? '...' : t('user.saveChanges') }}
                  </button>
                  <div v-if="profileMessage" :class="['form-message', profileMessage.type]">
                    {{ profileMessage.text }}
                  </div>
                </div>
              </Transition>
            </div>

            <!-- CHAT -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'chat' }"
                @click="toggleSection('chat')"
              >
                <span>
                  {{ t('user.chat') }}
                  <span v-if="chatUnread > 0" class="badge">{{ chatUnread }}</span>
                </span>
                <span class="section-arrow">{{ activeSection === 'chat' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'chat'" class="section-content">
                  <div ref="chatContainer" class="chat-messages">
                    <div v-if="chatLoading" class="chat-loading">{{ t('common.loading') }}...</div>
                    <div v-else-if="chatMessages.length === 0" class="chat-empty">
                      {{ t('user.noMessages') }}
                    </div>
                    <template v-else>
                      <div
                        v-for="msg in chatMessages"
                        :key="msg.id"
                        :class="[
                          'chat-message',
                          msg.direction === 'user_to_admin' ? 'sent' : 'received',
                        ]"
                      >
                        <div class="message-content">
                          {{ msg.content }}
                        </div>
                        <div class="message-time">
                          {{ formatTime(msg.created_at) }}
                        </div>
                      </div>
                    </template>
                  </div>
                  <div class="chat-input-area">
                    <textarea
                      v-model="chatInput"
                      :placeholder="t('user.writeMessage')"
                      rows="2"
                      @keydown.enter.prevent="handleSendChat"
                    />
                    <button
                      class="btn-send"
                      :disabled="chatSending || !chatInput.trim()"
                      @click="handleSendChat"
                    >
                      {{ chatSending ? '...' : t('user.send') }}
                    </button>
                  </div>
                  <p class="chat-info">
                    {{ t('user.chatInfo') }}
                  </p>
                </div>
              </Transition>
            </div>

            <!-- FAVORITOS -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'favoritos' }"
                @click="toggleSection('favoritos')"
              >
                <span>
                  {{ t('user.favorites') }}
                  <span v-if="favoritesCount() > 0" class="badge">{{ favoritesCount() }}</span>
                </span>
                <span class="section-arrow">{{ activeSection === 'favoritos' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'favoritos'" class="section-content">
                  <div v-if="favoritesCount() === 0" class="empty-state">
                    {{ t('user.noFavorites') }}
                  </div>
                  <div v-else class="favorites-list">
                    <p class="favorites-count">
                      {{ favoritesCount() }} {{ t('user.vehiclesSaved') }}
                    </p>
                    <NuxtLink
                      to="/"
                      class="btn-secondary"
                      @click="emit('update:modelValue', false)"
                    >
                      {{ t('user.viewFavorites') }}
                    </NuxtLink>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- SOLICITUDES -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'solicitudes' }"
                @click="toggleSection('solicitudes')"
              >
                <span>{{ t('user.requests') }}</span>
                <span class="section-arrow">{{ activeSection === 'solicitudes' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'solicitudes'" class="section-content">
                  <p class="section-info">
                    {{ t('user.requestsInfo') }}
                  </p>
                  <div v-if="demandsLoading" class="empty-state">
                    {{ t('common.loading') }}
                  </div>
                  <div v-else-if="userDemands.length === 0" class="empty-state">
                    {{ t('user.noRequests') }}
                  </div>
                  <div v-else class="items-list">
                    <div v-for="demand in userDemands" :key="demand.id" class="item-card">
                      <div class="item-info">
                        <span class="item-title">{{ demand.vehicle_type }}</span>
                        <span class="item-date">{{
                          new Date(demand.created_at).toLocaleDateString()
                        }}</span>
                      </div>
                      <span :class="['status-badge', demand.status]">{{ demand.status }}</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- MIS ANUNCIOS -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'anuncios' }"
                @click="toggleSection('anuncios')"
              >
                <span>{{ t('user.myAds') }}</span>
                <span class="section-arrow">{{ activeSection === 'anuncios' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'anuncios'" class="section-content">
                  <div v-if="adsLoading" class="empty-state">
                    {{ t('common.loading') }}
                  </div>
                  <div v-else-if="userAds.length === 0" class="empty-state">
                    {{ t('user.noAds') }}
                  </div>
                  <div v-else class="items-list">
                    <div v-for="ad in userAds" :key="ad.id" class="item-card">
                      <div class="item-info">
                        <span class="item-title">{{ ad.brand }} {{ ad.model }}</span>
                        <span class="item-date">{{
                          new Date(ad.created_at).toLocaleDateString()
                        }}</span>
                      </div>
                      <span :class="['status-badge', ad.status]">{{ ad.status }}</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- FACTURAS -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'facturas' }"
                @click="toggleSection('facturas')"
              >
                <span>{{ t('user.invoices') }}</span>
                <span class="section-arrow">{{ activeSection === 'facturas' ? '▲' : '▼' }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'facturas'" class="section-content">
                  <div class="empty-state">
                    {{ t('user.noInvoices') }}
                  </div>
                  <p class="section-info">
                    {{ t('user.invoicesInfo') }}
                  </p>
                </div>
              </Transition>
            </div>

            <!-- SUSCRIPCIONES -->
            <div class="panel-section">
              <button
                class="section-header"
                :class="{ active: activeSection === 'suscripciones' }"
                @click="toggleSection('suscripciones')"
              >
                <span>{{ t('user.subscriptions') }}</span>
                <span class="section-arrow">{{
                  activeSection === 'suscripciones' ? '▲' : '▼'
                }}</span>
              </button>
              <Transition name="accordion">
                <div v-if="activeSection === 'suscripciones'" class="section-content">
                  <h4>{{ t('user.receiveNotifications') }}</h4>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.web"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.webNotifications') }}</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.prensa"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.pressArea') }}</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.boletines"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.newsletters') }}</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.destacados"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.featuredVehicles') }}</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.eventos"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.events') }}</span>
                  </label>
                  <label class="checkbox-label">
                    <input
                      v-model="subscriptions.rsc"
                      type="checkbox"
                      @change="saveSubscriptions"
                    >
                    <span>{{ t('user.csr') }}</span>
                  </label>
                </div>
              </Transition>
            </div>

            <!-- GDPR: DANGER ZONE -->
            <div class="panel-section panel-section--danger">
              <button
                class="section-header section-header--danger"
                :class="{ active: activeSection === 'danger' }"
                @click="toggleSection('danger')"
              >
                <span>{{ t('gdpr.dangerZone') }}</span>
                <span class="section-arrow">{{
                  activeSection === 'danger' ? '&#9650;' : '&#9660;'
                }}</span>
              </button>
              <Transition name="accordion">
                <div
                  v-if="activeSection === 'danger'"
                  class="section-content section-content--danger"
                >
                  <p class="section-info">
                    {{ t('gdpr.dangerZoneDesc') }}
                  </p>

                  <!-- Export data -->
                  <button class="btn-export" :disabled="exportLoading" @click="handleExportData">
                    {{ exportLoading ? t('common.loading') : t('gdpr.exportData') }}
                  </button>

                  <!-- Delete account -->
                  <button class="btn-delete-account" @click="openDeleteModal">
                    {{ t('gdpr.deleteAccount') }}
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div class="panel-footer">
            <button class="btn-logout" @click="handleLogout">
              {{ t('user.logout') }}
            </button>
          </div>
        </aside>

        <!-- Delete Account Confirmation Modal -->
        <Transition name="modal-fade">
          <div
            v-if="deleteModalOpen"
            class="delete-modal-overlay"
            @click.self="deleteModalOpen = false"
          >
            <div class="delete-modal" role="dialog" :aria-label="t('gdpr.deleteAccountTitle')">
              <h3 class="delete-modal__title">{{ t('gdpr.deleteAccountTitle') }}</h3>
              <p class="delete-modal__warning">{{ t('gdpr.deleteAccountWarning') }}</p>
              <p class="delete-modal__instruction">{{ t('gdpr.deleteConfirmInstruction') }}</p>

              <input
                v-model="deleteConfirmText"
                type="text"
                class="delete-modal__input"
                placeholder="ELIMINAR"
                autocomplete="off"
              >

              <div v-if="deleteError" class="delete-modal__error">
                {{ deleteError }}
              </div>

              <div class="delete-modal__actions">
                <button
                  class="delete-modal__btn delete-modal__btn--cancel"
                  @click="deleteModalOpen = false"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  class="delete-modal__btn delete-modal__btn--confirm"
                  :disabled="deleteLoading || deleteConfirmText !== 'ELIMINAR'"
                  @click="handleDeleteAccount"
                >
                  {{ deleteLoading ? t('common.loading') : t('gdpr.confirmDelete') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.user-panel-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.user-panel-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.user-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 400px;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-banner {
  display: flex;
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: linear-gradient(
    135deg,
    var(--color-primary, #23424a) 0%,
    var(--color-primary-dark, #1a3238) 100%
  );
  color: var(--color-white, #fff);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  border-radius: var(--border-radius, 8px);
  margin: 12px 12px 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.panel-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  z-index: 10;
}

.panel-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  background: var(--color-primary, #23424a);
  color: white;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.user-info p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  opacity: 0.8;
}

/* Menu sections */
.panel-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.panel-section {
  border-bottom: 1px solid #f0f0f0;
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}

.section-header:hover {
  background: #f9f9f9;
}

.section-header.active {
  background: #f5f5f5;
}

.section-arrow {
  font-size: 0.75rem;
  color: #999;
}

.section-content {
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #eee;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 8px;
}

/* Form fields */
.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.form-field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-field input:disabled {
  background: #f5f5f5;
  color: #888;
}

.form-field small {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  color: #999;
}

.form-message {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.form-message.success {
  background: #dcfce7;
  color: #16a34a;
}

.form-message.error {
  background: #fee2e2;
  color: #dc2626;
}

/* Chat */
.chat-messages {
  height: 200px;
  overflow-y: auto;
  background: #f0f2f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-loading,
.chat-empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 0.9rem;
}

.chat-message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
}

.chat-message.sent {
  align-self: flex-end;
  background: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.chat-message.received {
  align-self: flex-start;
  background: white;
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: 0.9rem;
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  color: #888;
  text-align: right;
  margin-top: 4px;
}

.chat-input-area {
  display: flex;
  gap: 8px;
}

.chat-input-area textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 0.9rem;
}

.btn-send {
  padding: 10px 16px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-info {
  margin-top: 12px;
  font-size: 0.75rem;
  color: #888;
  text-align: center;
}

/* Empty states */
.empty-state {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9rem;
}

.section-info {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 12px;
}

/* Form row (side-by-side inputs) */
.form-row {
  display: flex;
  gap: 8px;
}

.form-row input {
  flex: 1;
  min-width: 0;
}

/* Items list (demands, ads) */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #eee;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.item-date {
  font-size: 0.75rem;
  color: #999;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* Favorites */
.favorites-count {
  margin-bottom: 12px;
  font-weight: 500;
}

/* Checkboxes */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  display: block;
  width: 100%;
  padding: 12px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

/* Footer */
.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-logout {
  width: 100%;
  padding: 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-logout:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

/* Transitions */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.3s ease;
}

.panel-enter-active .user-panel,
.panel-leave-active .user-panel {
  transition: transform 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .user-panel,
.panel-leave-to .user-panel {
  transform: translateX(100%);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ---- GDPR Danger Zone ---- */
.panel-section--danger {
  border-bottom: none;
}

.section-header--danger {
  color: #dc2626;
}

.section-header--danger:hover {
  background: #fef2f2;
}

.section-content--danger {
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.btn-export {
  width: 100%;
  padding: 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 8px;
  min-height: 44px;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-account {
  width: 100%;
  padding: 12px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.15s;
}

.btn-delete-account:hover {
  background: #b91c1c;
}

/* ---- Delete Confirmation Modal ---- */
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 16px;
}

.delete-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.delete-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #dc2626;
  margin: 0 0 12px 0;
}

.delete-modal__warning {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.delete-modal__instruction {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 12px 0;
}

.delete-modal__input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 44px;
}

.delete-modal__input:focus {
  outline: none;
  border-color: #dc2626;
}

.delete-modal__error {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.85rem;
}

.delete-modal__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.delete-modal__btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  border: none;
  font-size: 0.9rem;
}

.delete-modal__btn--cancel {
  background: #f0f0f0;
  color: #333;
}

.delete-modal__btn--cancel:hover {
  background: #e0e0e0;
}

.delete-modal__btn--confirm {
  background: #dc2626;
  color: white;
}

.delete-modal__btn--confirm:hover:not(:disabled) {
  background: #b91c1c;
}

.delete-modal__btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Mobile */
@media (max-width: 480px) {
  .user-panel {
    max-width: 100%;
  }
}
</style>
