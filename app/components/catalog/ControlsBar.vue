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
            :aria-expanded="props.menuVisible"
            aria-controls="catalog-filter-panel"
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
          <div :class="['mobile-search-wrapper', { active: searchExpanded }]" role="search">
            <button
              class="search-btn-icon"
              :aria-label="$t('catalog.searchPlaceholder')"
              :aria-expanded="searchExpanded"
              aria-controls="mobile-search-dropdown"
              @mousedown.prevent
              @click="toggleMobileSearch"
            >
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
            <div v-show="searchExpanded" id="mobile-search-dropdown" class="search-dropdown">
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
          <div class="search-box desktop-search" role="search">
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
              :aria-label="$t('common.clear')"
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

        <!-- Center: save filters + create alert -->
        <div class="catalog-actions-inline">
          <!-- Save / Load search -->
          <div class="save-preset-wrapper">
            <button
              :class="[
                'action-btn action-btn--save',
                { active: saveMenuOpen, success: saveSuccess },
              ]"
              :title="$t('catalog.savedFilters.saveSearch')"
              @click="onClickSaveBtn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span class="action-label">{{
                saveSuccess
                  ? $t('catalog.savedFilters.searchSavedOk')
                  : $t('catalog.savedFilters.saveSearch')
              }}</span>
            </button>

            <!-- MOBILE: Teleported save panel -->
            <Teleport to="body">
              <div v-if="saveMenuOpen" class="save-overlay" @click="closeSaveMenu">
                <div class="save-panel save-panel--mobile" @click.stop>
                  <div class="save-panel-header">
                    <span>{{ $t('catalog.savedFilters.saveSearch') }}</span>
                    <button type="button" class="save-panel-close" @click="closeSaveMenu">
                      &#10005;
                    </button>
                  </div>
                  <CatalogSaveSearchPanelContent
                    :user="user"
                    :save-tab="saveTab"
                    :can-save="canSave"
                    :new-preset-name="newPresetName"
                    :load-search-query="loadSearchQuery"
                    :filtered-searches="filteredSearches"
                    :editing-id="editingId"
                    :edit-name="editName"
                    @update:save-tab="saveTab = $event"
                    @update:new-preset-name="newPresetName = $event"
                    @update:load-search-query="loadSearchQuery = $event"
                    @update:edit-name="editName = $event"
                    @save-preset="onSavePreset"
                    @close="closeSaveMenu"
                    @unlock="onUnlockSearches"
                    @apply="onApplySearch"
                    @toggle-favorite="toggleFavorite"
                    @start-edit="startEdit"
                    @save-edit="onSaveEdit"
                    @update-filters="onUpdateFilters"
                    @delete-search="onDeleteSearch"
                    @cancel-edit="editingId = ''"
                  />
                </div>
              </div>
            </Teleport>

            <!-- DESKTOP: Absolute dropdown -->
            <div v-show="saveMenuOpen" class="save-panel save-panel--desktop">
              <CatalogSaveSearchPanelContent
                :user="user"
                :save-tab="saveTab"
                :can-save="canSave"
                :new-preset-name="newPresetName"
                :load-search-query="loadSearchQuery"
                :filtered-searches="filteredSearches"
                :editing-id="editingId"
                :edit-name="editName"
                @update:save-tab="saveTab = $event"
                @update:new-preset-name="newPresetName = $event"
                @update:load-search-query="loadSearchQuery = $event"
                @update:edit-name="editName = $event"
                @save-preset="onSavePreset"
                @close="closeSaveMenu"
                @unlock="onUnlockSearches"
                @apply="onApplySearch"
                @toggle-favorite="toggleFavorite"
                @start-edit="startEdit"
                @save-edit="onSaveEdit"
                @update-filters="onUpdateFilters"
                @delete-search="onDeleteSearch"
                @cancel-edit="editingId = ''"
              />
            </div>
          </div>

          <!-- Create alert -->
          <div class="alert-wrapper">
            <button
              :class="['action-btn action-btn--alert', { success: alertSuccess }]"
              :title="$t('catalog.savedFilters.createAlert')"
              @click="onClickCreateAlert"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span class="action-label">{{
                alertSuccess
                  ? $t('catalog.savedFilters.alertCreated')
                  : $t('catalog.savedFilters.createAlert')
              }}</span>
            </button>
            <!-- Frequency choice dropdown -->
            <div v-show="showAlertDropdown" class="alert-dropdown">
              <button class="alert-freq-btn" @click="onCreateAlertWithFrequency('daily')">
                {{ $t('catalog.savedFilters.daily') }}
              </button>
              <button
                class="alert-freq-btn alert-freq-btn--instant"
                @click="onCreateAlertWithFrequency('instant')"
              >
                {{ $t('catalog.savedFilters.instant') }}
                <span class="subscriber-badge">{{
                  $t('catalog.savedFilters.instantSubscriberOnly')
                }}</span>
              </button>
              <NuxtLink to="/perfil/suscripcion" class="subscribe-link">
                {{ $t('catalog.savedFilters.subscribeLink') }}
              </NuxtLink>
            </div>
            <!-- Alert limit prompt -->
            <div v-show="showAlertLimitPrompt" class="alert-dropdown limit-prompt">
              <p class="limit-text">{{ $t('catalog.savedFilters.alertLimitReached') }}</p>
              <button class="unlock-btn" @click="onUnlockAlerts">
                {{ $t('catalog.savedFilters.unlockAlerts') }}
              </button>
            </div>
          </div>
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

          <span class="view-label-desktop">{{ $t('catalog.viewShow') }}:</span>
          <div class="view-switcher">
            <button
              :class="['view-btn', { active: viewMode === 'compact' }]"
              :title="$t('catalog.viewCompact')"
              @click="setView('compact')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="5" width="7" height="14" rx="1" />
                <rect x="11" y="6" width="11" height="2.5" rx="1" />
                <rect x="11" y="11" width="8" height="2.5" rx="1" />
                <rect x="11" y="15.5" width="6" height="2.5" rx="1" />
              </svg>
            </button>
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
import { useSavedSearches, type SavedSearch } from '~/composables/catalog/useSavedSearches'

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
  viewChange: [mode: 'grid' | 'list' | 'compact']
}>()

