<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  saving: boolean
}>()
</script>

<template>
  <div class="form-actions">
    <NuxtLink to="/dashboard/vehiculos" class="btn-secondary">
      {{ t('common.cancel') }}
    </NuxtLink>
    <button type="submit" class="btn-primary" :disabled="saving">
      {{ saving ? t('common.loading') : t('common.save') }}
    </button>
  </div>
</template>

<style scoped>
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
}
</style>
