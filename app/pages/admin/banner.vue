<script setup lang="ts">
import { useAdminConfig, type BannerConfig } from '~/composables/admin/useAdminConfig'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { sanitize } = useSanitize()
const toast = useToast()

const { loading, saving, error, banner, fetchBanner, saveBanner, getBannerPreviewHtml } =
  useAdminConfig()

// Form state
const formData = ref<BannerConfig>({
  text_es: '',
  text_en: '',
  url: null,
  from_date: null,
  to_date: null,
  active: false,
})

// Preview state
const showPreview = ref(false)
const previewLang = ref<'es' | 'en'>('es')

// Emoji picker state
const showEmojiPicker = ref(false)
const emojiPickerTarget = ref<'es' | 'en' | null>(null)

// Emojis organized by categories (matching legacy)
const emojiCategories = [
  {
    name: 'Vehículos y Transporte',
    emojis: ['🚚', '🚛', '🚐', '🚌', '🚍', '🚎', '🚗', '🚕', '🏎️', '🚜'],
  },
  {
    name: 'Maquinaria y Logística',
    emojis: ['🏗️', '⚙️', '🔧', '🔩', '🛠️', '⛽', '🛢️', '📦', '🏭', '🚧'],
  },
  {
    name: 'Tráfico y Señales',
    emojis: ['🚦', '🚥', '🛑', '⛔', '🚫', '🛣️', '🛤️', '🗺️', '🧭', '📍'],
  },
  {
    name: 'Leyes y Documentos',
    emojis: ['📋', '📄', '📝', '📑', '🗂️', '⚖️', '🏛️', '📜', '✍️', '🔏'],
  },
  {
    name: 'Alertas y Actualizaciones',
    emojis: ['🔔', '📢', '📣', '⚠️', '🚨', '❗', '❓', 'ℹ️', '🆕', '🆙'],
  },
  {
    name: 'Dinero y Negocios',
    emojis: ['💰', '💵', '💶', '💳', '🏷️', '🤝', '📈', '📉', '💹', '🎯'],
  },
  {
    name: 'Celebración y Positivos',
    emojis: ['✅', '✨', '🎉', '🎊', '🏆', '⭐', '🌟', '💯', '🔥', '💪'],
  },
  {
    name: 'Internacional',
    emojis: ['🌍', '🌎', '🌏', '🇪🇸', '🇬🇧', '🇪🇺', '🇫🇷', '🇩🇪', '🇮🇹', '🇵🇹'],
  },
  {
    name: 'Tiempo y Calendario',
    emojis: ['📅', '📆', '🗓️', '⏰', '⏳', '🕐', '📞', '📧', '💡', '🎁'],
  },
]

// Quick emojis shown below input (most common)
const quickEmojis = ['🔔', '📢', '⚠️', '🎉', '🚛', '✅']

// User panel banner state
const userPanelForm = ref({
  text_es: '',
  text_en: '',
  url: '',
  active: false,
  from_date: null as string | null,
  to_date: null as string | null,
})
const userPanelSaving = ref(false)

async function fetchUserPanelBanner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'user_panel_banner')
    .single()
  if (data?.value) {
    const config = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
    Object.assign(userPanelForm.value, config)
  }
}

async function saveUserPanelBanner() {
  userPanelSaving.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = useSupabaseClient<any>()
    await supabase.from('config').upsert({ key: 'user_panel_banner', value: userPanelForm.value })
    toast.success('admin.banner.saved')
  } catch {
    toast.error('admin.banner.saveError')
  } finally {
    userPanelSaving.value = false
  }
}

// Load data
onMounted(async () => {
  await fetchBanner()
  formData.value = { ...banner.value }
  await fetchUserPanelBanner()
})

// Watch for changes in banner from store
watch(
  banner,
  (newBanner) => {
    if (!saving.value) {
      formData.value = { ...newBanner }
    }
  },
  { deep: true },
)

