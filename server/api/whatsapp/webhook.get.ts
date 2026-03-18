/**
 * WhatsApp Webhook Verification (GET)
 *
 * Meta requires a GET endpoint for webhook verification during setup.
 * It sends: hub.mode, hub.verify_token, hub.challenge
 * We must return the challenge value if the token matches.
 *
 * GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=yyy
 */
import { defineEventHandler, getQuery } from 'h3'
import { safeError } from '../../utils/safeError'
import { logger } from '../../utils/logger'
import { timingSafeCompare } from '../../utils/timingSafeCompare'

interface WebhookVerifyQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const query = getQuery<WebhookVerifyQuery>(event)

  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  if (mode === 'subscribe' && timingSafeCompare(token as string, config.whatsappVerifyToken)) {
    logger.info('[WhatsApp Webhook] Verification successful')
    // Meta expects the challenge value returned as plain text
    return challenge
  }

  logger.warn('[WhatsApp Webhook] Verification failed', {
    mode,
    tokenMatch: timingSafeCompare(token as string, config.whatsappVerifyToken),
  })
  throw safeError(403, 'Forbidden')
})
