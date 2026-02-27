<script setup lang="ts">
/**
 * ExportActionButton — Primary button to trigger CSV or PDF export.
 */
defineProps<{
  exporting: boolean
  vehicleCount: number
  exportFormat: 'csv' | 'pdf'
}>()

const emit = defineEmits<{
  (e: 'export'): void
}>()

const { t } = useI18n()
</script>

<template>
  <button
    class="btn-primary btn-export"
    :disabled="exporting || vehicleCount === 0"
    @click="emit('export')"
  >
    <span v-if="exporting" class="spinner-sm" />
    <span v-else>
      {{
        exportFormat === 'csv'
          ? t('dashboard.tools.export.downloadCSV')
          : t('dashboard.tools.export.downloadPDF')
      }}
    </span>
  </button>
</template>

<style scoped>
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 8px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  align-self: stretch;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
