<script setup lang="ts">
defineProps<{
  categories: Array<{
    id: string
    name_es: string
    name_en: string | null
    name?: Record<string, string> | null
  }>
  linkedSubcategories: Array<{
    id: string
    name_es: string
    name_en: string | null
    name?: Record<string, string> | null
  }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: Array<{ id: string; name: string; type: string; unit?: string | null; options?: any }>
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  filterValues: Record<string, string | number | boolean>
  selectorLoading: boolean
  filtersLoading: boolean
  catName: (item: {
    name_es: string
    name_en: string | null
    name?: Record<string, string> | null
  }) => string
  getFilterLabel: (
    filter: { name: string; label_es?: string | null; label_en?: string | null },
    locale: string,
  ) => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFilterOptions: (filter: any) => string[]
}>()

const emit = defineEmits<{
  (e: 'category-change' | 'subcategory-change', event: Event): void
  (e: 'filter-change', name: string, value: string | number | boolean): void
}>()

const { t, locale } = useI18n()
</script>

<template>
  <div class="section-fields">
    <div class="form-group full-width">
      <label for="adv-category" class="required">{{ t('advertise.vehicleType') }}</label>
      <select
        id="adv-category"
        class="form-input"
        :value="selectedCategoryId || ''"
        :disabled="selectorLoading"
        @change="emit('category-change', $event)"
      >
        <option value="">{{ t('advertise.selectCategory') }}</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ catName(cat) }}
        </option>
      </select>
    </div>

    <div v-if="selectedCategoryId && linkedSubcategories.length" class="form-group full-width">
      <label for="adv-subcategory">{{ t('advertise.selectSubcategory') }}</label>
      <select
        id="adv-subcategory"
        class="form-input"
        :value="selectedSubcategoryId || ''"
        @change="emit('subcategory-change', $event)"
      >
        <option value="">{{ t('advertise.selectSubcategory') }}</option>
        <option v-for="sub in linkedSubcategories" :key="sub.id" :value="sub.id">
          {{ catName(sub) }}
        </option>
      </select>
    </div>

    <template v-if="selectedSubcategoryId && attributes.length">
      <div class="form-group full-width filter-section-label">
        <span class="filter-title">{{ t('advertise.characteristics') }}</span>
      </div>
      <template v-for="filter in attributes" :key="filter.id">
        <div
          v-if="filter.type === 'desplegable' || filter.type === 'desplegable_tick'"
          class="form-group"
        >
          <label :for="`f-${filter.name}`">
            {{ getFilterLabel(filter, locale) }}
            <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
          </label>
          <select
            :id="`f-${filter.name}`"
            class="form-input"
            :value="filterValues[filter.name] || ''"
            @change="emit('filter-change', filter.name, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">-</option>
            <option v-for="opt in getFilterOptions(filter)" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <div v-else-if="filter.type === 'caja'" class="form-group">
          <label :for="`f-${filter.name}`">
            {{ getFilterLabel(filter, locale) }}
            <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
          </label>
          <input
            :id="`f-${filter.name}`"
            type="text"
            class="form-input"
            :value="filterValues[filter.name] || ''"
            @input="emit('filter-change', filter.name, ($event.target as HTMLInputElement).value)"
          >
        </div>

        <div v-else-if="filter.type === 'slider' || filter.type === 'calc'" class="form-group">
          <label :for="`f-${filter.name}`">
            {{ getFilterLabel(filter, locale) }}
            <span v-if="filter.unit" class="unit-label">({{ filter.unit }})</span>
          </label>
          <input
            :id="`f-${filter.name}`"
            type="number"
            class="form-input"
            :min="(filter.options as Record<string, number>).min"
            :max="(filter.options as Record<string, number>).max"
            :step="(filter.options as Record<string, number>).step || 1"
            :value="filterValues[filter.name] ?? ''"
            @input="emit('filter-change', filter.name, ($event.target as HTMLInputElement).value)"
          >
        </div>

        <div v-else-if="filter.type === 'tick'" class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              class="checkbox-input"
              :checked="!!filterValues[filter.name]"
              @change="
                emit('filter-change', filter.name, ($event.target as HTMLInputElement).checked)
              "
            >
            <span>{{ getFilterLabel(filter, locale) }}</span>
          </label>
        </div>
      </template>
    </template>

    <div v-if="filtersLoading" class="form-group full-width">
      <p class="loading-text">{{ t('common.loading') }}...</p>
    </div>
  </div>
</template>

<style scoped>
.section-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2, 8px);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.required::after {
  content: ' *';
  color: #ef4444;
}

.unit-label {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.filter-section-label {
  margin-top: var(--spacing-1, 4px);
}

.filter-title {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm, 0.875rem);
  margin: 0;
}

.form-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1.5px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 36px;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2, 8px);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.checkbox-input {
  min-width: 18px;
  min-height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

@media (min-width: 768px) {
  .section-fields {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3, 12px);
  }
}
</style>
