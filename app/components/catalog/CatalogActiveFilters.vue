<template>
  <div v-if="chips.length" class="active-filters">
    <TransitionGroup name="chip" tag="div" class="chips-row">
      <span v-for="chip in chips" :key="chip.key" class="filter-chip">
        <span class="chip-label">{{ chip.label }}</span>
        <button
          class="chip-remove"
          type="button"
          :aria-label="$t('catalog.clearFilters')"
          @click="removeChip(chip)"
        >
          &#215;
        </button>
      </span>
    </TransitionGroup>
    <button v-if="chips.length >= 2" class="clear-all-link" type="button" @click="handleClearAll">
      {{ $t('catalog.clearAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { getSortedEuropeanCountries } from '~/utils/geoData'

const emit = defineEmits<{
  change: []
}>()

const { t, locale } = useI18n()
const { activeFilters, clearFilter, clearAll: clearAllDynamic, visibleFilters } = useFilters()
const { filters, locationLevel, updateFilters, setLocationLevel } = useCatalogState()

const currentYear = new Date().getFullYear()

function formatPriceLabel(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

// Build localized label for a dynamic filter
function getFilterLabel(name: string): string {
  const def = visibleFilters.value.find((f) => f.name === name)
  if (!def) return name
  const label = locale.value === 'en' ? def.label_en : def.label_es
  return label || name
}

interface Chip {
  key: string
  label: string
  type: 'location' | 'price' | 'brand' | 'year' | 'dynamic'
  name?: string
}

const europeanCountriesData = computed(() => getSortedEuropeanCountries(locale.value))

const chips = computed<Chip[]>(() => {
  const result: Chip[] = []

  // Location
  if (locationLevel.value && locationLevel.value !== 'mundo') {
    let label = t('catalog.locationAll')
    if (filters.value.location_province_eq) {
      label = filters.value.location_province_eq as string
    } else if (filters.value.location_countries) {
      const countries = filters.value.location_countries as string[]
      if (countries.length === 1) {
        const all = [...europeanCountriesData.value.priority, ...europeanCountriesData.value.rest]
        const c = all.find((cc) => cc.code === countries[0])
        label = c ? `${c.flag} ${c.name}` : (countries[0] ?? '')
      } else {
        label = `${countries.length} ${t('catalog.countries')}`
      }
    }
    result.push({ key: 'location', label, type: 'location' })
  }

  // Price
  if (filters.value.price_min || filters.value.price_max) {
    const min = formatPriceLabel((filters.value.price_min as number) ?? 0)
    const max = formatPriceLabel((filters.value.price_max as number) ?? 200000)
    result.push({ key: 'price', label: `€ ${min} – ${max}`, type: 'price' })
  }

  // Brand
  if (filters.value.brand) {
    result.push({ key: 'brand', label: filters.value.brand as string, type: 'brand' })
  }

  // Year
  if (filters.value.year_min || filters.value.year_max) {
    const min = (filters.value.year_min as number) ?? 2000
    const max = (filters.value.year_max as number) ?? currentYear
    result.push({ key: 'year', label: `${min} – ${max}`, type: 'year' })
  }

  // Dynamic filters
  for (const [name, value] of Object.entries(activeFilters.value)) {
    if (!value) continue
    // Skip range sub-keys (handled by parent filter)
    if (name.endsWith('_min') || name.endsWith('_max')) {
      // Show range as a single chip
      const baseName = name.replace(/_min$|_max$/, '')
      if (!result.some((r) => r.key === `dyn_${baseName}_range`)) {
        const minVal = activeFilters.value[`${baseName}_min`]
        const maxVal = activeFilters.value[`${baseName}_max`]
        if (minVal || maxVal) {
          const label = `${getFilterLabel(baseName)}: ${minVal || '...'} – ${maxVal || '...'}`
          result.push({ key: `dyn_${baseName}_range`, label, type: 'dynamic', name: baseName })
        }
      }
      continue
    }

    // Arrays (desplegable_tick)
    if (Array.isArray(value)) {
      result.push({
        key: `dyn_${name}`,
        label: `${getFilterLabel(name)}: ${value.join(', ')}`,
        type: 'dynamic',
        name,
      })
      continue
    }

    // Boolean (tick)
    if (value === true) {
      result.push({ key: `dyn_${name}`, label: getFilterLabel(name), type: 'dynamic', name })
      continue
    }

    // String/number (desplegable, caja)
    result.push({
      key: `dyn_${name}`,
      label: `${getFilterLabel(name)}: ${value}`,
      type: 'dynamic',
      name,
    })
  }

  return result
})

function removeChip(chip: Chip) {
  switch (chip.type) {
    case 'location':
      setLocationLevel(null, '', null, null)
      break
    case 'price':
      updateFilters({ price_min: undefined, price_max: undefined })
      break
    case 'brand':
      updateFilters({ brand: undefined })
      break
    case 'year':
      updateFilters({ year_min: undefined, year_max: undefined })
      break
    case 'dynamic':
      if (chip.name) {
        // Clear range filters too
        clearFilter(chip.name)
        clearFilter(`${chip.name}_min`)
        clearFilter(`${chip.name}_max`)
      }
      break
  }
  emit('change')
}

function handleClearAll() {
  clearAllDynamic()
  updateFilters({
    price_min: undefined,
    price_max: undefined,
    year_min: undefined,
    year_max: undefined,
    brand: undefined,
  })
  setLocationLevel(null, '', null, null)
  emit('change')
}
</script>

<style scoped>
/* ============================================
   ACTIVE FILTER CHIPS — Base = mobile (360px)
   ============================================ */
.active-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  min-height: 0;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  background: var(--color-primary-light, #2f5a64);
  color: var(--color-white, #fff);
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  max-width: 180px;
}

.chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.chip-remove:hover {
  background: rgba(255, 255, 255, 0.45);
}

.clear-all-link {
  border: none;
  background: none;
  color: var(--text-auxiliary, #6b7280);
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: underline;
  padding: 0.2rem 0;
  min-height: auto;
  min-width: auto;
  flex-shrink: 0;
}

.clear-all-link:hover {
  color: var(--color-primary);
}

/* Transitions */
.chip-enter-active {
  transition: all 0.2s ease;
}

.chip-leave-active {
  transition: all 0.15s ease;
}

.chip-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.chip-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ============================================
   RESPONSIVE: >=480px
   ============================================ */
@media (min-width: 480px) {
  .filter-chip {
    font-size: 11px;
    padding: 0.25rem 0.5rem;
  }

  .clear-all-link {
    font-size: 11px;
  }
}

/* ============================================
   RESPONSIVE: >=768px
   ============================================ */
@media (min-width: 768px) {
  .active-filters {
    padding: 0.4rem 1.5rem;
  }

  .filter-chip {
    max-width: 220px;
  }
}

/* ============================================
   RESPONSIVE: >=1024px
   ============================================ */
@media (min-width: 1024px) {
  .active-filters {
    padding: 0.4rem 3rem;
  }
}
</style>
