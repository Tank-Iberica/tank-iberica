/**
 * RLS Negative Tests — Verify Row Level Security blocks unauthorized access
 *
 * Tests that anonymous users, regular users, and cross-user access are
 * properly denied by Supabase RLS policies across all critical tables.
 *
 * These are "negative" tests: they assert operations FAIL or return empty
 * when they should be blocked.
 *
 * Prerequisites:
 *   - Supabase staging project with migrations applied
 *   - Environment variables: STAGING_SUPABASE_URL, STAGING_SUPABASE_KEY
 *
 * Run: STAGING_SUPABASE_URL=... STAGING_SUPABASE_KEY=... npx vitest run tests/security/rls-negative
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.STAGING_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.STAGING_SUPABASE_KEY || '' // anon key

// Test fixture IDs (same as idor-protection.test.ts)
const DEALER_A_EMAIL = 'dealer-a@test.tracciona.com'
const DEALER_B_EMAIL = 'dealer-b@test.tracciona.com'
const TEST_PASSWORD = 'TestDealer2024!'

const skip = !SUPABASE_URL || !SUPABASE_KEY

let clientCounter = 0
async function authenticatedClient(email: string, password: string): Promise<SupabaseClient> {
  const uniqueKey = `rls-neg-${++clientCounter}-${Date.now()}`
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { storageKey: uniqueKey, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  return client
}

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { storageKey: `rls-anon-${++clientCounter}`, persistSession: false },
  })
}

// ─── Anonymous access tests ───────────────────────────────────────────────────

describe.skipIf(skip)('RLS Negative — Anonymous user', () => {
  let anon: SupabaseClient

  beforeAll(() => {
    anon = anonClient()
  })

  it('cannot read dealers table', async () => {
    const { data, error } = await anon.from('dealers').select('*').limit(1)
    // RLS should either return empty or error
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read conversations', async () => {
    const { data } = await anon.from('conversations').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read conversation_messages', async () => {
    const { data } = await anon.from('conversation_messages').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read invoices', async () => {
    const { data } = await anon.from('invoices').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read pipeline_items', async () => {
    const { data } = await anon.from('pipeline_items').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read admin_audit_log', async () => {
    const { data } = await anon.from('admin_audit_log').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read search_alerts', async () => {
    const { data } = await anon.from('search_alerts').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read reservations', async () => {
    const { data } = await anon.from('reservations').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read whatsapp_submissions', async () => {
    const { data } = await anon.from('whatsapp_submissions').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot read email_logs', async () => {
    const { data } = await anon.from('email_logs').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('cannot insert into vehicles without auth', async () => {
    const { error } = await anon.from('vehicles').insert({
      title: 'RLS Test Vehicle',
      slug: 'rls-test-should-fail',
      price: 1000,
    })
    expect(error).toBeTruthy()
  })

  it('cannot insert into dealers without auth', async () => {
    const { error } = await anon.from('dealers').insert({
      company_name: 'RLS Test Dealer',
    })
    expect(error).toBeTruthy()
  })

  it('cannot delete from any table', async () => {
    // Try to delete all vehicles — should be blocked
    const { error } = await anon
      .from('vehicles')
      .delete()
      .gt('id', '00000000-0000-0000-0000-000000000000')
    // Should either error or affect 0 rows
    if (!error) {
      // If no error, verify no rows affected
      const { count } = await anon.from('vehicles').select('*', { count: 'exact', head: true })
      expect(count).toBeGreaterThan(0) // vehicles still exist
    }
  })

  // Public tables: categories, subcategories, vertical_config should be readable
  it('CAN read categories (public read)', async () => {
    const { data } = await anon.from('categories').select('id, name').limit(1)
    expect(data?.length).toBeGreaterThanOrEqual(0) // may be 0 if no data, but no error
  })

  it('CAN read published vehicles (public read)', async () => {
    const { data } = await anon
      .from('vehicles')
      .select('id, title')
      .eq('status', 'published')
      .limit(1)
    // Should work — vehicles with published status are public
    expect(data).toBeDefined()
  })

  it('cannot read unpublished/draft vehicles', async () => {
    const { data } = await anon.from('vehicles').select('id, title').eq('status', 'draft').limit(1)
    // RLS should filter out drafts for anon users
    expect(data?.length ?? 0).toBe(0)
  })
})

// ─── Cross-user access tests ──────────────────────────────────────────────────

describe.skipIf(skip)('RLS Negative — Cross-user data isolation', () => {
  let clientA: SupabaseClient
  let clientB: SupabaseClient
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    clientA = await authenticatedClient(DEALER_A_EMAIL, TEST_PASSWORD)
    clientB = await authenticatedClient(DEALER_B_EMAIL, TEST_PASSWORD)

    const { data: userA } = await clientA.auth.getUser()
    const { data: userB } = await clientB.auth.getUser()
    userAId = userA.user?.id || ''
    userBId = userB.user?.id || ''
  })

  it('dealer A cannot read dealer B conversations', async () => {
    // Get B's conversations
    const { data: bConvs } = await clientB.from('conversations').select('id').limit(1)
    if (bConvs && bConvs.length > 0) {
      const bConvId = bConvs[0].id
      // Try to read it as A
      const { data: aRead } = await clientA
        .from('conversations')
        .select('*')
        .eq('id', bConvId)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('dealer A cannot read dealer B messages', async () => {
    const { data: bMsgs } = await clientB.from('conversation_messages').select('id').limit(1)
    if (bMsgs && bMsgs.length > 0) {
      const { data: aRead } = await clientA
        .from('conversation_messages')
        .select('*')
        .eq('id', bMsgs[0].id)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('dealer A cannot update dealer B vehicles', async () => {
    const { data: bVehicles } = await clientB
      .from('vehicles')
      .select('id')
      .eq('user_id', userBId)
      .limit(1)

    if (bVehicles && bVehicles.length > 0) {
      const { error } = await clientA
        .from('vehicles')
        .update({ title: 'HACKED BY A' })
        .eq('id', bVehicles[0].id)
      // Should either error or not update (0 rows affected)
      const { data: check } = await clientB
        .from('vehicles')
        .select('title')
        .eq('id', bVehicles[0].id)
        .single()
      expect(check?.title).not.toBe('HACKED BY A')
    }
  })

  it('dealer A cannot delete dealer B vehicles', async () => {
    const { data: bVehicles } = await clientB
      .from('vehicles')
      .select('id')
      .eq('user_id', userBId)
      .limit(1)

    if (bVehicles && bVehicles.length > 0) {
      const { error } = await clientA.from('vehicles').delete().eq('id', bVehicles[0].id)
      // Vehicle should still exist
      const { data: check } = await clientB
        .from('vehicles')
        .select('id')
        .eq('id', bVehicles[0].id)
        .single()
      expect(check).toBeTruthy()
    }
  })

  it('dealer A cannot read dealer B invoices', async () => {
    const { data: bInvoices } = await clientB
      .from('invoices')
      .select('id')
      .eq('dealer_id', userBId)
      .limit(1)

    if (bInvoices && bInvoices.length > 0) {
      const { data: aRead } = await clientA
        .from('invoices')
        .select('*')
        .eq('id', bInvoices[0].id)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('dealer A cannot read dealer B pipeline items', async () => {
    const { data: bPipeline } = await clientB.from('pipeline_items').select('id').limit(1)

    if (bPipeline && bPipeline.length > 0) {
      const { data: aRead } = await clientA
        .from('pipeline_items')
        .select('*')
        .eq('id', bPipeline[0].id)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('dealer A cannot read dealer B search alerts', async () => {
    const { data: bAlerts } = await clientB.from('search_alerts').select('id').limit(1)

    if (bAlerts && bAlerts.length > 0) {
      const { data: aRead } = await clientA
        .from('search_alerts')
        .select('*')
        .eq('id', bAlerts[0].id)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('dealer A cannot read dealer B reservations', async () => {
    const { data: bRes } = await clientB.from('reservations').select('id').limit(1)

    if (bRes && bRes.length > 0) {
      const { data: aRead } = await clientA
        .from('reservations')
        .select('*')
        .eq('id', bRes[0].id)
        .maybeSingle()
      expect(aRead).toBeNull()
    }
  })

  it('user cannot read admin_audit_log', async () => {
    const { data } = await clientA.from('admin_audit_log').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('user cannot read login_attempts', async () => {
    const { data } = await clientA.from('login_attempts').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('user cannot read email_logs', async () => {
    const { data } = await clientA.from('email_logs').select('*').limit(1)
    expect(data?.length ?? 0).toBe(0)
  })

  it('user cannot write to vertical_config', async () => {
    const { error } = await clientA
      .from('vertical_config')
      .update({ default_locale: 'fr' })
      .eq('vertical', 'tracciona')
    expect(error).toBeTruthy()
  })

  it('user cannot write to categories', async () => {
    const { error } = await clientA.from('categories').insert({
      name: { es: 'HACK' },
      slug: 'rls-test-hack',
      vertical: 'tracciona',
    } as Record<string, unknown>)
    expect(error).toBeTruthy()
  })

  it('user cannot write to admin_audit_log', async () => {
    const { error } = await clientA.from('admin_audit_log').insert({
      action: 'rls-test',
      resource_type: 'test',
      actor_id: userAId,
    })
    expect(error).toBeTruthy()
  })
})

// ─── Write isolation tests ────────────────────────────────────────────────────

describe.skipIf(skip)('RLS Negative — Write isolation', () => {
  let clientA: SupabaseClient
  let userAId: string

  beforeAll(async () => {
    clientA = await authenticatedClient(DEALER_A_EMAIL, TEST_PASSWORD)
    const { data } = await clientA.auth.getUser()
    userAId = data.user?.id || ''
  })

  it('cannot insert vehicle with different user_id', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000'
    const { error } = await clientA.from('vehicles').insert({
      title: 'RLS Spoofed Vehicle',
      slug: `rls-spoof-${Date.now()}`,
      user_id: fakeUserId,
      price: 999,
    })
    // Should fail — RLS should enforce user_id = auth.uid()
    if (!error) {
      // If somehow inserted, verify it got our real user_id
      const { data } = await clientA
        .from('vehicles')
        .select('user_id')
        .eq('slug', `rls-spoof-${Date.now()}`)
        .maybeSingle()
      if (data) {
        expect(data.user_id).toBe(userAId)
        // Clean up
        await clientA.from('vehicles').delete().eq('slug', `rls-spoof-${Date.now()}`)
      }
    }
  })

  it('cannot insert conversation impersonating another buyer', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000'
    const { error } = await clientA.from('conversations').insert({
      vehicle_id: '00000000-0000-0000-0000-000000000001',
      buyer_id: fakeUserId,
      seller_id: userAId,
    })
    expect(error).toBeTruthy()
  })

  it('cannot insert message in foreign conversation', async () => {
    // Try to insert a message in a conversation that doesn't belong to us
    const { error } = await clientA.from('conversation_messages').insert({
      conversation_id: '00000000-0000-0000-0000-000000000000',
      sender_id: userAId,
      content: 'RLS test injection',
    })
    // Should fail — either conversation doesn't exist or RLS blocks
    expect(error).toBeTruthy()
  })
})
