<template>
  <section v-if="hasFilters" class="filters-section">
    <!-- MOBILE: Inline scrollable bar for static filters (< 768px) -->
    <div class="filters-mobile">
      <div class="filters-mobile-container">
        <button
          v-show="mobileCanScrollLeft"
          class="scroll-btn scroll-btn-left"
          aria-hidden="true"
          @click="scrollMobileLeft"
        >
          &#9664;
        </button>
        <div
          ref="mobileScrollContainer"
          class="filters-mobile-wrapper"
          @scroll="updateMobileScrollState"
        >
          <!-- Reset filters -->
          <button
            type="button"
            :class="['reset-filters-btn', { disabled: !totalActiveCount }]"
            :disabled="!totalActiveCount"
            :title="$t('catalog.clearFilters')"
            @click="handleClearAll"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <span class="filter-divider" />

          <!-- Location -->
          <div class="filter-group filter-group-location">
            <span class="filter-label filter-label-icon-only">
              <svg class="location-pin-icon" width="14" height="14" viewBox="0 0 24 24" fill="#C41E3A" stroke="#C41E3A" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="white" /></svg>:
            </span>
            <div class="location-dropdown-wrapper">
              <button class="location-trigger" type="button" @click="locationDropdownOpen = !locationDropdownOpen">
                {{ $t(`catalog.locationLevel.${currentLevel}`) }}
              </button>
              <div v-if="locationDropdownOpen" class="location-dropdown">
                <span class="filter-sublabel">{{ $t('catalog.locationYours') }}</span>
                <select class="filter-select-inline location-manual-input" :value="editCountry" @change="onCountrySelect($event)">
                  <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
                  <option v-for="c in europeanCountriesData.priority" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.name }}
                  </option>
                  <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
                  <option v-for="c in europeanCountriesData.rest" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.name }}
                  </option>
                </select>
                <select
                  v-if="editCountry === 'ES'"
                  class="filter-select-inline location-manual-input"
                  :value="editProvince"
                  @change="onProvinceSelect($event)"
                >
                  <option value="">{{ $t('catalog.locationSelectProvince') }}</option>
                  <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
                </select>
                <span class="filter-sublabel">{{ $t('catalog.locationRange') }}</span>
                <div class="location-levels-desktop">
                  <label
                    v-for="level in availableLevels"
                    :key="level"
                    class="location-level-option-desktop"
                  >
                    <input
                      type="radio"
                      name="location-level-mobile-inline"
                      :value="level"
                      :checked="currentLevel === level"
                      @change="onLevelChange(level); locationDropdownOpen = false"
                    >
                    <span>{{ $t(`catalog.locationLevel.${level}`) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="filter-group">
            <span class="filter-label filter-label-price">€:</span>
            <div class="filter-range-inputs">
              <input type="number" class="filter-input-inline" :value="priceMin" min="0" max="200000" step="100" placeholder="Min" @change="onPriceMinChange">
              <span class="filter-dash">—</span>
              <input type="number" class="filter-input-inline" :value="priceMax" min="0" max="200000" step="100" placeholder="Max" @change="onPriceMaxChange">
            </div>
          </div>

          <!-- Brand -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.brand') }}:</span>
            <select class="filter-select-inline" :value="selectedBrand" @change="onBrandChange">
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Year -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.year') }}:</span>
            <div class="filter-range-inputs">
              <input type="number" class="filter-input-inline" :value="yearMin" min="1900" :max="currentYear" placeholder="Min" @change="onYearMinChange">
              <span class="filter-dash">—</span>
              <input type="number" class="filter-input-inline" :value="yearMax" min="1900" :max="currentYear" :placeholder="String(currentYear)" @change="onYearMaxChange">
            </div>
          </div>

          <!-- Advanced filters button (only if dynamic filters exist for FilterBar) -->
          <button v-if="filtersForFilterBar.length" class="filter-advanced-btn" @click="open = !open">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="16" y2="12" />
              <line x1="4" y1="18" x2="12" y2="18" />
            </svg>
            {{ $t('catalog.advancedFilters') }}
            <span v-if="dynamicActiveCount" class="filter-badge">{{ dynamicActiveCount }}</span>
          </button>
        </div>
        <button
          v-show="mobileCanScrollRight"
          class="scroll-btn scroll-btn-right"
          aria-hidden="true"
          @click="scrollMobileRight"
        >
          &#9654;
        </button>
      </div>
    </div>

    <!-- MOBILE: Bottom sheet for dynamic/advanced filters -->
    <Transition name="fade">
      <div v-if="open" class="filter-backdrop" @click="open = false" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="open" class="filter-sheet">
        <div class="filter-sheet-header">
          <h3>{{ $t('catalog.advancedFilters') }}</h3>
          <button class="filter-close" @click="open = false">&#215;</button>
        </div>
        <div class="filter-sheet-body">
          <template v-for="filter in filtersForFilterBar" :key="filter.id">
            <div class="filter-sheet-item">
              <template v-if="filter.type === 'desplegable'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <select class="filter-select-mobile" :value="activeFilters[filter.name] || ''" @change="onSelectChange(filter.name, $event)">
                  <option value="">—</option>
                  <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>

              <template v-else-if="filter.type === 'desplegable_tick'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <div class="filter-checks">
                  <label v-for="opt in getOptions(filter)" :key="opt" class="filter-check">
                    <input type="checkbox" :checked="isChecked(filter.name, opt)" @change="onCheckChange(filter.name, opt)">
                    <span>{{ opt }}</span>
                  </label>
                </div>
              </template>

              <template v-else-if="filter.type === 'tick'">
                <label class="filter-tick">
                  <input type="checkbox" :checked="!!activeFilters[filter.name]" @change="onTickChange(filter.name)">
                  <span>{{ filterLabel(filter) }}</span>
                </label>
              </template>

              <template v-else-if="filter.type === 'slider' || filter.type === 'calc'">
                <label class="filter-label">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}</label>
                <div class="filter-dual-range">
                  <input type="number" class="filter-input-sm" :value="activeFilters[filter.name + '_min'] || ''" :min="getSliderMin(filter)" :max="getSliderMax(filter)" placeholder="Min" @change="onRangeChange(filter.name + '_min', $event)">
                  <span class="filter-sep">—</span>
                  <input type="number" class="filter-input-sm" :value="activeFilters[filter.name + '_max'] || ''" :min="getSliderMin(filter)" :max="getSliderMax(filter)" placeholder="Max" @change="onRangeChange(filter.name + '_max', $event)">
                </div>
              </template>

              <template v-else-if="filter.type === 'caja'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <input type="text" class="filter-input-mobile" :value="activeFilters[filter.name] || ''" :placeholder="filterLabel(filter)" @input="onTextInput(filter.name, $event)">
              </template>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- DESKTOP: Inline horizontal scrollable bar (≥ 768px) -->
    <div class="filters-desktop">
      <div class="filters-container">
        <button
          v-show="canScrollLeft"
          class="scroll-btn scroll-btn-left"
          aria-hidden="true"
          @click="scrollLeft"
        >
          &#9664;
        </button>

        <div
          ref="scrollContainer"
          class="filters-wrapper"
          @scroll="updateScrollState"
          @mousedown="onGrabStart"
        >
          <!-- Reset filters button -->
          <button
            type="button"
            :class="['reset-filters-btn', { disabled: !totalActiveCount }]"
            :disabled="!totalActiveCount"
            :title="$t('catalog.clearFilters')"
            @click="handleClearAll"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <span class="filter-divider" />

          <!-- Static: Location -->
          <div class="filter-group filter-group-location">
            <span class="filter-label filter-label-icon-only">
              <svg class="location-pin-icon" width="14" height="14" viewBox="0 0 24 24" fill="#C41E3A" stroke="#C41E3A" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="white" /></svg>:
            </span>
            <div class="location-dropdown-wrapper">
              <button class="location-trigger" type="button" @click="locationDropdownOpen = !locationDropdownOpen">
                {{ $t(`catalog.locationLevel.${currentLevel}`) }}
              </button>
              <div v-if="locationDropdownOpen" class="location-dropdown">
                <span class="filter-sublabel">{{ $t('catalog.locationYours') }}</span>
                <select class="filter-select-inline location-manual-input" :value="editCountry" @change="onCountrySelect($event)">
                  <option value="">{{ $t('catalog.locationSelectCountry') }}</option>
                  <option v-for="c in europeanCountriesData.priority" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.name }}
                  </option>
                  <option disabled>{{ $t('catalog.locationRestAlpha') }}</option>
                  <option v-for="c in europeanCountriesData.rest" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.name }}
                  </option>
                </select>
                <select
                  v-if="editCountry === 'ES'"
                  class="filter-select-inline location-manual-input"
                  :value="editProvince"
                  @change="onProvinceSelect($event)"
                >
                  <option value="">{{ $t('catalog.locationSelectProvince') }}</option>
                  <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
                </select>
                <span class="filter-sublabel">{{ $t('catalog.locationRange') }}</span>
                <div class="location-levels-desktop">
                  <label
                    v-for="level in availableLevels"
                    :key="level"
                    class="location-level-option-desktop"
                  >
                    <input
                      type="radio"
                      name="location-level-desktop"
                      :value="level"
                      :checked="currentLevel === level"
                      @change="onLevelChange(level); locationDropdownOpen = false"
                    >
                    <span>{{ $t(`catalog.locationLevel.${level}`) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Static: Price -->
          <div class="filter-group">
            <span class="filter-label filter-label-price">€:</span>
            <div class="filter-range-inputs">
              <input
                type="number"
                class="filter-input-inline"
                :value="priceMin"
                min="0"
                max="200000"
                step="100"
                placeholder="Min"
                @change="onPriceMinChange"
              >
              <span class="filter-dash">-</span>
              <input
                type="number"
                class="filter-input-inline"
                :value="priceMax"
                min="0"
                max="200000"
                step="100"
                placeholder="Max"
                @change="onPriceMaxChange"
              >
            </div>
          </div>

          <!-- Static: Brand -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.brand') }}:</span>
            <select class="filter-select-inline" :value="selectedBrand" @change="onBrandChange">
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Static: Year -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.year') }}:</span>
            <div class="filter-range-inputs">
              <input
                type="number"
                class="filter-input-inline"
                :value="yearMin"
                min="1900"
                :max="currentYear"
                placeholder="Min"
                @change="onYearMinChange"
              >
              <span class="filter-dash">-</span>
              <input
                type="number"
                class="filter-input-inline"
                :value="yearMax"
                min="1900"
                :max="currentYear"
                :placeholder="String(currentYear)"
                @change="onYearMaxChange"
              >
            </div>
          </div>

          <!-- Dynamic filters (only subcategory filters when no type selected) -->
          <template v-for="filter in filtersForFilterBar" :key="filter.id">
            <div class="filter-group">
              <template v-if="filter.type === 'desplegable'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <select class="filter-select-inline" :value="activeFilters[filter.name] || ''" @change="onSelectChange(filter.name, $event)">
                  <option value="">—</option>
                  <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>

              <template v-else-if="filter.type === 'desplegable_tick'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <div class="filter-checks-inline">
                  <label v-for="opt in getOptions(filter)" :key="opt" class="cb">
                    <input type="checkbox" :checked="isChecked(filter.name, opt)" @change="onCheckChange(filter.name, opt)">
                    <span>{{ opt }}</span>
                  </label>
                </div>
              </template>

              <template v-else-if="filter.type === 'tick'">
                <label class="cb">
                  <input type="checkbox" :checked="!!activeFilters[filter.name]" @change="onTickChange(filter.name)">
                  <span>{{ filterLabel(filter) }}</span>
                </label>
              </template>

              <template v-else-if="filter.type === 'slider' || filter.type === 'calc'">
                <span class="filter-label">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span>
                <div class="filter-range-inputs">
                  <input
                    type="number"
                    class="filter-input-inline"
                    :value="activeFilters[filter.name + '_min'] || ''"
                    :min="getSliderMin(filter)"
                    :max="getSliderMax(filter)"
                    placeholder="Min"
                    @change="onRangeChange(filter.name + '_min', $event)"
                  >
                  <span class="filter-dash">-</span>
                  <input
                    type="number"
                    class="filter-input-inline"
                    :value="activeFilters[filter.name + '_max'] || ''"
                    :min="getSliderMin(filter)"
                    :max="getSliderMax(filter)"
                    placeholder="Max"
                    @change="onRangeChange(filter.name + '_max', $event)"
                  >
                </div>
              </template>

              <template v-else-if="filter.type === 'caja'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <input
                  type="text"
                  class="filter-input-inline"
                  :value="activeFilters[filter.name] || ''"
                  :placeholder="filterLabel(filter)"
                  @input="onTextInput(filter.name, $event)"
                >
              </template>
            </div>
          </template>

          <!-- Clear filters inline -->
        </div>

        <button
          v-show="canScrollRight"
          class="scroll-btn scroll-btn-right"
          aria-hidden="true"
          @click="scrollRight"
        >
          &#9654;
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FilterDefinition } from '~/composables/useFilters'
import type { Vehicle } from '~/composables/useVehicles'
import type { LocationLevel } from '~/utils/geoData'
import { getAvailableLevels, getSortedEuropeanCountries, getSortedProvinces, PROVINCE_TO_REGION } from '~/utils/geoData'

const props = defineProps<{
  vehicles?: readonly Vehicle[]
}>()

const emit = defineEmits<{
  change: []
}>()

const { locale } = useI18n()
const { visibleFilters, activeFilters, setFilter, clearFilter, clearAll } = useFilters()
const { updateFilters, filters, locationLevel, setLocationLevel, activeTypeId } = useCatalogState()
const { location: userLocation, detect: detectLocation, setManualLocation } = useUserLocation()

const open = ref(false)
const locationDropdownOpen = ref(false)

// Location


const availableLevels = computed(() =>
  getAvailableLevels(userLocation.value.country),
)

const selectedLevel = ref<LocationLevel>((locationLevel.value as LocationLevel) || 'mundo')
const currentLevel = computed(() => selectedLevel.value)

function onLevelChange(level: LocationLevel) {
  selectedLevel.value = level
  setLocationLevel(
    level === 'mundo' ? null : level,
    userLocation.value.country,
    userLocation.value.province,
    userLocation.value.region,
  )
  emit('change')
}

const editCountry = ref(userLocation.value.country || '')
const editProvince = ref(userLocation.value.province || '')
const europeanCountriesData = computed(() => getSortedEuropeanCountries(locale.value))
const provinces = computed(() => getSortedProvinces())

function onCountrySelect(e: Event) {
  const code = (e.target as HTMLSelectElement).value
  editCountry.value = code
  editProvince.value = ''
  if (code) {
    setManualLocation('', code)
    selectedLevel.value = 'pais'
    setLocationLevel('pais', code, null, null)
    emit('change')
  }
}

function onProvinceSelect(e: Event) {
  const prov = (e.target as HTMLSelectElement).value
  editProvince.value = prov
  if (prov) {
    const region = PROVINCE_TO_REGION[prov] ?? null
    setManualLocation(prov, 'ES', prov, region ?? undefined)
    selectedLevel.value = 'provincia'
    setLocationLevel('provincia', 'ES', prov, region)
    emit('change')
  }
}

onMounted(() => {
  detectLocation()
})
const currentYear = new Date().getFullYear()

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Always show if there's at least static filters (price, brand, year)
const hasFilters = computed(() => true)

// Static filter values
const priceMin = computed(() => filters.value.price_min ?? null)
const priceMax = computed(() => filters.value.price_max ?? null)
const yearMin = computed(() => filters.value.year_min ?? null)
const yearMax = computed(() => filters.value.year_max ?? null)
const selectedBrand = computed(() => filters.value.brand ?? '')

// Brand list — extracted dynamically from loaded vehicles
const brands = computed(() => {
  const set = new Set<string>()
  for (const v of props.vehicles ?? []) {
    if (v.brand) set.add(v.brand)
  }
  return [...set].sort()
})

const totalActiveCount = computed(() => {
  let count = Object.keys(activeFilters.value).length
  if (priceMin.value) count++
  if (priceMax.value) count++
  if (yearMin.value) count++
  if (yearMax.value) count++
  if (selectedBrand.value) count++
  if (locationLevel.value && locationLevel.value !== 'mundo') count++
  return count
})

const dynamicActiveCount = computed(() => Object.keys(activeFilters.value).length)

// Filters to show in FilterBar: only when NO type is selected
// When type is selected, filters go in SubcategoryBar
const filtersForFilterBar = computed(() => {
  if (activeTypeId.value) {
    // Type is selected → filters are shown in SubcategoryBar, not here
    return []
  }
  // Only subcategory selected (or nothing) → show subcategory filters here (without separator)
  return visibleFilters.value.filter(f => f.source === 'subcategory')
})

// Note: firstTypeFilterIndex removed - type filters now go in SubcategoryBar

// Mobile scroll
const mobileScrollContainer = ref<HTMLElement | null>(null)
const mobileCanScrollLeft = ref(false)
const mobileCanScrollRight = ref(false)

function updateMobileScrollState() {
  const el = mobileScrollContainer.value
  if (!el) return
  mobileCanScrollLeft.value = el.scrollLeft > 4
  mobileCanScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
}

function scrollMobileLeft() {
  mobileScrollContainer.value?.scrollBy({ left: -150, behavior: 'smooth' })
}

function scrollMobileRight() {
  mobileScrollContainer.value?.scrollBy({ left: 150, behavior: 'smooth' })
}

// Static filter handlers
function onPriceMinChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ price_min: val || undefined })
  emit('change')
}

function onPriceMaxChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ price_max: val || undefined })
  emit('change')
}

function onBrandChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  updateFilters({ brand: val || undefined })
  emit('change')
}

function onYearMinChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ year_min: val || undefined })
  emit('change')
}

function onYearMaxChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ year_max: val || undefined })
  emit('change')
}

// Dynamic filter helpers
function filterLabel(filter: FilterDefinition): string {
  if (locale.value === 'en' && filter.label_en) return filter.label_en
  return filter.label_es || filter.name
}

function getOptions(filter: FilterDefinition): string[] {
  const opts = filter.options
  if (Array.isArray(opts?.values)) return opts.values as string[]
  if (Array.isArray(opts)) return opts as string[]
  return []
}

function getSliderMin(filter: FilterDefinition): number {
  return (filter.options?.min as number) || 0
}

function getSliderMax(filter: FilterDefinition): number {
  return (filter.options?.max as number) || 100
}

function onSelectChange(name: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onCheckChange(name: string, option: string) {
  const current = (activeFilters.value[name] as string[]) || []
  const index = current.indexOf(option)
  if (index >= 0) {
    const next = current.filter(v => v !== option)
    if (next.length) setFilter(name, next)
    else clearFilter(name)
  }
  else {
    setFilter(name, [...current, option])
  }
  emit('change')
}

function isChecked(name: string, option: string): boolean {
  const current = (activeFilters.value[name] as string[]) || []
  return current.includes(option)
}

function onTickChange(name: string) {
  if (activeFilters.value[name]) clearFilter(name)
  else setFilter(name, true)
  emit('change')
}

function onRangeChange(name: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onTextInput(name: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function handleClearAll() {
  clearAll()
  updateFilters({ price_min: undefined, price_max: undefined, year_min: undefined, year_max: undefined, brand: undefined, location_countries: undefined, location_regions: undefined, location_province_eq: undefined })
  setLocationLevel(null, null, null, null)
  selectedLevel.value = 'mundo'
  editCountry.value = ''
  editProvince.value = ''
  open.value = false
  locationDropdownOpen.value = false
  emit('change')
}

// Scroll management
function updateScrollState() {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

function scrollLeft() {
  scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' })
}

// Grab-to-scroll
let isGrabbing = false
let startX = 0
let scrollLeftStart = 0

function onGrabStart(e: MouseEvent) {
  const el = scrollContainer.value
  if (!el) return
  // Don't grab if clicking on an input/select/button
  const tag = (e.target as HTMLElement).tagName
  if (['INPUT', 'SELECT', 'BUTTON', 'LABEL'].includes(tag)) return
  isGrabbing = true
  startX = e.pageX - el.offsetLeft
  scrollLeftStart = el.scrollLeft
  el.style.cursor = 'grabbing'
  document.addEventListener('mousemove', onGrabMove)
  document.addEventListener('mouseup', onGrabEnd)
}

function onGrabMove(e: MouseEvent) {
  if (!isGrabbing) return
  const el = scrollContainer.value
  if (!el) return
  e.preventDefault()
  const x = e.pageX - el.offsetLeft
  el.scrollLeft = scrollLeftStart - (x - startX)
}

function onGrabEnd() {
  isGrabbing = false
  const el = scrollContainer.value
  if (el) el.style.cursor = 'grab'
  document.removeEventListener('mousemove', onGrabMove)
  document.removeEventListener('mouseup', onGrabEnd)
}

// Body scroll lock for mobile sheet
watch(open, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

function onDocClickLocation(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.filter-group-location')) {
    locationDropdownOpen.value = false
  }
}

onMounted(() => {
  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
    nextTick(updateScrollState)
  }
  document.addEventListener('click', onDocClickLocation)
  nextTick(updateMobileScrollState)
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
  document.removeEventListener('mousemove', onGrabMove)
  document.removeEventListener('mouseup', onGrabEnd)
  document.removeEventListener('click', onDocClickLocation)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ============================================
   FILTERS SECTION — Base = mobile (360px)
   ============================================ */
.filters-section {
  background: var(--bg-primary);
  position: relative;
  z-index: 10;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

/* ============================================
   MOBILE: Inline scrollable bar (< 768px)
   ============================================ */
.filters-mobile {
  display: block;
}

.filters-mobile-container {
  position: relative;
  overflow: visible;
}

.filters-mobile-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  overflow-x: auto;
  overflow-y: visible;
  padding: 0.4rem 0.75rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.filters-mobile-wrapper::-webkit-scrollbar {
  display: none;
}

.filters-mobile-wrapper .filter-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.filters-mobile-wrapper .filter-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.filters-mobile-wrapper .filter-input-inline {
  padding: 0.2rem 0.3rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-width: 45px;
  max-width: 60px;
  min-height: auto;
}

.filters-mobile-wrapper .filter-input-inline:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filters-mobile-wrapper .filter-select-inline {
  padding: 0.2rem 0.3rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-width: 60px;
  min-height: auto;
  cursor: pointer;
}

.filters-mobile-wrapper .filter-dash {
  color: var(--text-auxiliary);
  font-size: 9px;
  flex-shrink: 0;
}

.filters-mobile-wrapper .filter-group-location {
  position: relative;
}

.filters-mobile-wrapper .location-dropdown-wrapper {
  position: relative;
}

.filters-mobile-wrapper .location-trigger {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  cursor: pointer;
  min-height: auto;
  min-width: auto;
  white-space: nowrap;
}

.filters-mobile-wrapper .location-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filters-mobile-wrapper .location-manual-input {
  width: 100%;
  max-width: none;
  min-width: 0;
  box-sizing: border-box;
}

.filters-mobile-wrapper .location-levels-desktop {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.filters-mobile-wrapper .location-level-option-desktop {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 0.3rem 0.2rem;
  cursor: pointer;
  border-radius: 4px;
  min-height: 44px;
  min-width: auto;
}

.filters-mobile-wrapper .location-level-option-desktop input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

.filters-mobile-container .scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(35, 66, 74, 0.8);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 9px;
}

.filters-mobile-container .scroll-btn-left {
  left: 2px;
}

.filters-mobile-container .scroll-btn-right {
  right: 2px;
}

.filter-advanced-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border: 2px solid var(--color-primary);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--bg-primary);
  cursor: pointer;
  white-space: nowrap;
  min-height: auto;
  min-width: auto;
  transition: all 0.2s ease;
}

.filter-advanced-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.filter-badge {
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 9px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* ============================================
   MOBILE: Bottom sheet
   ============================================ */
.filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: rgba(0, 0, 0, 0.5);
}

.filter-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-modal);
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  overflow-y: auto;
}

.filter-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color-light);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.filter-sheet-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-close {
  font-size: 18px;
  color: var(--text-auxiliary);
  min-height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-sheet-body {
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-sheet-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Type filter separator (mobile) */
.type-filter-separator-mobile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-top: 1px dashed var(--border-color);
  margin-top: 0.25rem;
}

.type-filter-separator-mobile span:first-child {
  color: var(--text-secondary, #6B7280);
  font-size: 14px;
  font-weight: 600;
}

.type-filter-separator-mobile .separator-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   SHARED: Labels & inputs
   ============================================ */
.filter-label {
  font-weight: 500;
  color: var(--color-primary);
  font-size: 10px;
  line-height: 1.4;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  letter-spacing: 0.15px;
  white-space: nowrap;
}

/* Icon-only label (no text) */
.filter-label-icon-only {
  gap: 0;
}

/* Price label - € symbol */
.filter-label-price {
  font-size: 13px;
  font-weight: 600;
}

.filter-dual-range {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.filter-sep {
  color: var(--text-auxiliary);
  font-size: 9px;
  flex-shrink: 0;
}

.filter-input-sm {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
}

.filter-input-sm:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.filter-select-mobile {
  padding: 0.3rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
  width: 100%;
}

.filter-input-mobile {
  padding: 0.3rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
  width: 100%;
}

/* ============================================
   LOCATION FILTER
   ============================================ */
.location-current {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 0.2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-sublabel {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 0.3rem 0 0.1rem;
}

.reset-filters-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  background: var(--bg-primary);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.reset-filters-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

.reset-filters-btn:disabled,
.reset-filters-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.filter-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color, #e5e7eb);
  flex-shrink: 0;
}

.location-levels {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-level-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  min-height: 44px;
  padding: 0 0.25rem;
}

.location-level-option input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

/* ============================================
   MOBILE: Ticks & checks
   ============================================ */
.filter-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.filter-check input {
  width: auto;
  min-height: auto;
  min-width: auto;
}

.filter-tick {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.filter-tick input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

.btn-clear-filters-mobile {
  margin-top: 0.5rem;
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-auxiliary);
  min-height: auto;
  min-width: auto;
}

/* ============================================
   DESKTOP: Inline horizontal bar (hidden on mobile)
   ============================================ */
.filters-desktop {
  display: none;
}

/* ============================================
   TRANSITIONS
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 300ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* ============================================
   RESPONSIVE: ≥480px
   ============================================ */
@media (min-width: 480px) {
  .filter-toggle {
    font-size: 11px;
  }

  .filter-label {
    font-size: 11px;
  }

  .filter-input-sm,
  .filter-select-mobile,
  .filter-input-mobile {
    font-size: 11px;
  }
}

/* ============================================
   RESPONSIVE: ≥768px — Switch to desktop inline bar
   ============================================ */
@media (min-width: 768px) {
  .filters-mobile {
    display: none;
  }

  .filter-backdrop {
    display: none !important;
  }

  .filter-sheet {
    display: none !important;
  }

  .filters-section {
    padding: 0.3rem 0;
  }

  .filters-desktop {
    display: block;
  }

  .filters-container {
    position: relative;
  }

  /* Slightly larger location icon and € on tablet+ */
  .location-pin-icon {
    width: 16px;
    height: 16px;
  }

  .filter-label {
    font-size: 12px;
  }

  .filter-label-price {
    font-size: 14px;
  }

  .filters-wrapper {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    overflow: visible;
    scroll-behavior: smooth;
    padding: 0.15rem 1.5rem;
    cursor: grab;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .filters-wrapper::-webkit-scrollbar {
    display: none;
  }

  .filters-wrapper:active {
    cursor: grabbing;
  }

  /* Filter group with pipe separator */
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    cursor: default;
  }

  .filter-group:not(:last-child)::after {
    content: '|';
    color: var(--border-color);
    margin-left: 0.6rem;
    font-weight: 300;
  }

  /* Inline select */
  .filter-select-inline {
    padding: 0.2rem 0.3rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 10px;
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 400;
    min-width: 74px;
    min-height: auto;
  }

  .filter-select-inline:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
  }

  /* Inline number/text inputs */
  .filter-input-inline {
    padding: 0.2rem 0.3rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 10px;
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    min-width: 50px;
    max-width: 70px;
    min-height: auto;
    transition: all 0.3s ease;
  }

  .filter-input-inline:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
  }

  .filter-range-inputs {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .filter-dash {
    color: var(--text-auxiliary);
    font-size: 9px;
    flex-shrink: 0;
  }

  /* Location dropdown (desktop) */
  .filter-group-location {
    position: relative;
  }

  .location-dropdown-wrapper {
    position: relative;
  }

  .location-trigger {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.4rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 10px;
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: auto;
    min-width: auto;
    white-space: nowrap;
  }

  .location-trigger:hover,
  .location-trigger:focus {
    border-color: var(--color-primary);
  }

  .location-level-badge {
    font-size: 8px;
    font-weight: 600;
    background: var(--color-primary);
    color: var(--color-white);
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .location-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: var(--bg-primary);
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1100;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .location-manual-input {
    width: 100%;
    max-width: none;
    min-width: 0;
    box-sizing: border-box;
  }

  .location-levels-desktop {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .location-level-option-desktop {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    padding: 0.3rem 0.2rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.15s;
    min-height: auto;
    min-width: auto;
  }

  .location-level-option-desktop:hover {
    background: rgba(35, 66, 74, 0.06);
  }

  .location-level-option-desktop input {
    width: auto;
    min-height: auto;
    min-width: auto;
    accent-color: var(--color-primary);
  }

  /* Type filter separator */
  .type-filter-separator {
    color: var(--text-secondary, #6B7280);
    font-size: 14px;
    font-weight: 600;
    padding: 0 0.5rem;
    flex-shrink: 0;
  }

  /* Inline checkbox groups */
  .filter-checks-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    cursor: pointer;
    min-height: auto;
    min-width: auto;
  }

  .cb input {
    width: auto;
    min-height: auto;
    min-width: auto;
    accent-color: var(--color-primary);
  }

  /* Clear button inline */
  .btn-clear-filters {
    padding: 0.2rem 0.5rem;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 10px;
    cursor: pointer;
    color: var(--text-auxiliary);
    white-space: nowrap;
    flex-shrink: 0;
    min-height: auto;
    min-width: auto;
    transition: all 0.2s ease;
  }

  .btn-clear-filters:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  /* Scroll arrows */
  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(35, 66, 74, 0.8);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.3s ease;
    font-size: 10px;
  }

  .scroll-btn:hover {
    background: var(--color-primary);
  }

  .scroll-btn-left {
    left: 4px;
  }

  .scroll-btn-right {
    right: 4px;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .filters-wrapper {
    padding: 0.6rem 3rem;
  }

  .filter-label {
    font-size: 13px;
  }

  /* Larger location icon and € symbol on desktop */
  .location-pin-icon {
    width: 18px;
    height: 18px;
  }

  .filter-label-price {
    font-size: 15px;
  }

  .filter-select-inline,
  .filter-input-inline {
    font-size: 11px;
  }

  .cb {
    font-size: 10px;
  }

  .btn-clear-filters {
    font-size: 10px;
  }

  .scroll-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 12px;
  }

  .scroll-btn-left {
    left: 6px;
  }

  .scroll-btn-right {
    right: 6px;
  }
}
</style>
