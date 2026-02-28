/**
 * Admin Metrics — Shared types
 * Extracted from useAdminMetrics.ts (Auditoría #7 Iter. 15)
 */

export interface KpiValue {
  current: number
  previousMonth: number
  changePercent: number
}

export interface KpiSummary {
  monthlyRevenue: KpiValue
  activeVehicles: KpiValue
  activeDealers: KpiValue
  monthlyLeads: KpiValue
}

export interface RevenuePoint {
  month: string
  revenue: number
  tax: number
}

export interface VehicleActivityPoint {
  month: string
  published: number
  sold: number
}

export interface LeadsPoint {
  month: string
  leads: number
}

export interface TopDealer {
  dealerId: string
  name: string
  vehicleCount: number
  leadCount: number
}

export interface TopVehicle {
  vehicleId: string
  title: string
  views: number
}

export interface ConversionFunnel {
  visits: number
  vehicleViews: number
  leads: number
  sales: number
}

export interface ChurnRate {
  totalDealers: number
  cancelledDealers: number
  churnRate: number
}
