<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  brand: string
  model: string
  year: number
  km: number
  price: number
  location: string
}>()

const emit = defineEmits<{
  update: [field: 'brand' | 'model' | 'year' | 'km' | 'price' | 'location', value: string | number]
}>()

function onStringInput(field: 'brand' | 'model' | 'location', event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, target.value)
}

function onNumberInput(field: 'year' | 'km' | 'price', event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', field, Number(target.value) || 0)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.vehicles.sectionBasic') }}</h2>
    <div class="form-grid">
      <div class="form-group">
        <label for="brand">{{ t('dashboard.vehicles.brand') }} *</label>
        <input
          id="brand"
          :value="props.brand"
          type="text"
          required
          autocomplete="off"
          @input="onStringInput('brand', $event)"
        >
      </div>
      <div class="form-group">
        <label for="model">{{ t('dashboard.vehicles.model') }} *</label>
        <input
          id="model"
          :value="props.model"
          type="text"
          required
          autocomplete="off"
          @input="onStringInput('model', $event)"
        >
      </div>
      <div class="form-group">
        <label for="year">{{ t('dashboard.vehicles.year') }}</label>
        <input
          id="year"
          :value="props.year"
          type="number"
          min="1950"
          :max="new Date().getFullYear() + 1"
          autocomplete="off"
          @input="onNumberInput('year', $event)"
        >
      </div>
      <div class="form-group">
        <label for="km">{{ t('dashboard.vehicles.km') }}</label>
        <input
          id="km"
          :value="props.km"
          type="number"
          min="0"
          autocomplete="off"
          @input="onNumberInput('km', $event)"
        >
      </div>
      <div class="form-group">
        <label for="price">{{ t('dashboard.vehicles.price') }}</label>
        <input
          id="price"
          :value="props.price"
          type="number"
          min="0"
          step="100"
          autocomplete="off"
          @input="onNumberInput('price', $event)"
        >
      </div>
      <div class="form-group">
        <label for="location">{{ t('dashboard.vehicles.location') }}</label>
        <input
          id="location"
          :value="props.location"
          type="text"
          autocomplete="off"
          @input="onStringInput('location', $event)"
        >
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

.form-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group input:focus {
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
