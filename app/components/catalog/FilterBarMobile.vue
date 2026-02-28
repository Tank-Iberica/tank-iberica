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
}>()

const emit = defineEmits<{
  countrySelect: [event: Event]
  provinceSelect: [event: Event]
  brandChange: [event: Event]
  clearAll: []
  togglePricePopover: []
  toggleYearPopover: []
  toggleAdvanced: []
}>()

// Internal state for mobile scroll + location dropdown + popovers
const mobileScrollContainer = ref<HTMLElement | null>(null)
const mobileCanScrollLeft = ref(false)
const mobileCanScrollRight = ref(false)
const locationDropdownOpen = ref(false)

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

function onDocClickLocation(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.filter-group-location')) {
    locationDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClickLocation)
  nextTick(updateMobileScrollState)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClickLocation)
})
</script>

<template>
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

        <!-- Price (button -> popover) -->
        <div class="filter-group filter-group-range-trigger">
          <span class="filter-label filter-label-price">&#8364;:</span>
          <button class="range-trigger" type="button" @click="emit('togglePricePopover')">
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
            @change="emit('brandChange', $event)"
          >
            <option value="">{{ $t('catalog.all') || '—' }}</option>
            <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- Year (button -> popover) -->
        <div class="filter-group filter-group-range-trigger">
          <span class="filter-label">{{ $t('catalog.year') }}:</span>
          <button class="range-trigger" type="button" @click="emit('toggleYearPopover')">
            {{ yearMin ?? 2000 }} – {{ yearMax ?? currentYear }}
          </button>
        </div>

        <!-- Advanced filters button (only if dynamic filters exist) -->
        <button
          v-if="filtersForFilterBar.length"
          class="filter-advanced-btn"
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
        v-show="mobileCanScrollRight"
        class="scroll-btn scroll-btn-right"
        aria-hidden="true"
        @click="scrollMobileRight"
      >
        &#9654;
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Mobile: Inline scrollable bar (< 768px) */
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

/* Shared */
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

@media (min-width: 480px) {
  .filter-label {
    font-size: 11px;
  }
}

@media (min-width: 768px) {
  .filters-mobile {
    display: none;
  }
}
</style>
