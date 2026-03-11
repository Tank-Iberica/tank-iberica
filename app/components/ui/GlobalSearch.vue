<template>
  <!-- Trigger button shown in header (Cmd+K shortcut hint) -->
  <slot name="trigger" :open="open" />

  <!-- Modal overlay -->
  <Teleport to="body">
    <Transition name="global-search">
      <div
        v-if="isOpen"
        class="gs-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('search.globalLabel')"
        @click.self="close"
        @keydown.esc="close"
      >
        <div class="gs-modal" @click.stop>
          <!-- Search input -->
          <div class="gs-input-row">
            <svg
              class="gs-icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              ref="inputRef"
              v-model="query"
              type="search"
              class="gs-input"
              :placeholder="$t('search.globalPlaceholder')"
              autocomplete="off"
              @keydown.down.prevent="moveDown"
              @keydown.up.prevent="moveUp"
              @keydown.enter.prevent="selectActive"
              @keydown.esc="close"
            >

            <button class="gs-close" :aria-label="$t('common.close')" @click="close">
              <span aria-hidden="true">Esc</span>
            </button>
          </div>

          <!-- Results -->
          <div class="gs-results" role="listbox" :aria-label="$t('search.results')">
            <!-- Loading -->
            <div v-if="isLoading" class="gs-loading" aria-live="polite">
              <span class="gs-spinner" aria-hidden="true" />
              <span>{{ $t('common.loading') }}…</span>
            </div>

            <!-- No results -->
            <div
              v-else-if="query.length >= 2 && results.length === 0 && !isLoading"
              class="gs-empty"
              aria-live="polite"
            >
              {{ $t('search.noResults', { q: query }) }}
            </div>

            <!-- Suggestions -->
            <template v-else>
              <NuxtLink
                v-for="(result, index) in results"
                :key="result.id"
                role="option"
                :aria-selected="activeIndex === index"
                class="gs-result"
                :class="{ 'gs-result--active': activeIndex === index }"
                :to="`/vehiculo/${result.slug}`"
                @click="close"
                @mouseenter="activeIndex = index"
              >
                <div class="gs-result-main">
                  <span class="gs-result-title">{{ result.brand }} {{ result.model }}</span>
                  <span v-if="result.year" class="gs-result-year">{{ result.year }}</span>
                </div>
                <div class="gs-result-meta">
                  <span v-if="result.price" class="gs-result-price">
                    {{ formatPrice(result.price) }}
                  </span>
                  <span v-if="result.location_province" class="gs-result-location">
                    {{ result.location_province }}
                  </span>
                </div>
              </NuxtLink>
            </template>

            <!-- Quick links (shown when no query) -->
            <div v-if="!query" class="gs-quick">
              <p class="gs-quick-label">{{ $t('search.quickLinks') }}</p>
              <NuxtLink
                v-for="link in quickLinks"
                :key="link.to"
                class="gs-quick-link"
                :to="link.to"
                @click="close"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>

          <!-- Footer hint -->
          <div class="gs-footer">
            <span class="gs-hint">
              <kbd>↑↓</kbd> {{ $t('search.navHint') }} · <kbd>↵</kbd>
              {{ $t('search.selectHint') }} · <kbd>Esc</kbd> {{ $t('search.closeHint') }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useSearchAutocomplete } from '~/composables/useSearchAutocomplete'

const { t, locale } = useI18n()
const router = useRouter()
const { query, results, isLoading } = useSearchAutocomplete()

const isOpen = ref(false)
const activeIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

const quickLinks = computed(() => [
  { to: '/catalog', label: t('nav.catalog') },
  { to: '/subastas', label: t('nav.subastas', 'Subastas') },
  { to: '/precios', label: t('nav.pricing', 'Precios') },
  { to: '/datos', label: t('nav.datos', 'Datos de mercado') },
])

function open(): void {
  isOpen.value = true
  activeIndex.value = -1
  nextTick(() => inputRef.value?.focus())
}

function close(): void {
  isOpen.value = false
  query.value = ''
  activeIndex.value = -1
}

function moveDown(): void {
  activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
}

function moveUp(): void {
  activeIndex.value = Math.max(activeIndex.value - 1, -1)
}

function selectActive(): void {
  if (activeIndex.value >= 0 && results.value[activeIndex.value]) {
    const slug = results.value[activeIndex.value].slug
    router.push(`/vehiculo/${slug}`)
    close()
  } else if (query.value.trim()) {
    router.push(`/catalog?q=${encodeURIComponent(query.value.trim())}`)
    close()
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Keyboard shortcut: Cmd+K / Ctrl+K
function onKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

// Lock scroll when open
const { lock, unlock } = useScrollLock()

watch(isOpen, (val) => {
  if (val) {
    lock()
  } else {
    unlock()
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// Expose open() so parent can trigger it
defineExpose({ open, close, isOpen })
</script>

<style scoped>
.gs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem 2rem;
}

.gs-modal {
  width: 100%;
  max-width: 36rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.gs-input-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.gs-icon-search {
  flex-shrink: 0;
  color: var(--text-auxiliary);
}

.gs-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: var(--text-primary);
  caret-color: var(--color-primary);
}

.gs-input::placeholder {
  color: var(--text-auxiliary);
}

.gs-close {
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  color: var(--text-auxiliary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.gs-close:hover {
  background: var(--bg-tertiary);
}

.gs-results {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  min-height: 3rem;
}

.gs-loading,
.gs-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.gs-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: gs-spin 0.6s linear infinite;
}

@keyframes gs-spin {
  to {
    transform: rotate(360deg);
  }
}

.gs-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  text-decoration: none;
  color: var(--text-primary);
  cursor: pointer;
  border-left: 2px solid transparent;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.gs-result:hover,
.gs-result--active {
  background: var(--bg-secondary);
  border-left-color: var(--color-primary);
}

.gs-result-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.gs-result-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gs-result-year {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.gs-result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  font-size: 0.8125rem;
}

.gs-result-price {
  font-weight: 600;
  color: var(--color-primary);
}
.gs-result-location {
  color: var(--text-secondary);
}

/* Quick links */
.gs-quick {
  padding: 0.75rem 1rem 0.25rem;
}

.gs-quick-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-auxiliary);
  margin: 0 0 0.375rem;
}

.gs-quick-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.gs-quick-link:hover {
  color: var(--color-primary);
}

/* Footer */
.gs-footer {
  border-top: 1px solid var(--border-color-light);
  padding: 0.5rem 1rem;
  flex-shrink: 0;
}

.gs-hint {
  font-size: 0.6875rem;
  color: var(--text-auxiliary);
}

.gs-hint kbd {
  display: inline-block;
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--border-color);
  border-radius: 0.2rem;
  font-family: monospace;
  font-size: 0.625rem;
  background: var(--bg-secondary);
}

/* Transition */
.global-search-enter-active,
.global-search-leave-active {
  transition: opacity var(--transition-fast);
}

.global-search-enter-from,
.global-search-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .global-search-enter-active,
  .global-search-leave-active {
    transition: none;
  }
}
</style>
