<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'
import type { LogoTextSettings } from '~/components/shared/LogoTextConfig.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

const DEFAULT_LOGO_TEXT: LogoTextSettings = {
  font_family: 'Inter',
  font_weight: '700',
  letter_spacing: '0em',
  italic: false,
  uppercase: false,
}

const name = ref<Record<string, string>>({ es: '', en: '' })
const tagline = ref<Record<string, string>>({ es: '', en: '' })
const metaDescription = ref<Record<string, string>>({ es: '', en: '' })
const logoUrl = ref('')
const logoDarkUrl = ref('')
const faviconUrl = ref('')
const ogImageUrl = ref('')
const logoTextConfig = ref<LogoTextSettings>({ ...DEFAULT_LOGO_TEXT })
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
  logoTextConfig.value = {
    ...DEFAULT_LOGO_TEXT,
    ...((config.value.logo_text_config as Partial<LogoTextSettings>) || {}),
  }
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
    logo_text_config: logoTextConfig.value,
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
        <h2>{{ $t('admin.configBranding.title') }}</h2>
        <p class="section-subtitle">
          Configura el nombre, logotipo, tipografia y colores del sitio
        </p>
      </div>
      <NuxtLink to="/admin/config" class="btn-back">Volver</NuxtLink>
    </div>

    <div v-if="error" class="feedback-banner error-banner">{{ error }}</div>
    <div v-if="saved" class="feedback-banner success-banner">{{ $t('admin.common.savedOk') }}</div>

    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else-if="config">
      <BrandingIdentityCard
        v-model:name="name"
        v-model:tagline="tagline"
        v-model:meta-description="metaDescription"
      />
      <BrandingLogosCard
        v-model:logo-url="logoUrl"
        v-model:logo-dark-url="logoDarkUrl"
        v-model:favicon-url="faviconUrl"
        v-model:og-image-url="ogImageUrl"
        v-model:logo-text-config="logoTextConfig"
        :vertical-name="name.es || name.en"
      />
      <BrandingTypographyCard v-model:font-preset="fontPreset" :font-presets="fontPresets" />
      <BrandingColorsCard v-model:theme="theme" :color-labels="themeColorLabels" />

      <div class="save-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
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
</style>