const {
  searchQuery,
  setSearch,
  sortBy,
  viewMode,
  setSort,
  setViewMode,
  filters: catalogFilters,
  locationLevel,
} = useCatalogState()
const { favoritesOnly, toggleFilter: toggleFavoritesFilter } = useFavorites()

// Auth
const user = useSupabaseUser()
const openSubscribeModal = inject<() => void>('openSubscribeModal')

// Save/Load search (DB-backed for auth users)
const {
  searches,
  save: saveSearch,
  update: updateSearch,
  bumpUsage,
  toggleFavorite,
  remove: removeSearch,
  canSave,
} = useSavedSearches()
const { unlock } = useFeatureUnlocks()
const { updateFilters: applyCatalogFilters, setSearch: applySearchQuery } = useCatalogState()

const saveMenuOpen = ref(false)
const saveTab = ref<'save' | 'load'>('save')
const newPresetName = ref('')
const presetNameInput = ref<HTMLInputElement | null>(null)
const saveSuccess = ref(false)

// Load tab search
const loadSearchQuery = ref('')
const filteredSearches = computed(() => {
  const q = loadSearchQuery.value.toLowerCase().trim()
  const list = searches.value
  if (!q) return list
  return list.filter((s) => s.name.toLowerCase().includes(q))
})

// Edit mode
const editingId = ref('')
const editName = ref('')

function closeSaveMenu() {
  saveMenuOpen.value = false
  editingId.value = ''
  loadSearchQuery.value = ''
}

function onClickSaveBtn() {
  saveMenuOpen.value = !saveMenuOpen.value
  if (saveMenuOpen.value) {
    // Auto-generate name for save tab
    newPresetName.value = generateSearchName()
    if (saveTab.value === 'save') {
      nextTick(() => presetNameInput.value?.focus())
    }
  }
}

function generateSearchName(): string {
  const parts: string[] = []
  const f = catalogFilters.value
  if (f.brand) parts.push(String(f.brand))
  if (f.category_id) parts.push(String(f.category_id).slice(0, 8))
  if (searchQuery.value) parts.push(searchQuery.value.slice(0, 30))
  if (locationLevel.value) parts.push(locationLevel.value)
  if (!parts.length) parts.push(new Date().toLocaleDateString())
  return parts.join(' · ')
}

async function onSavePreset() {
  const name = newPresetName.value.trim()
  if (!name) return
  const result = await saveSearch(
    name,
    catalogFilters.value,
    searchQuery.value,
    locationLevel.value,
  )
  if (result.success) {
    newPresetName.value = ''
    saveSuccess.value = true
    saveMenuOpen.value = false
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } else if (result.limitReached) {
    // Stay open, switch won't help — limit prompt shows in template
  }
}

async function onUnlockSearches() {
  const result = await unlock('saved_searches')
  if (result.success) {
    // Reload to reflect unlocked state
    newPresetName.value = generateSearchName()
  }
}

