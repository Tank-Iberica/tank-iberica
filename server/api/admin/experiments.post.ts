/**
 * POST /api/admin/experiments
 *
 * Create or update an experiment.
 * Admin-only endpoint.
 *
 * Body:
 * - key: string (required for create)
 * - name: string (required for create)
 * - description?: string
 * - variants?: Array<{id: string, weight: number}>
 * - target_sample_size?: number
 * - status?: 'draft' | 'active' | 'paused' | 'completed'
 * - id?: string (if provided, updates existing)
 */
import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { validateBody } from '../../utils/validateBody'

const variantSchema = z.object({
  id: z.string().min(1),
  weight: z.number().positive(),
})

const experimentSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).optional(),
  variants: z.array(variantSchema).min(2).optional(),
  target_sample_size: z.number().int().positive().max(10_000_000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const body = await validateBody(event, experimentSchema)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = serverSupabaseServiceRole(event) as any

  // Update existing experiment
  if (body.id) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === 'completed') {
        updates.ended_at = new Date().toISOString()
      }
    }
    if (body.variants !== undefined) {
      updates.variants = body.variants
    }
    if (body.target_sample_size !== undefined) {
      updates.target_sample_size = body.target_sample_size
    }

    const { data, error } = await client
      .from('experiments')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update experiment: ${error.message}`,
      })
    }
    return { experiment: data }
  }

  // Create new experiment
  if (!body.key || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'key and name are required for creating an experiment',
    })
  }

  const variants = body.variants || [
    { id: 'control', weight: 50 },
    { id: 'variant_a', weight: 50 },
  ]

  const { data, error } = await client
    .from('experiments')
    .insert({
      key: body.key,
      name: body.name,
      description: body.description || null,
      status: body.status || 'draft',
      variants,
      target_sample_size: body.target_sample_size || 1000,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: `Experiment with key "${body.key}" already exists`,
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create experiment: ${error.message}`,
    })
  }

  return { experiment: data }
})
