/**
 * POST /api/admin/documents
 *
 * Create a new dealer document record.
 * Admin-only endpoint.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const createDocumentSchema = z.object({
  dealer_id: z.string().uuid(),
  type: z.enum(['invoice', 'contract', 'certificate', 'insurance', 'license', 'other']),
  title: z.string().min(1).max(255),
  file_url: z.string().url(),
  file_size_bytes: z.number().int().positive().optional(),
  mime_type: z.string().max(128).optional(),
  notes: z.string().max(2000).optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') throw safeError(403, 'Forbidden')

  const body = await validateBody(event, createDocumentSchema)

  // Verify dealer exists
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id')
    .eq('id', body.dealer_id)
    .single()

  if (!dealer) throw safeError(404, 'Dealer not found')

  const { data, error: err } = await supabase
    .from('dealer_documents')
    .insert({
      ...body,
      metadata: (body.metadata as import('~/types/database.types').Json) ?? undefined,
      uploaded_by: user.id,
    })
    .select('id, dealer_id, type, status, title, file_url, created_at')
    .single()

  if (err) throw safeError(500, err.message)

  return data
})