// Save banner
async function handleSave() {
  const success = await saveBanner(formData.value)
  if (success) {
    toast.success('toast.bannerSaved')
  }
}

// Toggle preview
function togglePreview() {
  showPreview.value = !showPreview.value
}

// Open emoji picker for a specific field
function openEmojiPicker(target: 'es' | 'en') {
  emojiPickerTarget.value = target
  showEmojiPicker.value = true
}

// Close emoji picker
function closeEmojiPicker() {
  showEmojiPicker.value = false
  emojiPickerTarget.value = null
}

// Insert emoji at cursor position
function insertEmoji(emoji: string, target?: 'es' | 'en') {
  const fieldTarget = target || emojiPickerTarget.value
  if (!fieldTarget) return

  const fieldId = fieldTarget === 'es' ? 'bannerEs' : 'bannerEn'
  const input = document.getElementById(fieldId) as HTMLInputElement
  if (!input) return

  const start = input.selectionStart || 0
  const end = input.selectionEnd || 0
  const fieldKey = fieldTarget === 'es' ? 'text_es' : 'text_en'
  const currentValue = formData.value[fieldKey] || ''

  formData.value[fieldKey] = currentValue.slice(0, start) + emoji + currentValue.slice(end)

  // Close picker if it was open
  if (showEmojiPicker.value) {
    closeEmojiPicker()
  }

  nextTick(() => {
    input.focus()
    input.setSelectionRange(start + emoji.length, start + emoji.length)
  })
}

// Format datetime for input
function formatDatetimeLocal(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().slice(0, 16)
}

// Parse datetime from input
function parseDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

// Computed preview HTML
const previewHtml = computed(() => {
  return getBannerPreviewHtml(previewLang.value)
})

