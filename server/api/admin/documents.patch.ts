/**
 * PATCH /api/admin/documents
 *
 * Update a dealer document (status, notes, expiry).
 * Admin-only endpoint.
 *
 * Body: { id: UUID, status?, notes?, expires_at?, title? }
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
  title: z.string().min(1).max(255).optional(),
  notes: z.string().max(2000).optional(),
  expires_at: z.string().datetime().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') throw safeError(403, 'Forbidden')

  const body = await validateBody(event, updateDocumentSchema)
  const { id, ...fields } = body

  if (Object.keys(fields).length === 0) {
    throw safeError(400, 'No fields to update')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: err } = await (supabase as any)
    .from('dealer_documents')
    .update(fields as Record<string, unknown>)
    .eq('id', id)
    .select('id, dealer_id, type, status, title, notes, expires_at, updated_at')
    .single()

  if (err) throw safeError(500, err.message)
  if (!data) throw safeError(404, 'Document not found')

  return data
})
