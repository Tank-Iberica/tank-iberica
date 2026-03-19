/**
 * PATCH /api/admin/crm-pipeline
 *
 * Move a CRM pipeline item to a different stage.
 * Admin-only. Records stage history.
 *
 * Body: { id: UUID, stage?: string, notes?, next_action_date?, next_action_desc? }
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const updatePipelineSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(['contacted', 'demo', 'negotiating', 'closed', 'lost']).optional(),
  notes: z.string().max(5000).optional(),
  next_action_date: z.string().optional().nullable(),
  next_action_desc: z.string().max(500).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') throw safeError(403, 'Forbidden')

  const body = await validateBody(event, updatePipelineSchema)
  const { id, ...fields } = body

  if (Object.keys(fields).length === 0) {
    throw safeError(400, 'No fields to update')
  }

  // If stage is changing, record history
  if (fields.stage) {
    // Get current stage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (supabase as any)
      .from('crm_pipeline')
      .select('stage')
      .eq('id', id)
      .single()

    if (current && (current as Record<string, unknown>).stage !== fields.stage) {
      // Record history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('crm_pipeline_history').insert({
        pipeline_id: id,
        from_stage: (current as Record<string, unknown>).stage,
        to_stage: fields.stage,
        changed_by: user.id,
        notes: fields.notes || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // Update entered_stage_at
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(fields as any).entered_stage_at = new Date().toISOString()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: err } = await (supabase as any)
    .from('crm_pipeline')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(fields as any)
    .eq('id', id)
    .select(
      'id, dealer_id, stage, notes, next_action_date, next_action_desc, entered_stage_at, updated_at',
    )
    .single()

  if (err) throw safeError(500, err.message)
  if (!data) throw safeError(404, 'Pipeline item not found')

  return data
})
