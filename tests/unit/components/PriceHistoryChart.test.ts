/**
 * Tests for app/components/vehicle/PriceHistoryChart.vue
 *
 * Covers: rendering states (loading, empty, chart), props, computed properties
 * (scaledPoints, polylinePoints, areaPoints, yLabels, xLabels, tooltipStyle,
 * minPrice, maxPrice, priceRange), hover interactions, and formatDate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Restore Vue's real reactivity primitives so the SFC works correctly
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)
vi.stubGlobal('nextTick', nextTick)

import { shallowMount, type VueWrapper } from '@vue/test-utils'

// ---------------------------------------------------------------------------
// Mock data — shared reactive refs that tests can mutate
// ---------------------------------------------------------------------------

const mockChartData = ref<Array<{ date: string; price: number }>>([])
const mockLoading = ref(false)

vi.mock('~/composables/usePriceHistory', () => ({
  usePriceHistory: () => ({
    loading: mockLoading,
    chartData: mockChartData,
    history: ref([]),
    fairPriceCents: ref(null),
    priceTrend: computed(() => 'stable' as const),
    priceDropPercentage: computed(() => 0),
    currentPrice: ref(null),
    lowestPrice: ref(null),
    highestPrice: ref(null),
    fetchHistory: vi.fn(),
    calculateFairPrice: vi.fn(),
  }),
}))

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (cents: number) => {
    if (cents == null || cents === 0) return '-'
    return `${(cents / 100).toFixed(2)} EUR`
  },
}))

import PriceHistoryChart from '../../../app/components/vehicle/PriceHistoryChart.vue'

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function factory(props: Record<string, unknown> = {}): VueWrapper {
  return shallowMount(PriceHistoryChart, {
    props: {
      vehicleId: 'v-test-123',
      ...props,
    },
    global: {
      mocks: { $t: (key: string) => key },
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PriceHistoryChart', () => {
  beforeEach(() => {
    mockLoading.value = false
    mockChartData.value = []
  })

  // ---- Loading state ----

  it('renders loading skeleton when loading is true', () => {
    mockLoading.value = true
    const w = factory()
    expect(w.find('.chart-skeleton').exists()).toBe(true)
    expect(w.findAll('.skeleton-bar').length).toBe(3)
  })

  it('renders short and mid skeleton bar variants', () => {
    mockLoading.value = true
    const w = factory()
    expect(w.find('.skeleton-bar--short').exists()).toBe(true)
    expect(w.find('.skeleton-bar--mid').exists()).toBe(true)
  })

  it('does not render chart or empty state while loading', () => {
    mockLoading.value = true
    const w = factory()
    expect(w.find('.chart-wrapper').exists()).toBe(false)
    expect(w.find('.chart-empty').exists()).toBe(false)
  })

  // ---- Empty state ----

  it('renders empty message when chartData is empty and not loading', () => {
    mockChartData.value = []
    const w = factory()
    expect(w.find('.chart-empty').exists()).toBe(true)
    expect(w.find('.chart-empty').text()).toBe('priceHistory.noData')
  })

  it('does not render skeleton or chart when empty', () => {
    mockChartData.value = []
    const w = factory()
    expect(w.find('.chart-skeleton').exists()).toBe(false)
    expect(w.find('.chart-wrapper').exists()).toBe(false)
  })

  // ---- Chart rendering ----

  it('renders chart wrapper when data is available', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    expect(w.find('.chart-wrapper').exists()).toBe(true)
    expect(w.find('.chart-svg').exists()).toBe(true)
  })

  it('renders chart title', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    expect(w.find('.chart-title').text()).toBe('priceHistory.title')
  })

  it('does not render loading or empty when chart has data', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    expect(w.find('.chart-skeleton').exists()).toBe(false)
    expect(w.find('.chart-empty').exists()).toBe(false)
  })

  // ---- SVG elements ----

  it('renders a polyline element with points', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    const polyline = w.find('.chart-line')
    expect(polyline.exists()).toBe(true)
    expect(polyline.attributes('points')).toBeTruthy()
  })

  it('renders area polygon with points', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    const area = w.find('.chart-area')
    expect(area.exists()).toBe(true)
    expect(area.attributes('points')).toBeTruthy()
  })

  it('renders one circle dot per data point', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
      { date: '2026-03-01', price: 45000 },
    ]
    const w = factory()
    expect(w.findAll('.chart-dot').length).toBe(3)
  })

  // ---- Y-axis labels ----

  it('renders 4 y-axis labels (steps=3 yields indices 0..3)', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 40000 },
      { date: '2026-02-15', price: 60000 },
    ]
    const w = factory()
    const yLabels = w.findAll('.chart-axis-label:not(.chart-axis-label--x)')
    expect(yLabels.length).toBe(4)
  })

  it('y-axis labels contain formatted price strings', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 40000 },
      { date: '2026-02-15', price: 60000 },
    ]
    const w = factory()
    const yLabels = w.findAll('.chart-axis-label:not(.chart-axis-label--x)')
    yLabels.forEach((label) => {
      expect(label.text()).toMatch(/(EUR|-)/)
    })
  })

  // ---- Horizontal grid lines ----

  it('renders 4 grid lines', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 40000 },
      { date: '2026-02-15', price: 60000 },
    ]
    const w = factory()
    expect(w.findAll('.chart-grid-line').length).toBe(4)
  })

  // ---- X-axis labels ----

  it('renders 1 x-axis label for a single data point', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    expect(w.findAll('.chart-axis-label--x').length).toBe(1)
  })

  it('renders 2 x-axis labels for two data points (first and last)', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    expect(w.findAll('.chart-axis-label--x').length).toBe(2)
  })

  it('renders 3 x-axis labels for three or more data points', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
      { date: '2026-03-01', price: 45000 },
    ]
    const w = factory()
    expect(w.findAll('.chart-axis-label--x').length).toBe(3)
  })

  // ---- formatDate ----

  it('formats dates as DD/MM', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-28', price: 48000 },
    ]
    const w = factory()
    const xLabels = w.findAll('.chart-axis-label--x')
    expect(xLabels[0]!.text()).toBe('15/01')
    expect(xLabels[1]!.text()).toBe('28/02')
  })

  // ---- Tooltip (hover interaction) ----

  it('does not show tooltip initially', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    expect(w.find('.chart-tooltip').exists()).toBe(false)
  })

  it('shows tooltip on mouseenter on a dot', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[0]!.trigger('mouseenter')
    expect(w.find('.chart-tooltip').exists()).toBe(true)
    expect(w.find('.tooltip-price').exists()).toBe(true)
    expect(w.find('.tooltip-date').exists()).toBe(true)
  })

  it('tooltip displays formatted price and date', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[0]!.trigger('mouseenter')
    expect(w.find('.tooltip-price').text()).toBe('500.00 EUR')
    expect(w.find('.tooltip-date').text()).toBe('15/01')
  })

  it('activates hovered dot with active class', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    const dots = w.findAll('.chart-dot')
    await dots[1]!.trigger('mouseenter')
    expect(dots[1]!.classes()).toContain('chart-dot--active')
    expect(dots[0]!.classes()).not.toContain('chart-dot--active')
  })

  it('hides tooltip on mouseleave from chart container', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[0]!.trigger('mouseenter')
    expect(w.find('.chart-tooltip').exists()).toBe(true)

    await w.find('.chart-container').trigger('mouseleave')
    expect(w.find('.chart-tooltip').exists()).toBe(false)
  })

  // ---- Tooltip positioning ----

  it('tooltip style has left, top, and transform', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[0]!.trigger('mouseenter')

    const style = w.find('.chart-tooltip').attributes('style') || ''
    expect(style).toContain('left:')
    expect(style).toContain('top:')
    expect(style).toContain('translate(-50%, -120%)')
  })

  // ---- scaledPoints computed ----

  it('positions single data point at center x', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    const dots = w.findAll('.chart-dot')
    expect(dots.length).toBe(1)
    const cx = parseFloat(dots[0]!.attributes('cx') || '0')
    // PADDING_LEFT + CHART_WIDTH / 2 = 48 + 244/2 = 170
    expect(cx).toBeCloseTo(170, 0)
  })

  it('positions first point at PADDING_LEFT and last at right edge', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    const dots = w.findAll('.chart-dot')
    const cx0 = parseFloat(dots[0]!.attributes('cx') || '0')
    const cx1 = parseFloat(dots[1]!.attributes('cx') || '0')
    expect(cx0).toBeCloseTo(48, 0)   // PADDING_LEFT
    expect(cx1).toBeCloseTo(292, 0)   // PADDING_LEFT + CHART_WIDTH = 48 + 244
  })

  // ---- priceRange handles equal prices ----

  it('handles all-equal prices without division by zero', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 50000 },
    ]
    const w = factory()
    expect(w.find('.chart-svg').exists()).toBe(true)
    const dots = w.findAll('.chart-dot')
    expect(dots[0]!.attributes('cy')).toBeTruthy()
    expect(dots[1]!.attributes('cy')).toBeTruthy()
  })

  // ---- polylinePoints computed ----

  it('polyline points string has one pair per data point', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
      { date: '2026-03-01', price: 45000 },
    ]
    const w = factory()
    const points = w.find('.chart-line').attributes('points') || ''
    const pairs = points.trim().split(' ')
    expect(pairs.length).toBe(3)
    pairs.forEach((pair) => {
      expect(pair).toMatch(/\d+(\.\d+)?,\d+(\.\d+)?/)
    })
  })

  // ---- areaPoints computed ----

  it('area polygon starts and ends at the bottom baseline', () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    const points = w.find('.chart-area').attributes('points') || ''
    // PADDING_TOP + CHART_HEIGHT = 12 + 114 = 126
    expect(points).toContain(',126')
  })

  // ---- State transitions ----

  it('transitions from loading to chart when data arrives', async () => {
    mockLoading.value = true
    const w = factory()
    expect(w.find('.chart-skeleton').exists()).toBe(true)

    mockLoading.value = false
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    await w.vm.$nextTick()

    expect(w.find('.chart-skeleton').exists()).toBe(false)
    expect(w.find('.chart-wrapper').exists()).toBe(true)
  })

  it('transitions from loading to empty state', async () => {
    mockLoading.value = true
    const w = factory()

    mockLoading.value = false
    mockChartData.value = []
    await w.vm.$nextTick()

    expect(w.find('.chart-skeleton').exists()).toBe(false)
    expect(w.find('.chart-empty').exists()).toBe(true)
  })

  // ---- Props ----

  it('accepts vehicleId prop', () => {
    const w = factory({ vehicleId: 'custom-id' })
    expect(w.props('vehicleId')).toBe('custom-id')
  })

  // ---- Large dataset ----

  it('handles many data points without error', () => {
    const points: Array<{ date: string; price: number }> = []
    for (let i = 1; i <= 50; i++) {
      const day = String(i).padStart(2, '0')
      points.push({ date: `2026-01-${day}`, price: 50000 - i * 100 })
    }
    mockChartData.value = points
    const w = factory()
    expect(w.findAll('.chart-dot').length).toBe(50)
  })

  // ---- Touch interaction ----

  it('activates tooltip on touchstart on a dot', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 48000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[1]!.trigger('touchstart')
    expect(w.find('.chart-tooltip').exists()).toBe(true)
    expect(w.findAll('.chart-dot')[1]!.classes()).toContain('chart-dot--active')
  })

  // ---- Tooltip updates on hover change ----

  it('updates tooltip when hovering a different dot', async () => {
    mockChartData.value = [
      { date: '2026-01-15', price: 50000 },
      { date: '2026-02-15', price: 30000 },
    ]
    const w = factory()
    await w.findAll('.chart-dot')[0]!.trigger('mouseenter')
    expect(w.find('.tooltip-price').text()).toBe('500.00 EUR')

    await w.findAll('.chart-dot')[1]!.trigger('mouseenter')
    expect(w.find('.tooltip-price').text()).toBe('300.00 EUR')
  })

  // ---- Chart container has mouseleave handler ----

  it('chart-container element exists', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    expect(w.find('.chart-container').exists()).toBe(true)
  })

  // ---- SVG viewBox ----

  it('SVG has correct viewBox attribute', () => {
    mockChartData.value = [{ date: '2026-01-15', price: 50000 }]
    const w = factory()
    // DOM lowercases attribute names; check via the element directly
    const svg = w.find('.chart-svg').element
    expect(svg.getAttribute('viewBox')).toBe('0 0 300 150')
  })
})
