<template>
  <section class="catalog-controls">
    <div class="controls-wrapper">
      <!-- Single row: left + notification + right -->
      <div class="controls-row">
        <!-- Left: menu toggle + search -->
        <div class="controls-left">
          <button
            :class="['menu-toggle-btn', { 'menu-visible': props.menuVisible }]"
            :title="$t('catalog.menuToggle')"
            @click="onToggleMenu"
          >
            <span class="menu-label">{{ $t('catalog.menuToggle') }}</span>
            <span class="eye-wrapper">
              <!-- Eye open (menu visible) -->
              <svg
                v-if="props.menuVisible"
                class="eye-svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path
                  d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  class="eye-shape"
                  stroke-width="2"
                />
                <circle cx="12" cy="12" r="3" class="eye-pupil" />
              </svg>
              <!-- Eye closed (menu hidden) -->
              <svg v-else class="eye-svg" width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" />
                <line
                  x1="2"
                  y1="2"
                  x2="22"
                  y2="22"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
              </svg>
            </span>
          </button>

          <!-- Mobile search: circular icon, expands to dropdown -->
          <div :class="['mobile-search-wrapper', { active: searchExpanded }]">
            <button class="search-btn-icon" @mousedown.prevent @click="toggleMobileSearch">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <div v-show="searchExpanded" class="search-dropdown">
              <input
                ref="mobileSearchInput"
                :value="searchQuery"
                type="text"
                :placeholder="$t('catalog.searchPlaceholder')"
                @input="onSearch"
                @blur="onMobileSearchBlur"
              >
            </div>
          </div>

          <!-- Desktop search: full box with icon + clear X -->
          <div class="search-box desktop-search">
            <input
              ref="desktopSearchInput"
              :value="searchQuery"
              type="text"
              class="search-input"
              :placeholder="$t('catalog.searchPlaceholder')"
              @input="onSearch"
            >
            <button
              v-show="searchQuery"
              class="search-clear-btn"
              type="button"
              @click="clearSearch"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <svg
              class="search-icon-right"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        <!-- Category buttons: inline in the center -->
        <div class="categories-inline">
          <button
            v-for="cat in mainCategories"
            :key="cat"
            :class="['category-btn', { active: activeActions.has(cat) }]"
            @click="handleCategoryClick(cat)"
          >
            {{ $t(`catalog.${cat}`) }}
          </button>
        </div>

        <!-- Right: favorites + view + sort -->
        <div class="controls-right">
          <span class="fav-label-desktop">{{ $t('catalog.favorites') }}:</span>
          <button
            :class="['favorites-btn', { active: favoritesOnly }]"
            :title="$t('catalog.favorites')"
            @click="onToggleFavorites"
          >
            <svg viewBox="0 0 24 24">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              />
            </svg>
          </button>

          <button
            :class="['save-search-btn', { success: saveSearchSuccess }]"
            :title="$t('catalog.saveSearch')"
            @click="onSaveSearch"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <span class="view-label-desktop">{{ $t('catalog.viewShow') }}:</span>
          <div class="view-switcher">
            <button
              :class="['view-btn', { active: viewMode === 'grid' }]"
              :title="$t('catalog.viewGrid')"
              @click="setView('grid')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              :class="['view-btn', { active: viewMode === 'list' }]"
              :title="$t('catalog.viewList')"
              @click="setView('list')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="4" rx="1" />
                <rect x="3" y="10" width="18" height="4" rx="1" />
                <rect x="3" y="17" width="18" height="4" rx="1" />
              </svg>
            </button>
          </div>

          <div class="sort-wrapper">
            <span class="sort-label">{{ $t('catalog.sortLabel') }}</span>
            <div :class="['sort-dropdown-wrapper', { active: sortOpen }]">
              <button
                class="sort-btn"
                :title="$t('catalog.sortLabel')"
                @click="sortOpen = !sortOpen"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                >
                  <path d="M7 4v16" />
                  <path d="M7 4l-3 3" />
                  <path d="M7 4l3 3" />
                  <path d="M17 20V4" />
                  <path d="M17 20l-3-3" />
                  <path d="M17 20l3-3" />
                </svg>
              </button>
              <div v-show="sortOpen" class="sort-dropdown">
                <button
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  :class="['sort-option', { active: sortBy === opt.value }]"
                  @click="selectSort(opt.value)"
                >
                  {{ $t(opt.label) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  vehicleCount?: number
  favCount?: number
  menuVisible?: boolean
}>()

const emit = defineEmits<{
  search: [query: string]
  sort: [sortBy: string]
  toggleMenu: []
  openFavorites: []
  viewChange: [mode: 'grid' | 'list']
  categoryChange: [categories: string[]]
  saveSearchAuth: []
}>()

const {
  searchQuery,
  setSearch,
  sortBy,
  viewMode,
  setSort,
  setViewMode,
  setActions,
  filters: catalogFilters,
} = useCatalogState()
const { favoritesOnly, toggleFilter: toggleFavoritesFilter } = useFavorites()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const saveSearchSuccess = ref(false)

async function onSaveSearch() {
  if (!user.value) {
    emit('saveSearchAuth')
    return
  }

  try {
    const { error: err } = await supabase.from('search_alerts').insert({
      user_id: user.value.id,
      filters: { ...toRaw(catalogFilters.value) },
      frequency: 'daily',
      active: true,
    } as never)

    if (err) throw err
    saveSearchSuccess.value = true
    setTimeout(() => {
      saveSearchSuccess.value = false
    }, 2000)
  } catch {
    // Silent fail
  }
}

// Action buttons state
const mainCategories = ['alquiler', 'venta', 'terceros'] as const
const activeActions = ref<Set<string>>(new Set())

function handleCategoryClick(cat: string) {
  const next = new Set(activeActions.value)
  if (next.has(cat)) {
    next.delete(cat)
  } else {
    next.add(cat)
  }
  activeActions.value = next
  const arr = [...next]
  setActions(arr as import('~/composables/useCatalogState').VehicleAction[])
  emit('categoryChange', arr)
}

const searchExpanded = ref(false)
const sortOpen = ref(false)
const desktopSearchInput = ref<HTMLInputElement | null>(null)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const sortOptions = [
  { value: 'recommended', label: 'catalog.sortRecommended' },
  { value: 'price_asc', label: 'catalog.sortPriceAsc' },
  { value: 'price_desc', label: 'catalog.sortPriceDesc' },
  { value: 'year_asc', label: 'catalog.sortYearAsc' },
  { value: 'year_desc', label: 'catalog.sortYearDesc' },
  { value: 'brand_az', label: 'catalog.sortBrandAZ' },
  { value: 'brand_za', label: 'catalog.sortBrandZA' },
]

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearch(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    setSearch(value)
    emit('search', value)
  }, 300)
}

