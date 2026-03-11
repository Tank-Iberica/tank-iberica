/**
 * Shared type definitions for market data composables.
 * Imported by useMarketData, useMarketStats, useMarketTrends, and helpers.
 */

export interface MarketDataRow {
  vertical: string
  action: string
  subcategory: string
  brand: string
  location_province: string
  location_country: string
  month: string
  listings: number
  avg_price: number
  median_price: number
  min_price: number
  max_price: number
  avg_days_to_sell: number | null
  sold_count: number
}

export interface PriceHistoryRow {
  vertical: string
  subcategory: string
  brand: string
  week: string
  avg_price: number
  median_price: number
  sample_size: number
}

export interface DemandDataRow {
  vertical: string
  category: string
  subcategory: string
  brand: string
  province: string
  month: string
  alert_count: number
}

export interface MarketFilters {
  subcategory?: string
  brand?: string
  province?: string
  months?: number // last N months, default 12
}

export interface PriceHistoryFilters {
  subcategory?: string
  brand?: string
  weeks?: number // last N weeks, default 52
}

export interface DemandFilters {
  subcategory?: string
  brand?: string
  province?: string
}

export interface ValuationParams {
  brand: string
  model?: string
  year?: number
  km?: number
  province?: string
  subcategory?: string
}

export interface ValuationResult {
  estimated_min: number
  estimated_median: number
  estimated_max: number
  market_trend: 'rising' | 'falling' | 'stable'
  trend_pct: number
  avg_days_to_sell: number | null
  sample_size: number
  confidence: 'low' | 'medium' | 'high'
}

export interface CategoryStat {
  subcategory: string
  avg_price: number
  listings: number
  trend_pct: number
}
