/**
 * Pure functions for dealer stats access control.
 * Extracted from useDealerStats to enable testing without Vue reactivity.
 */

/**
 * Metrics access control by subscription plan.
 * Each metric lists the plans that have access to it.
 */
export const METRIC_ACCESS: Readonly<Record<string, string[]>> = {
  total_views: ['free', 'basic', 'premium', 'founding'],
  total_leads: ['free', 'basic', 'premium', 'founding'],
  per_vehicle_views: ['basic', 'premium', 'founding'],
  per_vehicle_leads: ['basic', 'premium', 'founding'],
  monthly_chart: ['basic', 'premium', 'founding'],
  conversion_rate: ['premium', 'founding'],
  sector_comparison: ['premium', 'founding'],
  demand_matching: ['premium', 'founding'],
}

/**
 * Check if a plan has access to a specific metric.
 */
export function canAccessMetric(plan: string, metric: string): boolean {
  const allowedPlans = METRIC_ACCESS[metric]
  if (!allowedPlans) return false
  return allowedPlans.includes(plan)
}
