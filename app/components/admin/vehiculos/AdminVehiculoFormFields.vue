<script setup lang="ts">
import type {
  CategoryOption,
  ExtendedVehicleFormData,
  SubcategoryRecord,
  TypeRecord,
} from '~/composables/admin/useAdminVehicleDetail'
import { localizedName } from '~/composables/useLocalized'

const props = defineProps<{
  form: ExtendedVehicleFormData
  categoryOptions: CategoryOption[]
  subcategories: SubcategoryRecord[]
  selectedSubcategoryId: string | null
  types: TypeRecord[]
  locale: string
}>()

const emit = defineEmits<{
  (e: 'update:form', value: ExtendedVehicleFormData): void
  (e: 'update:selectedSubcategoryId', value: string | null): void
}>()

// -----------------------------------------------------------------------
// Local helpers to update nested form fields without mutating the prop
// -----------------------------------------------------------------------

function updateField<K extends keyof ExtendedVehicleFormData>(
  key: K,
  value: ExtendedVehicleFormData[K],
) {
  emit('update:form', { ...props.form, [key]: value })
}

function _updateAttributeField(fieldName: string, value: unknown) {
  emit('update:form', {
    ...props.form,
    attributes_json: { ...props.form.attributes_json, [fieldName]: value },
  })
}
</script>

<template>
  <!-- Category & Subcategory -->
  <section class="form-section">
    <h2 class="section-title">Categoría</h2>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <div class="category-buttons">
          <button
            v-for="cat in categoryOptions"
            :key="cat.value"
            type="button"
            class="category-btn"
            :class="{ active: form.category === cat.value }"
            @click="updateField('category', cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Subcategoría</label>
        <select
          class="form-select"
          :value="selectedSubcategoryId"
          @change="
            emit('update:selectedSubcategoryId', ($event.target as HTMLSelectElement).value || null)
          "
        >
          <option :value="null">Seleccionar...</option>
          <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
            {{ localizedName(sub, locale) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo *</label>
        <select
          class="form-select"
          required
          :value="form.type_id ?? ''"
          @change="updateField('type_id', ($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">Seleccionar...</option>
          <option v-for="t in types" :key="t.id" :value="t.id">
            {{ localizedName(t, locale) }}
          </option>
        </select>
      </div>
    </div>
  </section>

  <!-- Basic info -->
  <section class="form-section">
    <h2 class="section-title">Información básica</h2>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Marca *</label>
        <input
          :value="form.brand"
          type="text"
          class="form-input"
          required
          @input="updateField('brand', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label class="form-label">Modelo *</label>
        <input
          :value="form.model"
          type="text"
          class="form-input"
          required
          @input="updateField('model', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Año</label>
        <input
          :value="form.year"
          type="number"
          class="form-input"
          min="1900"
          max="2100"
          @input="updateField('year', Number(($event.target as HTMLInputElement).value) || null)"
        >
      </div>
      <div class="form-group">
        <label class="form-label">Matrícula</label>
        <input
          :value="form.plate"
          type="text"
          class="form-input"
          @input="updateField('plate', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </section>

  <!-- Prices -->
  <section class="form-section">
    <h2 class="section-title">Precios</h2>
    <div class="form-row">
      <div v-if="form.category !== 'alquiler'" class="form-group">
        <label class="form-label">Precio venta (&euro;)</label>
        <input
          :value="form.price"
          type="number"
          class="form-input"
          min="0"
          step="100"
          @input="updateField('price', Number(($event.target as HTMLInputElement).value) || null)"
        >
      </div>
      <div v-if="form.category !== 'venta'" class="form-group">
        <label class="form-label">Precio alquiler (&euro;/mes)</label>
        <input
          :value="form.rental_price"
          type="number"
          class="form-input"
          min="0"
          step="50"
          @input="
            updateField('rental_price', Number(($event.target as HTMLInputElement).value) || null)
          "
        >
      </div>
    </div>
  </section>

  <!-- Location -->
  <section class="form-section">
    <h2 class="section-title">Ubicación</h2>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">País</label>
        <select
          class="form-select"
          :value="form.location_country ?? ''"
          @change="
            updateField('location_country', ($event.target as HTMLSelectElement).value || null)
          "
        >
          <option value="">Seleccionar...</option>
          <option value="ES">España</option>
          <option value="PT">Portugal</option>
          <option value="FR">Francia</option>
          <option value="DE">Alemania</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Región</label>
        <input
          :value="form.location_region"
          type="text"
          class="form-input"
          placeholder="Ej: Andalucía"
          @input="updateField('location_region', ($event.target as HTMLInputElement).value || null)"
        >
      </div>
      <div class="form-group">
        <label class="form-label">Provincia</label>
        <input
          :value="form.location_province"
          type="text"
          class="form-input"
          placeholder="Ej: Sevilla"
          @input="
            updateField('location_province', ($event.target as HTMLInputElement).value || null)
          "
        >
      </div>
    </div>
    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label">Ubicación detallada</label>
        <input
          :value="form.location"
          type="text"
          class="form-input"
          placeholder="Ej: Polígono Industrial..."
          @input="updateField('location', ($event.target as HTMLInputElement).value || null)"
        >
      </div>
    </div>
  </section>

  <!-- Description -->
  <section class="form-section">
    <h2 class="section-title">Descripción</h2>
    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label">Descripción (ES)</label>
        <textarea
          :value="form.description_es"
          class="form-textarea"
          rows="4"
          maxlength="300"
          placeholder="Descripción en español..."
          @input="
            updateField('description_es', ($event.target as HTMLTextAreaElement).value || null)
          "
        />
        <span class="char-count">{{ form.description_es?.length || 0 }}/300</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label">Descripción (EN)</label>
        <textarea
          :value="form.description_en"
          class="form-textarea"
          rows="4"
          maxlength="300"
          placeholder="Description in English..."
          @input="
            updateField('description_en', ($event.target as HTMLTextAreaElement).value || null)
          "
        />
        <span class="char-count">{{ form.description_en?.length || 0 }}/300</span>
      </div>
    </div>
  </section>

  <!-- Financial (admin only) -->
  <section class="form-section">
    <h2 class="section-title">Contabilidad</h2>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Coste adquisición (&euro;)</label>
        <input
          :value="form.acquisition_cost"
          type="number"
          class="form-input"
          min="0"
          step="100"
          @input="
            updateField(
              'acquisition_cost',
              Number(($event.target as HTMLInputElement).value) || null,
            )
          "
        >
      </div>
      <div class="form-group">
        <label class="form-label">Precio mínimo (&euro;)</label>
        <input
          :value="form.min_price"
          type="number"
          class="form-input"
          min="0"
          step="100"
          @input="
            updateField('min_price', Number(($event.target as HTMLInputElement).value) || null)
          "
        >
      </div>
    </div>
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

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.form-row:last-child {
  margin-bottom: 0;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row:has(.full-width) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input,
.form-select,
.form-textarea {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 44px;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: right;
}

/* Category buttons */
.category-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.category-btn {
  flex: 1;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  min-height: 44px;
}

.category-btn:hover {
  background: var(--bg-tertiary);
}

.category-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}
</style>
