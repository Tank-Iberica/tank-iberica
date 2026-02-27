<script setup lang="ts">
import { localizedName } from '~/composables/useLocalized'

const { locale } = useI18n()

interface SubcategoryItem {
  id: string
  name_es: string
  name_en?: string | null
  status: string
}

interface TypeItem {
  id: string
  name_es: string
  name_en?: string | null
  status: string
}

interface Props {
  selectedSubcategoryId: string | null
  subcategories: SubcategoryItem[]
  typeId: string | null
  types: TypeItem[]
  brand: string
  model: string
  year: number | null
  plate: string | null
  price: number | null
  rentalPrice: number | null
  showRentalPrice: boolean
  location: string | null
  locationEn: string | null
  locationCountry: string | null
  locationProvince: string | null
  locationRegion: string | null
  countryFlagFn: (country: string) => string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:selectedSubcategoryId': [value: string | null]
  'update:typeId': [value: string | null]
  'update:brand': [value: string]
  'update:model': [value: string]
  'update:year': [value: number | null]
  'update:plate': [value: string | null]
  'update:price': [value: number | null]
  'update:rentalPrice': [value: number | null]
  'update:location': [value: string | null]
  'update:locationEn': [value: string | null]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Datos del vehiculo</div>
    <div class="row-2">
      <div class="field">
        <label>Subcategoria</label>
        <select
          :value="selectedSubcategoryId"
          @change="
            emit('update:selectedSubcategoryId', ($event.target as HTMLSelectElement).value || null)
          "
        >
          <option :value="null">Seleccionar...</option>
          <option v-for="s in subcategories" :key="s.id" :value="s.id">
            {{ localizedName(s, locale) }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>Tipo *</label>
        <select
          :value="typeId"
          @change="emit('update:typeId', ($event.target as HTMLSelectElement).value || null)"
        >
          <option :value="null" disabled>Seleccionar...</option>
          <option v-for="tipo in types" :key="tipo.id" :value="tipo.id">
            {{ localizedName(tipo, locale) }}
          </option>
        </select>
      </div>
    </div>
    <div class="row-4">
      <div class="field">
        <label>Marca *</label>
        <input
          :value="brand"
          type="text"
          placeholder="Scania"
          @input="emit('update:brand', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="field">
        <label>Modelo *</label>
        <input
          :value="model"
          type="text"
          placeholder="R450"
          @input="emit('update:model', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="field">
        <label>Ano *</label>
        <input
          :value="year"
          type="number"
          placeholder="2023"
          @input="emit('update:year', Number(($event.target as HTMLInputElement).value) || null)"
        >
      </div>
      <div class="field" />
    </div>
    <div class="row-4">
      <div class="field">
        <label>Matricula</label>
        <input
          :value="plate"
          type="text"
          placeholder="1234-ABC"
          @input="emit('update:plate', ($event.target as HTMLInputElement).value || null)"
        >
      </div>
      <div class="field">
        <label>Precio Venta</label>
        <input
          :value="price"
          type="number"
          placeholder="0 = Consultar"
          @input="emit('update:price', Number(($event.target as HTMLInputElement).value) || null)"
        >
      </div>
      <div v-if="showRentalPrice" class="field">
        <label>Precio Alquiler /mes</label>
        <input
          :value="rentalPrice"
          type="number"
          placeholder="0 = Consultar"
          @input="
            emit('update:rentalPrice', Number(($event.target as HTMLInputElement).value) || null)
          "
        >
      </div>
      <div v-else class="field" />
      <div class="field" />
    </div>
    <div class="row-2">
      <div class="field">
        <label>Ubicacion ES</label>
        <input
          :value="location"
          type="text"
          placeholder="Madrid, Espana"
          @input="emit('update:location', ($event.target as HTMLInputElement).value || null)"
        >
        <span v-if="locationCountry" class="location-detected">
          {{ countryFlagFn(locationCountry) }} {{ locationCountry }}
          <template v-if="locationProvince"> &middot; {{ locationProvince }}</template>
          <template v-if="locationRegion"> &middot; {{ locationRegion }}</template>
        </span>
      </div>
      <div class="field">
        <label>Ubicacion EN</label>
        <input
          :value="locationEn"
          type="text"
          placeholder="Madrid, Spain"
          @input="emit('update:locationEn', ($event.target as HTMLInputElement).value || null)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field input,
.field select {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: #23424a;
}
.location-detected {
  display: block;
  font-size: 11px;
  color: #10b981;
  margin-top: 2px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .row-2,
  .row-4 {
    grid-template-columns: 1fr;
  }
}
</style>
