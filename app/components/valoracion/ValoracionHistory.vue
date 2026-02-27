<script setup lang="ts">
/**
 * Valuation history list.
 * Shows past valuation reports for the current user.
 */
import type { ValoracionHistoryItem } from '~/composables/useValoracion'

defineProps<{
  history: ValoracionHistoryItem[]
  showResults: boolean
  formatPrice: (value: number) => string
  formatDate: (dateStr: string) => string
  confidenceColor: (confidence: string) => string
}>()
</script>

<template>
  <section v-if="history.length > 0" class="history-section">
    <h2 class="history-title">{{ $t('valuation.history') }}</h2>
    <div class="history-list">
      <div v-for="item in history" :key="item.id" class="history-item">
        <div class="history-item-info">
          <span class="history-vehicle">{{ item.brand }} {{ item.model }} ({{ item.year }})</span>
          <span class="history-date">{{ formatDate(item.created_at) }}</span>
        </div>
        <div class="history-item-price">
          <span class="history-range">
            {{ formatPrice(item.estimated_min) }} — {{ formatPrice(item.estimated_max) }}
          </span>
          <span
            class="confidence-dot confidence-dot--small"
            :style="{ backgroundColor: confidenceColor(item.confidence) }"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </section>

  <section v-else-if="showResults && history.length === 0" class="history-section">
    <h2 class="history-title">{{ $t('valuation.history') }}</h2>
    <p class="no-history">{{ $t('valuation.noHistory') }}</p>
  </section>
</template>

<style scoped>
.history-section {
  margin-top: var(--spacing-8);
}

.history-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-sm);
}

.history-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-vehicle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.history-date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.history-item-price {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.history-range {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.confidence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.confidence-dot--small {
  width: 8px;
  height: 8px;
}

.no-history {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
  text-align: center;
}

@media (min-width: 480px) {
  .history-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
