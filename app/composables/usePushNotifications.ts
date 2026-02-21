/**
 * Push Notifications Composable
 *
 * Manages push notification subscriptions using VAPID.
 * - Requests browser permission
 * - Creates and stores push subscriptions in Supabase
 * - Provides subscription state management
 */

export function usePushNotifications() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  const isSubscribed = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if Push API is supported in the current browser.
   */
  const isSupported = computed(() => {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  })

  /**
   * Check if user has an active push subscription.
   */
  async function checkSubscription(): Promise<void> {
    if (!isSupported.value || !user.value) {
      isSubscribed.value = false
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Check if this subscription exists in our database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.value.id)
          .eq('endpoint', subscription.endpoint)
          .single()

        isSubscribed.value = !!data
      } else {
        isSubscribed.value = false
      }
    } catch (err: unknown) {
      console.error('Error checking push subscription:', err)
      isSubscribed.value = false
    }
  }

  /**
   * Request notification permission from the user.
   */
  async function requestPermission(): Promise<NotificationPermission> {
    if (!isSupported.value) {
      throw new Error('Push notifications are not supported in this browser')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Subscribe to push notifications.
   * Creates a PushSubscription and stores it in Supabase.
   */
  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) {
      error.value = 'Push notifications are not supported'
      return false
    }

    if (!user.value) {
      error.value = 'User must be logged in to subscribe to notifications'
      return false
    }

    const vapidPublicKey = config.public.vapidPublicKey
    if (!vapidPublicKey) {
      error.value = 'VAPID public key not configured'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // Request permission if not already granted
      const permission = await requestPermission()
      if (permission !== 'granted') {
        error.value = 'Notification permission denied'
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()

      // If no subscription exists, create one
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      // Store subscription in Supabase
      const subscriptionJson = subscription.toJSON()

      const { error: insertError } = await supabase.from('push_subscriptions').upsert({
        user_id: user.value.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
      })

      if (insertError) throw insertError

      isSubscribed.value = true
      return true
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error subscribing to notifications'
      error.value = errorMessage
      console.error('Push subscription error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Unsubscribe from push notifications.
   * Removes the subscription from both the browser and Supabase.
   */
  async function unsubscribe(): Promise<boolean> {
    if (!isSupported.value || !user.value) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from database
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.value.id)
          .eq('endpoint', subscription.endpoint)

        if (deleteError) throw deleteError
      }

      isSubscribed.value = false
      return true
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error unsubscribing from notifications'
      error.value = errorMessage
      console.error('Push unsubscribe error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Convert VAPID public key from base64 to Uint8Array.
   */
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Check subscription status on mount
  onMounted(() => {
    if (user.value) {
      checkSubscription()
    }
  })

  // Watch for user changes
  watch(user, (newUser) => {
    if (newUser) {
      checkSubscription()
    } else {
      isSubscribed.value = false
    }
  })

  return {
    isSupported,
    isSubscribed: readonly(isSubscribed),
    loading: readonly(loading),
    error: readonly(error),
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
