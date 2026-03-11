/**
 * Dealer domain types — shared between client and server.
 *
 * Consolidates the DealerRow interface previously duplicated in:
 * - server/api/cron/dealer-weekly-stats.post.ts
 * - server/api/cron/founding-expiry.post.ts
 * - server/api/whatsapp/webhook.post.ts
 * - server/api/widget/[dealerId].get.ts
 * - server/routes/embed/[dealer-slug].get.ts
 */

import type { ISODateString, UUID, UserRole } from './common'

/** Core dealer row as stored in the `dealers` table */
export interface DealerRow {
  id: UUID
  user_id: UUID
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  location: string | null
  phone: string | null
  whatsapp_phone: string | null
  email: string | null
  website: string | null
  verified: boolean
  rating: number | null
  review_count: number
  plan: string | null
  subscription_status: string | null
  subscription_id: string | null
  stripe_customer_id: string | null
  stripe_account_id: string | null
  founding_member: boolean
  founding_locked_until: ISODateString | null
  active_vehicles: number
  total_leads: number
  vertical: string
  custom_branding: Record<string, unknown> | null
  created_at: ISODateString
  updated_at: ISODateString
}

/** Public-facing dealer profile (no sensitive fields) */
export interface DealerPublicProfile {
  id: UUID
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  location: string | null
  phone: string | null
  website: string | null
  verified: boolean
  rating: number | null
}

/** Dealer user row (joined with auth.users) */
export interface DealerUserRow {
  id: UUID
  email: string
  name: string | null
  role: UserRole
  dealer_id: UUID | null
}