function onApplySearch(s: SavedSearch) {
  applyCatalogFilters(s.filters as Record<string, never>)
  if (s.search_query) applySearchQuery(s.search_query)
  bumpUsage(s.id)
  closeSaveMenu()
}

function startEdit(s: SavedSearch) {
  editingId.value = s.id
  editName.value = s.name
}

async function onSaveEdit(id: string) {
  if (!editName.value.trim()) return
  await updateSearch(id, { name: editName.value.trim() })
  editingId.value = ''
}

async function onUpdateFilters(id: string) {
  await updateSearch(id, {
    filters: catalogFilters.value as Record<string, unknown>,
    search_query: searchQuery.value || null,
    location_level: locationLevel.value || null,
  })
  editingId.value = ''
}

async function onDeleteSearch(id: string) {
  await removeSearch(id)
  editingId.value = ''
}

watch(saveTab, (val) => {
  if (val === 'save') nextTick(() => presetNameInput.value?.focus())
})

// Create alert
const supabase = useSupabaseClient()
const { activeFilters } = useFilters()
const { canCreate: canCreateAlert } = usePerfilAlertas()
const alertSuccess = ref(false)
const showAlertDropdown = ref(false)
const showAlertLimitPrompt = ref(false)

function onClickCreateAlert() {
  if (!user.value) {
    openSubscribeModal?.()
    return
  }
  if (canCreateAlert.value) {
    showAlertDropdown.value = !showAlertDropdown.value
    showAlertLimitPrompt.value = false
  } else {
    showAlertLimitPrompt.value = !showAlertLimitPrompt.value
    showAlertDropdown.value = false
  }
}

async function onCreateAlertWithFrequency(frequency: 'daily' | 'instant') {
  if (!user.value) return
  showAlertDropdown.value = false

  try {
    const allFilters = { ...toRaw(catalogFilters.value), ...toRaw(activeFilters.value) }
    const { error: err } = await supabase.from('search_alerts').insert({
      user_id: user.value.id,
      filters: allFilters,
      frequency,
      active: true,
    } as never)
    if (err) throw err
    alertSuccess.value = true
    setTimeout(() => {
      alertSuccess.value = false
    }, 3000)
  } catch {
    // Silent fail
  }
}

