/**
 * WhatsApp Submission Processor (POST)
 *
 * Processes a WhatsApp submission using AI Vision:
 * 1. Downloads images from WhatsApp Media API
 * 2. Sends images + text to AI Vision for analysis
 * 3. Uploads images to Cloudinary
 * 4. Creates a draft vehicle in Supabase
 * 5. Notifies the dealer via WhatsApp
 *
 * POST /api/whatsapp/process
 * Body: { submissionId: string }
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defineEventHandler, getHeader, getRequestIP } from 'h3'
import { z } from 'zod'
import { processWhatsAppSubmission, sanitizeSlug } from '~~/server/services/whatsappProcessor'
import { validateBody } from '~~/server/utils/validateBody'
import { logger } from '../../utils/logger'

const processSchema = z.object({
  submissionId: z.string().uuid('submissionId must be a valid UUID'),
  turnstileToken: z.string().optional(),
})

async function verifyAccess(
  event: Parameters<typeof getHeader>[0],
  internalSecret: string | undefined,
  turnstileToken: string | undefined,
): Promise<void> {
  const internalHeader = getHeader(event, 'x-internal-secret')
  if (internalSecret && internalHeader === internalSecret) return
  if (turnstileToken) {
    const ip = getRequestIP(event, { xForwardedFor: true }) || undefined
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      throw safeError(403, 'CAPTCHA verification failed')
    }
    return
  }
  throw safeError(401, 'Unauthorized')
}

async function createPlaceholderVehicle(
  supabase: SupabaseClient,
  submissionId: string,
): Promise<{ vehicleId: string }> {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({
      brand: 'Pendiente',
      model: 'WhatsApp',
      slug: sanitizeSlug(`whatsapp-${Date.now()}`),
      category: 'venta' as const,
      status: 'draft' as const,
      dealer_id: null,
      description_es: 'Vehiculo enviado por WhatsApp (pendiente de procesar)',
      description_en: 'Vehicle sent via WhatsApp (pending processing)',
      ai_generated: true,
      attributes_json: { source: 'whatsapp', submission_id: submissionId },
    } as never)
    .select('id, slug')
    .single()

  if (error || !vehicle) {
    throw safeError(500, 'Failed to create placeholder vehicle')
  }
  return { vehicleId: (vehicle as unknown as { id: string }).id }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole(event)

  const body = await validateBody(event, processSchema)

  await verifyAccess(event, config.cronSecret || process.env.CRON_SECRET, body.turnstileToken)

  // Dev mode: create placeholder if no AI key configured
  if (!config.anthropicApiKey && !process.env.OPENAI_API_KEY) {
    logger.warn('[WhatsApp Process] No AI API keys — creating placeholder vehicle')
    const { vehicleId } = await createPlaceholderVehicle(supabase, body.submissionId)
    return { status: 'processed', vehicleId, dev: true }
  }

  try {
    const result = await processWhatsAppSubmission(body.submissionId, supabase)
    return { status: 'processed', ...result }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw safeError(500, `Processing failed: ${message}`)
  }
})
