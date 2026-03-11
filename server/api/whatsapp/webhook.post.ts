/**
 * WhatsApp Webhook Receiver (POST)
 *
 * Receives incoming WhatsApp messages from Meta Cloud API.
 * Extracts sender info, text and image messages, then:
 * 1. Deduplicates by message.id (Meta redelivery protection)
 * 2. Looks up the dealer by phone/whatsapp field
 * 3. Creates a whatsapp_submissions record
 * 4. Triggers async processing via /api/whatsapp/process
 * 5. Sends an auto-reply acknowledgment
 *
 * Returns 200 immediately as required by Meta.
 *
 * POST /api/whatsapp/webhook
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defineEventHandler, readBody, readRawBody, getHeader } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logger } from '../../utils/logger'

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
  return phone.replaceAll(/\D/g, '')
}

/** Build all possible phone variants for lookup (with/without country code prefix) */
function phoneVariants(phone: string): string[] {
  const digits = normalizePhone(phone)
  const variants = new Set([digits, `+${digits}`])

  // Spain country code variants
  const hasSpainPrefix = digits.startsWith('34') && digits.length > 9
  const isLocalSpanish = !digits.startsWith('34') && digits.length === 9

  if (hasSpainPrefix) variants.add(digits.slice(2))
  if (isLocalSpanish) {
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
    logger.error('[WhatsApp Webhook] Failed to insert submission:', { error: String(errorText) })
    return null
  }

  const rows = (await response.json()) as { id: string }[]
  return rows[0] ?? null
}

// ── Signature verification ──────────────────────────────────────────────────

type VerifyResult = { payload: WhatsAppWebhookPayload } | { earlyReturn: Record<string, unknown> }

function verifyHmacSignature(rawBody: string, signature: string, appSecret: string): string | null {
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf))
      return 'invalid_signature'
    return null
  } catch {
    return 'signature_error'
  }
}

async function verifyProductionPayload(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  appSecret: string,
): Promise<VerifyResult> {
  const rawBody = await readRawBody(event)
  if (!rawBody) return { earlyReturn: { status: 'ok', error: 'empty_body' } }

  const signature = getHeader(event, 'x-hub-signature-256')
  if (!signature) return { earlyReturn: { status: 'ok', error: 'missing_signature' } }

  const sigError = verifyHmacSignature(rawBody, signature, appSecret)
  if (sigError) return { earlyReturn: { status: 'ok', error: sigError } }

  try {
    return { payload: JSON.parse(rawBody) as WhatsAppWebhookPayload }
  } catch {
    return { earlyReturn: { status: 'ok' } }
  }
}

async function verifyAndParsePayload(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): Promise<VerifyResult> {
  const appSecret = config.whatsappAppSecret || process.env.WHATSAPP_APP_SECRET

  if (appSecret && process.env.NODE_ENV === 'production') {
    return verifyProductionPayload(event, appSecret)
  }

  if (!config.whatsappApiToken) {
    const body = await readBody<WhatsAppWebhookPayload>(event)
    logger.warn('[WhatsApp Webhook] No API token configured (dev mode)', {
      entriesReceived: body?.entry?.length ?? 0,
    })
    return { earlyReturn: { status: 'ok', dev: true } }
  }

  try {
    return { payload: await readBody<WhatsAppWebhookPayload>(event) }
  } catch {
    return { earlyReturn: { status: 'ok' } }
  }
}

// ── Message extraction ──────────────────────────────────────────────────────

function extractMessageContent(messages: WhatsAppMessage[]): {
  textParts: string[]
  mediaIds: string[]
} {
  const textParts: string[] = []
  const mediaIds: string[] = []

  for (const msg of messages) {
    if (msg.type === 'text' && msg.text?.body) {
      textParts.push(msg.text.body)
    } else if (msg.type === 'image' && msg.image?.id) {
      mediaIds.push(msg.image.id)
      if (msg.image.caption) textParts.push(msg.image.caption)
    }
  }

  return { textParts, mediaIds }
}

