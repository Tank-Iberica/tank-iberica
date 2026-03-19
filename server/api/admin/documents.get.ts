/**
 * GET /api/admin/documents
 *
 * List dealer documents with optional filters.
 * Admin-only endpoint.
 *
 * Query params:
 *  - dealer_id?: UUID — filter by dealer
 *  - type?: dealer_document_type — filter by type
 *  - status?: dealer_document_status — filter by status
 *  - page?: number (default 1)
 *  - limit?: number (default 50, max 100)
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') throw safeError(403, 'Forbidden')

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const offset = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('dealer_documents')
    .select(
      'id, dealer_id, type, status, title, file_url, file_size_bytes, mime_type, notes, expires_at, created_at, updated_at',
      { count: 'exact' },
    )

  if (query.dealer_id) {
    q = q.eq('dealer_id', query.dealer_id as string)
  }
  if (query.type) {
    q = q.eq('type', query.type as string)
  }
  if (query.status) {
    q = q.eq('status', query.status as string)
  }

  const {
    data,
    error: err,
    count,
  } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  if (err) throw safeError(500, err.message)

  return {
    documents: data ?? [],
    total: count ?? 0,
    page,
    limit,
  }
})
