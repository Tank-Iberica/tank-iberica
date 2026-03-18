<template>
  <div class="error-page">
    <div class="error-container">
      <!-- Logo branding -->
      <NuxtLink to="/" class="error-logo" aria-label="Tracciona">
        <NuxtImg src="/icon-192x192.png" alt="Tracciona" width="48" height="48" sizes="48px" format="webp" decoding="async" />
      </NuxtLink>

      <!-- Visual illustration for 404 -->
      <div v-if="is404" class="error-illustration" aria-hidden="true">
        <svg viewBox="0 0 200 120" width="200" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Road -->
          <rect x="40" y="90" width="120" height="12" rx="4" fill="var(--bg-tertiary)" />
          <rect x="94" y="93" width="12" height="6" rx="2" fill="var(--color-white)" />
          <!-- Truck body -->
          <rect x="60" y="55" width="80" height="38" rx="6" fill="var(--color-primary)" />
          <rect x="112" y="45" width="28" height="48" rx="4" fill="var(--color-primary-dark)" />
          <!-- Wheels -->
          <circle cx="78" cy="93" r="9" fill="var(--color-near-black)" />
          <circle cx="78" cy="93" r="4" fill="var(--color-gray-300)" />
          <circle cx="122" cy="93" r="9" fill="var(--color-near-black)" />
          <circle cx="122" cy="93" r="4" fill="var(--color-gray-300)" />
          <!-- Question mark -->
          <text x="84" y="81" font-size="22" font-weight="bold" fill="var(--color-white)" font-family="sans-serif">?</text>
          <!-- Window -->
          <rect x="116" y="52" width="18" height="14" rx="3" fill="var(--color-accent)" opacity="0.7" />
        </svg>
      </div>

      <h1 class="error-code">{{ error?.statusCode || 404 }}</h1>

      <h2 class="error-title">{{ errorTitle }}</h2>
      <p class="error-message">{{ errorMessage }}</p>

      <!-- Inline vehicle search (only for 404) -->
      <div v-if="is404" class="error-search">
        <form class="search-form" @submit.prevent="handleSearch">
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('error.searchPlaceholder')"
            class="search-input"
          >
          <button type="submit" class="search-btn" :aria-label="$t('error.searchBtn')">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Suggested links -->
      <div class="error-suggestions">
        <NuxtLink to="/" class="btn-primary">
          {{ $t('error.backHome') }}
        </NuxtLink>
        <NuxtLink to="/?scroll=catalog" class="btn-secondary">
          {{ $t('error.backToCatalog') }}
        </NuxtLink>
      </div>

      <!-- Category links (only for 404) -->
      <div v-if="is404" class="error-categories">
        <p class="categories-label">{{ $t('error.categoriesLabel') }}</p>
        <div class="categories-grid">
          <NuxtLink to="/?category=camiones" class="category-link">{{
            $t('error.catTrucks')
          }}</NuxtLink>
          <NuxtLink to="/?category=remolques" class="category-link">{{
            $t('error.catTrailers')
          }}</NuxtLink>
          <NuxtLink to="/?category=furgonetas" class="category-link">{{
            $t('error.catVans')
          }}</NuxtLink>
          <NuxtLink to="/subastas" class="category-link">{{ $t('error.catAuctions') }}</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    message: string
    url?: string
  }
}>()

const { t } = useI18n()
const router = useRouter()

const searchQuery = ref('')
const is404 = computed(() => !props.error?.statusCode || props.error.statusCode === 404)

// Context-aware error messages
const errorTitle = computed(() => {
  const code = props.error?.statusCode || 404
  const url = props.error?.url || ''

  if (code === 503) return t('error.maintenanceTitle')
  if (code === 500) return t('error.serverError')

  // 404 — context-aware
  if (url.includes('/vehiculo/')) return t('error.vehicleNotFound')
  return t('error.notFound')
})

const errorMessage = computed(() => {
  const code = props.error?.statusCode || 404
  const url = props.error?.url || ''

  if (code === 503) return t('error.maintenanceMessage')
  if (code === 500) return t('error.serverMessage')

  if (url.includes('/vehiculo/')) return t('error.vehicleNotFoundMessage')
  return t('error.notFoundMessage')
})

useSeoMeta({
  title: `${props.error?.statusCode || 404} — Tracciona`,
  robots: 'noindex, nofollow',
})

useHead({
  htmlAttrs: { lang: t('error.lang') || 'es' },
})

function handleSearch(): void {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/', query: { q: searchQuery.value.trim() } })
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--bg-secondary);
  font-family: var(--font-family);
}

.error-container {
  text-align: center;
  max-width: 30em;
  width: 100%;
}

.error-logo {
  display: inline-block;
  margin-bottom: 1rem;
}

.error-illustration {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-4);
  opacity: 0.9;
}

.error-logo img {
  border-radius: var(--border-radius-md);
}

.error-code {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  margin: 0 0 0.5rem;
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.error-message {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-6);
}

/* Search */
.error-search {
  margin-bottom: 1.5rem;
}

.search-form {
  display: flex;
  gap: 0;
  max-width: 22.5rem;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  font-size: var(--font-size-sm);
  outline: none;
  min-height: 3rem;
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring-strong);
}

.search-btn {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  cursor: pointer;
  min-height: 3rem;
  display: flex;
  align-items: center;
}

.search-btn:hover {
  background: var(--color-primary-dark);
}

/* Actions */
.error-suggestions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-8);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  min-height: 3rem;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-white);
  color: var(--color-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  min-height: 3rem;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
}

/* Categories */
.error-categories {
  border-top: 1px solid var(--border-color-light);
  padding-top: var(--spacing-6);
}

.categories-label {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  justify-content: center;
}

.category-link {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-white);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-gray-700);
  text-decoration: none;
  transition: all var(--transition-fast);
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.category-link:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (min-width: 30em) {
  .error-code {
    font-size: 7rem;
  }

  .error-title {
    font-size: 1.5rem;
  }
}
</style>
