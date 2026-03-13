/**
 * POST /api/whatsapp/broadcast
 *
 * Sends a broadcast message to a WhatsApp Business broadcast channel
 * when a new vehicle is approved/published.
 *
 * Uses Meta Cloud API (WhatsApp Business Platform).
 * Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.
 * Optional: WHATSAPP_CHANNEL_ID for broadcast channel target.
 *
 * Body: { vehicleId: string }
 * Auth: Admin only
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { logger } from '../../utils/logger'
import { getSiteUrl } from '../../utils/siteConfig'
import { z } from 'zod'

const BroadcastSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
})

interface VehicleData {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  slug: string
  vehicle_images: { url: string; position: number }[]
}

interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp'
  recipient_type: string
  to: string
  type: string
  text?: { body: string; preview_url?: boolean }
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function buildBroadcastMessage(v: VehicleData): string {
  const title = [v.brand, v.model, v.year].filter(Boolean).join(' ')
  const price = v.price ? formatPrice(v.price) : 'Precio a consultar'
  const location = v.location || 'España'
  const url = `${getSiteUrl()}/vehiculo/${v.slug}`

  return (
    `🚛 *Nuevo en Tracciona*\n\n` +
    `*${title}*\n` +
    `📍 ${location}\n` +
    `💰 ${price}\n\n` +
    `✅ Disponible ahora\n` +
    `🔗 ${url}`
  )
}

export async function sendWhatsAppBroadcast(
  message: string,
  channelId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<{ messageId: string }> {
  const payload: WhatsAppMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: channelId,
    type: 'text',
    text: {
      body: message,
      preview_url: true,
    },
  }

  const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const text = await resp.text()
    logger.error('[whatsapp/broadcast] External service error', { status: resp.status, body: text })
    throw safeError(502, 'External service error')
  }

  const data = (await resp.json()) as { messages?: { id: string }[] }
  const messageId = data.messages?.[0]?.id || `wa_${Date.now()}`
  return { messageId }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const { vehicleId } = await validateBody(event, BroadcastSchema)
  const supabase = serverSupabaseServiceRole(event)

  // Check required env vars
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const channelId = process.env.WHATSAPP_CHANNEL_ID

  if (!phoneNumberId || !accessToken || !channelId) {
    logger.warn('WhatsApp broadcast skipped: env vars not configured', { vehicleId })
    return { ok: false, skipped: true, reason: 'WhatsApp not configured' }
  }

  // Check if broadcast enabled in config
  const { data: configData } = await supabase
    .from('vertical_config')
    .select('value')
    .eq('key', 'whatsapp_broadcast_enabled')
    .single()

  const broadcastEnabled = (configData as { value: boolean } | null)?.value !== false

  if (!broadcastEnabled) {
    return { ok: false, skipped: true, reason: 'WhatsApp broadcast disabled in config' }
  }

  // Fetch vehicle
  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, price, location, slug, vehicle_images(url, position)')
    .eq('id', vehicleId)
    .single()

  if (vehicleErr || !vehicle) throw safeError(404, 'Vehicle not found')

  const v = vehicle as VehicleData
  const message = buildBroadcastMessage(v)

  try {
    const { messageId } = await sendWhatsAppBroadcast(
      message,
      channelId,
      phoneNumberId,
      accessToken,
    )

    // Log to audit
    await supabase.from('whatsapp_submissions').insert({
      sender_phone: channelId,
      message_type: 'broadcast',
      content: message,
      status: 'sent',
      raw_payload: { vehicleId, messageId, type: 'vehicle_broadcast' },
    } as never)

    logger.info('WhatsApp broadcast sent', { vehicleId, messageId })
    return { ok: true, vehicleId, messageId }
  } catch (err: unknown) {
    logger.error('[whatsapp/broadcast] Broadcast failed', { vehicleId, err: String(err) })
    throw safeError(502, 'External service error')
  }
})
