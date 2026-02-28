/**
 * Admin Metrics — CSV Export utility
 * Pure function, no reactive deps.
 * Extracted from useAdminMetrics.ts (Auditoría #7 Iter. 15)
 */
import type {
  KpiSummary,
  RevenuePoint,
  VehicleActivityPoint,
  LeadsPoint,
  TopDealer,
  TopVehicle,
  ConversionFunnel,
  ChurnRate,
} from '~/utils/adminMetricsTypes'

export interface MetricsExportData {
  kpiSummary: KpiSummary
  revenueSeries: RevenuePoint[]
  vehicleActivity: VehicleActivityPoint[]
  leadsSeries: LeadsPoint[]
  topDealers: TopDealer[]
  topVehicles: TopVehicle[]
  conversionFunnel: ConversionFunnel
  churnRate: ChurnRate
}

export function exportMetricsCSV(data: MetricsExportData): void {
  const rows: string[][] = []

  rows.push(['Metric', 'Current', 'Previous Month', 'Change %'])

  const kpi = data.kpiSummary
  rows.push([
    'Monthly Revenue (cents)',
    String(kpi.monthlyRevenue.current),
    String(kpi.monthlyRevenue.previousMonth),
    String(kpi.monthlyRevenue.changePercent),
  ])
  rows.push([
    'Active Vehicles',
    String(kpi.activeVehicles.current),
    String(kpi.activeVehicles.previousMonth),
    String(kpi.activeVehicles.changePercent),
  ])
  rows.push([
    'Active Dealers',
    String(kpi.activeDealers.current),
    String(kpi.activeDealers.previousMonth),
    String(kpi.activeDealers.changePercent),
  ])
  rows.push([
    'Monthly Leads',
    String(kpi.monthlyLeads.current),
    String(kpi.monthlyLeads.previousMonth),
    String(kpi.monthlyLeads.changePercent),
  ])

  rows.push([])
  rows.push(['Month', 'Revenue (cents)', 'Tax (cents)'])
  for (const point of data.revenueSeries) {
    rows.push([point.month, String(point.revenue), String(point.tax)])
  }

  rows.push([])
  rows.push(['Month', 'Published', 'Sold'])
  for (const point of data.vehicleActivity) {
    rows.push([point.month, String(point.published), String(point.sold)])
  }

  rows.push([])
  rows.push(['Month', 'Leads'])
  for (const point of data.leadsSeries) {
    rows.push([point.month, String(point.leads)])
  }

  rows.push([])
  rows.push(['Dealer ID', 'Name', 'Vehicle Count', 'Lead Count'])
  for (const d of data.topDealers) {
    rows.push([d.dealerId, d.name, String(d.vehicleCount), String(d.leadCount)])
  }

  rows.push([])
  rows.push(['Vehicle ID', 'Title', 'Views'])
  for (const v of data.topVehicles) {
    rows.push([v.vehicleId, v.title, String(v.views)])
  }

  rows.push([])
  rows.push(['Funnel Stage', 'Count'])
  const funnel = data.conversionFunnel
  rows.push(['Visits (total views)', String(funnel.visits)])
  rows.push(['Vehicle Views (unique vehicles)', String(funnel.vehicleViews)])
  rows.push(['Leads', String(funnel.leads)])
  rows.push(['Sales', String(funnel.sales)])

  rows.push([])
  rows.push(['Churn Metric', 'Value'])
  const churn = data.churnRate
  rows.push(['Total Dealers (subscriptions)', String(churn.totalDealers)])
  rows.push(['Cancelled Dealers', String(churn.cancelledDealers)])
  rows.push(['Churn Rate (%)', String(churn.churnRate)])

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `metrics_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