// Status text
const statusText = computed(() => {
  if (!formData.value.active) return 'Banner desactivado'
  if (!formData.value.text_es && !formData.value.text_en) return 'Sin texto configurado'

  const now = new Date()

  if (formData.value.from_date) {
    const fromDate = new Date(formData.value.from_date)
    if (now < fromDate) {
      return `Programado para: ${fromDate.toLocaleDateString('es-ES')} ${fromDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  if (formData.value.to_date) {
    const toDate = new Date(formData.value.to_date)
    if (now > toDate) {
      return 'Período expirado'
    }
    return `Activo hasta: ${toDate.toLocaleDateString('es-ES')} ${toDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  }

  return 'Activo ahora'
})

const statusClass = computed(() => {
  if (!formData.value.active) return 'status-inactive'
  if (!formData.value.text_es && !formData.value.text_en) return 'status-inactive'

  const now = new Date()

  if (formData.value.from_date && now < new Date(formData.value.from_date)) {
    return 'status-scheduled'
  }

  if (formData.value.to_date && now > new Date(formData.value.to_date)) {
    return 'status-expired'
  }

  return 'status-active'
})
</script>

<template>
  <div class="admin-banner">
    <!-- Header -->
    <div class="section-header">
      <h2>Banner</h2>
      <div class="header-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando configuración...</div>

    <!-- Form -->
    <div v-else class="banner-form">
      <div class="form-card">
        <!-- Spanish Text -->
        <div class="form-group">
          <label for="bannerEs">Texto Español</label>
          <div class="input-with-emoji">
            <div class="input-row">
              <input
                id="bannerEs"
                v-model="formData.text_es"
                type="text"
                placeholder="Texto del aviso en español"
              >
              <button
                type="button"
                class="btn-emoji-picker"
                title="Seleccionar emoji"
                @click="openEmojiPicker('es')"
              >
                😀
              </button>
            </div>
            <div class="quick-emojis">
              <button
                v-for="emoji in quickEmojis"
                :key="emoji"
                class="emoji-btn-quick"
                type="button"
                :title="`Insertar ${emoji}`"
                @click="insertEmoji(emoji, 'es')"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- English Text -->
        <div class="form-group">
          <label for="bannerEn">Texto Inglés</label>
          <div class="input-with-emoji">
            <div class="input-row">
              <input
                id="bannerEn"
                v-model="formData.text_en"
                type="text"
                placeholder="Banner text in English"
              >
              <button
                type="button"
                class="btn-emoji-picker"
                title="Select emoji"
                @click="openEmojiPicker('en')"
              >
                😀
              </button>
            </div>
            <div class="quick-emojis">
              <button
                v-for="emoji in quickEmojis"
                :key="emoji"
                class="emoji-btn-quick"
                type="button"
                :title="`Insert ${emoji}`"
                @click="insertEmoji(emoji, 'en')"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- URL -->
        <div class="form-group">
          <label for="bannerUrl">URL enlace (opcional)</label>
          <input id="bannerUrl" v-model="formData.url" type="url" placeholder="https://..." >
          <p class="form-hint">
            Si añades URL, aparecerá "Más información" / "More info" al final del texto
          </p>
        </div>

        <!-- Date Range -->
        <div class="form-row">
          <div class="form-group">
            <label for="bannerDesde">Publicar desde (opcional)</label>
            <input
              id="bannerDesde"
              type="datetime-local"
              :value="formatDatetimeLocal(formData.from_date)"
              @input="
                formData.from_date = parseDatetimeLocal(($event.target as HTMLInputElement).value)
              "
            >
            <p class="form-hint">Vacío = activo inmediatamente</p>
          </div>
          <div class="form-group">
            <label for="bannerHasta">Publicar hasta (opcional)</label>
            <input
              id="bannerHasta"
              type="datetime-local"
              :value="formatDatetimeLocal(formData.to_date)"
              @input="
                formData.to_date = parseDatetimeLocal(($event.target as HTMLInputElement).value)
              "
            >
            <p class="form-hint">Vacío = sin fecha de fin</p>
          </div>
        </div>

        <!-- Active Toggle -->
        <div class="form-group">
          <label class="checkbox-label toggle-label">
            <input v-model="formData.active" type="checkbox" class="toggle-input" >
            <span class="toggle-switch" />
            <span class="toggle-text">Banner activo</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button class="btn-primary" :disabled="saving" @click="handleSave">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-secondary" type="button" @click="togglePreview">
            {{ showPreview ? 'Ocultar preview' : 'Ver preview' }}
          </button>
        </div>
      </div>

      <!-- Preview Panel -->
      <Transition name="slide">
        <div v-if="showPreview" class="preview-panel">
          <div class="preview-header">
            <h4>Vista previa</h4>
            <div class="preview-lang-toggle">
              <button :class="{ active: previewLang === 'es' }" @click="previewLang = 'es'">
                ES
              </button>
              <button :class="{ active: previewLang === 'en' }" @click="previewLang = 'en'">
                EN
              </button>
            </div>
          </div>
          <div class="preview-content">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="previewHtml" class="banner-preview" v-html="sanitize(previewHtml)" />
            <div v-else class="preview-empty">Sin texto configurado para este idioma</div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- User Panel Banner -->
    <div class="user-panel-banner-section">
      <div class="section-header">
        <h2>{{ $t('admin.banner.userPanelTitle') }}</h2>
      </div>
      <p class="admin-hint">{{ $t('admin.banner.userPanelHint') }}</p>

      <div class="form-card">
        <div class="form-group">
          <label>{{ $t('admin.banner.textEs') }}</label>
          <input v-model="userPanelForm.text_es" type="text" class="form-input" >
        </div>
        <div class="form-group">
          <label>{{ $t('admin.banner.textEn') }}</label>
          <input v-model="userPanelForm.text_en" type="text" class="form-input" >
        </div>
        <div class="form-group">
          <label>{{ $t('admin.banner.url') }}</label>
          <input v-model="userPanelForm.url" type="url" class="form-input" >
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('admin.banner.fromDate') }}</label>
            <input v-model="userPanelForm.from_date" type="date" class="form-input" >
          </div>
          <div class="form-group">
            <label>{{ $t('admin.banner.toDate') }}</label>
            <input v-model="userPanelForm.to_date" type="date" class="form-input" >
          </div>
        </div>
        <div class="form-group">
          <label class="toggle-label">
            <input v-model="userPanelForm.active" type="checkbox" class="toggle-input" >
            <span class="toggle-switch" />
            <span class="toggle-text">{{ $t('admin.banner.active') }}</span>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn-primary" :disabled="userPanelSaving" @click="saveUserPanelBanner">
            {{ userPanelSaving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Emoji Picker Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click.self="closeEmojiPicker">
          <div class="emoji-picker-modal">
            <div class="emoji-picker-header">
              <span>Seleccionar emoji</span>
              <button class="btn-close-picker" type="button" @click="closeEmojiPicker">×</button>
            </div>
            <div class="emoji-picker-body">
              <div v-for="category in emojiCategories" :key="category.name" class="emoji-category">
                <div class="emoji-category-name">{{ category.name }}</div>
                <div class="emoji-grid">
                  <button
                    v-for="emoji in category.emojis"
                    :key="emoji"
                    class="emoji-btn"
                    type="button"
                    @click="insertEmoji(emoji)"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-banner {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.header-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: #dcfce7;
  color: #16a34a;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.status-scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-expired {
  background: #fee2e2;
  color: #dc2626;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.banner-form {
  display: grid;
  gap: 24px;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 700px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input[type='text'],
.form-group input[type='url'],
.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.input-with-emoji {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row input {
  flex: 1;
}

.btn-emoji-picker {
  padding: 8px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s;
}

.btn-emoji-picker:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.quick-emojis {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.emoji-btn-quick {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s;
}

.emoji-btn-quick:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

/* Emoji Picker Modal */
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
}

.emoji-picker-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 380px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  flex-shrink: 0;
}

.btn-close-picker {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s;
}

.btn-close-picker:hover {
  background: #e5e7eb;
}

.emoji-picker-body {
  overflow-y: auto;
  padding: 12px;
  flex: 1;
}

.emoji-category {
  margin-bottom: 16px;
}

.emoji-category:last-child {
  margin-bottom: 0;
}

.emoji-category-name {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
}

.emoji-btn {
  font-size: 22px;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  text-align: center;
  transition: all 0.15s;
  background: transparent;
  border: none;
}

.emoji-btn:hover {
  background: #e0f2fe;
  transform: scale(1.15);
}

/* Fade transition for modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: #d1d5db;
  border-radius: 13px;
  transition: background 0.2s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: #16a34a;
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-weight: 500;
  color: #374151;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Preview Panel */
.preview-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 700px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #374151;
}

.preview-lang-toggle {
  display: flex;
  gap: 4px;
}

.preview-lang-toggle button {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.preview-lang-toggle button:hover {
  background: #e5e7eb;
}

.preview-lang-toggle button.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.preview-content {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.banner-preview {
  background: #fbbf24;
  color: #1f2a2a;
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
}

.banner-preview :deep(a) {
  color: #0f2a2e;
  font-weight: 600;
  text-decoration: underline;
}

.preview-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* User Panel Banner Section */
.user-panel-banner-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid #e5e7eb;
}

.admin-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-card {
    padding: 16px;
  }

  .quick-emojis {
    max-width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }

  .emoji-picker-overlay {
    padding: 10px;
    align-items: flex-end;
  }

  .emoji-picker-modal {
    max-width: 100%;
    max-height: 70vh;
  }

  .emoji-grid {
    grid-template-columns: repeat(8, 1fr);
  }

  .emoji-btn {
    font-size: 20px;
    padding: 5px;
  }
}
</style>
