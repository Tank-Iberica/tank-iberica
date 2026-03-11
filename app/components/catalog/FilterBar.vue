<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { useFilterBar } from '~/composables/catalog/useFilterBar'
import { useSavedFilters } from '~/composables/catalog/useSavedFilters'
import type { SavedFilterPreset } from '~/composables/catalog/useSavedFilters'

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

// Saved filter presets (localStorage)
const { savedPresets, hasPresets, savePreset, deletePreset } = useSavedFilters()
const { filters, locationLevel, updateFilters, setCategory, setSubcategory } = useCatalogState()
const { clearAll: clearDynamicFilters } = useFilters()

const showSaveInput = ref(false)
const newPresetName = ref('')

function onSavePreset() {
  savePreset(newPresetName.value, filters.value, locationLevel.value)
  newPresetName.value = ''
  showSaveInput.value = false
}

function onApplyPreset(preset: SavedFilterPreset) {
  // Reset all dynamic attribute filters first
  clearDynamicFilters()
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
    ...preset.filters,
  })
  setCategory(preset.filters.category_id ?? null, null)
  setSubcategory(preset.filters.subcategory_id ?? null, null)
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

  <!-- Saved filter presets strip (non-sticky) -->
  <div
    v-if="hasPresets || totalActiveCount > 0"
    class="saved-filters-strip"
    :aria-label="$t('catalog.savedFilters.title')"
  >
    <!-- Existing presets as chips -->
    <div v-if="hasPresets" class="presets-list" role="list">
      <button
        v-for="preset in savedPresets"
        :key="preset.id"
        class="preset-chip"
        role="listitem"
        :title="$t('catalog.savedFilters.apply')"
        @click="onApplyPreset(preset)"
      >
        <span class="preset-name">{{ preset.name }}</span>
        <span
          class="preset-delete"
          :aria-label="$t('catalog.savedFilters.delete', { name: preset.name })"
          role="button"
          tabindex="0"
          @click.stop="deletePreset(preset.id)"
          @keydown.enter.stop="deletePreset(preset.id)"
        >×</span>
      </button>
    </div>

    <!-- Save current filters as preset -->
    <div v-if="totalActiveCount > 0" class="save-search-area">
      <template v-if="!showSaveInput">
        <button class="btn-save-search" @click="showSaveInput = true">
          + {{ $t('catalog.savedFilters.saveSearch') }}
        </button>
      </template>
      <template v-else>
        <input
          v-model="newPresetName"
          class="preset-name-input"
          type="text"
          :placeholder="$t('catalog.savedFilters.namePlaceholder')"
          :aria-label="$t('catalog.savedFilters.name')"
          autocomplete="off"
          @keydown.enter="onSavePreset"
          @keydown.escape="showSaveInput = false; newPresetName = ''"
        >
        <button
          class="btn-save-confirm"
          :disabled="!newPresetName.trim()"
          @click="onSavePreset"
        >
          {{ $t('catalog.savedFilters.save') }}
        </button>
        <button
          class="btn-cancel-save"
          @click="showSaveInput = false; newPresetName = ''"
        >
          {{ $t('catalog.savedFilters.cancel') }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.filters-section {
  background: var(--bg-primary);
  position: sticky;
  top: var(--header-offset);
  z-index: var(--z-sticky);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

@media (min-width: 48em) {
  .filters-section {
    top: var(--header-offset-desktop);
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

.save-search-area {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.btn-save-search {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.25rem 0.75rem;
  background: transparent;
  color: var(--color-primary);
  border: 1px dashed var(--color-primary);
  border-radius: 6.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-save-search:hover {
  background: var(--color-primary-alpha, rgba(35, 66, 74, 0.06));
}

.preset-name-input {
  height: 2rem;
  padding: 0 var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-family: inherit;
  min-width: 10rem;
}

.preset-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.12);
}

.btn-save-confirm {
  min-height: 2rem;
  padding: 0 var(--spacing-3);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-save-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-cancel-save {
  min-height: 2rem;
  padding: 0 var(--spacing-3);
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
