/**
 * POST /api/account/delete
 *
 * GDPR Right to Erasure — Account deletion endpoint.
 * Requires authenticated user. Anonymizes personal data,
 * archives dealer vehicles, deletes auth user, logs the action,
 * and sends confirmation email.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, createError } from 'h3'
import { verifyCsrf } from '../../utils/verifyCsrf'

interface DeleteAccountResponse {
  success: boolean
}

export default defineEventHandler(async (event): Promise<DeleteAccountResponse> => {
  // ── 1. Authenticate user ──────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  verifyCsrf(event)

  const userId = user.id
  const userEmail = user.email ?? ''
  const supabase = serverSupabaseServiceRole(event)
  const _internalSecret = useRuntimeConfig().cronSecret || process.env.CRON_SECRET

  // ── 2. Check if user has a dealer profile ─────────────────────────────────
  const { data: dealerData } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const dealerId = dealerData?.id as string | undefined

  // ── 3. If dealer: archive vehicles and anonymize dealer profile ───────────
  if (dealerId) {
    // Archive all active vehicles belonging to this dealer
    await supabase
      .from('vehicles')
      .update({ status: 'archived' })
      .eq('dealer_id', dealerId)
      .in('status', ['published', 'draft', 'reserved'])

    // Anonymize dealer profile
    await supabase
      .from('dealers')
      .update({
        company_name: 'Deleted Dealer',
        contact_email: null,
        contact_phone: null,
        website: null,
        description: null,
        logo_url: null,
        cover_url: null,
        status: 'deleted',
      })
      .eq('id', dealerId)
  }

  // ── 4. Anonymize user profile ─────────────────────────────────────────────
  await supabase
    .from('users')
    .update({
      name: null,
      apellidos: null,
      pseudonimo: 'Deleted User',
      phone: null,
      email: `deleted_${userId.slice(0, 8)}@tracciona.com`,
      avatar_url: null,
    })
    .eq('id', userId)

  // ── 5. Delete user data from related tables ───────────────────────────────
  // Delete favorites
  await supabase.from('favorites').delete().eq('user_id', userId)

  // Delete search alerts
  await supabase.from('search_alerts').delete().eq('user_id', userId)

  // Delete email preferences
  await supabase.from('email_preferences').delete().eq('user_id', userId)

  // ── 6. Anonymize leads ────────────────────────────────────────────────────
  // Anonymize leads sent by this user
  await supabase
    .from('leads')
    .update({
      buyer_name: 'Deleted User',
      buyer_email: null,
      buyer_phone: null,
    })
    .eq('user_id', userId)

  // ── 7. Log the deletion in consents table ─────────────────────────────────
  await supabase.from('consents').insert({
    user_id: userId,
    consent_type: 'account_deletion',
    granted: true,
    user_agent: event.node.req.headers['user-agent'] ?? null,
  })

  // ── 8. Send confirmation email ────────────────────────────────────────────
  if (userEmail) {
    try {
      await $fetch('/api/email/send', {
        method: 'POST',
        headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
        body: {
          templateKey: 'account_deleted',
          to: userEmail,
          userId,
          variables: {
            user_name: 'Usuario',
          },
        },
      })
    } catch {
      // Non-blocking: deletion still succeeds even if email fails
    }
  }

  // ── 9. Delete auth user via Supabase Admin API ────────────────────────────
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
  if (deleteAuthError) {
    // Log but don't fail — data has been anonymized already
    console.error(`[account/delete] Failed to delete auth user ${userId}:`, deleteAuthError.message)
  }

  return { success: true }
})
