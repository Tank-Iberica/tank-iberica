/**
 * RBAC Utilities — Server-side role checking
 *
 * Usage in route handlers:
 *   const user = await requireRole(event, 'admin')
 *   const user = await requirePermission(event, 'vehicles', 'update')
 */

import { createError, type H3Event } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export type Role = 'super_admin' | 'admin' | 'editor' | 'viewer'
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage'

interface UserWithRoles {
  id: string
  roles: Role[]
}

/**
 * Get authenticated user with their roles.
 * Throws 401 if not authenticated.
 */
export async function getUserWithRoles(event: H3Event): Promise<UserWithRoles> {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', user.id)

  const roles = (roleRows ?? []).map((r: { role: string }) => r.role as Role)

  return { id: user.id, roles }
}

/**
 * Require user to have a specific role.
 * Throws 403 if role is missing.
 */
export async function requireRole(event: H3Event, requiredRole: Role): Promise<UserWithRoles> {
  const user = await getUserWithRoles(event)

  // super_admin always passes
  if (user.roles.includes('super_admin')) return user

  // Role hierarchy: admin > editor > viewer
  const ROLE_HIERARCHY: Record<Role, number> = {
    super_admin: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  }

  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  const maxLevel = Math.max(0, ...user.roles.map((r) => ROLE_HIERARCHY[r] ?? 0))

  if (maxLevel < requiredLevel) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: { error: `Requires role: ${requiredRole}` },
    })
  }

  return user
}

/**
 * Require user to have a specific permission on a resource.
 * Uses the has_permission() DB function.
 */
export async function requirePermission(
  event: H3Event,
  resource: string,
  action: Action,
): Promise<UserWithRoles> {
  const user = await getUserWithRoles(event)

  // super_admin always passes
  if (user.roles.includes('super_admin')) return user

  const supabase = serverSupabaseServiceRole(event)
  const { data } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_resource: resource,
    p_action: action,
  })

  if (!data) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: { error: `No ${action} permission on ${resource}` },
    })
  }

  return user
}
