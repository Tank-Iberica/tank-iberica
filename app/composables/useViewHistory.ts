/**
 * useViewHistory — Track vehicle views and generate recommendations.
 *
 * Stores view history in localStorage (capped at 100 entries).
 * Extracts user preferences from patterns.
 * Scores vehicles for personalized recommendations.
 */

import {
  classifyPrice,
  classifyYear,
  extractPreferences,
  scoreVehicle,
  deduplicateHistory,
} from '~/utils/viewHistory.helpers'
import type { ViewEntry, UserPreferences } from '~/utils/viewHistory.helpers'

const HISTORY_KEY = 'tracciona_view_history'
const MAX_HISTORY = 100

// Lazy-initialized state
let _history: Ref<ViewEntry[]> | null = null

function getHistory(): Ref<ViewEntry[]> {
  if (!_history) {
    _history = ref<ViewEntry[]>([])
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(HISTORY_KEY)
        if (raw) _history.value = JSON.parse(raw)
      } catch {
        // ignore
      }
    }
  }
  return _history
}

function persistHistory(entries: ViewEntry[]): void {
  if (import.meta.client) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
    } catch {
      // ignore
    }
  }
}

export function useViewHistory() {
  const history = getHistory()

  /**
   * Record a vehicle view.
   */
  function recordView(vehicle: {
    id: string
    brand: string
    category: string
    subcategory?: string
    price: number
    year: number
  }): void {
    const entry: ViewEntry = {
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      category: vehicle.category,
      subcategory: vehicle.subcategory,
      priceRange: classifyPrice(vehicle.price),
      yearRange: classifyYear(vehicle.year),
      viewedAt: new Date().toISOString(),
    }

    // Add and deduplicate
    const updated = deduplicateHistory([entry, ...history.value]).slice(0, MAX_HISTORY)
    history.value = updated
    persistHistory(updated)
  }

  /**
   * Get extracted user preferences from view history.
   */
  const preferences = computed<UserPreferences>(() => {
    return extractPreferences(history.value)
  })

  /**
   * Score a vehicle for recommendation relevance (0-100).
   */
  function getRecommendationScore(vehicle: {
    brand: string
    category: string
    price: number
    year: number
  }): number {
    return scoreVehicle(vehicle, preferences.value)
  }

  /**
   * Get recently viewed vehicle IDs (for "continue browsing" section).
   */
  const recentlyViewed = computed(() => {
    return history.value.slice(0, 10).map((e) => e.vehicleId)
  })

  /**
   * Clear view history.
   */
  function clearHistory(): void {
    history.value = []
    persistHistory([])
  }

  return {
    history: readonly(history),
    preferences,
    recentlyViewed,
    recordView,
    getRecommendationScore,
    clearHistory,
  }
}
