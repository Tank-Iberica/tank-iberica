/**
 * Dealer Repository — server-side data access layer for dealers.
 *
 * Centralizes query logic and column selection for dealer entities.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Columns safe to expose in public dealer profiles */
const PUBLIC_COLUMNS =
  'id, slug, name, description, logo_url, banner_url, location_city, location_province, location_country, phone, email, website, social_links, vertical, subscription_plan, is_verified, created_at'

/** Full columns for dealer management contexts */
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS}, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_expires_at, api_key, metadata, settings, updated_at`

export const dealerRepository = {
  /**
   * Find a single dealer by ID (full data for server/admin use).
   */
  findById(supabase: SupabaseClient, id: string) {
    return supabase.from('dealers').select(ADMIN_COLUMNS).eq('id', id).single()
  },

  /**
   * Find a single dealer by slug (public profile).
   */
  findBySlug(supabase: SupabaseClient, slug: string) {
    return supabase.from('dealers').select(PUBLIC_COLUMNS).eq('slug', slug).single()
  },

  /**
   * Find all dealers for a vertical (admin / cron contexts).
   */
  findByVertical(supabase: SupabaseClient, vertical: string) {
    return supabase
      .from('dealers')
      .select(ADMIN_COLUMNS)
      .eq('vertical', vertical)
      .order('created_at', { ascending: false })
  },

  /**
   * Find dealers with active subscriptions for a vertical.
   */
  findActive(supabase: SupabaseClient, vertical: string) {
    return supabase
      .from('dealers')
      .select(ADMIN_COLUMNS)
      .eq('vertical', vertical)
      .eq('subscription_status', 'active')
      .order('name', { ascending: true })
  },

  /**
   * Find a dealer by their Stripe customer ID (for webhook processing).
   */
  findByStripeCustomerId(supabase: SupabaseClient, customerId: string) {
    return supabase
      .from('dealers')
      .select(ADMIN_COLUMNS)
      .eq('stripe_customer_id', customerId)
      .single()
  },
}
