/**
 * WhatsApp Webhook Verification (GET)
 *
 * Meta requires a GET endpoint for webhook verification during setup.
 * It sends: hub.mode, hub.verify_token, hub.challenge
 * We must return the challenge value if the token matches.
 *
 * GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=yyy
 */
import { defineEventHandler, getQuery, createError } from 'h3'

interface WebhookVerifyQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event) as WebhookVerifyQuery

  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    console.info('[WhatsApp Webhook] Verification successful')
    // Meta expects the challenge value returned as plain text
    return challenge
  }

  console.warn(
    '[WhatsApp Webhook] Verification failed — mode:',
    mode,
    'token match:',
    token === config.whatsappVerifyToken,
  )
  throw createError({ statusCode: 403, message: 'Forbidden' })
})
