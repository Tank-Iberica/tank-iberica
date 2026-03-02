<template>
  <div class="empty-state-wrap">
    <!-- ── ZERO RESULTS MODE ─────────────────────────────────── -->
    <template v-if="total === 0">
      <!-- Icon + headline -->
      <div class="empty-icon-row">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p class="empty-title">
          {{ $t('catalog.noResultsInArea', { area: currentLevelLabel }) }}
        </p>
        <button class="btn-ghost-sm" @click="$emit('clearFilters')">
          {{ $t('catalog.clearFilters') }}
        </button>
      </div>

      <!-- Demand card (hero CTA) -->
      <div class="demand-card">
        <div class="demand-card__icon">🔔</div>
        <div class="demand-card__body">
          <p class="demand-card__title">{{ $t('catalog.requestSearchTitle') }}</p>
          <p class="demand-card__desc">{{ $t('catalog.requestSearchDesc') }}</p>
        </div>
        <div class="demand-card__actions">
          <button class="btn-primary" @click="$emit('openDemand')">
            {{ $t('catalog.requestSearch') }}
          </button>
          <button class="btn-outline" @click="$emit('createAlert')">
            {{ $t('catalog.createAlert') }}
          </button>
        </div>
      </div>
    </template>

    <!-- ── FEW RESULTS MODE header ───────────────────────────── -->
    <p v-else class="few-results-label">
      {{ $t('catalog.fewResultsInArea', { count: total, area: currentLevelLabel }) }}
    </p>

    <!-- ── SIMILAR SEARCHES (both modes) ─────────────────────── -->
    <template v-if="suggestions.length || suggestionsLoading">
      <h3 class="section-title">{{ $t('catalog.similarSearches') }}</h3>
      <div class="suggestions-grid">
        <!-- Loading skeletons -->
        <template v-if="suggestionsLoading && !suggestions.length">
          <div v-for="n in 2" :key="n" class="suggestion-card suggestion-card--skeleton">
            <div class="skel-line wide" />
            <div class="skel-line narrow" />
          </div>
        </template>
        <!-- Actual suggestions -->
        <button
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggestion-card"
          @click="$emit('applySuggestion', s.filters)"
        >
          <span class="suggestion-card__label">
            {{ $t(s.labelKey, s.labelParams) }}
          </span>
          <span class="suggestion-card__count">
            {{ $tc('catalog.resultCount', s.count, { count: s.count }) }}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>
    </template>

    <!-- ── EXPAND AREA card (both modes) ─────────────────────── -->
    <button
      v-if="nextLevel && (nextLevelCount > 0 || nextLevelCountLoading)"
      class="expand-card"
      :disabled="nextLevelCountLoading"
      @click="$emit('expandArea')"
    >
      <span v-if="nextLevelCountLoading" class="expand-card__text">
        {{ $t('catalog.expandToAreaNoCount', { area: nextLevelLabel }) }}
      </span>
      <span v-else class="expand-card__text">
        {{ $t('catalog.expandToArea', { count: nextLevelCount, area: nextLevelLabel }) }}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LocationLevel } from '~/utils/geoData'
import type { VehicleFilters } from '~/composables/useVehicles'
import type { SearchSuggestion } from '~/composables/catalog/useSimilarSearches'
import { useGeoFallback } from '~/composables/catalog/useGeoFallback'

const props = defineProps<{
  total: number
  locationLevel: LocationLevel | null
  nextLevel: LocationLevel | null
  nextLevelCount: number
  nextLevelCountLoading?: boolean
  suggestions: SearchSuggestion[]
  suggestionsLoading: boolean
}>()

defineEmits<{
  clearFilters: []
  openDemand: []
  createAlert: []
  expandArea: []
  applySuggestion: [filters: VehicleFilters]
}>()

const { getLevelLabel } = useGeoFallback()
const { location: userLocation } = useUserLocation()

const currentLevelLabel = computed(() =>
  props.locationLevel
    ? getLevelLabel(
        props.locationLevel,
        userLocation.value?.province,
        userLocation.value?.region,
        userLocation.value?.country,
      )
    : '',
)

const nextLevelLabel = computed(() =>
  props.nextLevel
    ? getLevelLabel(
        props.nextLevel,
        userLocation.value?.province,
        userLocation.value?.region,
        userLocation.value?.country,
      )
    : '',
)
</script>

<style scoped>
.empty-state-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-3);
  max-width: 640px;
  margin: 0 auto;
}

/* ── Zero-result icon row ── */
.empty-icon-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8) var(--spacing-4) var(--spacing-4);
  color: var(--text-auxiliary);
  text-align: center;
}

.empty-title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

/* ── Demand card ── */
.demand-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.demand-card__icon {
  font-size: 1.75rem;
  line-height: 1;
}

.demand-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.demand-card__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

.demand-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-1);
}

/* ── Few results label ── */
.few-results-label {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  padding-top: var(--spacing-2);
}

/* ── Section title ── */
.section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--spacing-2);
}

/* ── Suggestions grid ── */
.suggestions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.suggestion-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  text-align: left;
  min-height: 52px;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
  cursor: pointer;
}

@media (hover: hover) {
  .suggestion-card:hover {
    border-color: var(--color-primary);
    background: var(--bg-secondary);
  }
}

.suggestion-card__label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  flex: 1;
}

.suggestion-card__count {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Skeleton */
.suggestion-card--skeleton {
  flex-direction: column;
  align-items: flex-start;
  cursor: default;
  pointer-events: none;
}

.skel-line {
  height: 13px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}
.skel-line.wide {
  width: 70%;
}
.skel-line.narrow {
  width: 35%;
  margin-top: var(--spacing-1);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ── Expand area card ── */
.expand-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-height: 52px;
  transition: opacity var(--transition-fast);
  cursor: pointer;
}

@media (hover: hover) {
  .expand-card:hover {
    opacity: 0.88;
  }
}

.expand-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.expand-card__text {
  flex: 1;
  text-align: left;
}

/* ── Button helpers ── */
.btn-primary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  transition: opacity var(--transition-fast);
}

@media (hover: hover) {
  .btn-primary:hover {
    opacity: 0.88;
  }
}

.btn-outline {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  transition: all var(--transition-fast);
  background: transparent;
}

@media (hover: hover) {
  .btn-outline:hover {
    background: var(--color-primary);
    color: var(--color-white);
  }
}

.btn-ghost-sm {
  padding: var(--spacing-1) var(--spacing-3);
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  min-height: 36px;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

@media (hover: hover) {
  .btn-ghost-sm:hover {
    color: var(--text-primary);
    border-color: var(--border-color);
  }
}

/* ── Responsive ── */
@media (min-width: 480px) {
  .demand-card__actions {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .demand-card {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-4);
  }

  .demand-card__icon {
    flex-shrink: 0;
    padding-top: var(--spacing-1);
  }

  .demand-card__body {
    flex: 1;
  }
}
</style>
