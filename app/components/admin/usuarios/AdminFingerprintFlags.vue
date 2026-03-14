<template>
  <div class="fp-flags">
    <div class="fp-flags__header">
      <h3 class="fp-flags__title">{{ $t('admin.users.fp_flags.title') }}</h3>
      <span class="fp-flags__badge" :class="{ 'fp-flags__badge--alert': duplicates.length > 0 }">
        {{ duplicates.length }}
      </span>
    </div>

    <p class="fp-flags__desc">{{ $t('admin.users.fp_flags.description') }}</p>

    <div v-if="loading" class="fp-flags__loading" aria-live="polite" aria-busy="true">
      <span class="fp-flags__spinner" aria-hidden="true"/>
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="error" class="fp-flags__error" role="alert">
      {{ $t('admin.users.fp_flags.load_error') }}
    </div>

    <div v-else-if="duplicates.length === 0" class="fp-flags__empty">
      {{ $t('admin.users.fp_flags.no_duplicates') }}
    </div>

    <ul v-else class="fp-flags__list" aria-label="Duplicate device fingerprints">
      <li
        v-for="dup in duplicates"
        :key="dup.fp_hash"
        class="fp-flags__item"
      >
        <div class="fp-flags__item-header">
          <code class="fp-flags__hash" :title="dup.fp_hash">
            {{ dup.fp_hash.substring(0, 8) }}&hellip;
          </code>
          <span class="fp-flags__count">
            {{ $t('admin.users.fp_flags.accounts', { count: dup.account_count }) }}
          </span>
          <time
            class="fp-flags__last-seen"
            :datetime="dup.last_seen"
            :title="dup.last_seen"
          >
            {{ formatDate(dup.last_seen) }}
          </time>
        </div>

        <p v-if="dup.ua_hint" class="fp-flags__ua">
          {{ dup.ua_hint }}
        </p>

        <div class="fp-flags__users">
          <a
            v-for="userId in dup.user_ids"
            :key="userId"
            class="fp-flags__user-link"
            :href="`/admin/usuarios?id=${userId}`"
          >
            {{ userId.substring(0, 8) }}&hellip;
          </a>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const $supabase = useSupabaseClient() as any

interface DuplicateDeviceRow {
  fp_hash: string
  account_count: number
  user_ids: string[]
  first_seen: string
  last_seen: string
  ua_hint: string | null
}

const duplicates = ref<DuplicateDeviceRow[]>([])
const loading = ref(true)
const error = ref(false)

async function fetchDuplicates() {
  loading.value = true
  error.value = false
  const { data, error: fetchErr } = await $supabase
    .from('duplicate_device_users')
    .select('fp_hash, account_count, user_ids, first_seen, last_seen, ua_hint')
    .order('account_count', { ascending: false })
    .limit(50)

  loading.value = false
  if (fetchErr) {
    error.value = true
    return
  }
  duplicates.value = (data ?? []) as DuplicateDeviceRow[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(fetchDuplicates)
</script>

<style scoped>
.fp-flags {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.fp-flags__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.fp-flags__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.fp-flags__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 0.75rem;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.fp-flags__badge--alert {
  background: #fee2e2;
  color: #b91c1c;
}

.fp-flags__desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 1rem;
}

.fp-flags__loading,
.fp-flags__empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  justify-content: center;
}

.fp-flags__error {
  padding: 1rem;
  border-radius: 0.5rem;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.875rem;
}

.fp-flags__spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.fp-flags__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fp-flags__item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--bg-subtle);
  border-left: 3px solid #f59e0b;
}

.fp-flags__item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.fp-flags__hash {
  font-size: 0.8125rem;
  font-family: monospace;
  color: var(--text-secondary);
  background: var(--bg-surface);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.fp-flags__count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #b45309;
}

.fp-flags__last-seen {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-left: auto;
}

.fp-flags__ua {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fp-flags__users {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.375rem;
}

.fp-flags__user-link {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--color-primary);
  text-decoration: none;
  background: var(--bg-surface);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--border-subtle);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.fp-flags__user-link:hover {
  text-decoration: underline;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
