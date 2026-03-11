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
  export: []
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
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  align-self: stretch;
}

.spinner-sm {
  width: 1.125rem;
  height: 1.125rem;
  border: 0.125rem solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: var(--border-radius-full);
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
