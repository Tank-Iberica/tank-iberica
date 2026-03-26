<script setup lang="ts">
import type { SavedSearch } from '~/composables/catalog/useSavedSearches'

defineProps<{
  user: unknown
  saveTab: 'save' | 'load'
  canSave: boolean
  newPresetName: string
  loadSearchQuery: string
  filteredSearches: readonly SavedSearch[]
  editingId: string
  editName: string
}>()

const emit = defineEmits<{
  'update:saveTab': [val: 'save' | 'load']
  'update:newPresetName': [val: string]
  'update:loadSearchQuery': [val: string]
  'update:editName': [val: string]
  savePreset: []
  close: []
  unlock: []
  apply: [s: SavedSearch]
  toggleFavorite: [id: string]
  startEdit: [s: SavedSearch]
  saveEdit: [id: string]
  updateFilters: [id: string]
  deleteSearch: [id: string]
  cancelEdit: []
}>()

const presetNameInput = ref<HTMLInputElement | null>(null)

watch(
  () => emit,
  () => {},
  { immediate: false },
)

defineExpose({ focusInput: () => presetNameInput.value?.focus() })
</script>

<template>
  <!-- Auth gate -->
  <template v-if="!user">
    <p class="sp-limit-text">{{ $t('catalog.savedFilters.registerPrompt') }}</p>
    <NuxtLink to="/registro" class="sp-unlock-btn" style="text-decoration: none; display: block">
      {{ $t('catalog.savedFilters.registerCta') }}
    </NuxtLink>
  </template>

  <!-- Authenticated -->
  <template v-else>
    <!-- Two tab buttons -->
    <div class="sp-tabs">
      <button
        :class="['sp-tab', { active: saveTab === 'save' }]"
        @click="emit('update:saveTab', 'save')"
      >
        {{ $t('catalog.savedFilters.saveSearch') }}
      </button>
      <button
        :class="['sp-tab', { active: saveTab === 'load' }]"
        @click="emit('update:saveTab', 'load')"
      >
        {{ $t('catalog.savedFilters.loadSearch') }}
      </button>
    </div>

    <!-- SAVE tab -->
    <template v-if="saveTab === 'save'">
      <template v-if="!canSave">
        <p class="sp-limit-text">{{ $t('catalog.savedFilters.limitReached') }}</p>
        <button class="sp-unlock-btn" @click="emit('unlock')">
          {{ $t('catalog.savedFilters.unlockPrompt') }}
        </button>
      </template>
      <template v-else>
        <input
          ref="presetNameInput"
          :value="newPresetName"
          type="text"
          class="sp-input"
          :placeholder="$t('catalog.savedFilters.namePlaceholder')"
          :aria-label="$t('catalog.savedFilters.name')"
          autocomplete="off"
          @input="emit('update:newPresetName', ($event.target as HTMLInputElement).value)"
          @keydown.enter="emit('savePreset')"
          @keydown.escape="emit('close')"
        >
        <button class="sp-save-btn" :disabled="!newPresetName.trim()" @click="emit('savePreset')">
          {{ $t('catalog.savedFilters.save') }}
        </button>
      </template>
    </template>

    <!-- LOAD tab -->
    <template v-if="saveTab === 'load'">
      <input
        :value="loadSearchQuery"
        type="text"
        class="sp-input"
        :placeholder="$t('catalog.savedFilters.searchPlaceholder')"
        autocomplete="off"
        @input="emit('update:loadSearchQuery', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="!filteredSearches.length" class="sp-empty">
        {{ $t('catalog.savedFilters.noSearches') }}
      </div>
      <ul v-else class="sp-list">
        <li v-for="s in filteredSearches" :key="s.id" class="sp-item">
          <!-- Edit mode -->
          <template v-if="editingId === s.id">
            <input
              :value="editName"
              type="text"
              class="sp-input sp-input--inline"
              :aria-label="$t('catalog.savedFilters.editName')"
              autocomplete="off"
              @input="emit('update:editName', ($event.target as HTMLInputElement).value)"
              @keydown.enter="emit('saveEdit', s.id)"
              @keydown.escape="emit('cancelEdit')"
            >
            <div class="sp-edit-actions">
              <button class="sp-edit-btn sp-edit-btn--update" @click="emit('updateFilters', s.id)">
                {{ $t('catalog.savedFilters.editFilters') }}
              </button>
              <button class="sp-edit-btn sp-edit-btn--save" @click="emit('saveEdit', s.id)">
                {{ $t('catalog.savedFilters.saveChanges') }}
              </button>
              <button class="sp-edit-btn sp-edit-btn--delete" @click="emit('deleteSearch', s.id)">
                {{ $t('catalog.savedFilters.delete', { name: s.name }) }}
              </button>
            </div>
          </template>
          <!-- Normal mode -->
          <template v-else>
            <button
              :class="['sp-star', { active: s.is_favorite }]"
              :title="
                s.is_favorite
                  ? $t('catalog.savedFilters.unfavorite')
                  : $t('catalog.savedFilters.favorite')
              "
              @click.stop="emit('toggleFavorite', s.id)"
            >
              &#9733;
            </button>
            <button class="sp-name" @click="emit('apply', s)">
              {{ s.name }}
            </button>
            <button
              class="sp-gear"
              :title="$t('catalog.savedFilters.editSearch')"
              @click.stop="emit('startEdit', s)"
            >
              &#9881;
            </button>
          </template>
        </li>
      </ul>
    </template>
  </template>
</template>

<style scoped>
.sp-tabs {
  display: flex;
  gap: 0.25rem;
}

.sp-tab {
  flex: 1;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 2rem;
}

.sp-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.sp-input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 2rem;
  box-sizing: border-box;
}

.sp-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.sp-input--inline {
  margin-bottom: 0.25rem;
}

.sp-save-btn {
  width: 100%;
  padding: 0.4rem 0.6rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  min-height: 2.25rem;
}

.sp-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sp-limit-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.sp-unlock-btn {
  padding: 0.4rem 0.75rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  min-height: 2.5rem;
}

.sp-unlock-btn:hover {
  background: var(--color-primary-dark);
}

.sp-empty {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  padding: 0.75rem 0;
}

.sp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 14rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sp-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.3rem;
  border-radius: var(--border-radius-sm);
  transition: background 0.1s;
}

.sp-item:hover {
  background: var(--bg-secondary);
}

.sp-star {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  min-width: 1.5rem;
  min-height: 1.5rem;
  border: none;
  background: transparent;
  color: var(--border-color);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.sp-star.active {
  color: var(--color-warning, #f59e0b);
}

.sp-star:hover {
  color: var(--color-warning, #f59e0b);
}

.sp-name {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.2rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-name:hover {
  color: var(--color-primary);
}

.sp-gear {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  min-width: 1.5rem;
  min-height: 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-auxiliary);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.sp-gear:hover {
  color: var(--color-primary);
}

.sp-edit-actions {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
}

.sp-edit-btn {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  min-height: 1.75rem;
  text-align: center;
}

.sp-edit-btn--save {
  background: var(--color-primary);
  color: var(--color-white);
}

.sp-edit-btn--update {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sp-edit-btn--delete {
  background: transparent;
  color: var(--color-danger, #ef4444);
}
</style>
