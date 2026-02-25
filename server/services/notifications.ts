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
          if (opts.data.phone && opts.data.message) {
            await sendWhatsAppMessage(opts.data.phone as string, opts.data.message as string)
            sent.push('whatsapp')
          } else {
            console.warn('[notifications] WhatsApp requires phone and message in data')
          }
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

/**
 * Notify a dealer via WhatsApp and/or email.
 */
export async function notifyDealer(
  dealerId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  // If phone is provided, send WhatsApp
  if (data.phone && data.message) {
    try {
      await sendWhatsAppMessage(data.phone as string, data.message as string)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[notifications] WhatsApp to dealer ${dealerId} failed: ${msg}`)
    }
  }

  // Also try email
  try {
    await notify(dealerId, { type, channels: ['email'], data })
  } catch {
    // Email is best-effort for dealer notifications
  }
}

/**
 * Notify admin(s) about system events.
 */
export async function notifyAdmin(type: string, data: Record<string, unknown>): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'tankiberica@gmail.com'
  const internalSecret = process.env.CRON_SECRET || ''

  try {
    await $fetch('/api/email/send', {
      method: 'POST',
      headers: internalSecret ? { 'x-internal-secret': internalSecret } : {},
      body: {
        templateKey: type,
        to: adminEmail,
        variables: data,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[notifications] Admin notification failed: ${msg}`)
  }
}

/**
 * Notify a buyer/user about events (favorites, auctions, etc).
 */
export async function notifyBuyer(
  userId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  await notify(userId, { type, channels: ['email'], data })
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
