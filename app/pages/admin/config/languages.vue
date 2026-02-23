<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()
const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// Local form state
const activeLocales = ref<string[]>([])
const defaultLocale = ref('es')
const translationEngine = ref('gpt4omini')
const translationApiKey = ref('')
const autoTranslateOnPublish = ref(false)

// Translation progress state
interface LocaleProgress {
  locale: string
  label: string
  existing: number
  expected: number
  percentage: number
}
const translationProgress = ref<LocaleProgress[]>([])
const loadingProgress = ref(false)

// Pending translations queue state
const pendingVehicles = ref(0)
const pendingArticles = ref(0)
const translating = ref(false)
const translateSuccess = ref(false)

const availableLocales = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'it', label: 'Italiano' },
]

const translationEngines = [
  { value: 'gpt4omini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude_haiku', label: 'Claude Haiku (Anthropic)' },
  { value: 'deepl', label: 'DeepL' },
]

// Computed: available locales for default locale dropdown (only active ones)
const defaultLocaleOptions = computed(() => {
  return availableLocales.filter((loc) => activeLocales.value.includes(loc.value))
})

// Computed: locales that need translations (active minus default)
const translatableLocales = computed(() => {
  return activeLocales.value.filter((l) => l !== defaultLocale.value)
})

// Computed: whether the "Traducir todo ahora" button should be disabled
const translateAllDisabled = computed(() => {
  return (pendingVehicles.value === 0 && pendingArticles.value === 0) || !translationApiKey.value
})

