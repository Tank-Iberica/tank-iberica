<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { useFilterBar } from '~/composables/catalog/useFilterBar'

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
</template>

<style scoped>
.filters-section {
  background: var(--bg-primary);
  position: relative;
  z-index: 100;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

@media (min-width: 768px) {
  .filters-section {
    padding: 0.3rem 0;
  }
}
</style>
