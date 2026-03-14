/**
 * Shared type definitions for useDatos composable.
 */

export type PriceTrend = 'rising' | 'falling' | 'stable'

export interface MarketRow {
  id: string
  vertical: string
  subcategory: string
  subcategory_label: string
  brand: string | null
  province: string | null
  month: string
  avg_price: number
  median_price: number
  listing_count: number
  sold_count: number
  avg_days_to_sell: number | null
}

export interface PriceHistoryRow {
  id: string
  vertical: string
  subcategory: string
  week: string
  avg_price: number
  listing_count: number
}

export interface CategoryStat {
  subcategory: string
  label: string
  avgPrice: number
  medianPrice: number
  listingCount: number
  soldCount: number
  avgDaysToSell: number | null
  trendPct: number
  trendDirection: PriceTrend
}

export interface ProvinceStat {
  province: string
  avgPrice: number
  listingCount: number
}

export interface BrandBreakdownItem {
  brand: string
  avgPrice: number
  listingCount: number
}

export type ProvinceSortKey = 'province' | 'avgPrice' | 'listingCount'

export interface DatosChartDataset {
  label: string
  data: number[]
  fill: boolean
  borderColor: string
  backgroundColor: string
  tension: number
  pointRadius: number
  pointHoverRadius: number
}

export interface DatosChartData {
  labels: string[]
  datasets: DatosChartDataset[]
}

export interface DatosState { loading: boolean; data: MarketRow[]; priceHistory: PriceHistoryRow[]; filters: Record<string, unknown> }
