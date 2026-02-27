<script setup lang="ts">
import { formatPrice } from '~/composables/useDatos'
import type { CategoryStat, BrandBreakdownItem } from '~/composables/useDatos'

defineProps<{
  categoryStat: CategoryStat | undefined
  brandBreakdown: BrandBreakdownItem[]
}>()
</script>

<template>
  <section v-if="categoryStat && brandBreakdown.length" class="datos-section">
    <h2 class="datos-section__title">{{ categoryStat.label }}</h2>
    <div class="detail-grid">
      <div class="detail-stat">
        <span class="detail-stat__label">{{ $t('data.avgPrice') }}</span>
        <span class="detail-stat__value">{{ formatPrice(categoryStat.avgPrice) }}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">{{ $t('data.median') }}</span>
        <span class="detail-stat__value">{{ formatPrice(categoryStat.medianPrice) }}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">{{ $t('data.listings') }}</span>
        <span class="detail-stat__value">{{ categoryStat.listingCount }}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">{{ $t('data.soldCount') }}</span>
        <span class="detail-stat__value">{{ categoryStat.soldCount }}</span>
      </div>
      <div v-if="categoryStat.avgDaysToSell !== null" class="detail-stat">
        <span class="detail-stat__label">{{ $t('data.avgDaysToSell') }}</span>
        <span class="detail-stat__value">{{ categoryStat.avgDaysToSell }}</span>
      </div>
    </div>

    <!-- Brand breakdown table -->
    <div class="brand-table-wrapper">
      <table class="brand-table">
        <thead>
          <tr>
            <th class="brand-table__th--left">{{ $t('data.brand') }}</th>
            <th>{{ $t('data.avgPrice') }}</th>
            <th>{{ $t('data.volume') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="brand in brandBreakdown" :key="brand.brand">
            <td class="brand-table__td--left">{{ brand.brand }}</td>
            <td>{{ formatPrice(brand.avgPrice) }}</td>
            <td>{{ brand.listingCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.datos-section {
  margin-bottom: var(--spacing-10);
}

.datos-section__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-5);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.detail-stat {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.detail-stat__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-stat__value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.brand-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.brand-table {
  width: 100%;
  min-width: 320px;
  border-collapse: collapse;
}

.brand-table thead {
  background: var(--color-primary);
}

.brand-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.brand-table__th--left {
  text-align: left;
}

.brand-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.brand-table__td--left {
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.brand-table tbody tr:last-child td {
  border-bottom: none;
}

.brand-table tbody tr:hover {
  background: var(--color-gray-50);
}

@media (min-width: 480px) {
  .detail-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .detail-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .datos-section__title {
    font-size: var(--font-size-2xl);
  }
}
</style>