async function onUnlockAlerts() {
  const result = await unlock('alerts')
  if (result.success) {
    showAlertLimitPrompt.value = false
    showAlertDropdown.value = true
  }
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

function setView(mode: 'grid' | 'list' | 'compact') {
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
  if (
    !target.closest('.save-preset-wrapper') &&
    !target.closest('.save-overlay') &&
    !target.closest('.save-panel--mobile')
  ) {
    saveMenuOpen.value = false
    editingId.value = ''
  }
  if (!target.closest('.alert-wrapper')) {
    showAlertDropdown.value = false
    showAlertLimitPrompt.value = false
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
  z-index: 30;
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
  width: 1.8125rem;
  height: 1.8125rem;
  min-height: 1.8125rem;
  min-width: 1.8125rem;
  padding: 0;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.menu-label {
  display: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.eye-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eye-svg {
  width: 1rem;
  height: 1rem;
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
  width: 1.8125rem;
  height: 1.8125rem;
  min-height: 1.8125rem;
  min-width: 1.8125rem;
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
  top: calc(100% + 0.5rem);
  left: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 12.5rem;
}

.search-dropdown input {
  border: none;
  outline: none;
  font-size: var(--font-size-base);
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
  max-width: 14.0625rem;
  flex: 1;
}

.search-box .search-input {
  width: 100%;
  height: 1.8125rem;
  padding: 0 2.5rem 0 0.75rem;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-xl);
  font-size: var(--font-size-xs);
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
  box-shadow: var(--shadow-ring);
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
  width: 1.25rem;
  height: 1.25rem;
  min-height: 1.25rem;
  min-width: 1.25rem;
  padding: 0;
  background: var(--border-color, var(--color-gray-200));
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary, var(--color-gray-500));
  transition: all 0.2s;
}

.search-clear-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ============================================
   CATALOG ACTIONS — save filters + create alert
   ============================================ */
.catalog-actions-inline {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 1.8125rem;
  min-width: 1.8125rem;
  line-height: 1;
}

.action-btn svg {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.action-label {
  display: none;
}

.action-btn:hover,
.action-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.action-btn--alert.success {
  background: var(--color-success, #22c55e);
  border-color: var(--color-success, #22c55e);
  color: var(--color-white);
}

/* Save/Load panel */
.save-preset-wrapper {
  position: relative;
}

.save-panel--desktop {
  display: none;
}

.action-btn--save.success {
  background: var(--color-success, #22c55e);
  border-color: var(--color-success, #22c55e);
  color: var(--color-white);
}

/* Limit / unlock prompt */
.limit-prompt {
  flex-direction: column;
  gap: 0.4rem;
  align-items: stretch;
}

.limit-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}

.unlock-btn {
  padding: 0.4rem 0.75rem;
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  min-height: 2.5rem;
}

.unlock-btn:hover {
  background: var(--color-primary-dark);
}

/* Alert dropdown */
.alert-wrapper {
  position: relative;
}

.alert-dropdown {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 12rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-freq-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-radius: var(--border-radius-sm);
  min-height: 2.5rem;
  width: 100%;
  text-align: left;
}

.alert-freq-btn:hover {
  background: var(--bg-secondary);
}

.subscriber-badge {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-style: italic;
}

.subscribe-link {
  display: block;
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  text-decoration: underline;
  padding: 0.25rem;
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
  width: 1.8125rem;
  height: 1.8125rem;
  min-height: 1.8125rem;
  min-width: 1.8125rem;
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
  width: 1rem;
  height: 1rem;
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

.view-label-desktop,
.fav-label-desktop {
  display: none;
}

/* View switcher: 2-button pill */
.view-switcher {
  display: flex;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.5625rem;
  min-height: 1.5625rem;
  min-width: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s ease;
}

.view-btn:not(:last-child) {
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
  width: 0.875rem;
  height: 0.875rem;
}

/* Sort: circular button + custom dropdown */
.sort-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sort-label {
  display: none;
  font-size: var(--font-size-sm);
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
  width: 1.8125rem;
  height: 1.8125rem;
  min-height: 1.8125rem;
  min-width: 1.8125rem;
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
  top: calc(100% + 0.5rem);
  right: 0;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 9.375rem;
}

.sort-option {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
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
   RESPONSIVE: ≥30em
   ============================================ */
@media (min-width: 30em) {
  .controls-wrapper {
    padding: 0 0.5rem;
  }
}

/* ============================================
   RESPONSIVE: ≥48em (tablet)
   ============================================ */
@media (min-width: 48em) {
  .controls-wrapper {
    padding: 0 1.5rem;
  }

  .controls-row {
    gap: 0.5rem;
  }

  .catalog-actions-inline {
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.4rem 0.75rem;
    height: 2.25rem;
  }

  .action-label {
    display: inline;
  }

  .search-box .search-input {
    height: 2.25rem;
  }

  /* Menu: larger */
  .menu-toggle-btn {
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
    min-height: 2.25rem;
  }

  .eye-svg {
    width: 1.25rem;
    height: 1.25rem;
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
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
    min-height: 2.25rem;
  }

  .favorites-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .view-label-desktop,
  .fav-label-desktop {
    display: inline;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-primary);
    white-space: nowrap;
  }

  /* View switcher: larger */
  .view-btn {
    width: 2.25rem;
    height: 2rem;
    min-width: 2.25rem;
    min-height: 2rem;
  }

  .view-btn svg {
    width: 1rem;
    height: 1rem;
  }

  /* Sort: larger, show label */
  .sort-label {
    display: inline;
  }

  .sort-btn {
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
    min-height: 2.25rem;
  }

  .controls-right {
    gap: 0.6rem;
  }

  /* Save panel: desktop absolute dropdown */
  .save-panel--desktop {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-primary);
    border: 2px solid var(--color-primary);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    z-index: 200;
    min-width: 16rem;
    max-width: 20rem;
  }

  /* Alert dropdown: desktop absolute instead of fixed */
  .alert-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
  }
}

/* ============================================
   RESPONSIVE: ≥64em (desktop)
   Menu becomes pill with label + eye in circle
   ============================================ */
@media (min-width: 64em) {
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
    border-radius: var(--border-radius-xl);
    gap: 0.5rem;
  }

  .menu-label {
    display: inline;
  }

  .eye-wrapper {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid white;
    border-radius: 50%;
  }

  .menu-toggle-btn:not(.menu-visible) .eye-wrapper {
    border-color: var(--color-primary);
  }

  .eye-svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}
</style>

<!-- Non-scoped: teleported to body -->
<style>
.save-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6rem;
}

.save-panel--mobile {
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

.save-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--color-primary);
  font-size: var(--font-size-base);
}

.save-panel-close {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 48em) {
  .save-overlay {
    display: none !important;
  }
}
</style>
