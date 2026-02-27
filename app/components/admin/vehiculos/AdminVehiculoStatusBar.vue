<script setup lang="ts">
import type { StatusOption } from '~/composables/admin/useAdminVehicleDetail'

defineProps<{
  status: string
  featured: boolean
  statusOptions: StatusOption[]
}>()

const emit = defineEmits<{
  (e: 'update:status', value: string): void
  (e: 'update:featured', value: boolean): void
}>()
</script>

<template>
  <section class="form-section status-section">
    <h2 class="section-title">Estado</h2>
    <div class="status-selector">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        type="button"
        class="status-option"
        :class="{ active: status === opt.value, [opt.value]: true }"
        @click="emit('update:status', opt.value)"
      >
        <span class="status-dot" />
        <span class="status-label">{{ opt.label }}</span>
      </button>
    </div>
    <label class="featured-toggle">
      <input
        type="checkbox"
        :checked="featured"
        @change="emit('update:featured', ($event.target as HTMLInputElement).checked)"
      >
      <span>Destacado</span>
    </label>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--border-color);
}

.status-section .section-title {
  border-bottom: none;
  padding-bottom: 0;
}

.status-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.status-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
}

.status-option:hover {
  background: var(--bg-tertiary);
}

.status-option.active {
  border-color: currentColor;
  color: var(--text-primary);
}

.status-option.draft {
  color: var(--text-auxiliary);
}

.status-option.published {
  color: var(--color-success);
}

.status-option.rented {
  color: var(--color-info);
}

.status-option.workshop {
  color: var(--color-warning);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.featured-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.featured-toggle input {
  width: 18px;
  height: 18px;
}
</style>
