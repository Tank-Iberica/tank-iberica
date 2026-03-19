/**
 * Server-side A/B testing utilities.
 *
 * Works with the experiments/experiment_assignments/experiment_events tables
 * created in migration 00177_experiments_ab_testing.sql.
 *
 * Uses deterministic hashing for consistent variant assignment.
 */
import type { H3Event } from 'h3'
import { logger } from './logger'

export interface Experiment {
  id: string
  key: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'completed'
  variants: ExperimentVariant[]
  target_sample_size: number | null
  created_at: string
  updated_at: string
  ended_at: string | null
}

export interface ExperimentVariant {
  id: string
  weight: number
}

export interface ExperimentAssignment {
  experiment_id: string
  user_id: string | null
  anonymous_id: string | null
  variant_id: string
  assigned_at: string
}

export interface ExperimentResults {
  experiment: Experiment
  variants: VariantResult[]
  total_participants: number
  total_conversions: number
  overall_conversion_rate: number
}

export interface VariantResult {
  variant_id: string
  participants: number
  conversions: number
  conversion_rate: number
  participant_share: number
}

/**
 * Deterministic hash for consistent variant assignment.
 * Uses same approach as featureFlags.ts simpleHash.
 */
function deterministicHash(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.codePointAt(i) ?? 0
    hash = (hash << 5) - hash + char
    hash = hash | 0
  }
  return Math.abs(hash)
}

/**
 * Assign a user/visitor to an experiment variant.
 * Returns existing assignment if already assigned, otherwise creates new one.
 *
 * In-memory fallback when DB is unreachable (calls RPC assign_experiment).
 */
export async function assignExperiment(
  event: H3Event,
  experimentKey: string,
  userId?: string | null,
  anonymousId?: string | null,
): Promise<string | null> {
  if (!userId && !anonymousId) return null

  const client = useSupabaseServiceClient(event)

  try {
    const { data, error } = await client.rpc('assign_experiment', {
      p_experiment_key: experimentKey,
      p_user_id: userId || null,
      p_anonymous_id: anonymousId || null,
    })

    if (error) {
      logger.error('[experiments] RPC assign_experiment failed', {
        error: error.message,
        experimentKey,
      })
      // Fallback: in-memory deterministic assignment
      return fallbackAssign(experimentKey, userId, anonymousId)
    }

    return data as string | null
  } catch (err) {
    logger.error('[experiments] assignExperiment exception', { error: String(err) })
    return fallbackAssign(experimentKey, userId, anonymousId)
  }
}

/**
 * In-memory fallback for when DB is not available.
 * Returns a deterministic variant based on hash only (no persistence).
 */
function fallbackAssign(
  experimentKey: string,
  userId?: string | null,
  anonymousId?: string | null,
): string {
  const seed = `${experimentKey}:${userId || anonymousId || 'unknown'}`
  const hash = deterministicHash(seed) % 2
  return hash === 0 ? 'control' : 'variant_a'
}

/**
 * Track an experiment event (conversion, click, etc.)
 */
export async function trackExperimentEvent(
  event: H3Event,
  experimentKey: string,
  variantId: string,
  eventType: string,
  userId?: string | null,
  anonymousId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const client = useSupabaseServiceClient(event)

  try {
    // Look up experiment ID by key
    const { data: experiment } = await client
      .from('experiments')
      .select('id')
      .eq('key', experimentKey)
      .single()

    if (!experiment) return false

    const { error } = await client.from('experiment_events').insert({
      experiment_id: experiment.id,
      variant_id: variantId,
      event_type: eventType,
      user_id: userId || null,
      anonymous_id: anonymousId || null,
      metadata: metadata || {},
    })

    if (error) {
      logger.error('[experiments] trackEvent failed', { error: error.message })
      return false
    }
    return true
  } catch (err) {
    logger.error('[experiments] trackEvent exception', { error: String(err) })
    return false
  }
}

/**
 * Get experiment results with per-variant conversion rates.
 */
export async function getExperimentResults(
  event: H3Event,
  experimentKey: string,
): Promise<ExperimentResults | null> {
  const client = useSupabaseServiceClient(event)

  // Get experiment
  const { data: experiment, error: expError } = await client
    .from('experiments')
    .select(
      'id, key, name, description, status, variants, target_sample_size, created_at, updated_at, ended_at',
    )
    .eq('key', experimentKey)
    .single()

  if (expError || !experiment) return null

  // Get assignments count per variant
  const { data: assignments } = await client
    .from('experiment_assignments')
    .select('variant_id')
    .eq('experiment_id', experiment.id)

  // Get conversion events per variant
  const { data: conversions } = await client
    .from('experiment_events')
    .select('variant_id')
    .eq('experiment_id', experiment.id)
    .eq('event_type', 'conversion')

  const assignmentCounts = new Map<string, number>()
  const conversionCounts = new Map<string, number>()

  for (const a of assignments || []) {
    assignmentCounts.set(a.variant_id, (assignmentCounts.get(a.variant_id) || 0) + 1)
  }
  for (const c of conversions || []) {
    conversionCounts.set(c.variant_id, (conversionCounts.get(c.variant_id) || 0) + 1)
  }

  const totalParticipants = assignments?.length || 0
  const totalConversions = conversions?.length || 0

  const variants: VariantResult[] = (experiment.variants as ExperimentVariant[]).map((v) => {
    const participants = assignmentCounts.get(v.id) || 0
    const variantConversions = conversionCounts.get(v.id) || 0
    return {
      variant_id: v.id,
      participants,
      conversions: variantConversions,
      conversion_rate: participants > 0 ? variantConversions / participants : 0,
      participant_share: totalParticipants > 0 ? participants / totalParticipants : 0,
    }
  })

  return {
    experiment: experiment as Experiment,
    variants,
    total_participants: totalParticipants,
    total_conversions: totalConversions,
    overall_conversion_rate: totalParticipants > 0 ? totalConversions / totalParticipants : 0,
  }
}
