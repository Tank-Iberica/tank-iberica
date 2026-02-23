/**
 * WhatsApp Cloud API Utilities
 *
 * Provides helper functions for sending messages and downloading media
 * via Meta's WhatsApp Business Cloud API (Graph API v19.0).
 *
 * In dev mode (no token configured), functions log to console instead of calling the API.
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0'

interface WhatsAppMessageResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

interface WhatsAppMediaUrlResponse {
  url: string
  mime_type: string
  sha256: string
  file_size: number
  id: string
  messaging_product: string
}

/**
 * Send a text message via WhatsApp Cloud API.
 *
 * @param to - Recipient phone number in international format (e.g. '34612345678')
 * @param text - Message body text
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const config = useRuntimeConfig()
  const token = config.whatsappApiToken as string
  const phoneNumberId = config.whatsappPhoneNumberId as string

  if (!token || !phoneNumberId) {
    console.warn(`[WhatsApp Dev] Would send to ${to}: ${text}`)
    return
  }

  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[WhatsApp] Failed to send message to ${to}:`, errorBody)
    throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as WhatsAppMessageResponse
  console.info(`[WhatsApp] Message sent to ${to}, message_id: ${data.messages?.[0]?.id}`)
}

/**
 * Download media from WhatsApp Cloud API.
 *
 * Two-step process:
 * 1. GET media metadata to obtain the download URL
 * 2. GET the actual binary content from the download URL
 *
 * @param mediaId - The WhatsApp media ID from the incoming webhook
 * @returns Buffer containing the media binary data
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  const config = useRuntimeConfig()
  const token = config.whatsappApiToken as string

  if (!token) {
    console.warn(`[WhatsApp Dev] Would download media: ${mediaId}`)
    return Buffer.from('')
  }

  // Step 1: Get media URL
  const metadataUrl = `${GRAPH_API_BASE}/${mediaId}`
  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!metadataResponse.ok) {
    const errorBody = await metadataResponse.text()
    console.error(`[WhatsApp] Failed to get media metadata for ${mediaId}:`, errorBody)
    throw new Error(`WhatsApp media metadata error: ${metadataResponse.status}`)
  }

  const metadata = (await metadataResponse.json()) as WhatsAppMediaUrlResponse

  // Step 2: Download the actual media binary
  const mediaResponse = await fetch(metadata.url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!mediaResponse.ok) {
    const errorBody = await mediaResponse.text()
    console.error(`[WhatsApp] Failed to download media ${mediaId}:`, errorBody)
    throw new Error(`WhatsApp media download error: ${mediaResponse.status}`)
  }

  const arrayBuffer = await mediaResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
