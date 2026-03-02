<script setup lang="ts">
import type { InvoiceLine } from '~/composables/dashboard/useInvoice'

defineProps<{
  lines: InvoiceLine[]
}>()

const emit = defineEmits<{
  (e: 'add-line'): void
  (e: 'remove-line', id: number): void
}>()

const { t } = useI18n()
</script>

<template>
  <fieldset class="form-section">
    <legend class="form-section__legend">{{ t('dashboard.tools.invoice.lines') }}</legend>
    <DashboardInvoiceInvoiceLinesEditor
      :lines="lines"
      @add-line="emit('add-line')"
      @remove-line="(id: number) => emit('remove-line', id)"
    />
  </fieldset>
</template>

<style scoped>
.form-section {
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section__legend {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary, var(--color-primary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0.5rem;
}

@media (min-width: 1024px) {
  .form-section {
    padding: 1.5rem;
  }
}
</style>
