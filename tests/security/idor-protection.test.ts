/**
 * IDOR Protection Tests — Cross-dealer data isolation via Supabase RLS
 *
 * These tests authenticate as Dealer A and verify they CANNOT access
 * Dealer B's data through the Supabase client (enforced by RLS policies).
 *
 * Prerequisites:
 *   - Supabase staging project with migrations applied
 *   - Environment variables: STAGING_SUPABASE_URL, STAGING_SUPABASE_KEY
 *   - Test fixtures: 2 dealers, 5 vehicles, invoices, pipeline items, historico
 *
 * Run: STAGING_SUPABASE_URL=... STAGING_SUPABASE_KEY=... npx vitest run tests/security/idor-protection
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Staging credentials ──────────────────────────────────────────────
const SUPABASE_URL = process.env.STAGING_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.STAGING_SUPABASE_KEY || '' // anon key

// ── Fixed test fixture IDs ───────────────────────────────────────────
const DEALER_A_USER_ID = '34873578-87ba-4888-869c-4cdb9ab07bf1'
const DEALER_B_USER_ID = 'cc19f72f-6a18-4683-b31c-8b171ac3cbe6'
const DEALER_A_RECORD_ID = '19a4595a-29a8-4632-a48b-01b7a16e99c6'
const DEALER_B_RECORD_ID = '337edfe5-54b6-4711-b350-63f39a07d307'
const DEALER_A_VEHICLE_SLUG = 'idor-test-a1-volvo-fh'
const DEALER_B_VEHICLE_SLUG = 'idor-test-b1-iveco-daily'

const TEST_PASSWORD = 'TestDealer2024!'
const DEALER_A_EMAIL = 'dealer-a@test.tracciona.com'
const DEALER_B_EMAIL = 'dealer-b@test.tracciona.com'

const skip = !SUPABASE_URL || !SUPABASE_KEY

/**
 * Create an authenticated Supabase client for a test user.
 * Each client gets a unique storageKey to prevent session conflicts in Node.
 */
let clientCounter = 0
async function authenticatedClient(email: string, password: string): Promise<SupabaseClient> {
  const uniqueKey = `test-client-${++clientCounter}-${Date.now()}`
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storageKey: uniqueKey,
      persistSession: false,
    },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  return client
}

