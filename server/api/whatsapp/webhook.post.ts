/**
 * WhatsApp Webhook Receiver (POST)
 *
 * Receives incoming WhatsApp messages from Meta Cloud API.
 * Extracts sender info, text and image messages, then:
 * 1. Looks up the dealer by phone/whatsapp field
 * 2. Creates a whatsapp_submissions record
 * 3. Triggers async processing via /api/whatsapp/process
 * 4. Sends an auto-reply acknowledgment
 *
 * Returns 200 immediately as required by Meta.
 *
 * POST /api/whatsapp/webhook
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, readBody, readRawBody, getHeader } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'

// ── Meta Cloud API webhook payload types ──

interface WhatsAppWebhookPayload {
  object: string
  entry?: WhatsAppEntry[]
}

interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

interface WhatsAppChange {
  value: WhatsAppChangeValue
  field: string
}

interface WhatsAppChangeValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: WhatsAppContact[]
  messages?: WhatsAppMessage[]
  statuses?: unknown[]
}

interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type:
    | 'text'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'button'
    | 'reaction'
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
}

// ── Helpers ──

/** Normalize phone number: strip '+' and leading zeros, keep digits only */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Build all possible phone variants for lookup (with/without country code prefix) */
function phoneVariants(phone: string): string[] {
  const digits = normalizePhone(phone)
  const variants = new Set<string>()

  // Original normalized
  variants.add(digits)

  // With + prefix
  variants.add(`+${digits}`)

  // Without leading country code (try common: 34 for Spain)
  if (digits.startsWith('34') && digits.length > 9) {
    variants.add(digits.slice(2))
    variants.add(`+${digits}`)
  }

  // If it doesn't start with country code, add the 34 variant
  if (!digits.startsWith('34') && digits.length === 9) {
    variants.add(`34${digits}`)
    variants.add(`+34${digits}`)
  }

  return Array.from(variants)
}

interface DealerRow {
  id: string
  user_id: string | null
  phone: string | null
  whatsapp: string | null
  company_name: Record<string, string> | null
}

/**
 * Supabase REST helper for whatsapp_submissions (table not yet in generated types).
 * Uses direct REST API calls like the stripe webhook pattern.
 */
