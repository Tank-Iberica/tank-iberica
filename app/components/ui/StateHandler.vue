<script setup lang="ts">
/**
 * StateHandler — Unified loading / empty / error / content states.
 *
 * Eliminates ad-hoc v-if chains across 40+ pages and enforces a
 * consistent visual pattern for all async data sections.
 *
 * Usage:
 *   <!-- Basic: automatic skeletons + default messages -->
 *   <StateHandler :loading="loading" :error="error" :empty="!items.length">
 *     <MyContent />
 *   </StateHandler>
 *
 *   <!-- Custom slots -->
 *   <StateHandler :loading :error :empty="!items.length">
 *     <template #loading><UiSkeletonCard v-for="n in 3" :key="n" /></template>
 *     <template #empty>
 *       <p>{{ $t('catalog.noResults') }}</p>
 *     </template>
 *     <template #error="{ message, retry }">
 *       <p>{{ message }}</p><button @click="retry">{{ $t('common.retry') }}</button>
 *     </template>
 *     <MyContent />
 *   </StateHandler>
 *
 * Notes:
 *   - `loading` takes priority over `error` which takes priority over `empty`
 *   - `retry` prop: optional callback for retry action in error slot
 *   - `skeletonCount` controls how many skeleton lines show in default loading state
 *   - aria-busy on wrapper, aria-live="polite" on error region
 */

const props = withDefaults(
  defineProps<{
    /** Show loading state */
    loading?: boolean
    /** Show error state (pass Error, string, or true for generic message) */
    error?: Error | string | boolean | null
    /** Show empty state */
    empty?: boolean
    /** Message for default empty state (overridden by #empty slot) */
    emptyMessage?: string
    /** Number of skeleton lines in default loading state */
    skeletonCount?: number
    /** Optional retry callback shown in default error state */
    retry?: () => void
    /** Min-height so layout doesn't jump during load */
    minHeight?: string
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    emptyMessage: '',
    skeletonCount: 3,
    retry: undefined,
    minHeight: '',
  },
)

const { t } = useI18n()

const errorMessage = computed<string>(() => {
  if (!props.error) return ''
  if (props.error instanceof Error) return props.error.message
  if (typeof props.error === 'string') return props.error
  return t('common.error')
})

const wrapStyle = computed(() =>
  props.minHeight ? { minHeight: props.minHeight } : {},
)
</script>

<template>
  <div
    class="state-handler"
    :style="wrapStyle"
    :aria-busy="loading || undefined"
  >
    <!-- ── LOADING ─────────────────────────────────────────────── -->
    <template v-if="loading">
      <slot name="loading">
        <div class="state-handler__loading" aria-hidden="true">
          <UiSkeleton
            v-for="n in skeletonCount"
            :key="n"
            :width="n % 3 === 0 ? '55%' : n % 2 === 0 ? '80%' : '100%'"
          />
        </div>
      </slot>
    </template>

    <!-- ── ERROR ──────────────────────────────────────────────── -->
    <template v-else-if="error">
      <slot name="error" :message="errorMessage" :retry="retry">
        <div class="state-handler__error" role="alert" aria-live="polite">
          <svg
            class="state-handler__error-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p class="state-handler__error-msg">
            {{ errorMessage || $t('common.error') }}
          </p>
          <button
            v-if="retry"
            class="state-handler__retry"
            type="button"
            @click="retry"
          >
            {{ $t('common.retry') }}

          </button>
        </div>
      </slot>
    </template>

    <!-- ── EMPTY ──────────────────────────────────────────────── -->
    <template v-else-if="empty">
      <slot name="empty">
        <div class="state-handler__empty">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="12" x2="15" y2="12" />
          </svg>
          <p class="state-handler__empty-msg">
            {{ emptyMessage || $t('common.noResults') }}
          </p>
        </div>
      </slot>
    </template>

    <!-- ── CONTENT ────────────────────────────────────────────── -->
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<style scoped>
.state-handler {
  width: 100%;
}

/* ── Loading ── */
.state-handler__loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-2) 0;
}

/* ── Error ── */
.state-handler__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8) var(--spacing-4);
  color: var(--color-danger, #c0392b);
  text-align: center;
}

.state-handler__error-icon {
  opacity: 0.8;
  flex-shrink: 0;
}

.state-handler__error-msg {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  max-width: 30em;
}

.state-handler__retry {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 2.75rem;
  background: transparent;
  transition: all var(--transition-fast);
  cursor: pointer;
}

@media (hover: hover) {
  .state-handler__retry:hover {
    background: var(--color-primary);
    color: var(--color-white);
  }
}

/* ── Empty ── */
.state-handler__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8) var(--spacing-4);
  color: var(--text-auxiliary);
  text-align: center;
}

.state-handler__empty-msg {
  font-size: var(--font-size-sm);
  max-width: 30em;
}
</style>