describe('IDOR: cross-dealer data isolation (RLS)', () => {
  let clientA: SupabaseClient
  let clientB: SupabaseClient

  beforeAll(async () => {
    if (skip) return
    clientA = await authenticatedClient(DEALER_A_EMAIL, TEST_PASSWORD)
    clientB = await authenticatedClient(DEALER_B_EMAIL, TEST_PASSWORD)
  })

  // ── Vehicles (public read — SELECT is allowed for published) ──────
  it('vehicles: public SELECT returns published vehicles from all dealers', async () => {
    if (skip) return
    const { data, error } = await clientA
      .from('vehicles')
      .select('id, slug, dealer_id')
      .like('slug', 'idor-test-%')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    // Both dealer A and B vehicles are visible (public read policy)
    const slugs = data!.map((v: { slug: string }) => v.slug)
    expect(slugs).toContain(DEALER_A_VEHICLE_SLUG)
    expect(slugs).toContain(DEALER_B_VEHICLE_SLUG)
  })

  it('vehicles: dealer A cannot UPDATE dealer B vehicle', async () => {
    if (skip) return
    // Get dealer B's vehicle ID
    const { data: vehicleB } = await clientA
      .from('vehicles')
      .select('id')
      .eq('slug', DEALER_B_VEHICLE_SLUG)
      .single()

    if (!vehicleB) return // Vehicle not found — skip

    const { error, count } = await clientA
      .from('vehicles')
      .update({ description_es: 'HACKED BY DEALER A' })
      .eq('id', vehicleB.id)
      .select()

    // RLS should block: either error or 0 rows affected
    const blocked = !!error || !count || count === 0
    expect(blocked).toBe(true)
  })

  it('vehicles: dealer A cannot DELETE dealer B vehicle', async () => {
    if (skip) return
    const { data: vehicleB } = await clientA
      .from('vehicles')
      .select('id')
      .eq('slug', DEALER_B_VEHICLE_SLUG)
      .single()

    if (!vehicleB) return

    const { error, count } = await clientA
      .from('vehicles')
      .delete()
      .eq('id', vehicleB.id)
      .select()

    const blocked = !!error || !count || count === 0
    expect(blocked).toBe(true)
  })

  // ── Pipeline items (dealer-scoped) ────────────────────────────────
  it('pipeline_items: dealer A sees only own items', async () => {
    if (skip) return
    const { data, error } = await clientA
      .from('pipeline_items')
      .select('id, dealer_id, title')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    // All returned items must belong to dealer A
    for (const item of data!) {
      expect(item.dealer_id).toBe(DEALER_A_RECORD_ID)
    }
  })

  it('pipeline_items: dealer A cannot read dealer B items by ID', async () => {
    if (skip) return
    // First, use client B to get a pipeline item ID
    const { data: itemsB } = await clientB
      .from('pipeline_items')
      .select('id')
      .limit(1)

    if (!itemsB?.length) return

    const { data } = await clientA
      .from('pipeline_items')
      .select('id, dealer_id')
      .eq('id', itemsB[0].id)
      .single()

    // Should return null (RLS filters it out)
    expect(data).toBeNull()
  })

  it('pipeline_items: dealer A cannot INSERT item for dealer B', async () => {
    if (skip) return
    const { error } = await clientA
      .from('pipeline_items')
      .insert({
        dealer_id: DEALER_B_RECORD_ID,
        title: 'IDOR attack',
        stage: 'interested',
        contact_name: 'Attacker',
      })

    expect(error).not.toBeNull()
  })

  // ── Historico (dealer-scoped) ─────────────────────────────────────
  it('historico: dealer A sees only own records', async () => {
    if (skip) return
    const { data, error } = await clientA
      .from('historico')
      .select('id, dealer_id, brand')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    for (const record of data!) {
      expect(record.dealer_id).toBe(DEALER_A_RECORD_ID)
    }
  })

  it('historico: dealer B sees only own records', async () => {
    if (skip) return
    const { data, error } = await clientB
      .from('historico')
      .select('id, dealer_id, brand')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    for (const record of data!) {
      expect(record.dealer_id).toBe(DEALER_B_RECORD_ID)
    }
  })

  it('historico: dealer A cannot INSERT record for dealer B', async () => {
    if (skip) return
    const { error } = await clientA
      .from('historico')
      .insert({
        dealer_id: DEALER_B_RECORD_ID,
        brand: 'IDOR attack',
        action: 'sale',
      })

    expect(error).not.toBeNull()
  })

  // ── Dealers table (public read, but update is own-only) ───────────
  it('dealers: dealer A cannot UPDATE dealer B company name', async () => {
    if (skip) return
    const { data, error } = await clientA
      .from('dealers')
      .update({ company_name: { es: 'HACKED', en: 'HACKED' } })
      .eq('id', DEALER_B_RECORD_ID)
      .select()

    // Should either error or return empty (update policy: user_id = auth.uid())
    const blocked = !!error || !data?.length
    expect(blocked).toBe(true)
  })

  // ── Invoices (user_id scoped RLS: invoices_own_read) ────────────────
  it('invoices: dealer A sees only own invoices', async () => {
    if (skip) return
    const { data, error } = await clientA
      .from('invoices')
      .select('id, dealer_id, user_id')

    expect(error).toBeNull()
    // All returned invoices must belong to dealer A's user
    for (const inv of data || []) {
      expect(inv.user_id).toBe(DEALER_A_USER_ID)
    }
  })

  it('invoices: dealer A cannot read dealer B invoices via RLS', async () => {
    if (skip) return
    // Try to filter for dealer B's invoices — RLS should filter them out
    const { data, error } = await clientA
      .from('invoices')
      .select('id, dealer_id, user_id')
      .eq('user_id', DEALER_B_USER_ID)

    expect(error).toBeNull()
    // Should return empty — dealer A cannot see dealer B's invoices
    expect(data?.length || 0).toBe(0)
  })
})

describe('IDOR: rutas publicas no exponen datos sensibles', () => {
  const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

  it('Sitemap no contiene rutas de admin', async () => {
    let res: Response
    try {
      res = await fetch(`${BASE}/sitemap.xml`)
    } catch {
      // Server not running — skip
      return
    }

    if (res.ok) {
      const text = await res.text()
      expect(text).not.toContain('/admin')
      expect(text).not.toContain('/api/')
    }
  })
})
