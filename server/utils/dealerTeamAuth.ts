/**
 * Dealer team authorization utilities.
 *
 * RBAC per dealer: owner (full), manager (edit vehicles/leads), viewer (read-only).
 * Uses dealer_team_members table + check_dealer_permission RPC.
 *
 * D17 — Multi-user dealer accounts
 */
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { logger } from './logger'

export type DealerTeamRole = 'owner' | 'manager' | 'viewer'

export interface DealerTeamMember {
  id: number
  dealer_id: string
  user_id: string | null
  email: string
  role: DealerTeamRole
  status: 'pending' | 'active' | 'revoked'
  invite_token: string | null
  invited_by: string | null
  invited_at: string
  accepted_at: string | null
  revoked_at: string | null
}

const ROLE_HIERARCHY: Record<DealerTeamRole, number> = {
  owner: 3,
  manager: 2,
  viewer: 1,
}

/**
 * Check if the current user has the required role for a dealer.
 * Throws 403 if insufficient permissions.
 */
export async function requireDealerRole(
  event: H3Event,
  dealerId: string,
  requiredRole: DealerTeamRole = 'viewer',
): Promise<DealerTeamMember> {
  const client = useSupabaseServiceClient(event)
  const userId = getUserIdFromEvent(event)

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const { data: member, error } = await client
    .from('dealer_team_members')
    .select(
      'id, dealer_id, user_id, email, role, status, invite_token, invited_by, invited_at, accepted_at, revoked_at',
    )
    .eq('dealer_id', dealerId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !member) {
    logger.warn('[dealerTeam] Access denied — not a team member', { userId, dealerId })
    throw createError({ statusCode: 403, statusMessage: 'No access to this dealer account' })
  }

  const typedMember = member as unknown as DealerTeamMember
  const userLevel = ROLE_HIERARCHY[typedMember.role] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0

  if (userLevel < requiredLevel) {
    logger.warn('[dealerTeam] Insufficient role', {
      userId,
      dealerId,
      userRole: typedMember.role,
      requiredRole,
    })
    throw createError({
      statusCode: 403,
      statusMessage: `Requires "${requiredRole}" role. You have "${typedMember.role}".`,
    })
  }

  return typedMember
}

/**
 * Get all team members for a dealer.
 * Requires at least viewer role.
 */
export async function getDealerTeamMembers(
  event: H3Event,
  dealerId: string,
): Promise<DealerTeamMember[]> {
  await requireDealerRole(event, dealerId, 'viewer')

  const client = useSupabaseServiceClient(event)
  const { data, error } = await client
    .from('dealer_team_members')
    .select(
      'id, dealer_id, user_id, email, role, status, invite_token, invited_by, invited_at, accepted_at, revoked_at',
    )
    .eq('dealer_id', dealerId)
    .order('role', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to load team: ${error.message}` })
  }

  return (data || []) as unknown as DealerTeamMember[]
}

/**
 * Invite a team member to a dealer account.
 * Requires owner role.
 */
export async function inviteDealerTeamMember(
  event: H3Event,
  dealerId: string,
  email: string,
  role: DealerTeamRole = 'viewer',
): Promise<DealerTeamMember> {
  await requireDealerRole(event, dealerId, 'owner')
  const userId = getUserIdFromEvent(event)

  if (role === 'owner') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot invite as owner. Use ownership transfer.',
    })
  }

  const client = useSupabaseServiceClient(event)

  // Generate invite token
  const inviteToken = crypto.randomUUID()

  const { data, error } = await client
    .from('dealer_team_members')
    .insert({
      dealer_id: dealerId,
      email,
      role,
      status: 'pending',
      invite_token: inviteToken,
      invited_by: userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: `${email} is already a team member` })
    }
    throw createError({ statusCode: 500, statusMessage: `Failed to invite: ${error.message}` })
  }

  return data as unknown as DealerTeamMember
}

/**
 * Update a team member's role.
 * Requires owner role.
 */
export async function updateDealerTeamMemberRole(
  event: H3Event,
  dealerId: string,
  memberId: number,
  newRole: DealerTeamRole,
): Promise<DealerTeamMember> {
  await requireDealerRole(event, dealerId, 'owner')

  if (newRole === 'owner') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot assign owner role. Use ownership transfer.',
    })
  }

  const client = useSupabaseServiceClient(event)

  const { data, error } = await client
    .from('dealer_team_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('dealer_id', dealerId)
    .neq('role', 'owner') // Can't change owner's role
    .select()
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Team member not found or cannot modify owner',
    })
  }

  return data as unknown as DealerTeamMember
}

/**
 * Revoke a team member's access.
 * Requires owner role. Cannot revoke self (owner).
 */
export async function revokeDealerTeamMember(
  event: H3Event,
  dealerId: string,
  memberId: number,
): Promise<void> {
  const member = await requireDealerRole(event, dealerId, 'owner')
  const client = useSupabaseServiceClient(event)

  // Check we're not revoking the owner
  const { data: target } = await client
    .from('dealer_team_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('dealer_id', dealerId)
    .single()

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Team member not found' })
  }

  const typedTarget = target as unknown as { role: string; user_id: string }
  if (typedTarget.role === 'owner') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot revoke owner access' })
  }

  if (typedTarget.user_id === member.user_id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot revoke yourself' })
  }

  const { error } = await client
    .from('dealer_team_members')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('dealer_id', dealerId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to revoke: ${error.message}` })
  }
}

/**
 * Extract user ID from event (via JWT or session).
 */
function getUserIdFromEvent(event: H3Event): string | null {
  try {
    // Try to get from JWT/session
    const user = event.context.user
    if (user && typeof user === 'object' && 'id' in user) {
      return (user as { id: string }).id
    }
    return null
  } catch {
    return null
  }
}
