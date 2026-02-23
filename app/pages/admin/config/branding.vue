<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// --- Local form state ---
const name = ref<Record<string, string>>({ es: '', en: '' })
const tagline = ref<Record<string, string>>({ es: '', en: '' })
const metaDescription = ref<Record<string, string>>({ es: '', en: '' })
const logoUrl = ref('')
const logoDarkUrl = ref('')
const faviconUrl = ref('')
const ogImageUrl = ref('')
const fontPreset = ref('default')
const theme = ref<Record<string, string>>({
  primary: '#23424A',
  primary_hover: '#1A3238',
  secondary: '#7FD1C8',
  accent: '#D4A017',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#1F2A2A',
  text_secondary: '#4A5A5A',
  border: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
})

const fontPresets = [
  { value: 'default', label: 'Default (Inter)' },
  { value: 'industrial', label: 'Industrial (Barlow)' },
  { value: 'modern', label: 'Modern (Outfit)' },
  { value: 'classic', label: 'Classic (Merriweather)' },
]

const themeColorLabels: Record<string, string> = {
  primary: 'Primario',
  primary_hover: 'Primario hover',
  secondary: 'Secundario',
  accent: 'Acento',
  background: 'Fondo',
  surface: 'Superficie',
  text: 'Texto',
  text_secondary: 'Texto secundario',
  border: 'Bordes',
  error: 'Error',
  success: 'Exito',
  warning: 'Advertencia',
}

function populateForm() {
  if (!config.value) return
  name.value = { es: '', en: '', ...(config.value.name || {}) }
  tagline.value = { es: '', en: '', ...(config.value.tagline || {}) }
  metaDescription.value = { es: '', en: '', ...(config.value.meta_description || {}) }
  logoUrl.value = config.value.logo_url || ''
  logoDarkUrl.value = config.value.logo_dark_url || ''
  faviconUrl.value = config.value.favicon_url || ''
  ogImageUrl.value = config.value.og_image_url || ''
  fontPreset.value = config.value.font_preset || 'default'
  theme.value = {
    primary: '#23424A',
    primary_hover: '#1A3238',
    secondary: '#7FD1C8',
    accent: '#D4A017',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#1F2A2A',
    text_secondary: '#4A5A5A',
    border: '#D1D5DB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    ...(config.value.theme || {}),
  }
}

onMounted(async () => {
  await loadConfig()
  populateForm()
})

async function handleSave() {
  const fields: Record<string, unknown> = {
    name: name.value,
    tagline: tagline.value,
    meta_description: metaDescription.value,
    logo_url: logoUrl.value || null,
    logo_dark_url: logoDarkUrl.value || null,
    favicon_url: faviconUrl.value || null,
    og_image_url: ogImageUrl.value || null,
    font_preset: fontPreset.value,
    theme: theme.value,
  }
  await saveFields(fields)
}
</script>

