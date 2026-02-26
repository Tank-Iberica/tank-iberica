<template>
  <div class="error-page">
    <div class="error-container">
      <!-- Logo branding -->
      <NuxtLink to="/" class="error-logo" aria-label="Tracciona">
        <img src="/icon-192x192.png" alt="Tracciona" width="48" height="48" >
      </NuxtLink>

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
  if (url.includes('/vendedor/')) return t('error.dealerNotFound')
  return t('error.notFound')
})

const errorMessage = computed(() => {
  const code = props.error?.statusCode || 404
  const url = props.error?.url || ''

  if (code === 503) return t('error.maintenanceMessage')
  if (code === 500) return t('error.serverMessage')

  if (url.includes('/vehiculo/')) return t('error.vehicleNotFoundMessage')
  if (url.includes('/vendedor/')) return t('error.dealerNotFoundMessage')
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #f9fafb;
  font-family: 'Inter', sans-serif;
}

.error-container {
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.error-logo {
  display: inline-block;
  margin-bottom: 1rem;
}

.error-logo img {
  border-radius: 12px;
}

.error-code {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-primary, #23424a);
  line-height: 1;
  margin: 0 0 0.5rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem;
}

.error-message {
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

/* Search */
.error-search {
  margin-bottom: 1.5rem;
}

.search-form {
  display: flex;
  gap: 0;
  max-width: 360px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 0.95rem;
  outline: none;
  min-height: 48px;
}

.search-input:focus {
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.search-btn {
  padding: 12px 16px;
  background: var(--color-primary, #23424a);
  color: white;
  border: 1px solid var(--color-primary, #23424a);
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.search-btn:hover {
  background: var(--color-primary-dark, #1a3238);
}

/* Actions */
.error-suggestions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  min-height: 48px;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  min-height: 48px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--color-primary, #23424a);
}

/* Categories */
.error-categories {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.categories-label {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.category-link {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.category-link:hover {
  border-color: var(--color-primary, #23424a);
  color: var(--color-primary, #23424a);
}

@media (min-width: 480px) {
  .error-code {
    font-size: 7rem;
  }

  .error-title {
    font-size: 1.5rem;
  }
}
</style>
