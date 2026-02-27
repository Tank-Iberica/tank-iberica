<script setup lang="ts">
import type { ComparisonRow } from '~/composables/usePrecios'

defineProps<{
  rows: ComparisonRow[]
}>()

const planKeys = ['free', 'basic', 'premium', 'founding'] as const
</script>

<template>
  <section class="comparison-section">
    <h2 class="comparison-title">{{ $t('pricing.compareTitle') }}</h2>
    <div class="comparison-table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th class="comparison-feature-header">&nbsp;</th>
            <th>{{ $t('pricing.planFree') }}</th>
            <th>{{ $t('pricing.planBasic') }}</th>
            <th>{{ $t('pricing.planPremium') }}</th>
            <th>{{ $t('pricing.planFounding') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td class="comparison-feature-cell">{{ row.label }}</td>
            <td v-for="plan in planKeys" :key="plan" class="comparison-value-cell">
              <template v-if="typeof row[plan] === 'boolean'">
                <span v-if="row[plan]" class="check-icon" aria-label="Yes">&#10003;</span>
                <span v-else class="cross-icon" aria-label="No">&#10007;</span>
              </template>
              <template v-else>
                {{ row[plan] }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.comparison-section {
  margin-bottom: var(--spacing-16);
}

.comparison-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.comparison-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-primary);
}

.comparison-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.comparison-table thead {
  background: var(--color-primary);
}

.comparison-table th {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  text-align: center;
  white-space: nowrap;
}

.comparison-feature-header {
  text-align: left !important;
  min-width: 160px;
}

.comparison-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border-color-light);
  text-align: center;
}

.comparison-feature-cell {
  text-align: left !important;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
}

.comparison-value-cell {
  color: var(--text-secondary);
}

.comparison-table tbody tr:last-child td {
  border-bottom: none;
}

.comparison-table tbody tr:hover {
  background: var(--color-gray-50);
}

.check-icon {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.cross-icon {
  color: var(--color-gray-400);
  font-size: var(--font-size-base);
}

@media (min-width: 768px) {
  .comparison-title {
    font-size: var(--font-size-2xl);
  }
}
</style>
