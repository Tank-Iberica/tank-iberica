<script setup lang="ts">
/**
 * ExportPdfPreview — Informational card describing the PDF layout before exporting.
 */
defineProps<{
  vehicleCount: number
  companyName: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="options-card">
    <h2>{{ t('dashboard.tools.export.pdfPreview') }}</h2>
    <div class="pdf-info">
      <div class="pdf-info-item">
        <span class="info-label">{{ t('dashboard.tools.export.pdfCoverPage') }}</span>
        <span>{{ companyName || '--' }}</span>
      </div>
      <div class="pdf-info-item">
        <span class="info-label">{{ t('dashboard.tools.export.pdfPages') }}</span>
        <span>{{ vehicleCount + 1 }} {{ t('dashboard.tools.export.pdfPagesCount') }}</span>
      </div>
      <div class="pdf-info-item">
        <span class="info-label">{{ t('dashboard.tools.export.pdfLayout') }}</span>
        <span>{{ t('dashboard.tools.export.pdfLayoutDesc') }}</span>
      </div>
      <div class="pdf-info-item">
        <span class="info-label">{{ t('dashboard.tools.export.pdfFooter') }}</span>
        <span>{{ t('dashboard.tools.export.pdfFooterDesc') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.options-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.options-card h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.pdf-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdf-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.9rem;
}

.pdf-info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--text-auxiliary);
  font-weight: 500;
}
</style>
