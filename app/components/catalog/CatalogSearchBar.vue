<script setup lang="ts">
/**
 * Full-text search bar with autocomplete dropdown.
 *
 * Calls /api/search (pg_trgm + tsvector) with 300ms debounce.
 * Suggested results link directly to vehicle detail pages.
 *
 * Usage:
 *   <CatalogSearchBar />          — standalone (e.g. in header)
 *   <CatalogSearchBar compact />  — narrow inline variant for filter bar
 */

import type { AutocompleteResult } from '~/composables/useSearchAutocomplete'
import { useSearchHistory } from '~/composables/useSearchHistory'

const props = withDefaults(
  defineProps<{
    /** Compact single-line variant for inline use inside filter bars */
    compact?: boolean
  }>(),
  { compact: false },
)

const { locale } = useI18n()
const { query, results, isLoading, isOpen, clear, close } = useSearchAutocomplete()
const { history, addSearch, clearHistory } = useSearchHistory()
const inputRef = ref<HTMLInputElement | null>(null)
const wrapRef = ref<HTMLDivElement | null>(null)
const activeIndex = ref(-1)
const showHistory = ref(false)

// Close dropdown on click outside
function onDocClick(e: MouseEvent) {
  if (!wrapRef.value?.contains(e.target as Node)) {
    close()
    showHistory.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// Reset active index when results change
watch(results, () => {
  activeIndex.value = -1
})

function onFocus() {
  if (!query.value && history.value.length > 0) {
    showHistory.value = true
  }
}

watch(query, (q) => {
  if (q) showHistory.value = false
  else if (history.value.length > 0) showHistory.value = true
})

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value && !showHistory.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Escape') {
    close()
    showHistory.value = false
    inputRef.value?.blur()
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    const selected = results.value[activeIndex.value]
    if (selected) goToResult(selected)
  }
}

const router = useRouter()
function goToResult(result: AutocompleteResult) {
  addSearch(`${result.brand} ${result.model}`)
  clear()
  showHistory.value = false
  router.push(`/vehiculo/${result.slug}`)
}

function applyHistoryItem(term: string) {
  query.value = term
  showHistory.value = false
  inputRef.value?.focus()
}

function formatPrice(price: number | null): string {
  if (price == null) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function onClear() {
  clear()
  inputRef.value?.focus()
}
</script>

<template>
  <div
    ref="wrapRef"
    :class="['search-bar', { 'search-bar--compact': props.compact }]"
    role="combobox"
    :aria-expanded="isOpen"
    aria-controls="search-results"
    aria-haspopup="listbox"
    aria-owns="search-results"
  >
    <!-- Input -->
    <div class="search-bar__input-wrap">
      <svg
        class="search-bar__icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref="inputRef"
        v-model="query"
        type="search"
        class="search-bar__input"
        :placeholder="$t('common.searchPlaceholder')"
        autocomplete="off"
        :aria-label="$t('catalog.searchLabel')"
        aria-autocomplete="list"
        aria-controls="search-results"
        :aria-activedescendant="activeIndex >= 0 ? `search-result-${activeIndex}` : undefined"
        @keydown="onKeydown"
        @focus="onFocus"
      >

      <!-- Loading spinner -->
      <span v-if="isLoading" class="search-bar__spinner" aria-hidden="true" />

      <!-- Clear button -->
      <button
        v-else-if="query"
        class="search-bar__clear"
        :aria-label="$t('common.clear')"
        type="button"
        @click="onClear"
      >
        ×
      </button>
    </div>

    <!-- Autocomplete dropdown -->
    <Transition name="search-drop">
      <ul
        v-if="isOpen && results.length"
        id="search-results"
        class="search-bar__dropdown"
        role="listbox"
        :aria-label="$t('catalog.searchResults')"
      >
        <li
          v-for="(result, i) in results"
          :id="`search-result-${i}`"
          :key="result.id"
          role="option"
          :aria-selected="activeIndex === i"
          :class="['search-bar__option', { 'search-bar__option--active': activeIndex === i }]"
          @click="goToResult(result)"
          @mouseover="activeIndex = i"
        >
          <span class="search-bar__option-title">
            {{ result.brand }} {{ result.model }}
            <span v-if="result.year" class="search-bar__option-year">{{ result.year }}</span>
          </span>
          <span class="search-bar__option-meta">
            <span v-if="result.price" class="search-bar__option-price">
              {{ formatPrice(result.price) }}
            </span>
            <span v-if="result.location_province" class="search-bar__option-loc">
              {{ result.location_province }}
            </span>
          </span>
        </li>
      </ul>
    </Transition>

    <!-- Search history dropdown -->
    <Transition name="search-drop">
      <div
        v-if="showHistory && !query && history.length"
        class="search-bar__dropdown search-bar__history"
        role="listbox"
        :aria-label="$t('catalog.recentSearches')"
      >
        <div class="search-bar__history-header">
          <span>{{ $t('catalog.recentSearches') }}</span>
          <button
            class="search-bar__history-clear"
            type="button"
            :aria-label="$t('common.clear')"
            @click.stop="clearHistory"
          >
            {{ $t('common.clear') }}
          </button>
        </div>
        <button
          v-for="term in history"
          :key="term"
          class="search-bar__history-item"
          type="button"
          role="option"
          aria-selected="false"
          @click.stop="applyHistoryItem(term)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{{ term }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
  max-width: 28rem;
}