function clearSearch() {
  setSearch('')
  emit('search', '')
  if (desktopSearchInput.value) desktopSearchInput.value.value = ''
}

function onToggleMenu() {
  emit('toggleMenu')
}

function toggleMobileSearch() {
  searchExpanded.value = !searchExpanded.value
  if (searchExpanded.value) {
    nextTick(() => mobileSearchInput.value?.focus())
  }
}

function onMobileSearchBlur() {
  if (!searchQuery.value) {
    searchExpanded.value = false
  }
}

function setView(mode: 'grid' | 'list') {
  setViewMode(mode)
  emit('viewChange', mode)
}

function selectSort(value: string) {
  setSort(value as import('~/composables/useCatalogState').SortOption)
  sortOpen.value = false
  emit('sort', value)
}

function onToggleFavorites() {
  toggleFavoritesFilter()
  emit('openFavorites')
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.sort-dropdown-wrapper')) {
    sortOpen.value = false
  }
  if (!target.closest('.mobile-search-wrapper')) {
    if (!searchQuery.value) searchExpanded.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
/* ============================================
   CATALOG CONTROLS — Base = mobile (360px)
   All controls in ONE row. NOT sticky.
   ============================================ */
.catalog-controls {
  background: var(--bg-primary);
  padding: 0.25rem 0;
  border-top: 1px solid var(--border-color);
  margin-bottom: 0.34rem;
  position: relative;
  z-index: 50;
}

.controls-wrapper {
  padding: 0 0.5rem;
}

/* Single row: left + notification + right */
.controls-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* ============================================
   LEFT GROUP: Menu + Search
   ============================================ */
.controls-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* ============================================
   MENU TOGGLE — circular with eye icon
   ============================================ */
.menu-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  min-height: 29px;
  min-width: 29px;
  padding: 0;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.menu-label {
  display: none;
  font-size: 13px;
  font-weight: 600;
}

.eye-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eye-svg {
  width: 16px;
  height: 16px;
}

.menu-toggle-btn.menu-visible {
  background: var(--color-primary);
  color: var(--color-white);
}

.menu-toggle-btn.menu-visible .eye-shape {
  fill: white;
  stroke: white;
}

.menu-toggle-btn.menu-visible .eye-pupil {
  fill: var(--color-primary);
  stroke: none;
}

.menu-toggle-btn:not(.menu-visible) {
  background: var(--bg-primary);
  color: var(--color-primary);
}

.menu-toggle-btn.menu-visible:hover {
  background: var(--bg-primary);
  color: var(--color-primary);
}

.menu-toggle-btn.menu-visible:hover .eye-shape {
  fill: var(--color-primary);
  stroke: var(--color-primary);
}

.menu-toggle-btn.menu-visible:hover .eye-pupil {
  fill: white;
}

.menu-toggle-btn:not(.menu-visible):hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ============================================
   SEARCH — Mobile: circular icon. Desktop: input box.
   ============================================ */
.desktop-search {
  display: none;
}

.mobile-search-wrapper {
  display: block;
  position: relative;
}

.search-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  min-height: 29px;
  min-width: 29px;
  padding: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-primary);
}