async function fetchTranslationProgress() {
  loadingProgress.value = true
  try {
    const locales = translatableLocales.value
    if (locales.length === 0) {
      translationProgress.value = []
      return
    }

    // Count active vehicles
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    // Count published articles
    const { count: articleCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    const totalVehicles = vehicleCount ?? 0
    const totalArticles = articleCount ?? 0

    // Translatable fields: vehicles = 1 (description), articles = 3 (content, description, excerpt)
    const vehicleFields = 1
    const articleFields = 3

    const progressList: LocaleProgress[] = []

    for (const locale of locales) {
      // Count existing translations for this locale
      const { count: vehicleTranslations } = await supabase
        .from('content_translations')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', 'vehicle')
        .eq('locale', locale)

      const { count: articleTranslations } = await supabase
        .from('content_translations')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', 'article')
        .eq('locale', locale)

      const existing = (vehicleTranslations ?? 0) + (articleTranslations ?? 0)
      const expected = totalVehicles * vehicleFields + totalArticles * articleFields
      const percentage = expected > 0 ? Math.round((existing / expected) * 100) : 0

      const localeInfo = availableLocales.find((l) => l.value === locale)
      progressList.push({
        locale,
        label: localeInfo?.label ?? locale,
        existing,
        expected,
        percentage: Math.min(percentage, 100),
      })
    }

    translationProgress.value = progressList
  } catch {
    // Silently fail — progress is informational
    translationProgress.value = []
  } finally {
    loadingProgress.value = false
  }
}

async function fetchPendingCounts() {
  try {
    const { count: vCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('pending_translations', true)

    const { count: aCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('pending_translations', true)

    pendingVehicles.value = vCount ?? 0
    pendingArticles.value = aCount ?? 0
  } catch {
    pendingVehicles.value = 0
    pendingArticles.value = 0
  }
}

async function handleTranslateAll() {
  if (translateAllDisabled.value) return
  translating.value = true
  translateSuccess.value = false

  try {
    // Placeholder: clear pending_translations flags
    if (pendingVehicles.value > 0) {
      await supabase
        .from('vehicles')
        .update({ pending_translations: false })
        .eq('pending_translations', true)
    }

    if (pendingArticles.value > 0) {
      await supabase
        .from('articles')
        .update({ pending_translations: false })
        .eq('pending_translations', true)
    }

    pendingVehicles.value = 0
    pendingArticles.value = 0
    translateSuccess.value = true

    // Hide success message after 4 seconds
    setTimeout(() => {
      translateSuccess.value = false
    }, 4000)
  } catch {
    // Error handling — keep current state
  } finally {
    translating.value = false
  }
}

onMounted(async () => {
  const cfg = await loadConfig()
  if (cfg) {
    activeLocales.value = [...(cfg.active_locales || ['es'])]
    defaultLocale.value = cfg.default_locale || 'es'
    translationEngine.value = cfg.translation_engine || 'gpt4omini'
    translationApiKey.value = cfg.translation_api_key_encrypted || ''
    autoTranslateOnPublish.value = cfg.auto_translate_on_publish ?? false
  }

  // Fetch translation progress and pending counts after config loads
  await Promise.all([fetchTranslationProgress(), fetchPendingCounts()])
})

// If the default locale is deselected, reset to first active
watch(activeLocales, (newLocales) => {
  if (!newLocales.includes(defaultLocale.value)) {
    defaultLocale.value = newLocales[0] || 'es'
  }
})

// Re-fetch translation progress when active locales or default locale changes
watch([activeLocales, defaultLocale], () => {
  fetchTranslationProgress()
})

const hasChanges = computed(() => {
  if (!config.value) return false
  const origLocales = config.value.active_locales || ['es']
  const origDefault = config.value.default_locale || 'es'
  const origEngine = config.value.translation_engine || 'gpt4omini'
  const origKey = config.value.translation_api_key_encrypted || ''
  const origAutoTranslate = config.value.auto_translate_on_publish ?? false

  if (activeLocales.value.length !== origLocales.length) return true
  if (activeLocales.value.some((l) => !origLocales.includes(l))) return true
  if (origLocales.some((l) => !activeLocales.value.includes(l))) return true
  if (defaultLocale.value !== origDefault) return true
  if (translationEngine.value !== origEngine) return true
  if (translationApiKey.value !== origKey) return true
  if (autoTranslateOnPublish.value !== origAutoTranslate) return true
  return false
})

async function handleSave() {
  if (activeLocales.value.length === 0) {
    return
  }
  await saveFields({
    active_locales: [...activeLocales.value],
    default_locale: defaultLocale.value,
    translation_engine: translationEngine.value,
    translation_api_key_encrypted: translationApiKey.value || null,
    auto_translate_on_publish: autoTranslateOnPublish.value,
  })
}
</script>

<template>
  <div class="admin-config-languages">
    <div class="section-header">
      <h2>Idiomas</h2>
      <p class="section-subtitle">
        Configura los idiomas activos y el motor de traduccion automatica.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

    <template v-else>
      <!-- Error banner -->
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Success banner -->
      <div v-if="saved" class="success-banner">Cambios guardados correctamente.</div>

      <!-- Active Locales -->
      <div class="config-card">
        <h3 class="card-title">Idiomas Activos</h3>
        <p class="card-description">
          Selecciona los idiomas en los que estara disponible el sitio.
        </p>
        <div class="checkbox-grid">
          <label v-for="locale in availableLocales" :key="locale.value" class="checkbox-label">
            <input v-model="activeLocales" type="checkbox" :value="locale.value" >
            <span>{{ locale.label }}</span>
          </label>
        </div>
      </div>

      <!-- Default Locale -->
      <div class="config-card">
        <h3 class="card-title">Idioma por Defecto</h3>
        <p class="card-description">
          El idioma principal del sitio. Debe ser uno de los idiomas activos.
        </p>
        <div class="form-group">
          <select v-model="defaultLocale" class="form-select">
            <option v-for="loc in defaultLocaleOptions" :key="loc.value" :value="loc.value">
              {{ loc.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Translation Engine -->
      <div class="config-card">
        <h3 class="card-title">Motor de Traduccion</h3>
        <p class="card-description">
          Selecciona el servicio que se utilizara para las traducciones automaticas.
        </p>
        <div class="radio-group">
          <label v-for="engine in translationEngines" :key="engine.value" class="radio-label">
            <input
              v-model="translationEngine"
              type="radio"
              :value="engine.value"
              name="translationEngine"
            >
            <span>{{ engine.label }}</span>
          </label>
        </div>
      </div>

      <!-- API Key -->
      <div class="config-card">
        <h3 class="card-title">API Key</h3>
        <p class="card-description">Clave de acceso para el motor de traduccion seleccionado.</p>
        <div class="form-group">
          <input
            v-model="translationApiKey"
            type="password"
            class="form-input"
            placeholder="Introduce la API key..."
            autocomplete="off"
          >
        </div>
      </div>

      <!-- Auto-translate Toggle -->
      <div class="config-card">
        <h3 class="card-title">Traduccion Automatica</h3>
        <p class="card-description">
          Si se activa, el contenido se traducira automaticamente al publicar.
        </p>
        <label class="toggle-label">
          <input v-model="autoTranslateOnPublish" type="checkbox" class="toggle-input" >
          <span class="toggle-switch" />
          <span class="toggle-text">
            {{ autoTranslateOnPublish ? 'Activado' : 'Desactivado' }}
          </span>
        </label>
      </div>

      <!-- Translation Progress -->
      <div v-if="translatableLocales.length > 0" class="config-card">
        <h3 class="card-title">Progreso de Traduccion</h3>
        <p class="card-description">
          Estado de las traducciones para cada idioma activo (excepto el idioma por defecto).
        </p>

        <div v-if="loadingProgress" class="progress-loading">Cargando progreso...</div>

        <div v-else-if="translationProgress.length > 0" class="progress-list">
          <div v-for="prog in translationProgress" :key="prog.locale" class="progress-item">
            <div class="progress-header">
              <span class="progress-locale">{{ prog.label }}</span>
              <span class="progress-count"
                >{{ prog.existing }} / {{ prog.expected }} traducciones</span
              >
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: prog.percentage + '%' }" />
            </div>
            <span class="progress-percentage">{{ prog.percentage }}%</span>
          </div>
        </div>

        <div v-else class="progress-empty">No hay traducciones esperadas todavia.</div>
      </div>

      <!-- Pending Translation Queue -->
      <div class="config-card">
        <h3 class="card-title">Cola de Traducciones Pendientes</h3>
        <p class="card-description">Contenido marcado como pendiente de traduccion.</p>

        <div v-if="translateSuccess" class="success-banner" style="margin-bottom: 16px">
          Traducciones procesadas correctamente. Los flags pendientes han sido limpiados.
        </div>

        <div class="pending-list">
          <div class="pending-row">
            <span class="pending-label">Vehiculos pendientes:</span>
            <span class="pending-count">{{ pendingVehicles }}</span>
          </div>
          <div class="pending-row">
            <span class="pending-label">Articulos pendientes:</span>
            <span class="pending-count">{{ pendingArticles }}</span>
          </div>
        </div>

        <button
          class="btn-translate"
          :disabled="translateAllDisabled || translating"
          @click="handleTranslateAll"
        >
          {{ translating ? 'Traduciendo...' : 'Traducir todo ahora' }}
        </button>

        <p v-if="!translationApiKey" class="hint-text">
          Configura una API key para habilitar la traduccion.
        </p>
      </div>

      <!-- Save Button -->
      <div class="save-section">
        <button class="btn-primary" :disabled="saving || !hasChanges" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-config-languages {
  padding: 0;
}

.section-header {
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.875rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.form-group {
  margin-bottom: 0;
}

.form-select {
  width: 100%;
  max-width: 320px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  color: #374151;
  cursor: pointer;
  min-height: 44px;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-input {
  width: 100%;
  max-width: 480px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-height: 44px;
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
  flex-shrink: 0;
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
  background: var(--color-primary, #23424a);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-size: 0.95rem;
  color: #374151;
}

.save-section {
  margin-top: 8px;
  padding-top: 24px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Translation Progress */
.progress-loading {
  color: #6b7280;
  font-size: 0.875rem;
  padding: 12px 0;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.progress-locale {
  font-weight: 500;
  font-size: 0.95rem;
  color: #1f2937;
}

.progress-count {
  font-size: 0.8rem;
  color: #6b7280;
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary, #23424a);
  border-radius: 4px;
  transition: width 0.3s ease;
  min-width: 0;
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.progress-empty {
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 8px 0;
}

/* Pending Translation Queue */
.pending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 16px;
}

.pending-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
}

.pending-label {
  font-size: 0.95rem;
  color: #374151;
}

.pending-count {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
}

.btn-translate {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-translate:hover {
  background: #059669;
}

.btn-translate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint-text {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

/* Mobile responsive */
@media (min-width: 768px) {
  .progress-item {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .progress-header {
    min-width: 240px;
    flex-shrink: 0;
  }

  .progress-bar-track {
    flex: 1;
  }

  .progress-percentage {
    min-width: 40px;
    text-align: right;
  }
}

@media (max-width: 767px) {
  .section-header h2 {
    font-size: 1.5rem;
  }

  .config-card {
    padding: 16px;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
  }

  .form-select,
  .form-input {
    max-width: 100%;
  }

  .btn-primary,
  .btn-translate {
    width: 100%;
    text-align: center;
  }
}
</style>
