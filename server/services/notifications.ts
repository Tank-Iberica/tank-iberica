/**
 * Unified notification service.
 * Sends notifications via email, WhatsApp, or push based on user preferences.
 */
import { $fetch } from 'ofetch'

interface NotifyOptions {
  type: string
  channels?: ('email' | 'whatsapp' | 'push')[]
  data: Record<string, unknown>
}

/**
 * Send a notification to a user via their preferred channels.
 * Currently supports email via the internal /api/email/send endpoint.
 * WhatsApp and push channels will be added as they mature.
 */
export async function notify(
  userId: string,
  opts: NotifyOptions,
): Promise<{ sent: string[]; failed: string[] }> {
  const channels = opts.channels || ['email']
  const sent: string[] = []
  const failed: string[] = []

  for (const channel of channels) {
    try {
      switch (channel) {
        case 'email':
          await sendEmailNotification(userId, opts.type, opts.data)
          sent.push('email')
          break
        case 'whatsapp':
          // TODO: Integrate with WhatsApp send when ready
          console.warn('[notifications] WhatsApp channel not yet implemented')
          break
        case 'push':
          // TODO: Integrate with web push when ready
          console.warn('[notifications] Push channel not yet implemented')
          break
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[notifications] Failed to send ${channel} to user ${userId}: ${message}`)
      failed.push(channel)
    }
  }

  return { sent, failed }
}

async function sendEmailNotification(
  userId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  const internalSecret = process.env.CRON_SECRET || ''

  await $fetch('/api/email/send', {
    method: 'POST',
    headers: internalSecret ? { 'x-internal-secret': internalSecret } : {},
    body: {
      templateKey: type,
      userId,
      variables: data,
    },
  })
}