// ── Dealer lookup ───────────────────────────────────────────────────────────

 
async function lookupDealer(
  supabase: SupabaseClient,
  senderPhone: string,
): Promise<DealerRow | null> {
  const variants = phoneVariants(senderPhone)

  const { data: waDealer } = await supabase
    .from('dealers')
    .select('id, user_id, phone, whatsapp, company_name')
    .in('whatsapp', variants)
    .limit(1)
    .single()

  if (waDealer) return waDealer as unknown as DealerRow

  const { data: phoneDealer } = await supabase
    .from('dealers')
    .select('id, user_id, phone, whatsapp, company_name')
    .in('phone', variants)
    .limit(1)
    .single()

  return phoneDealer ? (phoneDealer as unknown as DealerRow) : null
}

// ── Per-change processor ─────────────────────────────────────────────────────

async function processMessageChange(
  change: WhatsAppChange,
   
  supabase: SupabaseClient,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<void> {
  if (change.field !== 'messages') return

  const messages = change.value.messages ?? []
  if (messages.length === 0) return

  const messageId = messages[0]?.id
  const senderPhone = messages[0]?.from
  if (!senderPhone || !messageId) return

  // Dedup: check if this message_id was already processed
  const { data: existing } = await supabase
    .from('whatsapp_submissions')
    .select('id')
    .eq('meta_message_id', messageId)
    .maybeSingle()

  if (existing) {
    // Message already processed, skip
    return
  }

  const { textParts, mediaIds } = extractMessageContent(messages)
  if (textParts.length === 0 && mediaIds.length === 0) return

  const textContent = textParts.join('\n').trim() || null

  const dealer = await lookupDealer(supabase, senderPhone)
  if (!dealer) {
    await sendWhatsAppMessage(
      senderPhone,
      'No estás registrado como dealer en Tracciona. Visita tracciona.com para más información.',
    )
    return
  }

  const submission = await insertSubmission(supabaseUrl, supabaseKey, {
    dealer_id: dealer.id,
    phone_number: senderPhone,
    media_ids: mediaIds,
    text_content: textContent,
    status: 'received',
    meta_message_id: messageId,
  })
  if (!submission) return

  await sendWhatsAppMessage(
    senderPhone,
    'Recibido. Estamos procesando tu vehículo. Te avisaremos cuando esté listo.',
  )

  $fetch('/api/whatsapp/process', {
    method: 'POST',
    body: { submissionId: submission.id },
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`[WhatsApp Webhook] Process trigger failed for ${submission.id}:`, {
      error: String(message),
    })
  })
}

// ── Send WhatsApp message via Meta API ───────────────────────────────────────

async function sendWhatsAppMessage(recipientPhone: string, messageBody: string): Promise<void> {
  const config = useRuntimeConfig()
  const apiToken = config.whatsappApiToken || process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = config.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!apiToken || !phoneNumberId) {
    logger.warn('[WhatsApp Webhook] Cannot send reply: missing API token or phone number ID')
    return
  }

  try {
    await $fetch(`https://graph.instagram.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { body: messageBody },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('[WhatsApp Webhook] Failed to send reply:', { error: String(message) })
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const result = await verifyAndParsePayload(event, config)
  if ('earlyReturn' in result) return result.earlyReturn
  const payload = result.payload

  if (payload.object !== 'whatsapp_business_account') {
    return { status: 'ok' }
  }

  const supabase = serverSupabaseServiceRole(event)
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  const changes = (payload.entry ?? []).flatMap((e) => e.changes)
  for (const change of changes) {
    try {
      await processMessageChange(change, supabase, supabaseUrl, supabaseKey)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[WhatsApp Webhook] Error processing change:', { error: String(message) })
    }
  }

  return { status: 'ok' }
})
