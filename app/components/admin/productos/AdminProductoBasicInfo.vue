<script setup lang="ts">
import { localizedName } from '~/composables/useLocalized'

const { t, locale } = useI18n()

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
      <div class="section-title">{{ t('admin.productos.basicInfo.categories') }} *</div>
      <div class="cat-row">
        <label class="cat-check" :class="{ active: hasCat('venta') }">
          <input type="checkbox" :checked="hasCat('venta')" @change="toggleCategory('venta')" />
          {{ t('common.sale') }}
        </label>
        <label class="cat-check" :class="{ active: hasCat('alquiler') }">
          <input
            type="checkbox"
            :checked="hasCat('alquiler')"
            @change="toggleCategory('alquiler')"
          />
          {{ t('common.rental') }}
        </label>
        <label class="cat-check" :class="{ active: hasCat('terceros') }">
          <input
            type="checkbox"
            :checked="hasCat('terceros')"
            @change="toggleCategory('terceros')"
          />
          {{ t('common.thirdParty') }}
        </label>
        <label class="feat-check">
          <input :checked="featured" type="checkbox" @change="emit('update:featured', !featured)" />
          ★ {{ t('admin.productos.basicInfo.featured') }}
        </label>
      </div>
    </div>

    <!-- Basic data -->
    <div class="section">
      <div class="section-title">{{ t('admin.productos.basicInfo.vehicleData') }}</div>
      <div class="row-2">
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.subcategory') }}</label>
          <select
            :value="selectedSubcategoryId"
            @change="
              emit(
                'update:selectedSubcategoryId',
                ($event.target as HTMLSelectElement).value || null,
              )
            "
          >
            <option :value="null">{{ t('admin.productos.basicInfo.selectPlaceholder') }}</option>
            <option v-for="s in subcategories" :key="s.id" :value="s.id">
              {{ localizedName(s, locale) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>{{ t('common.type') }} *</label>
          <select
            :value="typeId"
            @change="emit('update:typeId', ($event.target as HTMLSelectElement).value || null)"
          >
            <option :value="null" disabled>{{ t('admin.productos.basicInfo.selectPlaceholder') }}</option>
            <option v-for="t in types" :key="t.id" :value="t.id">
              {{ localizedName(t, locale) }}
            </option>
          </select>
        </div>
      </div>
      <div class="row-4">
        <div class="field">
          <label>{{ t('common.brand') }} *</label>
          <input
            :value="brand"
            type="text"
            placeholder="Scania"
            @input="emit('update:brand', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label>{{ t('common.model') }} *</label>
          <input
            :value="model"
            type="text"
            placeholder="R450"
            @input="emit('update:model', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.year') }} *</label>
          <input
            :value="year"
            type="number"
            placeholder="2023"
            @input="emit('update:year', Number(($event.target as HTMLInputElement).value) || null)"
          />
        </div>
        <div class="field" />
      </div>
      <div class="row-4">
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.plate') }}</label>
          <input
            :value="plate"
            type="text"
            placeholder="1234-ABC"
            @input="emit('update:plate', ($event.target as HTMLInputElement).value || null)"
          />
        </div>
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.salePrice') }}</label>
          <input
            :value="price"
            type="number"
            :placeholder="t('admin.productos.basicInfo.priceConsultPlaceholder')"
            @input="emit('update:price', Number(($event.target as HTMLInputElement).value) || null)"
          />
        </div>
        <div v-if="showRentalPrice" class="field">
          <label>{{ t('admin.productos.basicInfo.rentalPriceMonth') }}</label>
          <input
            :value="rentalPrice"
            type="number"
            :placeholder="t('admin.productos.basicInfo.priceConsultPlaceholder')"
            @input="
              emit('update:rentalPrice', Number(($event.target as HTMLInputElement).value) || null)
            "
          />
        </div>
        <div v-else class="field" />
        <div class="field" />
      </div>
      <div class="row-2">
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.locationEs') }}</label>
          <input
            :value="location"
            type="text"
            placeholder="Madrid, España"
            @input="emit('update:location', ($event.target as HTMLInputElement).value || null)"
          />
          <span v-if="locationCountry" class="location-detected">
            {{ countryFlag(locationCountry) }} {{ locationCountry }}
            <template v-if="locationProvince"> · {{ locationProvince }}</template>
            <template v-if="locationRegion"> · {{ locationRegion }}</template>
          </span>
        </div>
        <div class="field">
          <label>{{ t('admin.productos.basicInfo.locationEn') }}</label>
          <input
            :value="locationEn"
            type="text"
            placeholder="Madrid, Spain"
            @input="emit('update:locationEn', ($event.target as HTMLInputElement).value || null)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-xs);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.cat-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
.cat-check {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
}
.cat-check input {
  margin: 0;
}
.cat-check.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-white);
}
.feat-check {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  gap: 0.75rem;
}
.row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
}
.field input,
.field select {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--color-primary);
}
.location-detected {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-success);
  margin-top: 0.125rem;
  font-weight: 500;
}

@media (max-width: 48em) {
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
    margin-top: 0.5rem;
  }
}
</style>
