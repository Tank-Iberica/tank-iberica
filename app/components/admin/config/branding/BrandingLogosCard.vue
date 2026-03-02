<script setup lang="ts">
import type { LogoTextSettings } from '~/components/shared/LogoTextConfig.vue'

defineProps<{
  logoUrl: string
  logoDarkUrl: string
  faviconUrl: string
  ogImageUrl: string
  logoTextConfig: LogoTextSettings
  verticalName: string
}>()

const emit = defineEmits<{
  (
    e: 'update:logoUrl' | 'update:logoDarkUrl' | 'update:faviconUrl' | 'update:ogImageUrl',
    value: string,
  ): void
  (e: 'update:logoTextConfig', value: LogoTextSettings): void
}>()

const logoRecommendations = [
  'Tamaño recomendado: 400 × 120 px (ratio 3:1 aprox.)',
  'Fondo transparente (PNG) para uso sobre fondo claro',
  'Mínimo 200 px de ancho para buena calidad',
]

const logoDarkRecommendations = [
  'Mismo ratio que el logo principal',
  'Versión con texto/elementos en blanco o claro',
  'Se usa en el header cuando el fondo es oscuro',
]

const faviconRecommendations = [
  'Tamaño recomendado: 64 × 64 px (cuadrado)',
  'PNG con fondo transparente o color sólido',
  'Se muestra en la pestaña del navegador y marcadores',
]

const ogRecommendations = [
  'Tamaño recomendado: 1200 × 630 px (ratio 1.91:1)',
  'Formato JPG o WebP para mejor compresión',
  'Se muestra al compartir el sitio en redes sociales',
]
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Logotipos e imágenes</h3>
    <p class="card-subtitle">Recursos gráficos del sitio — se suben directamente a Cloudinary</p>

    <div class="uploaders-grid">
      <SharedImageUploader
        :model-value="logoUrl"
        label="Logo principal"
        folder="tracciona/vertical/logos"
        preview-class="logo-preview"
        :recommendations="logoRecommendations"
        enable-bg-removal
        @update:model-value="emit('update:logoUrl', $event)"
      />

      <SharedImageUploader
        :model-value="logoDarkUrl"
        label="Logo oscuro (dark mode)"
        folder="tracciona/vertical/logos"
        preview-class="logo-dark-preview"
        :recommendations="logoDarkRecommendations"
        enable-bg-removal
        @update:model-value="emit('update:logoDarkUrl', $event)"
      />

      <SharedImageUploader
        :model-value="faviconUrl"
        label="Favicon"
        folder="tracciona/vertical/favicons"
        preview-class="favicon-preview"
        :recommendations="faviconRecommendations"
        @update:model-value="emit('update:faviconUrl', $event)"
      />

      <SharedImageUploader
        :model-value="ogImageUrl"
        label="Imagen OG (redes sociales)"
        folder="tracciona/vertical/og"
        preview-class="og-preview"
        :recommendations="ogRecommendations"
        @update:model-value="emit('update:ogImageUrl', $event)"
      />
    </div>

    <!-- Logo text fallback -->
    <div class="logo-text-section">
      <h4 class="subsection-title">Nombre de la vertical como logo</h4>
      <p class="subsection-desc">
        Tipografía usada cuando no hay logo, y como fallback accesible en todo el sitio
      </p>
      <SharedLogoTextConfig
        :model-value="logoTextConfig"
        :preview-name="verticalName"
        @update:model-value="emit('update:logoTextConfig', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
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
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.875rem;
}

.uploaders-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  margin-bottom: 32px;
}

@media (min-width: 768px) {
  .uploaders-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.logo-text-section {
  border-top: 1px solid var(--color-gray-100);
  padding-top: 24px;
}

.subsection-title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.subsection-desc {
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
