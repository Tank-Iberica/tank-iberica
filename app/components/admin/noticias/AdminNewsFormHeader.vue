<script setup lang="ts">
defineProps<{
  title: string
  slug: string
  saving: boolean
  isValid: boolean
}>()

defineEmits<{
  cancel: []
  save: []
  delete: []
}>()
</script>

<template>
  <header class="nf-header">
    <div class="nf-left">
      <button class="btn-icon" @click="$emit('cancel')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1>{{ title }}</h1>
    </div>
    <div class="nf-right">
      <a :href="`/noticias/${slug}`" target="_blank" class="btn" title="Ver en web">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          style="width: 1rem; height: 1rem"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Ver
      </a>
      <button class="btn btn-delete-outline" @click="$emit('delete')">
        {{ $t('common.delete') }}
      </button>
      <button class="btn" @click="$emit('cancel')">{{ $t('common.cancel') }}</button>
      <button class="btn btn-primary" :disabled="saving || !isValid" @click="$emit('save')">
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.nf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.nf-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex: 1;
}

.nf-left h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-near-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nf-right {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--border-radius);
  color: var(--text-auxiliary);
  transition: all 0.15s;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  color: var(--color-near-black);
}

.btn-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete-outline {
  color: var(--color-error);
  border-color: var(--color-error-border);
}

.btn-delete-outline:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

@media (max-width: 47.9375em) {
  .nf-right {
    width: 100%;
    justify-content: flex-end;
  }

  .nf-left h1 {
    font-size: 1.1rem;
  }
}
</style>
