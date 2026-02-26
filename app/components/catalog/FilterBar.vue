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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <span class="filter-divider" />

          <!-- Location -->
          <div class="filter-group filter-group-location">
            <span class="filter-label filter-label-icon-only">
              <svg
                class="location-pin-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#C41E3A"
                stroke="#C41E3A"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" fill="white" /></svg
              >:
            </span>
            <div class="location-dropdown-wrapper">
              <button
                class="location-trigger"
                type="button"
                @click="locationDropdownOpen = !locationDropdownOpen"
              >
                {{ locationTriggerText }}
              </button>
              <CatalogFilterBarLocationPicker
                :open="locationDropdownOpen"
                :edit-country="editCountry"
                :edit-province="editProvince"
                :european-countries="europeanCountriesData"
                :provinces="provinces"
                @update:open="locationDropdownOpen = $event"
                @country-select="onCountrySelect"
                @province-select="onProvinceSelect"
              />
            </div>
          </div>

          <!-- Price (button -> popover) -->
          <div class="filter-group filter-group-range-trigger">
            <span class="filter-label filter-label-price">&#8364;:</span>
            <button
              class="range-trigger"
              type="button"
              @click="pricePopoverOpen = !pricePopoverOpen"
            >
              {{ formatPriceLabel(priceMin ?? 0) }} – {{ formatPriceLabel(priceMax ?? 200000) }}
            </button>
          </div>

          <!-- Brand -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.brand') }}:</span>
            <select
              class="filter-select-inline"
              :value="selectedBrand"
              :aria-label="$t('catalog.brand')"
              @change="onBrandChange"
            >
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Year (button -> popover) -->
          <div class="filter-group filter-group-range-trigger">
            <span class="filter-label">{{ $t('catalog.year') }}:</span>
            <button class="range-trigger" type="button" @click="yearPopoverOpen = !yearPopoverOpen">
              {{ yearMin ?? 2000 }} – {{ yearMax ?? currentYear }}
            </button>
          </div>

          <!-- Advanced filters button (only if dynamic filters exist) -->
          <button
            v-if="filtersForFilterBar.length"
            class="filter-advanced-btn"
            @click="open = !open"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
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

    <!-- MOBILE: Price popover -->
    <CatalogFilterBarRangePopover
      :open="pricePopoverOpen"
      :title="$t('catalog.priceRange')"
      :min="0"
      :max="200000"
      :step="500"
      :model-min="priceMin"
      :model-max="priceMax"
      :format-label="formatPriceLabel"
      @update:open="pricePopoverOpen = $event"
      @update:model-min="onPriceSliderMin"
      @update:model-max="onPriceSliderMax"
    />

    <!-- MOBILE: Year popover -->
    <CatalogFilterBarRangePopover
      :open="yearPopoverOpen"
      :title="$t('catalog.yearRange')"
      :min="2000"
      :max="currentYear"
      :step="1"
      :model-min="yearMin"
      :model-max="yearMax"
      @update:open="yearPopoverOpen = $event"
      @update:model-min="onYearSliderMin"
      @update:model-max="onYearSliderMax"
    />

    <!-- Advanced filters (mobile bottom sheet + desktop panel) -->
    <CatalogFilterBarAdvancedPanel
      :mobile-open="open"
      :desktop-open="advancedOpen"
      :filters="filtersForFilterBar"
      :active-filters="activeFilters"
      @update:mobile-open="open = $event"
      @select="onDynamicSelect"
      @check="onDynamicCheck"
      @tick="onDynamicTick"
      @range="onDynamicRange"
      @text="onDynamicText"
    />

    <!-- DESKTOP: Inline horizontal scrollable bar (>= 768px) -->
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <span class="filter-divider" />

          <!-- Static: Location -->
          <div class="filter-group filter-group-location">
            <span class="filter-label filter-label-icon-only">
              <svg
                class="location-pin-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#C41E3A"
                stroke="#C41E3A"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" fill="white" /></svg
              >:
            </span>
            <div class="location-dropdown-wrapper">
              <button
                class="location-trigger"
                type="button"
                @click="locationDropdownOpen = !locationDropdownOpen"
              >
                {{ locationTriggerText }}
              </button>
              <CatalogFilterBarLocationPicker
                :open="locationDropdownOpen"
                :edit-country="editCountry"
                :edit-province="editProvince"
                :european-countries="europeanCountriesData"
                :provinces="provinces"
                @update:open="locationDropdownOpen = $event"
                @country-select="onCountrySelect"
                @province-select="onProvinceSelect"
              />
            </div>
          </div>

          <!-- Static: Price -->
          <div class="filter-group filter-group-slider">
            <span class="filter-label filter-label-price">&#8364;:</span>
            <UiRangeSlider
              :min="0"
              :max="200000"
              :step="500"
              :model-min="priceMin"
              :model-max="priceMax"
              :format-label="formatPriceLabel"
              @update:model-min="onPriceSliderMin"
              @update:model-max="onPriceSliderMax"
            />
          </div>

          <!-- Static: Brand -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.brand') }}:</span>
            <select
              class="filter-select-inline"
              :value="selectedBrand"
              :aria-label="$t('catalog.brand')"
              @change="onBrandChange"
            >
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Static: Year -->
          <div class="filter-group filter-group-slider">
            <span class="filter-label">{{ $t('catalog.year') }}:</span>
            <UiRangeSlider
              :min="2000"
              :max="currentYear"
              :step="1"
              :model-min="yearMin"
              :model-max="yearMax"
              @update:model-min="onYearSliderMin"
              @update:model-max="onYearSliderMax"
            />
          </div>

          <!-- Advanced filters button (desktop) -->
          <button
            v-if="filtersForFilterBar.length"
            class="filter-advanced-btn-desktop"
            @click="advancedOpen = !advancedOpen"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="16" y2="12" />
              <line x1="4" y1="18" x2="12" y2="18" />
            </svg>
            {{ $t('catalog.advancedFilters') }}
            <span v-if="dynamicActiveCount" class="filter-badge">{{ dynamicActiveCount }}</span>
          </button>
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
import type { Vehicle } from '~/composables/useVehicles'
import { getSortedEuropeanCountries, getSortedProvinces } from '~/utils/geoData'

