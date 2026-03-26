<script setup lang="ts">
/**
 * Top Dealers Public Page (#55)
 *
 * Public scoreboard showing top-rated dealers by trust score.
 * Includes rank, badge, company name, province, and vehicle count.
 */
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { dealers, loading, error, loadTopDealers } = useTopDealers()

usePageSeo({
  title: t('topDealers.seoTitle'),
  description: t('topDealers.seoDescription'),
  path: '/top-dealers',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('topDealers.seoTitle'),
    description: t('topDealers.seoDescription'),
    url: `${useSiteUrl()}/top-dealers`,
    isPartOf: { '@type': 'WebSite', name: t('site.title'), url: useSiteUrl() },
  },
})

await useAsyncData('top-dealers', () => loadTopDealers(100), { server: true })
</script>

<template>
  <div class="top-dealers-page">
    <div class="top-dealers-container">
      <UiBreadcrumbNav
        :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('topDealers.title') }]"
      />

      <header class="top-dealers-header">
        <h1 class="top-dealers-title">{{ $t('topDealers.title') }}</h1>
        <p class="top-dealers-subtitle">{{ $t('topDealers.subtitle') }}</p>
      </header>

      <!-- Loading -->
      <UiSkeletonTable v-if="loading" :rows="10" :cols="5" />

      <!-- Error -->
      <UiErrorState v-else-if="error" :title="error" />

      <!-- Empty -->
      <div v-else-if="!dealers.length" class="top-dealers-empty">
        <p>{{ $t('topDealers.empty') }}</p>
      </div>

      <!-- Table -->
      <div v-else class="top-dealers-table-wrapper">
        <table class="top-dealers-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-name">{{ $t('topDealers.colName') }}</th>
              <th class="col-badge">{{ $t('topDealers.colBadge') }}</th>
              <th class="col-score">{{ $t('topDealers.colScore') }}</th>
              <th class="col-vehicles">{{ $t('topDealers.colVehicles') }}</th>
              <th class="col-province">{{ $t('topDealers.colProvince') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(dealer, idx) in dealers"
              :key="dealer.id"
              :class="{ 'row-top': dealer.badge === 'top' }"
            >
              <td class="col-rank">
                <span class="rank-number" :class="{ 'rank-podium': idx < 3 }">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="col-name">
                {{ dealer.company_name || $t('topDealers.anonymous') }}
              </td>
              <td class="col-badge">
                <SharedDealerTrustBadge :tier="dealer.badge" />
              </td>
              <td class="col-score">
                <span class="score-value">{{ dealer.trust_score }}</span>
                <span class="score-max">/100</span>
              </td>
              <td class="col-vehicles">{{ dealer.vehicle_count }}</td>
              <td class="col-province">{{ dealer.location_province || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-dealers-page {
  padding: var(--spacing-16) var(--spacing-16) var(--spacing-48);
}

.top-dealers-container {
  max-width: 64rem;
  margin: 0 auto;
}

.top-dealers-header {
  margin-bottom: var(--spacing-32);
}

.top-dealers-title {
  font-size: var(--heading-2);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-8);
}

.top-dealers-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.top-dealers-empty {
  text-align: center;
  padding: var(--spacing-48) var(--spacing-16);
  color: var(--text-secondary);
}

.top-dealers-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.top-dealers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.top-dealers-table th {
  text-align: left;
  padding: var(--spacing-12) var(--spacing-8);
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.top-dealers-table td {
  padding: var(--spacing-12) var(--spacing-8);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.top-dealers-table tbody tr:hover {
  background: var(--bg-hover);
}

.row-top {
  background: rgba(212, 175, 55, 0.04);
}

.col-rank {
  width: 3rem;
  text-align: center;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.rank-podium {
  background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
  color: #fff;
}

.col-badge {
  width: 4rem;
  text-align: center;
}

.col-score {
  width: 5rem;
}

.score-value {
  font-weight: 700;
  color: var(--text-primary);
}

.score-max {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.col-vehicles,
.col-province {
  white-space: nowrap;
}

@media (max-width: 29.94em) {
  .col-province {
    display: none;
  }

  .top-dealers-table th,
  .top-dealers-table td {
    padding: var(--spacing-8) var(--spacing-4);
  }
}

@media (min-width: 48em) {
  .top-dealers-page {
    padding: var(--spacing-24) var(--spacing-24) var(--spacing-64);
  }

  .top-dealers-table {
    font-size: var(--text-base);
  }
}
</style>