.search-btn-icon:hover,
.mobile-search-wrapper.active .search-btn-icon {
  background: var(--color-primary);
  color: var(--color-white);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 200px;
}

.search-dropdown input {
  border: none;
  outline: none;
  font-size: 14px;
  width: 100%;
  padding: 0.3rem;
  background: transparent;
  min-height: auto;
  min-width: auto;
}

/* Desktop search box */
.search-box {
  position: relative;
  min-width: 0;
  max-width: 225px;
  flex: 1;
}

.search-box .search-input {
  width: 100%;
  height: 29px;
  padding: 0 2.5rem 0 0.75rem;
  border: 2px solid var(--color-primary);
  border-radius: 20px;
  font-size: 12px;
  line-height: 1.3;
  background: var(--bg-primary);
  min-height: auto;
  min-width: auto;
  box-sizing: border-box;
  transition: all 0.3s ease;
  color: var(--color-primary);
}

.search-box .search-input::placeholder {
  color: var(--text-disabled);
}

.search-box .search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
  background: var(--bg-primary);
}

.search-icon-right {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-auxiliary);
  pointer-events: none;
}

.search-clear-btn {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-height: 20px;
  min-width: 20px;
  padding: 0;
  background: var(--border-color, #e5e7eb);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s;
}

.search-clear-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ============================================
   CATEGORY BUTTONS — inline in center
   ============================================ */
.categories-inline {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.category-btn {
  padding: 0.25rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 9999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.category-btn:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.category-btn.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: var(--color-white);
  border-color: var(--color-primary);
}

/* ============================================
   RIGHT GROUP: Favorites + View + Sort
   ============================================ */
.controls-right {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-left: auto;
}

/* Favorites: circular star button */
.favorites-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  min-height: 29px;
  min-width: 29px;
  padding: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-primary);
  flex-shrink: 0;
  position: relative;
}

.favorites-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  transition: all 0.3s ease;
}

.favorites-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.favorites-btn:hover svg {
  fill: var(--color-gold, var(--color-warning));
  stroke: var(--color-gold, var(--color-warning));
}

.favorites-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.favorites-btn.active svg {
  fill: var(--color-gold, var(--color-warning));
  stroke: var(--color-gold, var(--color-warning));
}