const props = defineProps<{
  vehicles?: readonly Vehicle[]
}>()

const emit = defineEmits<{
  change: []
}>()

const { t, locale } = useI18n()
const { visibleFilters, activeFilters, setFilter, clearFilter, clearAll } = useFilters()
const { updateFilters, filters, locationLevel, setLocationLevel, setCategory, setSubcategory } =
  useCatalogState()
const { location: userLocation, detect: detectLocation, setManualLocation } = useUserLocation()

const open = ref(false)
const advancedOpen = ref(false)
const locationDropdownOpen = ref(false)
const pricePopoverOpen = ref(false)
const yearPopoverOpen = ref(false)

// Location — simplified: country + province only
const editCountry = ref(userLocation.value.country || '')
const editProvince = ref(userLocation.value.province || '')
const europeanCountriesData = computed(() => getSortedEuropeanCountries(locale.value))
const provinces = computed(() => getSortedProvinces())

const locationTriggerText = computed(() => {
  if (editProvince.value) return editProvince.value
  if (editCountry.value) {
    const all = [...europeanCountriesData.value.priority, ...europeanCountriesData.value.rest]
    const country = all.find((c) => c.code === editCountry.value)
    return country ? `${country.flag} ${country.name}` : editCountry.value
  }
  return t('catalog.locationAll')
})

watch(
  () => userLocation.value,
  (newLoc) => {
    if (newLoc.country && !editCountry.value) {
      editCountry.value = newLoc.country
      setLocationLevel('nacional', newLoc.country, null, null)
    }
    if (newLoc.province && !editProvince.value) {
      editProvince.value = newLoc.province
    }
  },
  { deep: true },
)

function onCountrySelect(e: Event) {
  const code = (e.target as HTMLSelectElement).value
  editCountry.value = code
  editProvince.value = ''
  if (code) {
    setManualLocation('', code)
    setLocationLevel('nacional', code, null, null)
  } else {
    setLocationLevel(null, '', null, null)
  }
  locationDropdownOpen.value = false
  emit('change')
}

function onProvinceSelect(e: Event) {
  const prov = (e.target as HTMLSelectElement).value
  editProvince.value = prov
  if (prov) {
    setManualLocation(prov, 'ES', prov)
    setLocationLevel('provincia', 'ES', prov, null)
  } else {
    setLocationLevel('nacional', 'ES', null, null)
  }
  locationDropdownOpen.value = false
  emit('change')
}

onMounted(async () => {
  await detectLocation()
  if (userLocation.value.country && !editCountry.value) {
    editCountry.value = userLocation.value.country
  }
  if (userLocation.value.province && !editProvince.value) {
    editProvince.value = userLocation.value.province
  }
})

const currentYear = new Date().getFullYear()
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const hasFilters = computed(() => true)