<template>
  <div class="admin-branding">
    <div class="section-header">
      <div>
        <h2>Identidad de marca</h2>
        <p class="section-subtitle">
          Configura el nombre, logotipo, tipografia y colores del sitio
        </p>
      </div>
      <NuxtLink to="/admin/config" class="btn-back"> Volver </NuxtLink>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="feedback-banner error-banner">
      {{ error }}
    </div>
    <div v-if="saved" class="feedback-banner success-banner">Cambios guardados correctamente</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

    <template v-else-if="config">
      <!-- Identity section -->
      <div class="config-card">
        <h3 class="card-title">Identidad</h3>
        <p class="card-subtitle">Nombre, lema y descripcion del sitio en cada idioma</p>

        <div class="form-group">
          <label>Nombre del sitio</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="name.es" type="text" placeholder="Nombre en espanol" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="name.en" type="text" placeholder="Site name in English" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Lema (tagline)</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="tagline.es" type="text" placeholder="Lema en espanol" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="tagline.en" type="text" placeholder="Tagline in English" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Meta description</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input
                v-model="metaDescription.es"
                type="text"
                placeholder="Descripcion SEO en espanol"
              >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input
                v-model="metaDescription.en"
                type="text"
                placeholder="SEO description in English"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Logos section -->
      <div class="config-card">
        <h3 class="card-title">Logotipos e imagenes</h3>
        <p class="card-subtitle">URLs de los recursos graficos del sitio</p>

        <div class="form-group">
          <label for="logo_url">Logo principal (URL)</label>
          <input
            id="logo_url"
            v-model="logoUrl"
            type="text"
            placeholder="https://res.cloudinary.com/..."
          >
          <div v-if="logoUrl" class="image-preview">
            <img :src="logoUrl" alt="Logo preview" >
          </div>
        </div>

        <div class="form-group">
          <label for="logo_dark_url">Logo oscuro (URL)</label>
          <input
            id="logo_dark_url"
            v-model="logoDarkUrl"
            type="text"
            placeholder="https://res.cloudinary.com/..."
          >
          <div v-if="logoDarkUrl" class="image-preview dark-preview">
            <img :src="logoDarkUrl" alt="Logo dark preview" >
          </div>
        </div>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="favicon_url">Favicon (URL)</label>
            <input id="favicon_url" v-model="faviconUrl" type="text" placeholder="https://..." >
          </div>
          <div class="form-group">
            <label for="og_image_url">Imagen OG (URL)</label>
            <input id="og_image_url" v-model="ogImageUrl" type="text" placeholder="https://..." >
          </div>
        </div>
      </div>

      <!-- Typography section -->
      <div class="config-card">
        <h3 class="card-title">Tipografia</h3>
        <p class="card-subtitle">Selecciona el estilo tipografico del sitio</p>

        <div class="font-presets">
          <label
            v-for="preset in fontPresets"
            :key="preset.value"
            class="radio-card"
            :class="{ selected: fontPreset === preset.value }"
          >
            <input v-model="fontPreset" type="radio" name="font_preset" :value="preset.value" >
            <span class="radio-label">{{ preset.label }}</span>
          </label>
        </div>
      </div>

      <!-- Colors section -->
      <div class="config-card">
        <h3 class="card-title">Colores</h3>
        <p class="card-subtitle">Personaliza la paleta de colores del tema</p>

        <div class="color-grid">
          <div v-for="(colorValue, colorKey) in theme" :key="colorKey" class="color-field">
            <label :for="`color-${colorKey}`">{{ themeColorLabels[colorKey] || colorKey }}</label>
            <div class="color-input-wrapper">
              <input
                :id="`color-${colorKey}`"
                v-model="theme[colorKey]"
                type="color"
                class="color-picker"
              >
              <input
                v-model="theme[colorKey]"
                type="text"
                class="color-hex"
                maxlength="7"
                placeholder="#000000"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="save-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-branding {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.btn-back {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back:hover {
  background: #d1d5db;
}

.feedback-banner {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.lang-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-badge {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 4px 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.image-preview {
  margin-top: 8px;
  padding: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  text-align: center;
}

.image-preview.dark-preview {
  background: #1f2937;
}

.image-preview img {
  max-width: 200px;
  max-height: 60px;
  object-fit: contain;
}

/* Font presets */
.font-presets {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  border-color: #9ca3af;
}

.radio-card.selected {
  border-color: var(--color-primary, #23424a);
  background: #f0fdfa;
}

.radio-card input[type='radio'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-label {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 500;
}

/* Color grid */
.color-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.color-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  text-transform: capitalize;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-hex {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Save bar */
.save-bar {
  padding: 20px 0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive: tablet+ */
@media (min-width: 480px) {
  .font-presets {
    grid-template-columns: 1fr 1fr;
  }

  .color-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .form-row-2col {
    grid-template-columns: 1fr 1fr;
  }

  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }

  .color-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .font-presets {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
