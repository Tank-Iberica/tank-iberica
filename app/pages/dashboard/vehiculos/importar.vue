<script setup lang="ts">
import { useDashboardImportar } from '~/composables/dashboard/useDashboardImportar'

/**
 * Bulk Vehicle Import
 * Allows dealers to import multiple vehicles via CSV file.
 *
 * Logic: useDashboardImportar
 * Subcomponents: ImportarPageHeader, ImportarUploadStep, ImportarPreviewStep, ImportarPublishStep
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const {
  step,
  file,
  parsedRows,
  publishing,
  progress,
  publishedCount,
  errorCount,
  error,
  validRowsCount,
  invalidRowsCount,
  handleFileUpload,
  parseFile,
  publishVehicles,
  downloadTemplate,
  navigateToVehicles,
  goToStep,
  init,
} = useDashboardImportar()

onMounted(init)
</script>

<template>
  <div class="import-page">
    <ImportarPageHeader />

    <!-- Step 1: Upload -->
    <ImportarUploadStep
      v-if="step === 1"
      :file="file"
      :error="error"
      @file-upload="handleFileUpload"
      @parse="parseFile"
      @download-template="downloadTemplate"
    />

    <!-- Step 2: Preview -->
    <ImportarPreviewStep
      v-if="step === 2"
      :parsed-rows="parsedRows"
      :valid-rows-count="validRowsCount"
      :invalid-rows-count="invalidRowsCount"
      @back="goToStep(1)"
      @publish="publishVehicles"
    />

    <!-- Step 3: Publishing -->
    <ImportarPublishStep
      v-if="step === 3"
      :publishing="publishing"
      :progress="progress"
      :published-count="publishedCount"
      :error-count="errorCount"
      @navigate-back="navigateToVehicles"
    />
  </div>
</template>

<style scoped>
.import-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .import-page {
    padding: 24px;
  }
}
</style>