// Static filter values
const priceMin = computed(() => filters.value.price_min ?? null)
const priceMax = computed(() => filters.value.price_max ?? null)
const yearMin = computed(() => filters.value.year_min ?? null)
const yearMax = computed(() => filters.value.year_max ?? null)
const selectedBrand = computed(() => filters.value.brand ?? '')

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
const filtersForFilterBar = computed(() => visibleFilters.value)

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

function formatPriceLabel(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

// Slider handlers
function onPriceSliderMin(val: number | null) {
  updateFilters({ price_min: val ?? undefined })
  emit('change')
}

function onPriceSliderMax(val: number | null) {
  updateFilters({ price_max: val ?? undefined })
  emit('change')
}

function onYearSliderMin(val: number | null) {
  updateFilters({ year_min: val ?? undefined })
  emit('change')
}

function onYearSliderMax(val: number | null) {
  updateFilters({ year_max: val ?? undefined })
  emit('change')
}

function onBrandChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  updateFilters({ brand: val || undefined })
  emit('change')
}

// Dynamic filter event handlers
function onDynamicSelect(name: string, value: string) {
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onDynamicCheck(name: string, option: string) {
  const current = (activeFilters.value[name] as string[]) || []
  const index = current.indexOf(option)
  if (index >= 0) {
    const next = current.filter((v) => v !== option)
    if (next.length) setFilter(name, next)
    else clearFilter(name)
  } else {
    setFilter(name, [...current, option])
  }
  emit('change')
}

function onDynamicTick(name: string) {
  if (activeFilters.value[name]) clearFilter(name)
  else setFilter(name, true)
  emit('change')
}

function onDynamicRange(name: string, value: number | null) {
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onDynamicText(name: string, value: string) {
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function handleClearAll() {
  clearAll()
  setCategory(null, null)
  setSubcategory(null, null)
  updateFilters({
    price_min: undefined,
    price_max: undefined,
    year_min: undefined,
    year_max: undefined,
    brand: undefined,
    location_countries: undefined,
    location_regions: undefined,
    location_province_eq: undefined,
    category_id: undefined,
    subcategory_id: undefined,
  })
  setLocationLevel('nacional', 'ES', null, null)
  editCountry.value = 'ES'
  editProvince.value = ''
  open.value = false
  locationDropdownOpen.value = false
  emit('change')
}

// Desktop scroll management
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
  document.body.style.overflow = val ? 'hidden' : ''
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
  z-index: 100;
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
  padding-right: 0.5rem;
  border-right: 1px solid var(--border-color);
}

.filters-mobile-wrapper .filter-group:last-child {
  border-right: none;
  padding-right: 0;
}

.filters-mobile-wrapper .filter-group-range-trigger {
  min-width: auto;
}

.range-trigger {
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
  white-space: nowrap;
  min-height: auto;
  min-width: auto;
}

.range-trigger:hover,
.range-trigger:focus {
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

.filters-mobile-container .scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(35, 66, 74, 0.8);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 10px;
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

.filter-label-icon-only {
  gap: 0;
}

.filter-label-price {
  font-size: 13px;
  font-weight: 600;
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

/* ============================================
   DESKTOP: Inline horizontal bar (hidden on mobile)
   ============================================ */
.filters-desktop {
  display: none;
}

/* ============================================
   RESPONSIVE: >=480px
   ============================================ */
@media (min-width: 480px) {
  .filter-label {
    font-size: 11px;
  }
}

/* ============================================
   RESPONSIVE: >=768px
   ============================================ */
@media (min-width: 768px) {
  .filters-mobile {
    display: none;
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

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    cursor: default;
  }

  .filter-group-slider {
    min-width: 160px;
  }

  .filter-group:not(:last-child)::after {
    content: '|';
    color: var(--border-color);
    margin-left: 0.6rem;
    font-weight: 300;
  }

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

  .filter-advanced-btn-desktop {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    min-height: auto;
    min-width: auto;
    transition: all 0.2s ease;
  }

  .filter-advanced-btn-desktop:hover {
    border-color: var(--color-primary);
    background: var(--bg-secondary);
  }
}

/* ============================================
   RESPONSIVE: >=1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .filters-wrapper {
    padding: 0.6rem 3rem;
  }

  .filter-label {
    font-size: 13px;
  }

  .location-pin-icon {
    width: 18px;
    height: 18px;
  }

  .filter-label-price {
    font-size: 15px;
  }

  .filter-select-inline {
    font-size: 11px;
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
