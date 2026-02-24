/**
 * Push Notification Send Endpoint
 *
 * Sends web push notifications to a user's subscribed devices.
 * Uses web-push library with VAPID authentication.
 */

import webpush from 'web-push'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // ── Auth: internal secret OR admin user ──
  const internalSecret = config.cronSecret || process.env.CRON_SECRET
  const internalHeader = getHeader(event, 'x-internal-secret')
  const isInternal = internalSecret && internalHeader === internalSecret

  if (!isInternal) {
    // Fallback: admin authentication for calls from admin panel
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    const supabaseAuth = serverSupabaseServiceRole(event)
    const { data: profile } = await supabaseAuth
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || (profile as { role: string }).role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Admin access required' })
    }
  }

  const body = await readBody(event)

  const { userId, title, body: messageBody, url } = body

  if (!userId || !title || !messageBody) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: userId, title, body',
    })
  }

  // Configure VAPID details
  const vapidPublicKey = config.public.vapidPublicKey
  const vapidPrivateKey = config.vapidPrivateKey
  const vapidEmail = config.vapidEmail

  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    throw createError({
      statusCode: 500,
      message: 'VAPID keys not configured',
    })
  }

  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)

  // Get user's push subscriptions from Supabase
  const supabase = serverSupabaseServiceRole(event)

  const { data: subscriptions, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (fetchError) {
    throw createError({
      statusCode: 500,
      message: `Error fetching subscriptions: ${fetchError.message}`,
    })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return {
      success: false,
      message: 'No push subscriptions found for user',
      sent: 0,
    }
  }

  // Prepare notification payload
  const payload = JSON.stringify({
    title,
    body: messageBody,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: url || '/',
    timestamp: Date.now(),
  })

  // Send notification to all user's subscriptions
  const sendPromises = subscriptions.map(async (sub) => {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      }

      await webpush.sendNotification(pushSubscription, payload)
      return { success: true, endpoint: sub.endpoint }
    } catch (error: unknown) {
      const err = error as { statusCode?: number }

      // If subscription is invalid (410 Gone), remove it from database
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }

      return { success: false, endpoint: sub.endpoint, error }
    }
  })

  const results = await Promise.all(sendPromises)
  const successCount = results.filter((r) => r.success).length

  return {
    success: successCount > 0,
    message: `Sent ${successCount} of ${subscriptions.length} notifications`,
    sent: successCount,
    total: subscriptions.length,
    results,
  }
})
