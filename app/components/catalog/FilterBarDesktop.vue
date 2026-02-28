<script setup lang="ts">
import type { AttributeDefinition, EuropeanCountriesData } from '~/composables/catalog/useFilterBar'

defineProps<{
  editCountry: string
  editProvince: string
  europeanCountriesData: EuropeanCountriesData
  provinces: string[]
  locationTriggerText: string
  priceMin: number | null
  priceMax: number | null
  yearMin: number | null
  yearMax: number | null
  currentYear: number
  selectedBrand: string
  brands: string[]
  filtersForFilterBar: AttributeDefinition[]
  dynamicActiveCount: number
  totalActiveCount: number
  formatPriceLabel: (n: number) => string
  advancedOpen: boolean
}>()

const emit = defineEmits<{
  countrySelect: [event: Event]
  provinceSelect: [event: Event]
  brandChange: [event: Event]
  clearAll: []
  priceSliderMin: [val: number | null]
  priceSliderMax: [val: number | null]
  yearSliderMin: [val: number | null]
  yearSliderMax: [val: number | null]
  toggleAdvanced: []
}>()

// Internal scroll + grab state
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const locationDropdownOpen = ref(false)

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
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
  document.removeEventListener('mousemove', onGrabMove)
  document.removeEventListener('mouseup', onGrabEnd)
  document.removeEventListener('click', onDocClickLocation)
})
</script>

<template>
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
        <!-- Reset filters -->
        <button
          type="button"
          :class="['reset-filters-btn', { disabled: !totalActiveCount }]"
          :disabled="!totalActiveCount"
          :title="$t('catalog.clearFilters')"
          @click="emit('clearAll')"
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
              @country-select="emit('countrySelect', $event)"
              @province-select="emit('provinceSelect', $event)"
            />
          </div>
        </div>

        <!-- Price slider -->
        <div class="filter-group filter-group-slider">
          <span class="filter-label filter-label-price">&#8364;:</span>
          <UiRangeSlider
            :min="0"
            :max="200000"
            :step="500"
            :model-min="priceMin"
            :model-max="priceMax"
            :format-label="formatPriceLabel"
            @update:model-min="emit('priceSliderMin', $event)"
            @update:model-max="emit('priceSliderMax', $event)"
          />
        </div>

        <!-- Brand -->
        <div class="filter-group">
          <span class="filter-label">{{ $t('catalog.brand') }}:</span>
          <select
            class="filter-select-inline"
            :value="selectedBrand"
            :aria-label="$t('catalog.brand')"
            @change="emit('brandChange', $event)"
          >
            <option value="">{{ $t('catalog.all') || '—' }}</option>
            <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- Year slider -->
        <div class="filter-group filter-group-slider">
          <span class="filter-label">{{ $t('catalog.year') }}:</span>
          <UiRangeSlider
            :min="2000"
            :max="currentYear"
            :step="1"
            :model-min="yearMin"
            :model-max="yearMax"
            @update:model-min="emit('yearSliderMin', $event)"
            @update:model-max="emit('yearSliderMax', $event)"
          />
        </div>

        <!-- Advanced filters button -->
        <button
          v-if="filtersForFilterBar.length"
          class="filter-advanced-btn-desktop"
          @click="emit('toggleAdvanced')"
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
</template>

<style scoped>
/* Desktop bar: hidden on mobile, shown on >=768px */
.filters-desktop {
  display: none;
}

/* Shared labels / controls (needed since this component is isolated) */
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

@media (min-width: 768px) {
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
