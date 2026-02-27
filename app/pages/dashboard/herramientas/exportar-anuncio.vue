<script setup lang="ts">
/**
 * Ad Export Generator for external platforms.
 * Generates optimized ad text for Milanuncios, Wallapop, Facebook, LinkedIn, Instagram.
 * Plan gate: Basic+ (catalogExport).
 */
import { PLATFORMS } from '~/composables/dashboard/useDashboardExportarAnuncio'
import type { PlatformKey } from '~/composables/dashboard/useDashboardExportarAnuncio'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const {
  vehicles,
  selectedVehicleId,
  selectedPlatform,
  generatedText,
  loading,
  error,
  copySuccess,
  selectedVehicle,
  currentPlatformConfig,
  charCount,
  charCountClass,
  thumbnail,
  canExport,
  handleGenerate,
  handleCopy,
  setSelectedVehicleId,
  setSelectedPlatform,
  setGeneratedText,
  init,
} = useDashboardExportarAnuncio()

const { t } = useI18n()

onMounted(async () => {
  await init()
})

function onVehicleIdChange(id: string | null): void {
  setSelectedVehicleId(id)
}

function onPlatformSelect(key: PlatformKey): void {
  setSelectedPlatform(key)
}

function onTextUpdate(text: string): void {
  setGeneratedText(text)
}
</script>

<template>
  <div class="export-page">
    <ExportAnuncioHeader />

    <!-- Plan gate: Free users see upgrade prompt -->
    <ExportAnuncioUpgradeGate v-if="!canExport" />

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <template v-else>
        <!-- Step 1: Select vehicle -->
        <ExportAnuncioVehicleSelector
          :vehicles="vehicles"
          :selected-vehicle-id="selectedVehicleId"
          @update:vehicle-id="onVehicleIdChange"
        />

        <!-- Vehicle preview -->
        <ExportAnuncioVehiclePreview
          v-if="selectedVehicle"
          :vehicle="selectedVehicle"
          :thumbnail="thumbnail"
        />

        <!-- Step 2: Select platform -->
        <ExportAnuncioPlatformSelector
          v-if="selectedVehicle"
          :platforms="PLATFORMS"
          :selected-platform="selectedPlatform"
          :can-generate="!!selectedVehicle"
          @select="onPlatformSelect"
          @generate="handleGenerate"
        />

        <!-- Step 3: Generated text -->
        <ExportAnuncioResult
          v-if="generatedText"
          :generated-text="generatedText"
          :char-count="charCount"
          :max-chars="currentPlatformConfig.maxChars"
          :char-count-class="charCountClass"
          :copy-success="copySuccess"
          @update:text="onTextUpdate"
          @copy="handleCopy"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.export-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .export-page {
    padding: 24px;
  }
}
</style>
