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
  accent: 'var(--color-amber-400)',
  background: '#FFFFFF',
  surface: 'var(--color-gray-100)',
  text: '#1F2A2A',
  text_secondary: 'var(--color-teal-dark)',
  border: 'var(--color-gray-300)',
  error: 'var(--color-error)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
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
  name.value = { es: '', en: '', ...config.value.name }
  tagline.value = { es: '', en: '', ...config.value.tagline }
  metaDescription.value = { es: '', en: '', ...config.value.meta_description }
  logoUrl.value = config.value.logo_url || ''
  logoDarkUrl.value = config.value.logo_dark_url || ''
  faviconUrl.value = config.value.favicon_url || ''
  ogImageUrl.value = config.value.og_image_url || ''
  logoTextConfig.value = {
    ...DEFAULT_LOGO_TEXT,
    ...(config.value.logo_text_config as Partial<LogoTextSettings>),
  }
  fontPreset.value = config.value.font_preset || 'default'
  theme.value = {
    primary: '#23424A',
    primary_hover: '#1A3238',
    secondary: '#7FD1C8',
    accent: 'var(--color-amber-400)',
    background: '#FFFFFF',
    surface: 'var(--color-gray-100)',
    text: '#1F2A2A',
    text_secondary: 'var(--color-teal-dark)',
    border: 'var(--color-gray-300)',
    error: 'var(--color-error)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    ...config.value.theme,
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
        <p class="section-subtitle">{{ $t('admin.configBranding.subtitle') }}</p>
      </div>
      <NuxtLink to="/admin/config" class="btn-back">{{ $t('common.back') }}</NuxtLink>
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
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.section-header h2 {
  margin: 0 0 var(--spacing-1);
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--color-gray-300);
}

.feedback-banner {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: 0.95rem;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.save-bar {
  padding: var(--spacing-5) 0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) 1.75rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
