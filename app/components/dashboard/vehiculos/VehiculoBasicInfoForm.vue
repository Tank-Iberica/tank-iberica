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
  (
    e: 'update',
    field: 'brand' | 'model' | 'year' | 'km' | 'price' | 'location',
    value: string | number,
  ): void
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
          @input="onNumberInput('price', $event)"
        >
      </div>
      <div class="form-group">
        <label for="location">{{ t('dashboard.vehicles.location') }}</label>
        <input
          id="location"
          :value="props.location"
          type="text"
          @input="onStringInput('location', $event)"
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
