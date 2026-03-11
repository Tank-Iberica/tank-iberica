<script setup lang="ts">
import type {
  CategoryOption,
  SubcategoryOption,
} from '~/composables/dashboard/useDashboardVehiculoDetail'

const { t } = useI18n()

const props = defineProps<{
  categoryId: string
  subcategoryId: string
  categories: CategoryOption[]
  filteredSubcategories: SubcategoryOption[]
}>()

const emit = defineEmits<{
  update: [field: 'category_id' | 'subcategory_id', value: string]
}>()

function onCategoryChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update', 'category_id', target.value)
}

function onSubcategoryChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update', 'subcategory_id', target.value)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.vehicles.sectionCategory') }}</h2>
    <div class="form-grid">
      <div class="form-group">
        <label for="category">{{ t('dashboard.vehicles.category') }}</label>
        <select id="category" :value="props.categoryId" @change="onCategoryChange">
          <option value="">{{ t('dashboard.vehicles.selectCategory') }}</option>
          <option v-for="cat in props.categories" :key="cat.id" :value="cat.id">
            {{ cat.name.es || cat.slug }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="subcategory">{{ t('dashboard.vehicles.subcategory') }}</label>
        <select id="subcategory" :value="props.subcategoryId" @change="onSubcategoryChange">
          <option value="">{{ t('dashboard.vehicles.selectSubcategory') }}</option>
          <option v-for="sub in props.filteredSubcategories" :key="sub.id" :value="sub.id">
            {{ sub.name.es || sub.slug }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (min-width: 30em) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
