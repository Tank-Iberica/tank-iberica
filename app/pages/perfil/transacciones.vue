<template>
  <div class="transactions-page">
    <UiBreadcrumbNav :items="breadcrumbs" />

    <div class="page-header">
      <h1 class="page-title">{{ $t('profile.transactions.title') }}</h1>
      <p class="page-subtitle">{{ $t('profile.transactions.subtitle') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="transactions-loading">
      <div v-for="n in 3" :key="n" class="skeleton-card" aria-hidden="true">
        <div class="sk-image" />
        <div class="sk-body">
          <div class="sk-line wide" />
          <div class="sk-line medium" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <UiErrorState
      v-else-if="error"
      type="network"
      :title="$t('common.errorTitle')"
      :description="error"
    />

    <!-- Empty -->
    <UiEmptyState
      v-else-if="transactions.length === 0"
      icon="truck"
      :title="$t('profile.transactions.empty')"
      :description="$t('profile.transactions.emptyHint')"
    >
      <template #action>
        <NuxtLink to="/catalog" class="btn-primary">
          {{ $t('profile.transactions.browse') }}
        </NuxtLink>
      </template>
    </UiEmptyState>

    <!-- Transactions list -->
    <div v-else class="transactions-list">
      <article v-for="tx in transactions" :key="tx.id" class="tx-card">
        <!-- Image -->
        <div class="tx-image">
          <NuxtImg
            v-if="tx.image"
            :src="tx.image"
            :alt="tx.title"
            width="100"
            height="75"
            sizes="100px"
            format="webp"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="tx-image-placeholder" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              width="28"
              height="28"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        </div>

        <!-- Info -->
        <div class="tx-info">
          <NuxtLink :to="`/vehiculo/${tx.slug}`" class="tx-title">
            {{ tx.title }}
          </NuxtLink>
          <p v-if="tx.dealer_name" class="tx-dealer">{{ tx.dealer_name }}</p>
          <div class="tx-meta">
            <span v-if="tx.price" class="tx-price">
              {{ formatPrice(tx.price, tx.currency) }}
            </span>
            <span class="tx-status" :class="`status--${tx.status}`">
              {{ $t(`vehicle.status.${tx.status}`) }}
            </span>
          </div>
        </div>

        <!-- Date -->
        <div class="tx-date">
          <time :datetime="tx.sold_at ?? tx.reserved_at ?? tx.created_at">
            {{ formatDate(tx.sold_at ?? tx.reserved_at ?? tx.created_at) }}
          </time>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { t, locale } = useI18n()
const { transactions, loading, error, fetch } = useTransactionHistory()

const breadcrumbs = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('profile.title'), to: '/perfil' },
  { label: t('profile.transactions.title') },
])

function formatPrice(price: number, currency: string | null): string {
  return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: currency ?? 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

usePageSeo({
  title: `${t('profile.transactions.title')} — ${t('site.title')}`,
  description: t('profile.transactions.subtitle'),
  path: '/perfil/transacciones',
})

onMounted(fetch)
</script>

<style scoped>
.transactions-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.page-subtitle {
  color: var(--text-secondary);
  margin: 0;
}

/* Loading skeleton */
.transactions-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
}

.sk-image {
  width: 6.25rem;
  height: 4.75rem;
  border-radius: var(--border-radius-sm);
  background: var(--color-skeleton-bg);
  flex-shrink: 0;
}

.sk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.25rem;
}
.sk-line {
  height: 0.875rem;
  border-radius: 0.25rem;
  background: var(--color-skeleton-bg);
}
.sk-line.wide {
  width: 70%;
}
.sk-line.medium {
  width: 45%;
}

/* Transactions list */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tx-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
}

.tx-card:hover {
  border-color: var(--color-primary);
}

.tx-image {
  flex-shrink: 0;
  width: 6.25rem;
  height: 4.75rem;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
}

.tx-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tx-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.tx-info {
  flex: 1;
  min-width: 0;
}

.tx-title {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.tx-title:hover {
  color: var(--color-primary);
}

.tx-dealer {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}

.tx-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tx-price {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.tx-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-weight: 500;
}

.status--sold {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status--reserved {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.tx-date {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.875rem;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
