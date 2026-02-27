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
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
}
</style>
