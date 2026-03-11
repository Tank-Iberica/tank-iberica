<script setup lang="ts">
import type { AttributeDefinition, EuropeanCountriesData } from '~/composables/catalog/useFilterBar'
import { useHorizontalScroll } from '~/composables/catalog/useHorizontalScroll'

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

const {
  scrollContainer,
  canScrollLeft,
  canScrollRight,
  updateScrollState,
  scrollLeftBy,
  scrollRightBy,
  onGrabStart,
} = useHorizontalScroll()

const locationDropdownOpen = ref(false)

function onDocClickLocation(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.filter-group-location')) {
    locationDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClickLocation)
})

onUnmounted(() => {
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
        @click="scrollLeftBy"
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
              fill="var(--color-danger)"
              stroke="var(--color-danger)"
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
          :aria-expanded="advancedOpen"
          aria-controls="filter-advanced-panel"
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
        @click="scrollRightBy"
      >
        &#9654;
      </button>
    </div>
  </div>
</template>

<style src="~/assets/css/filter-bar-shared.css"></style>

<style scoped>
.filters-desktop {
  display: none;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(35, 66, 74, 0.8);
  border: none;
  color: white;
  width: 1.75rem;
  height: 1.75rem;
  min-width: 1.75rem;
  min-height: 1.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
  font-size: var(--font-size-xs);
}

@media (hover: hover) {
  .scroll-btn:hover {
    background: var(--color-primary);
  }
}

.scroll-btn-left {
  left: 0.25rem;
}

.scroll-btn-right {
  right: 0.25rem;
}

@media (min-width: 48em) {
  .filters-desktop {
    display: block;
  }

  .filters-container {
    position: relative;
  }

  .location-pin-icon {
    width: 1rem;
    height: 1rem;
  }

  .filter-label {
    font-size: var(--font-size-xs);
  }

  .filter-label-price {
    font-size: var(--font-size-base);
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
    min-width: 10rem;
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
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 400;
    min-width: 4.625rem;
    min-height: auto;
  }

  .filter-select-inline:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
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
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
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

  .filter-advanced-btn-desktop {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-xs);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    min-height: auto;
    min-width: auto;
    transition: all 0.2s ease;
  }

  @media (hover: hover) {
    .filter-advanced-btn-desktop:hover {
      border-color: var(--color-primary);
      background: var(--bg-secondary);
    }
  }
}

@media (min-width: 64em) {
  .filters-wrapper {
    padding: 0.6rem 3rem;
  }

  .filter-label {
    font-size: var(--font-size-sm);
  }

  .location-pin-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .filter-label-price {
    font-size: var(--font-size-sm);
  }

  .filter-select-inline {
    font-size: var(--font-size-xs);
  }

  .scroll-btn {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    font-size: var(--font-size-xs);
  }

  .scroll-btn-left {
    left: 0.375rem;
  }

  .scroll-btn-right {
    right: 0.375rem;
  }
}
</style>
