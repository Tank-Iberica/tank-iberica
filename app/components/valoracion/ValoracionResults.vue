<script setup lang="ts">
/**
 * Results display for the valuation page.
 * Shows either a "no data" card or the full result card with price bar,
 * stats grid, detailed report preview, and disclaimer.
 */
import type { ValoracionResultData } from '~/composables/useValoracion'

defineProps<{
  result: ValoracionResultData | null
  noData: boolean
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: number | null
  formatPrice: (value: number) => string
  priceBarPosition: (value: number, min: number, max: number) => number
  confidenceColor: (confidence: string) => string
  trendIcon: (trend: string) => string
  trendLabel: (trend: string) => string
  confidenceLabel: (confidence: string) => string
}>()

const emit = defineEmits<{
  reset: []
}>()
</script>

<template>
  <section class="valuation-results-section">
    <!-- No data -->
    <div v-if="noData" class="no-data-card">
      <div class="no-data-icon" aria-hidden="true">&#128269;</div>
      <h2 class="no-data-title">{{ $t('valuation.noData') }}</h2>
      <p class="no-data-desc">{{ $t('valuation.noDataDesc') }}</p>
      <button class="submit-btn" @click="emit('reset')">
        {{ $t('valuation.newValuation') }}
      </button>
    </div>

    <!-- Result card -->
    <div v-else-if="result" class="result-card">
      <div class="result-header">
        <h2 class="result-title">{{ $t('valuation.resultTitle') }}</h2>
        <p class="result-vehicle">{{ vehicleBrand }} {{ vehicleModel }} ({{ vehicleYear }})</p>
      </div>

      <!-- Price range bar -->
      <div class="price-range-section">
        <h3 class="section-label">{{ $t('valuation.priceRange') }}</h3>
        <div class="price-bar-container">
          <div class="price-bar">
            <div
              class="price-bar-marker"
              :style="{ left: priceBarPosition(result.median, result.min, result.max) + '%' }"
            >
              <span class="marker-label">{{ formatPrice(result.median) }}</span>
            </div>
          </div>
          <div class="price-bar-labels">
            <span class="price-label price-label--min">
              <span class="price-label-title">{{ $t('valuation.minPrice') }}</span>
              <span class="price-label-value">{{ formatPrice(result.min) }}</span>
            </span>
            <span class="price-label price-label--max">
              <span class="price-label-title">{{ $t('valuation.maxPrice') }}</span>
              <span class="price-label-value">{{ formatPrice(result.max) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <!-- Median -->
        <div class="stat-card stat-card--primary">
          <span class="stat-label">{{ $t('valuation.estimatedPrice') }}</span>
          <span class="stat-value stat-value--large">{{ formatPrice(result.median) }}</span>
        </div>

        <!-- Trend -->
        <div class="stat-card">
          <span class="stat-label">{{ $t('valuation.trend') }}</span>
          <span class="stat-value">
            <span class="trend-icon" aria-hidden="true">{{ trendIcon(result.trend) }}</span>
            {{ trendLabel(result.trend) }}
            <span v-if="result.trendPct !== 0" class="trend-pct">
              ({{ result.trendPct > 0 ? '+' : '' }}{{ result.trendPct }}%)
            </span>
          </span>
        </div>

        <!-- Days to sell -->
        <div class="stat-card">
          <span class="stat-label">{{ $t('valuation.daysToSell') }}</span>
          <span class="stat-value">{{ result.daysToSell }} {{ $t('valuation.days') }}</span>
        </div>

        <!-- Sample size -->
        <div class="stat-card">
          <span class="stat-label">{{ $t('valuation.sampleSize') }}</span>
          <span class="stat-value">{{ result.sampleSize }} {{ $t('valuation.vehicles') }}</span>
        </div>

        <!-- Confidence -->
        <div class="stat-card">
          <span class="stat-label">{{ $t('valuation.confidence') }}</span>
          <span class="stat-value">
            <span
              class="confidence-dot"
              :style="{ backgroundColor: confidenceColor(result.confidence) }"
              aria-hidden="true"
            />
            {{ confidenceLabel(result.confidence) }}
          </span>
        </div>
      </div>

      <!-- Detailed report preview (blurred) -->
      <div class="detailed-preview">
        <div class="detailed-preview-content">
          <div class="blurred-chart" aria-hidden="true">
            <div class="fake-bar" style="height: 40%" />
            <div class="fake-bar" style="height: 55%" />
            <div class="fake-bar" style="height: 70%" />
            <div class="fake-bar" style="height: 60%" />
            <div class="fake-bar" style="height: 80%" />
            <div class="fake-bar" style="height: 65%" />
            <div class="fake-bar" style="height: 75%" />
            <div class="fake-bar" style="height: 90%" />
          </div>
          <div class="blurred-table" aria-hidden="true">
            <div class="fake-row" />
            <div class="fake-row" />
            <div class="fake-row" />
            <div class="fake-row" />
          </div>
        </div>
        <div class="detailed-preview-overlay">
          <div class="overlay-content">
            <h3 class="overlay-title">{{ $t('valuation.detailedReport') }}</h3>
            <p class="overlay-desc">{{ $t('valuation.detailedReportDesc') }}</p>
            <button class="detailed-cta">
              {{ $t('valuation.getDetailedReport') }} — {{ $t('valuation.detailedPrice') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <p class="disclaimer">{{ $t('valuation.disclaimer') }}</p>

      <!-- New valuation button -->
      <button class="submit-btn submit-btn--outline" @click="emit('reset')">
        {{ $t('valuation.newValuation') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* ---- No Data ---- */
.no-data-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8) var(--spacing-6);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  line-height: 1;
}

.no-data-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.no-data-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-6);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* ---- Submit Button (shared style) ---- */
.submit-btn {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  min-height: 48px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.submit-btn--outline {
  background: transparent;
  color: var(--color-primary);
  margin-top: var(--spacing-4);
}

.submit-btn--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

/* ---- Result Card ---- */
.result-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.result-header {
  text-align: center;
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
}

.result-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.result-vehicle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* ---- Price Range Bar ---- */
.price-range-section {
  margin-bottom: var(--spacing-6);
}

.section-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-bar-container {
  position: relative;
}

.price-bar {
  height: 12px;
  border-radius: var(--border-radius-full);
  background: linear-gradient(
    90deg,
    var(--color-success) 0%,
    var(--color-warning) 50%,
    var(--color-error) 100%
  );
  position: relative;
  margin-bottom: var(--spacing-6);
}

.price-bar-marker {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-bar-marker::after {
  content: '';
  width: 20px;
  height: 20px;
  background: var(--color-white);
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  display: block;
}

.marker-label {
  position: absolute;
  top: -32px;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  background: var(--bg-primary);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
}

.price-bar-labels {
  display: flex;
  justify-content: space-between;
}

.price-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label--max {
  text-align: right;
}

.price-label-title {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
}

.price-label-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* ---- Stats Grid ---- */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.stat-card--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.stat-card--primary .stat-label {
  color: var(--text-on-dark-secondary);
}

.stat-card--primary .stat-value {
  color: var(--color-white);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.stat-value--large {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.trend-icon {
  font-size: var(--font-size-lg);
  line-height: 1;
}

.trend-pct {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-normal);
}

.confidence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* ---- Detailed Report Preview (Blurred) ---- */
.detailed-preview {
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-6);
  border: 1px solid var(--border-color-light);
}

.detailed-preview-content {
  padding: var(--spacing-6);
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.blurred-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-2);
  height: 120px;
  margin-bottom: var(--spacing-4);
}

.fake-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary-light) 100%);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  min-width: 20px;
}

.blurred-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.fake-row {
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.fake-row:nth-child(odd) {
  width: 100%;
}

.fake-row:nth-child(even) {
  width: 85%;
}

.detailed-preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: var(--spacing-4);
}

.overlay-content {
  text-align: center;
  max-width: 360px;
}

.overlay-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.overlay-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
}

.detailed-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.detailed-cta:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

/* ---- Disclaimer ---- */
.disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--color-warning);
  margin-bottom: var(--spacing-4);
}

/* ---- Responsive ---- */
@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .result-card {
    padding: var(--spacing-8);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card--primary {
    grid-column: span 2;
  }

  .blurred-chart {
    height: 160px;
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-card--primary {
    grid-column: span 1;
  }
}
</style>
