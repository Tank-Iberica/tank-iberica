<template>
  <div class="catalog-controls">
    <div class="controls-wrapper">
      <!-- Left: menu toggle + search -->
      <div class="controls-left">
        <button
          class="ctrl-btn"
          :title="$t('catalog.menuToggle')"
          @click="emit('toggleMenu')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span class="ctrl-label">{{ $t('catalog.menuToggle') }}</span>
        </button>

        <div class="search-box">
          <input
            v-if="searchExpanded || !isMobile"
            ref="searchInput"
            :value="searchQuery"
            type="text"
            class="search-input"
            :placeholder="$t('catalog.searchPlaceholder')"
            @input="onSearch"
            @blur="onSearchBlur"
          >
          <button v-if="isMobile && !searchExpanded" class="ctrl-btn" @click="expandSearch">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <svg v-if="!isMobile" class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <!-- Center: result count + solicitar -->
      <div class="controls-center">
        <span class="results-count">{{ $t('catalog.resultsCount', { count: vehicleCount }) }}</span>
        <button class="solicitar-btn" @click="emit('openSolicitar')">
          {{ $t('catalog.solicitar') }}
        </button>
      </div>

      <!-- Right: favorites + view toggle + sort -->
      <div class="controls-right">
        <button class="ctrl-btn" :title="$t('catalog.favorites')" @click="emit('openFavorites')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span v-if="favCount" class="ctrl-badge">{{ favCount }}</span>
        </button>

        <button class="ctrl-btn" :title="viewMode === 'grid' ? $t('catalog.viewList') : $t('catalog.viewGrid')" @click="toggleView">
          <!-- Grid icon -->
          <svg v-if="viewMode === 'list'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <!-- List icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>

        <div class="sort-box">
          <select
            id="sort-select"
            :value="sortBy"
            class="sort-select"
            @change="onSort"
          >
            <option value="price_asc">{{ $t('catalog.sortPriceAsc') }}</option>
            <option value="price_desc">{{ $t('catalog.sortPriceDesc') }}</option>
            <option value="year_asc">{{ $t('catalog.sortYearAsc') }}</option>
            <option value="year_desc">{{ $t('catalog.sortYearDesc') }}</option>
            <option value="brand_az">{{ $t('catalog.sortBrandAZ') }}</option>
            <option value="brand_za">{{ $t('catalog.sortBrandZA') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  vehicleCount?: number
  favCount?: number
}>()

const emit = defineEmits<{
  search: [query: string]
  sort: [sortBy: string]
  toggleMenu: []
  openSolicitar: []
  openFavorites: []
  viewChange: [mode: 'grid' | 'list']
}>()

const { searchQuery, setSearch } = useCatalogState()
const sortBy = ref('price_asc')
const viewMode = ref<'grid' | 'list'>('grid')
const searchExpanded = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const isMobile = useMediaQuery('(max-width: 767px)')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearch(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setSearch(value)
    emit('search', value)
  }, 300)
}

function onSort(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  sortBy.value = value
  emit('sort', value)
}

function toggleView() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  emit('viewChange', viewMode.value)
}

function expandSearch() {
  searchExpanded.value = true
  nextTick(() => searchInput.value?.focus())
}

function onSearchBlur() {
  if (isMobile.value && !searchQuery.value) {
    searchExpanded.value = false
  }
}
</script>

<style scoped>
.catalog-controls {
  background: var(--bg-primary);
  padding: 0.4rem 1rem;
  border-top: 1px solid var(--border-color-light);
  border-bottom: 1px solid var(--border-color-light);
  position: sticky;
  top: var(--header-height, 60px);
  z-index: 10;
}

.controls-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  max-width: var(--container-max-width);
  margin: 0 auto;
}

/* Left group */
.controls-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  color: var(--text-secondary);
  min-height: 36px;
  min-width: 36px;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: color 0.2s;
  position: relative;
}

.ctrl-btn:hover {
  color: var(--color-primary);
}

.ctrl-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  display: none;
}

.ctrl-badge {
  position: absolute;
  top: 0;
  right: -2px;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Search */
.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.3rem 2rem 0.3rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
  background: var(--bg-secondary);
  min-height: 32px;
  max-width: 160px;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--bg-primary);
}

.search-icon {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-auxiliary);
  pointer-events: none;
}

/* Center group */
.controls-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.results-count {
  font-size: 10px;
  color: var(--text-auxiliary);
  white-space: nowrap;
  display: none;
}

.solicitar-btn {
  padding: 0.3rem 0.75rem;
  background: var(--color-gold, #D4A017);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  min-height: 32px;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.solicitar-btn:hover {
  opacity: 0.9;
}

/* Right group */
.controls-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.sort-box {
  display: flex;
  align-items: center;
}

.sort-select {
  padding: 0.25rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  background: var(--bg-secondary);
  min-width: 80px;
  min-height: 32px;
}

.sort-select:focus {
  border-color: var(--color-primary);
}

@media (min-width: 480px) {
  .search-input {
    max-width: 200px;
  }

  .results-count {
    display: inline;
  }
}

@media (min-width: 768px) {
  .catalog-controls {
    padding: 0.5rem 1.5rem;
  }

  .ctrl-label {
    display: inline;
  }

  .search-input {
    max-width: 225px;
    font-size: 12px;
  }

  .solicitar-btn {
    font-size: 11px;
    padding: 0.35rem 1rem;
  }

  .sort-select {
    font-size: 11px;
    min-width: 100px;
  }
}

@media (min-width: 1024px) {
  .catalog-controls {
    padding: 0.5rem 3rem;
  }
}
</style>
