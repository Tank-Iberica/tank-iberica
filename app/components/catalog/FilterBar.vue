<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { useFilterBar } from '~/composables/catalog/useFilterBar'
import { useSavedSearches } from '~/composables/catalog/useSavedSearches'
import type { SavedSearch } from '~/composables/catalog/useSavedSearches'

const props = defineProps<{
  vehicles?: readonly Vehicle[]
}>()

const emit = defineEmits<{
  change: []
}>()

const {
  open,
  advancedOpen,
  editCountry,
  editProvince,
  europeanCountriesData,
  provinces,
  locationTriggerText,
  currentYear,
  hasFilters,
  priceMin,
  priceMax,
  yearMin,
  yearMax,
  selectedBrand,
  brands,
  totalActiveCount,
  dynamicActiveCount,
  filtersForFilterBar,
  activeFilters,
  formatPriceLabel,
  onCountrySelect,
  onProvinceSelect,
  onPriceSliderMin,
  onPriceSliderMax,
  onYearSliderMin,
  onYearSliderMax,
  onBrandChange,
  onDynamicSelect,
  onDynamicCheck,
  onDynamicTick,
  onDynamicRange,
  onDynamicText,
  handleClearAll,
} = useFilterBar(
  () => props.vehicles,
  () => emit('change'),
)

const pricePopoverOpen = ref(false)
const yearPopoverOpen = ref(false)

// Saved searches (DB-backed)
const {
  searches,
  hasSearches,
  bumpUsage,
  toggleFavorite,
  remove: removeSearch,
} = useSavedSearches()
const { updateFilters, setCategory, setSubcategory, setSearch } = useCatalogState()
const { clearAll: clearDynamicFilters } = useFilters()

function onApplySearch(search: SavedSearch) {
  // Reset all dynamic attribute filters first
  clearDynamicFilters()
  const filters = search.filters as Record<string, unknown>
  // Apply saved filters (merges & overrides current state)
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
    ...filters,
  })
  setCategory((filters.category_id as string) ?? null, null)
  setSubcategory((filters.subcategory_id as string) ?? null, null)
  setSearch(search.search_query || '')
  // Bump usage in background
  bumpUsage(search.id)
  emit('change')
}
</script>

<template>
  <section v-if="hasFilters" class="filters-section">
    <!-- Mobile bar -->
    <CatalogFilterBarMobile
      :edit-country="editCountry"
      :edit-province="editProvince"
      :european-countries-data="europeanCountriesData"
      :provinces="provinces"
      :location-trigger-text="locationTriggerText"
      :price-min="priceMin"
      :price-max="priceMax"
      :year-min="yearMin"
      :year-max="yearMax"
      :current-year="currentYear"
      :selected-brand="selectedBrand"
      :brands="brands"
      :filters-for-filter-bar="filtersForFilterBar"
      :dynamic-active-count="dynamicActiveCount"
      :total-active-count="totalActiveCount"
      :format-price-label="formatPriceLabel"
      @country-select="onCountrySelect"
      @province-select="onProvinceSelect"
      @brand-change="onBrandChange"
      @clear-all="handleClearAll"
      @toggle-price-popover="pricePopoverOpen = !pricePopoverOpen"
      @toggle-year-popover="yearPopoverOpen = !yearPopoverOpen"
      @toggle-advanced="open = !open"
    />

    <!-- Mobile: Price popover -->
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

    <!-- Mobile: Year popover -->
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

    <!-- Advanced filters panel (mobile sheet + desktop panel) -->
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

    <!-- Desktop bar -->
    <CatalogFilterBarDesktop
      :edit-country="editCountry"
      :edit-province="editProvince"
      :european-countries-data="europeanCountriesData"
      :provinces="provinces"
      :location-trigger-text="locationTriggerText"
      :price-min="priceMin"
      :price-max="priceMax"
      :year-min="yearMin"
      :year-max="yearMax"
      :current-year="currentYear"
      :selected-brand="selectedBrand"
      :brands="brands"
      :filters-for-filter-bar="filtersForFilterBar"
      :dynamic-active-count="dynamicActiveCount"
      :total-active-count="totalActiveCount"
      :format-price-label="formatPriceLabel"
      :advanced-open="advancedOpen"
      @country-select="onCountrySelect"
      @province-select="onProvinceSelect"
      @brand-change="onBrandChange"
      @clear-all="handleClearAll"
      @price-slider-min="onPriceSliderMin"
      @price-slider-max="onPriceSliderMax"
      @year-slider-min="onYearSliderMin"
      @year-slider-max="onYearSliderMax"
      @toggle-advanced="advancedOpen = !advancedOpen"
    />
  </section>

  <!-- Saved searches strip (non-sticky) -->
  <div
    v-if="hasSearches"
    class="saved-filters-strip"
    :aria-label="$t('catalog.savedFilters.title')"
  >
    <div class="presets-list" role="list">
      <button
        v-for="search in searches"
        :key="search.id"
        :class="['preset-chip', { 'preset-chip--favorite': search.is_favorite }]"
        role="listitem"
        :title="$t('catalog.savedFilters.apply')"
        @click="onApplySearch(search)"
      >
        <span
          v-if="search.is_favorite"
          class="preset-star"
          :aria-label="$t('catalog.savedFilters.unfavorite')"
          role="button"
          tabindex="0"
          @click.stop="toggleFavorite(search.id)"
          @keydown.enter.stop="toggleFavorite(search.id)"
          >&#9733;</span
        >
        <span class="preset-name">{{ search.name }}</span>
        <span
          class="preset-delete"
          :aria-label="$t('catalog.savedFilters.delete', { name: search.name })"
          role="button"
          tabindex="0"
          @click.stop="removeSearch(search.id)"
          @keydown.enter.stop="removeSearch(search.id)"
          >&times;</span
        >
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters-section {
  background: var(--bg-primary);
  position: relative;
  z-index: 40;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

@media (min-width: 48em) {
  .filters-section {
    padding: 0.3rem 0;
  }
}

/* Saved filter presets strip */
.saved-filters-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.presets-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.preset-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 0.25rem 0.625rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 6.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 2rem;
  transition: background var(--transition-fast);
}

.preset-chip:hover {
  background: var(--color-primary-dark);
}

.preset-name {
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  font-size: 0.9rem;
  line-height: 1;
  opacity: 0.8;
  flex-shrink: 0;
}

.preset-delete:hover {
  opacity: 1;
}

.preset-chip--favorite {
  background: var(--color-primary-dark, var(--color-primary));
}

.preset-star {
  font-size: 0.75rem;
  color: var(--color-gold, var(--color-warning));
  flex-shrink: 0;
}
</style>
