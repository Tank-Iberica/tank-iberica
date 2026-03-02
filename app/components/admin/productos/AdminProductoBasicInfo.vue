<script setup lang="ts">
import { localizedName } from '~/composables/useLocalized'

const { locale } = useI18n()

interface Subcategory {
  id: string
  name?: Record<string, string> | null
  name_es: string
  status: string
}

interface Type {
  id: string
  name?: Record<string, string> | null
  name_es: string
  status: string
}

interface Props {
  categories: string[]
  featured: boolean
  selectedSubcategoryId: string | null
  subcategories: Subcategory[]
  typeId: string | null
  types: Type[]
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
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:categories': [value: string[]]
  'update:featured': [value: boolean]
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

function toggleCategory(cat: string) {
  const cats = props.categories || []
  const idx = cats.indexOf(cat)
  if (idx === -1) emit('update:categories', [...cats, cat])
  else
    emit(
      'update:categories',
      cats.filter((c) => c !== cat),
    )
}

function hasCat(cat: string): boolean {
  return props.categories?.includes(cat) || false
}

function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    España: '🇪🇸',
    France: '🇫🇷',
    Germany: '🇩🇪',
    Italy: '🇮🇹',
    Portugal: '🇵🇹',
    'United Kingdom': '🇬🇧',
    Netherlands: '🇳🇱',
    Belgium: '🇧🇪',
    Poland: '🇵🇱',
  }
  return flags[country] || '🌍'
}
</script>

<template>
  <div>
    <!-- Categories -->
    <div class="section">
      <div class="section-title">Categorías *</div>
      <div class="cat-row">
        <label class="cat-check" :class="{ active: hasCat('venta') }">
          <input type="checkbox" :checked="hasCat('venta')" @change="toggleCategory('venta')" >
          Venta
        </label>
        <label class="cat-check" :class="{ active: hasCat('alquiler') }">
          <input
            type="checkbox"
            :checked="hasCat('alquiler')"
            @change="toggleCategory('alquiler')"
          >
          Alquiler
        </label>
        <label class="cat-check" :class="{ active: hasCat('terceros') }">
          <input
            type="checkbox"
            :checked="hasCat('terceros')"
            @change="toggleCategory('terceros')"
          >
          Terceros
        </label>
        <label class="feat-check">
          <input :checked="featured" type="checkbox" @change="emit('update:featured', !featured)" >
          ★ Destacado
        </label>
      </div>
    </div>

    <!-- Basic data -->
    <div class="section">
      <div class="section-title">Datos del vehículo</div>
      <div class="row-2">
        <div class="field">
          <label>Subcategoría</label>
          <select
            :value="selectedSubcategoryId"
            @change="
              emit(
                'update:selectedSubcategoryId',
                ($event.target as HTMLSelectElement).value || null,
              )
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
            <option v-for="t in types" :key="t.id" :value="t.id">
              {{ localizedName(t, locale) }}
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
          <label>Año *</label>
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
          <label>Matrícula</label>
          <input
            :value="plate"
            type="text"
            placeholder="1234-ABC"
            @input="emit('update:plate', ($event.target as HTMLInputElement).value || null)"
          >
        </div>
        <div class="field">
          <label>Precio Venta €</label>
          <input
            :value="price"
            type="number"
            placeholder="0 = Consultar"
            @input="emit('update:price', Number(($event.target as HTMLInputElement).value) || null)"
          >
        </div>
        <div v-if="showRentalPrice" class="field">
          <label>Precio Alquiler €/mes</label>
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
          <label>Ubicación ES</label>
          <input
            :value="location"
            type="text"
            placeholder="Madrid, España"
            @input="emit('update:location', ($event.target as HTMLInputElement).value || null)"
          >
          <span v-if="locationCountry" class="location-detected">
            {{ countryFlag(locationCountry) }} {{ locationCountry }}
            <template v-if="locationProvince"> · {{ locationProvince }}</template>
            <template v-if="locationRegion"> · {{ locationRegion }}</template>
          </span>
        </div>
        <div class="field">
          <label>Ubicación EN</label>
          <input
            :value="locationEn"
            type="text"
            placeholder="Madrid, Spain"
            @input="emit('update:locationEn', ($event.target as HTMLInputElement).value || null)"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.cat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.cat-check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.cat-check input {
  margin: 0;
}
.cat-check.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.feat-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--color-warning);
  cursor: pointer;
  margin-left: auto;
}
.feat-check input {
  margin: 0;
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
  border: 1px solid var(--border-color-light);
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--color-primary);
}
.location-detected {
  display: block;
  font-size: 11px;
  color: var(--color-success);
  margin-top: 2px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .row-2,
  .row-4 {
    grid-template-columns: 1fr;
  }
  .cat-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .feat-check {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
