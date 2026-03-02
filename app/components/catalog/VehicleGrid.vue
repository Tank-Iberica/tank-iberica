<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="vehicle-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-image" />
        <div class="skeleton-body">
          <div class="skeleton-line wide" />
          <div class="skeleton-line medium" />
          <div class="skeleton-line short" />
        </div>
      </div>
    </div>

    <!-- Vehicle table (list view) -->
    <CatalogVehicleTable
      v-else-if="displayedVehicles.length && viewMode === 'list'"
      :vehicles="displayedVehicles"
    />

    <!-- Vehicle grid with interleaved promo cards -->
    <div v-else-if="displayedVehicles.length" class="vehicle-grid">
      <template v-for="item in gridItems" :key="item.key">
        <!-- Vehicle card -->
        <CatalogVehicleCard v-if="item.type === 'vehicle'" :vehicle="item.vehicle!" />
        <!-- Promo card (demand + hidden split, or end-of-catalog promos) -->
        <CatalogPromoCard
          v-else
          :slots="item.promoSlots!"
          @action="onPromoAction(item.promoId!, $event)"
          @action-secondary="onPromoSecondaryAction(item.promoId!, $event)"
        />
      </template>
    </div>

    <!-- Zero results: grid of promo cards -->
    <div v-else class="vehicle-grid vehicle-grid--empty">
      <!-- Demand card (full) -->
      <CatalogPromoCard
        :slots="[demandSlot]"
        @action="$emit('openDemand')"
        @action-secondary="$emit('createAlert')"
      />

      <!-- Expand area (if available) -->
      <CatalogPromoCard
        v-if="nextLevel && (nextLevelCount > 0 || nextLevelCountLoading)"
        :slots="[expandSlot]"
        @action="$emit('expandArea')"
      />

      <!-- Similar searches as individual promo cards -->
      <CatalogPromoCard
        v-for="(s, i) in suggestions || []"
        :key="'sug-' + i"
        :slots="[buildSuggestionSlot(s)]"
        @action="$emit('applySuggestion', s.filters)"
      />

      <!-- Loading skeletons for suggestions -->
      <template v-if="suggestionsLoading && !(suggestions || []).length">
        <div v-for="n in 2" :key="'skel-' + n" class="skeleton-card">
          <div class="skeleton-image" />
          <div class="skeleton-body">
            <div class="skeleton-line wide" />
            <div class="skeleton-line short" />
          </div>
        </div>
      </template>
    </div>

    <!-- End-of-catalog cascade (after load-more or when no more pages) -->
    <div
      v-if="displayedVehicles.length && !hasMore && !loading && cascadeLevels.length"
      class="vehicle-grid vehicle-grid--cascade"
    >
      <template v-for="level in cascadeLevels" :key="'cl-' + level.depth">
        <!-- Cascade level header (spans full grid) -->
        <p v-if="level.suggestions.length || level.loading" class="cascade-header">
          {{ $t('catalog.moreSuggestions') }}
        </p>

        <!-- Split cards: pair suggestions into splits -->
        <CatalogPromoCard
          v-for="(pair, pi) in pairSuggestions(level.suggestions)"
          :key="'cas-' + level.depth + '-' + pi"
          :slots="pair.slots"
          @action="$emit('applySuggestion', pair.filters[$event] || pair.filters[0]!)"
        />

        <!-- Loading skeleton for cascade -->
        <template v-if="level.loading">
          <div v-for="n in 2" :key="'cskel-' + n" class="skeleton-card">
            <div class="skeleton-image" />
            <div class="skeleton-body">
              <div class="skeleton-line wide" />
              <div class="skeleton-line short" />
            </div>
          </div>
        </template>
      </template>

      <!-- Load more cascade button -->
      <div v-if="hasMoreCascadeLevels" class="cascade-more-wrap">
        <button class="load-more-btn" @click="$emit('loadMoreCascade')">
          {{ $t('catalog.moreSuggestions') }}
        </button>
      </div>
    </div>

    <!-- Load more vehicles -->
    <div v-if="hasMore && vehicles.length" class="load-more">
      <button class="load-more-btn" :disabled="loadingMore" @click="$emit('loadMore')">
        {{ loadingMore ? $t('common.loading') : $t('catalog.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle, VehicleFilters } from '~/composables/useVehicles'
import { localizedName } from '~/composables/useLocalized'
import type { LocationLevel } from '~/utils/geoData'
import type { SearchSuggestion, CascadeLevel } from '~/composables/catalog/useSimilarSearches'
import type { PromoSlot } from '~/components/catalog/CatalogPromoCard.vue'

const props = defineProps<{
  vehicles: readonly Vehicle[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  viewMode?: 'grid' | 'list'
  // Geo-fallback + similar searches state
  isFewResults?: boolean
  locationLevel?: LocationLevel | null
  nextLevel?: LocationLevel | null
  nextLevelCount?: number
  nextLevelCountLoading?: boolean
  suggestions?: SearchSuggestion[]
  suggestionsLoading?: boolean
  // Hidden vehicles
  hiddenCount?: number
  hoursUntilNext?: number | null
  // Cascade (end-of-catalog)
  cascadeLevels?: CascadeLevel[]
  hasMoreCascadeLevels?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
  clearFilters: []
  openDemand: []
  createAlert: []
  expandArea: []
  applySuggestion: [filters: VehicleFilters]
  unlockHidden: []
  loadMoreCascade: []
}>()

const { t } = useI18n()
const { favoritesOnly, isFavorite } = useFavorites()
const { searchQuery } = useCatalogState()
const { locale } = useI18n()

const displayedVehicles = computed(() => {
  let result = props.vehicles as Vehicle[]

  // Filter by favorites
  if (favoritesOnly.value) {
    result = result.filter((v) => isFavorite(v.id))
  }

  // Fuzzy search client-side
  const q = searchQuery.value?.trim()
  if (q) {
    result = result.filter((v) => {
      const description = locale.value === 'en' ? v.description_en : v.description_es
      const cat = v.subcategories?.subcategory_categories?.[0]?.categories
      const searchable = [
        localizedName(cat, locale.value),
        localizedName(v.subcategories, locale.value),
        v.brand,
        v.model,
        v.location,
        description,
      ]
        .filter(Boolean)
        .join(' ')
      return fuzzyMatch(searchable, q)
    })
  }

  return result
})

// ── Grid item types for interleaved rendering ──

interface GridItemVehicle {
  type: 'vehicle'
  key: string
  vehicle: Vehicle
  promoSlots?: undefined
  promoId?: undefined
}

interface GridItemPromo {
  type: 'promo'
  key: string
  promoSlots: [PromoSlot] | [PromoSlot, PromoSlot]
  promoId: string
  vehicle?: undefined
}

type GridItem = GridItemVehicle | GridItemPromo

// Build the demand promo slot
const demandSlot = computed<PromoSlot>(() => ({
  icon: '<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />',
  titleKey: 'catalog.requestSearchTitle',
  descKey: 'catalog.requestSearchDesc',
  ctaKey: 'catalog.requestSearch',
  ctaSecondaryKey: 'catalog.createAlert',
}))

// Build the hidden vehicles promo slot
const hiddenSlot = computed<PromoSlot | null>(() => {
  if (!props.hiddenCount || props.hiddenCount <= 0) return null
  return {
    icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    titleKey: 'catalog.hiddenVehiclesTitle',
    descKey: 'catalog.hiddenVehiclesDesc',
    descParams: { count: props.hiddenCount, hours: props.hoursUntilNext ?? '?' },
    ctaKey: 'catalog.hiddenVehiclesCta',
    variant: 'gold',
    badge: `${props.hiddenCount} ${t('catalog.vehicles')}`,
  }
})

// Build the expand area promo slot
const expandSlot = computed<PromoSlot>(() => ({
  icon: '<circle cx="12" cy="12" r="10" /><polyline points="8 12 12 16 16 12" /><line x1="12" y1="8" x2="12" y2="16" />',
  titleKey: props.nextLevelCountLoading ? 'catalog.expandToAreaNoCount' : 'catalog.expandToArea',
  titleParams: {
    count: props.nextLevelCount ?? 0,
    area: props.nextLevel ? t(`catalog.levelLabels.${props.nextLevel}`) : '',
  },
  ctaKey: 'catalog.expandToArea',
  ctaSecondaryKey: undefined,
  variant: 'primary',
  badge: props.nextLevelCount ? `${props.nextLevelCount} ${t('catalog.vehicles')}` : undefined,
}))

// Build a suggestion promo slot
function buildSuggestionSlot(s: SearchSuggestion): PromoSlot {
  return {
    icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />',
    titleKey: s.labelKey,
    titleParams: s.labelParams,
    ctaKey: 'catalog.viewDetails',
    variant: 'accent',
    badge: `${s.count} ${t('catalog.vehicles')}`,
  }
}

// ── Build interleaved grid items ──
const gridItems = computed<GridItem[]>(() => {
  const items: GridItem[] = []
  const vList = displayedVehicles.value

  for (let i = 0; i < vList.length; i++) {
    // Insert split promo card at position 2 (after 2nd vehicle)
    if (i === 2) {
      if (hiddenSlot.value) {
        // Hidden vehicles on top, demand on bottom
        items.push({
          type: 'promo',
          key: 'split-hidden-demand',
          promoSlots: [hiddenSlot.value, demandSlot.value],
          promoId: 'split-hidden-demand',
        })
      } else {
        items.push({
          type: 'promo',
          key: 'promo-demand',
          promoSlots: [demandSlot.value],
          promoId: 'demand',
        })
      }
    }

    items.push({
      type: 'vehicle',
      key: vList[i]!.id,
      vehicle: vList[i]!,
    })
  }

  // If fewer than 3 vehicles, the position-2 promo wasn't inserted — add at end
  if (vList.length > 0 && vList.length < 3) {
    if (hiddenSlot.value) {
      items.push({
        type: 'promo',
        key: 'split-hidden-demand-end',
        promoSlots: [hiddenSlot.value, demandSlot.value],
        promoId: 'split-hidden-demand-end',
      })
    } else {
      items.push({
        type: 'promo',
        key: 'promo-demand-end',
        promoSlots: [demandSlot.value],
        promoId: 'demand-end',
      })
    }
  }

  // End-of-catalog: expand area card (if applicable and no more pages)
  if (!props.hasMore && props.nextLevel && (props.nextLevelCount ?? 0) > 0) {
    items.push({
      type: 'promo',
      key: 'promo-expand',
      promoSlots: [expandSlot.value],
      promoId: 'expand',
    })
  }

  return items
})

// ── Pair cascade suggestions into split cards ──
function pairSuggestions(suggestions: SearchSuggestion[]): Array<{
  slots: [PromoSlot] | [PromoSlot, PromoSlot]
  filters: VehicleFilters[]
}> {
  const pairs: Array<{ slots: [PromoSlot] | [PromoSlot, PromoSlot]; filters: VehicleFilters[] }> =
    []
  for (let i = 0; i < suggestions.length; i += 2) {
    const s1 = suggestions[i]!
    const s2 = suggestions[i + 1]
    if (s2) {
      pairs.push({
        slots: [buildSuggestionSlot(s1), buildSuggestionSlot(s2)],
        filters: [s1.filters, s2.filters],
      })
    } else {
      pairs.push({
        slots: [buildSuggestionSlot(s1)],
        filters: [s1.filters],
      })
    }
  }
  return pairs
}

// ── Handle promo card actions ──
function onPromoAction(promoId: string, slotIndex: number) {
  if (promoId === 'split-hidden-demand' || promoId === 'split-hidden-demand-end') {
    // slot 0 = hidden vehicles, slot 1 = demand search
    if (slotIndex === 0) emit('unlockHidden')
    else if (slotIndex === 1) emit('openDemand')
  } else if (promoId === 'demand' || promoId === 'demand-end') {
    emit('openDemand')
  } else if (promoId === 'expand') {
    emit('expandArea')
  }
}

function onPromoSecondaryAction(promoId: string, _slotIndex: number) {
  if (promoId === 'demand' || promoId === 'demand-end') {
    emit('createAlert')
  }
}
</script>

<style scoped>
.vehicle-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 1rem 0.5rem;
}

.vehicle-grid--empty {
  max-width: 640px;
  margin: var(--spacing-8) auto 0;
}

/* Skeleton */
.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
}

.skeleton-image {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 14px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 50%;
}
.skeleton-line.short {
  width: 30%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Cascade header — spans full grid */
.cascade-header {
  grid-column: 1 / -1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-2) 0 0;
}

.cascade-more-wrap {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: var(--spacing-4) 0;
}

/* Load more */
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--spacing-6) var(--spacing-4);
}

.load-more-btn {
  padding: var(--spacing-3) var(--spacing-8);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  min-height: 48px;
  transition: background var(--transition-fast);
}

.load-more-btn:hover {
  background: var(--color-primary-light);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive grid */
@media (min-width: 480px) {
  .vehicle-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .vehicle-grid--empty {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .vehicle-grid {
    grid-template-columns: repeat(3, 1fr);
    padding: 1.5rem;
  }

  .vehicle-grid--empty {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .vehicle-grid {
    padding: 1.5rem 3rem;
  }
}

@media (min-width: 1280px) {
  .vehicle-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .vehicle-grid--empty {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
