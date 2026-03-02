<script setup lang="ts">
interface ComparisonOption {
  id: string
  name: string
  vehicle_ids: string[]
}

defineProps<{
  comparisons: ComparisonOption[]
  activeComparison: ComparisonOption | null | undefined
  showNewForm: boolean
  newCompName: string
}>()

const emit = defineEmits<{
  (e: 'print' | 'toggle-new-form' | 'create'): void
  (e: 'select' | 'delete' | 'update-new-comp-name', payload: string): void
}>()
</script>

<template>
  <div class="cmp-header">
    <div class="header-top">
      <h1 class="page-title">{{ $t('comparator.title') }}</h1>
      <button class="btn-icon" :aria-label="$t('common.print')" @click="emit('print')">
        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <div v-if="comparisons.length > 0" class="selector-row">
      <select
        class="cmp-select"
        :value="activeComparison?.id ?? ''"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>{{ $t('comparator.selectComparison') }}</option>
        <option v-for="comp in comparisons" :key="comp.id" :value="comp.id">
          {{ comp.name }} ({{ comp.vehicle_ids.length }})
        </option>
      </select>
      <button class="btn-outline" @click="emit('toggle-new-form')">
        {{ $t('comparator.newComparison') }}
      </button>
      <button
        v-if="activeComparison"
        class="btn-outline btn-err"
        @click="emit('delete', activeComparison.id)"
      >
        {{ $t('comparator.deleteComparison') }}
      </button>
    </div>

    <div v-if="showNewForm || comparisons.length === 0" class="new-form">
      <input
        type="text"
        class="input-name"
        :value="newCompName"
        :placeholder="$t('comparator.newComparison')"
        @input="emit('update-new-comp-name', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('create')"
      >
      <button class="btn-fill" @click="emit('create')">{{ $t('common.create') }}</button>
    </div>
  </div>
</template>

<style scoped>
.cmp-header {
  margin-bottom: var(--spacing-6);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  transition: background var(--transition-fast);
  background: none;
  border: none;
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.selector-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.cmp-select {
  flex: 1 1 180px;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.cmp-select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.btn-fill,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
  cursor: pointer;
}

.btn-fill {
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
}

.btn-fill:hover {
  background: var(--color-primary-dark);
}

.btn-outline {
  color: var(--color-primary);
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background: var(--bg-secondary);
}

.btn-outline.btn-err {
  color: var(--color-error);
  border-color: var(--color-error);
}

.btn-outline.btn-err:hover {
  background: var(--color-error-bg, #fef2f2);
}

.new-form {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.input-name {
  flex: 1;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
}

.input-name:focus {
  border-color: var(--color-primary);
  outline: none;
}

@media (min-width: 768px) {
  .page-title {
    font-size: var(--font-size-3xl);
  }
}
</style>
