/**
 * Subscription Limits Service
 *
 * Centralizes plan-based limits and vehicle management logic
 * extracted from stripe/webhook.post.ts.
 *
 * Endpoints call these functions instead of embedding business rules inline.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Plan limits — single source of truth
// ---------------------------------------------------------------------------

export interface PlanLimits {
  maxVehicles: number
  freeReservationsPerMonth: number
  depositCents: number
  features: string[]
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxVehicles: 3,
    freeReservationsPerMonth: 0,
    depositCents: 5000,
    features: ['basic_listing'],
  },
  basic: {
    maxVehicles: 20,
    freeReservationsPerMonth: 1,
    depositCents: 2500,
    features: ['basic_listing', 'analytics', 'crm_basic'],
  },
  premium: {
    maxVehicles: Infinity,
    freeReservationsPerMonth: 3,
    depositCents: 1000,
    features: ['basic_listing', 'analytics', 'crm_full', 'export', 'api', 'priority_support'],
  },
  founding: {
    maxVehicles: Infinity,
    freeReservationsPerMonth: 3,
    depositCents: 1000,
    features: [
      'basic_listing',
      'analytics',
      'crm_full',
      'export',
      'api',
      'priority_support',
      'founding_badge',
    ],
  },
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS['free']!
}

// ---------------------------------------------------------------------------
// Vehicle limit enforcement
// ---------------------------------------------------------------------------

/**
 * Reactivate vehicles when a user upgrades their plan.
 * Re-publishes paused vehicles up to the new plan limit.
 */
export async function reactivateVehiclesByPlan(
  supabase: SupabaseClient,
  dealerId: string,
  plan: string,
): Promise<number> {
  const limits = getPlanLimits(plan)

  // Count currently published vehicles
  const { count: publishedCount } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('dealer_id', dealerId)
    .eq('status', 'published')

  const currentPublished = publishedCount ?? 0
  const canActivate = Math.max(0, limits.maxVehicles - currentPublished)

  if (canActivate === 0) return 0

  // Get paused vehicles ordered by last activity
  const { data: paused } = await supabase
    .from('vehicles')
    .select('id')
    .eq('dealer_id', dealerId)
    .eq('status', 'paused')
    .order('updated_at', { ascending: false })
    .limit(canActivate)

  if (!paused?.length) return 0

  const ids = paused.map((v: { id: string }) => v.id)
  await supabase.from('vehicles').update({ status: 'published' }).in('id', ids)

  return ids.length
}

/**
 * Pause excess vehicles when a user downgrades or cancels.
 * Keeps the most recent vehicles published, pauses the rest.
 */
export async function pauseExcessVehicles(
  supabase: SupabaseClient,
  dealerId: string,
  plan: string,
): Promise<number> {
  const limits = getPlanLimits(plan)

  const { data: published } = await supabase
    .from('vehicles')
    .select('id')
    .eq('dealer_id', dealerId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (!published?.length) return 0

  const excess = published.slice(limits.maxVehicles)
  if (excess.length === 0) return 0

  const ids = excess.map((v: { id: string }) => v.id)
  await supabase.from('vehicles').update({ status: 'paused' }).in('id', ids)

  return ids.length
}

// ---------------------------------------------------------------------------
// Grace period / dunning logic
// ---------------------------------------------------------------------------

/**
 * Calculate grace period days based on invoice attempt number.
 */
export function calculateGracePeriodDays(attemptCount: number): number {
  if (attemptCount <= 1) return 14
  if (attemptCount === 2) return 7
  return 3
}

/**
 * Determine if a subscription should be suspended based on failed payments.
 */
export function shouldSuspendSubscription(
  attemptCount: number,
  daysSinceFirstFailure: number,
): boolean {
  const graceDays = calculateGracePeriodDays(attemptCount)
  return daysSinceFirstFailure >= graceDays
}