/* Save search: circular bell button */
.save-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-primary);
  flex-shrink: 0;
  position: relative;
}

.save-search-btn svg {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.save-search-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.save-search-btn.success {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}

.save-search-btn.success svg {
  stroke: var(--color-white);
}

.view-label-desktop,
.fav-label-desktop {
  display: none;
}

/* View switcher: 2-button pill */
.view-switcher {
  display: flex;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 20px;
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 25px;
  min-height: 25px;
  min-width: 28px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s ease;
}

.view-btn:first-child {
  border-right: 1px solid var(--color-primary);
}

.view-btn:hover {
  background: rgba(35, 66, 74, 0.1);
}

.view-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.view-btn svg {
  width: 14px;
  height: 14px;
}

/* Sort: circular button + custom dropdown */
.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sort-label {
  display: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.sort-dropdown-wrapper {
  position: relative;
}

.sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  min-height: 29px;
  min-width: 29px;
  padding: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-primary);
}

.sort-btn:hover,
.sort-dropdown-wrapper.active .sort-btn {
  background: var(--color-primary);
  color: var(--color-white);
}

.sort-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 0.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 150px;
}

.sort-option {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-primary);
  transition: background 0.2s;
  min-height: auto;
  min-width: auto;
}

.sort-option:hover {
  background: rgba(35, 66, 74, 0.1);
}

.sort-option.active {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ============================================
   RESPONSIVE: ≥480px
   ============================================ */
@media (min-width: 480px) {
  .controls-wrapper {
    padding: 0 0.5rem;
  }
}

/* ============================================
   RESPONSIVE: ≥768px (tablet)
   ============================================ */
@media (min-width: 768px) {
  .controls-wrapper {
    padding: 0 1.5rem;
  }

  .controls-row {
    gap: 0.5rem;
  }

  .categories-inline {
    gap: 0.5rem;
  }

  .category-btn {
    font-size: 12px;
    padding: 0.4rem 0.6rem;
    letter-spacing: 0.2px;
    height: 36px;
    display: inline-flex;
    align-items: center;
  }

  .search-box .search-input {
    height: 36px;
  }

  /* Menu: larger */
  .menu-toggle-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }

  .eye-svg {
    width: 20px;
    height: 20px;
  }

  /* Search: show desktop, hide mobile */
  .desktop-search {
    display: block;
  }

  .mobile-search-wrapper {
    display: none;
  }

  /* Favorites: larger */
  .favorites-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }

  .favorites-btn svg {
    width: 20px;
    height: 20px;
  }

  /* Save search: larger */
  .save-search-btn {
    width: 36px;
    height: 36px;
    min-width: 44px;
    min-height: 44px;
  }

  .save-search-btn svg {
    width: 20px;
    height: 20px;
  }

  .view-label-desktop,
  .fav-label-desktop {
    display: inline;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    white-space: nowrap;
  }

  /* View switcher: larger */
  .view-btn {
    width: 36px;
    height: 32px;
    min-width: 36px;
    min-height: 32px;
  }

  .view-btn svg {
    width: 16px;
    height: 16px;
  }

  /* Sort: larger, show label */
  .sort-label {
    display: inline;
  }

  .sort-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }

  .controls-right {
    gap: 0.6rem;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   Menu becomes pill with label + eye in circle
   ============================================ */
@media (min-width: 1024px) {
  .controls-wrapper {
    padding: 0 3rem;
  }

  .controls-row {
    gap: 0.75rem;
  }

  .menu-toggle-btn {
    width: auto;
    height: auto;
    min-width: auto;
    min-height: auto;
    padding: 0.4rem 0.5rem 0.4rem 0.75rem;
    border-radius: 20px;
    gap: 0.5rem;
  }

  .menu-label {
    display: inline;
  }

  .eye-wrapper {
    width: 24px;
    height: 24px;
    border: 2px solid white;
    border-radius: 50%;
  }

  .menu-toggle-btn:not(.menu-visible) .eye-wrapper {
    border-color: var(--color-primary);
  }

  .eye-svg {
    width: 14px;
    height: 14px;
  }
}
</style>