async function insertSubmission(
  supabaseUrl: string,
  supabaseKey: string,
  data: Record<string, unknown>,
): Promise<{ id: string } | null> {
  const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_submissions`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[WhatsApp Webhook] Failed to insert submission:', errorText)
    return null
  }

  const rows = (await response.json()) as { id: string }[]
  return rows[0] ?? null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  let payload: WhatsAppWebhookPayload

  // ── Signature verification (production) ─────────────────────────────────
  const appSecret = config.whatsappAppSecret || process.env.WHATSAPP_APP_SECRET

  if (appSecret && process.env.NODE_ENV === 'production') {
    // Read raw body for signature verification
    const rawBody = await readRawBody(event)
    if (!rawBody) {
      return { status: 'ok', error: 'empty_body' }
    }

    const signature = getHeader(event, 'x-hub-signature-256')
    if (!signature) {
      console.error('[WhatsApp Webhook] Missing x-hub-signature-256 header')
      return { status: 'ok', error: 'missing_signature' }
    }

    const expectedSignature =
      'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')

    try {
      const sigBuffer = Buffer.from(signature)
      const expectedBuffer = Buffer.from(expectedSignature)
      if (
        sigBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        console.error('[WhatsApp Webhook] Invalid signature')
        return { status: 'ok', error: 'invalid_signature' }
      }
    } catch {
      console.error('[WhatsApp Webhook] Signature comparison failed')
      return { status: 'ok', error: 'signature_error' }
    }

    try {
      payload = JSON.parse(rawBody) as WhatsAppWebhookPayload
    } catch {
      console.error('[WhatsApp Webhook] Failed to parse verified body')
      return { status: 'ok' }
    }
  } else {
    // Dev mode or no app secret: read body directly
    if (!config.whatsappApiToken) {
      const body = await readBody<WhatsAppWebhookPayload>(event)
      console.warn(
        '[WhatsApp Webhook] No API token configured (dev mode). Entries received:',
        body?.entry?.length ?? 0,
      )
      return { status: 'ok', dev: true }
    }

    try {
      payload = await readBody<WhatsAppWebhookPayload>(event)
    } catch {
      console.error('[WhatsApp Webhook] Failed to parse request body')
      return { status: 'ok' }
    }
  }

  // Meta sends various webhook types; we only care about 'whatsapp_business_account'
  if (payload.object !== 'whatsapp_business_account') {
    return { status: 'ok' }
  }

  const supabase = serverSupabaseServiceRole(event)

  // Get Supabase REST credentials for direct API calls (whatsapp_submissions not in types)
  const supabaseUrl = (process.env.SUPABASE_URL || '') as string
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '') as string

  // Process each entry/change
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue

      const value = change.value
      const messages = value.messages ?? []

      // Skip status updates (delivery receipts, read receipts)
      if (messages.length === 0) continue

      // Group messages by sender
      const senderPhone = messages[0]?.from
      if (!senderPhone) continue

      // Collect text and image data from all messages in this batch
      const textParts: string[] = []
      const mediaIds: string[] = []

      for (const msg of messages) {
        if (msg.type === 'text' && msg.text?.body) {
          textParts.push(msg.text.body)
        } else if (msg.type === 'image' && msg.image?.id) {
          mediaIds.push(msg.image.id)
          // Also capture image captions as text
          if (msg.image.caption) {
            textParts.push(msg.image.caption)
          }
        }
        // Other message types are ignored for now
      }

      // Skip if there's nothing useful
      if (textParts.length === 0 && mediaIds.length === 0) continue

      const textContent = textParts.join('\n').trim() || null

      try {
        // Look up dealer by phone or whatsapp field
        const variants = phoneVariants(senderPhone)
        let dealer: DealerRow | null = null

        // Try whatsapp field first
        const { data: waDealer } = await supabase
          .from('dealers')
          .select('id, user_id, phone, whatsapp, company_name')
          .in('whatsapp', variants)
          .limit(1)
          .single()

        if (waDealer) {
          dealer = waDealer as unknown as DealerRow
        } else {
          // Fallback: try phone field
          const { data: phoneDealer } = await supabase
            .from('dealers')
            .select('id, user_id, phone, whatsapp, company_name')
            .in('phone', variants)
            .limit(1)
            .single()

          if (phoneDealer) {
            dealer = phoneDealer as unknown as DealerRow
          }
        }

        if (!dealer) {
          // Not a registered dealer — send auto-reply
          await sendWhatsAppMessage(
            senderPhone,
            'No est\u00E1s registrado como dealer en Tracciona. Visita tracciona.com para m\u00E1s informaci\u00F3n.',
          )
          continue
        }

        // Create submission record via REST (table not yet in generated types)
        const submission = await insertSubmission(supabaseUrl, supabaseKey, {
          dealer_id: dealer.id,
          phone_number: senderPhone,
          media_ids: mediaIds,
          text_content: textContent,
          status: 'received',
        })

        if (!submission) {
          continue
        }

        const submissionId = submission.id

        // Send acknowledgment
        await sendWhatsAppMessage(
          senderPhone,
          '\uD83D\uDCF8 Recibido. Estamos procesando tu veh\u00EDculo. Te avisaremos cuando est\u00E9 listo.',
        )

        // Trigger async processing (fire and forget — don't await)
        $fetch('/api/whatsapp/process', {
          method: 'POST',
          body: { submissionId },
        }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error(`[WhatsApp Webhook] Process trigger failed for ${submissionId}:`, message)
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(
          '[WhatsApp Webhook] Error processing messages from',
          senderPhone,
          ':',
          message,
        )
      }
    }
  }

  // Always return 200 to Meta
  return { status: 'ok' }
})
