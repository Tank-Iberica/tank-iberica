/**
 * Subscription/plan domain types — shared between client and server.
 */

import type { ISODateString, UUID } from './common'

/** Subscription plan tiers */
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

/** Subscription status from Stripe */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'

/** Subscription row from dealer_subscriptions */
export interface SubscriptionRow {
  id: UUID
  dealer_id: UUID
  plan: PlanTier
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  current_period_start: ISODateString | null
  current_period_end: ISODateString | null
  cancel_at_period_end: boolean
  created_at: ISODateString
  updated_at: ISODateString
}

/** Credit balance for pay-per-use features */
export interface CreditBalanceRow {
  dealer_id: UUID
  credits: number
  last_purchase_at: ISODateString | null
}
