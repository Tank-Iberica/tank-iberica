/**
 * Search history composable — persists the last N search queries to localStorage.
 *
 * Usage:
 *   const { history, addSearch, clearHistory } = useSearchHistory()
 *   addSearch('Volvo FH')     // add to front, dedup, trim to MAX
 *   clearHistory()            // clear all saved searches
 */

import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'tracciona_search_history'
const MAX_HISTORY = 5

/** Composable for search history. */
export function useSearchHistory() {
  const history = ref<string[]>([])

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      history.value = raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      history.value = []
    }
  }

  function save() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch {
      // Storage quota exceeded — fail silently
    }
  }

  function addSearch(term: string) {
    const trimmed = term.trim()
    if (!trimmed) return
    // Move to front and deduplicate
    history.value = [trimmed, ...history.value.filter(h => h !== trimmed)].slice(0, MAX_HISTORY)
    save()
  }

  function clearHistory() {
    history.value = []
    save()
  }

  onMounted(load)

  return { history, addSearch, clearHistory }
}