.search-bar--compact {
  max-width: 14rem;
}

/* ── Input wrap ── */
.search-bar__input-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0 var(--spacing-3);
  height: 2.75rem;
  transition: border-color var(--transition-fast);
}

.search-bar__input-wrap:focus-within {
  border-color: var(--color-primary);
  outline: none;
}

.search-bar__icon {
  color: var(--text-auxiliary);
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.search-bar__input::placeholder {
  color: var(--text-auxiliary);
}

/* Remove browser-native clear button */
.search-bar__input::-webkit-search-cancel-button {
  display: none;
}

/* ── Spinner ── */
.search-bar__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Clear button ── */
.search-bar__clear {
  color: var(--text-auxiliary);
  font-size: 1.25rem;
  line-height: 1;
  padding: 0 var(--spacing-1);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  min-height: 2rem;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast);
}

@media (hover: hover) {
  .search-bar__clear:hover {
    color: var(--text-primary);
  }
}

/* ── Dropdown ── */
.search-bar__dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 500;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
  overflow: hidden;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ── Options ── */
.search-bar__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--border-color-light);
}

.search-bar__option:last-child {
  border-bottom: none;
}

.search-bar__option--active,
.search-bar__option:hover {
  background: var(--bg-secondary);
}

.search-bar__option-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-bar__option-year {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-normal);
  margin-left: var(--spacing-1);
}

.search-bar__option-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.search-bar__option-price {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.search-bar__option-loc {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  display: none;
}

/* ── History dropdown ── */
.search-bar__history {
  padding: var(--spacing-1) 0;
}

.search-bar__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-4) var(--spacing-1);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-bar__history-clear {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: var(--font-weight-medium);
  text-transform: none;
  letter-spacing: 0;
}

.search-bar__history-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  transition: background var(--transition-fast);
  min-height: 2.5rem;
}

.search-bar__history-item svg {
  flex-shrink: 0;
  color: var(--text-auxiliary);
}

.search-bar__history-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* ── Transition ── */
.search-drop-enter-active,
.search-drop-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.search-drop-enter-from,
.search-drop-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

/* ── Responsive ── */
@media (min-width: 30em) {
  .search-bar__option-loc {
    display: inline;
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-bar__spinner {
    animation: none;
    opacity: 0.5;
  }
  .search-drop-enter-active,
  .search-drop-leave-active {
    transition: none;
  }
}
</style>
