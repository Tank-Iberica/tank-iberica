<template>
  <div class="price-history-chart">
    <!-- Loading skeleton -->
    <div v-if="loading" class="chart-skeleton">
      <div class="skeleton-bar" />
      <div class="skeleton-bar skeleton-bar--short" />
      <div class="skeleton-bar skeleton-bar--mid" />
    </div>

    <!-- No data message -->
    <p v-else-if="chartData.length === 0" class="chart-empty">
      {{ $t('priceHistory.noData') }}
    </p>

    <!-- SVG Chart -->
    <div v-else class="chart-wrapper">
      <h4 class="chart-title">{{ $t('priceHistory.title') }}</h4>

      <div class="chart-container" @mouseleave="hoveredIndex = null">
        <svg viewBox="0 0 300 150" class="chart-svg" preserveAspectRatio="xMidYMid meet">
          <!-- Y-axis labels -->
          <text
            v-for="(label, idx) in yLabels"
            :key="`y-${idx}`"
            :x="2"
            :y="label.y + 4"
            class="chart-axis-label"
          >
            {{ label.text }}
          </text>

          <!-- Horizontal grid lines -->
          <line
            v-for="(label, idx) in yLabels"
            :key="`grid-${idx}`"
            :x1="PADDING_LEFT"
            :y1="label.y"
            :x2="300 - PADDING_RIGHT"
            :y2="label.y"
            class="chart-grid-line"
          />

          <!-- Polyline -->
          <polyline :points="polylinePoints" class="chart-line" />

          <!-- Area fill under the line -->
          <polygon :points="areaPoints" class="chart-area" />

          <!-- Data point dots -->
          <circle
            v-for="(point, idx) in scaledPoints"
            :key="`dot-${idx}`"
            :cx="point.x"
            :cy="point.y"
            r="4"
            class="chart-dot"
            :class="{ 'chart-dot--active': hoveredIndex === idx }"
            @mouseenter="hoveredIndex = idx"
            @touchstart.passive="hoveredIndex = idx"
          />

          <!-- X-axis labels (show first, middle, last) -->
          <text
            v-for="(label, idx) in xLabels"
            :key="`x-${idx}`"
            :x="label.x"
            :y="150 - 2"
            class="chart-axis-label chart-axis-label--x"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="hoveredIndex !== null && scaledPoints[hoveredIndex]"
          class="chart-tooltip"
          :style="tooltipStyle"
        >
          <span class="tooltip-price">{{ formatPrice(chartData[hoveredIndex].price) }}</span>
          <span class="tooltip-date">{{ formatDate(chartData[hoveredIndex].date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePriceHistory } from '~/composables/usePriceHistory'

const props = defineProps<{
  vehicleId: string
}>()

const { loading, chartData } = usePriceHistory(props.vehicleId)

const hoveredIndex = ref<number | null>(null)

const PADDING_LEFT = 48
const PADDING_RIGHT = 8
const PADDING_TOP = 12
const PADDING_BOTTOM = 24
const CHART_WIDTH = 300 - PADDING_LEFT - PADDING_RIGHT
const CHART_HEIGHT = 150 - PADDING_TOP - PADDING_BOTTOM

const minPrice = computed(() => {
  if (chartData.value.length === 0) return 0
  return Math.min(...chartData.value.map((p) => p.price))
})

const maxPrice = computed(() => {
  if (chartData.value.length === 0) return 0
  return Math.max(...chartData.value.map((p) => p.price))
})

const priceRange = computed(() => {
  const range = maxPrice.value - minPrice.value
  return range > 0 ? range : 1
})

interface ScaledPoint {
  x: number
  y: number
}

const scaledPoints = computed<ScaledPoint[]>(() => {
  const len = chartData.value.length
  if (len === 0) return []

  return chartData.value.map((point, idx) => ({
    x: PADDING_LEFT + (len > 1 ? (idx / (len - 1)) * CHART_WIDTH : CHART_WIDTH / 2),
    y:
      PADDING_TOP +
      CHART_HEIGHT -
      ((point.price - minPrice.value) / priceRange.value) * CHART_HEIGHT,
  }))
})

const polylinePoints = computed(() => scaledPoints.value.map((p) => `${p.x},${p.y}`).join(' '))

const areaPoints = computed(() => {
  if (scaledPoints.value.length === 0) return ''
  const first = scaledPoints.value[0]
  const last = scaledPoints.value[scaledPoints.value.length - 1]
  const bottom = PADDING_TOP + CHART_HEIGHT
  return `${first.x},${bottom} ${polylinePoints.value} ${last.x},${bottom}`
})

const yLabels = computed(() => {
  const steps = 3
  const labels: Array<{ text: string; y: number }> = []

  for (let i = 0; i <= steps; i++) {
    const price = minPrice.value + (priceRange.value * i) / steps
    const y = PADDING_TOP + CHART_HEIGHT - (CHART_HEIGHT * i) / steps
    labels.push({ text: formatPrice(price), y })
  }

  return labels
})

const xLabels = computed(() => {
  const data = chartData.value
  if (data.length === 0) return []

  const indices: number[] = [0]
  if (data.length > 2) indices.push(Math.floor(data.length / 2))
  if (data.length > 1) indices.push(data.length - 1)

  return indices.map((idx) => ({
    x: scaledPoints.value[idx]?.x ?? 0,
    text: formatDate(data[idx].date),
  }))
})

const tooltipStyle = computed(() => {
  if (hoveredIndex.value === null) return {}
  const point = scaledPoints.value[hoveredIndex.value]
  if (!point) return {}

  const leftPercent = (point.x / 300) * 100
  const topPercent = (point.y / 150) * 100

  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
    transform: 'translate(-50%, -120%)',
  }
})

function formatPrice(cents: number): string {
  const euros = cents / 100
  if (euros >= 1000) {
    return `${Math.round(euros / 1000)}k`
  }
  return `${Math.round(euros)}`
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  return `${parts[2]}/${parts[1]}`
}
</script>

<style scoped>
.price-history-chart {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.chart-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

/* Skeleton */
.chart-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
}

.skeleton-bar {
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  animation: pulse 1.5s ease-in-out infinite;
  width: 100%;
}

.skeleton-bar--short {
  width: 60%;
}

.skeleton-bar--mid {
  width: 80%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Empty state */
.chart-empty {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  padding: var(--spacing-6) 0;
  margin: 0;
}

/* Chart container */
.chart-container {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}

.chart-line {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-area {
  fill: var(--color-primary);
  opacity: 0.08;
}

.chart-grid-line {
  stroke: var(--border-color-light);
  stroke-width: 0.5;
  stroke-dasharray: 3 3;
}

.chart-dot {
  fill: var(--bg-primary);
  stroke: var(--color-primary);
  stroke-width: 2;
  cursor: pointer;
  transition: r var(--transition-fast);
}

.chart-dot--active {
  fill: var(--color-primary);
  r: 6;
}

.chart-axis-label {
  font-size: 8px;
  fill: var(--text-auxiliary);
  font-family: var(--font-family);
}

.chart-axis-label--x {
  font-size: 7px;
}

/* Tooltip */
.chart-tooltip {
  position: absolute;
  background: var(--bg-dark);
  color: var(--text-on-dark-primary);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-md);
}

.tooltip-price {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.tooltip-date {
  font-size: var(--font-size-xs);
  color: var(--text-on-dark-secondary);
}
</style>
