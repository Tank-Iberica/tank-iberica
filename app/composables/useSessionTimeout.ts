/**
 * Client-side session idle timeout.
 * - Admin sessions: 30 minutes of inactivity → sign out
 * - Regular users: 7 days of inactivity → sign out
 *
 * Tracks last activity in localStorage so it persists across tabs/refreshes.
 * Listens for user interaction events (mouse, keyboard, touch, scroll).
 */

const LS_KEY = 'tracciona_last_activity'

// Timeout durations in milliseconds
const ADMIN_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const USER_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
]

// Throttle activity updates to max once per 60 seconds to avoid excessive writes
const ACTIVITY_THROTTLE_MS = 60 * 1000

export function useSessionTimeout() {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  let checkInterval: ReturnType<typeof setInterval> | null = null
  let lastWrite = 0

  const isAdmin = computed(() => {
    // Check user metadata for admin role
    return (
      user.value?.app_metadata?.role === 'admin' || user.value?.user_metadata?.user_type === 'admin'
    )
  })

  const timeoutMs = computed(() => (isAdmin.value ? ADMIN_TIMEOUT_MS : USER_TIMEOUT_MS))

  function touchActivity() {
    const now = Date.now()
    if (now - lastWrite < ACTIVITY_THROTTLE_MS) return
    lastWrite = now
    try {
      localStorage.setItem(LS_KEY, String(now))
    } catch {
      // localStorage unavailable
    }
  }

  function getLastActivity(): number {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? Number.parseInt(raw, 10) : Date.now()
    } catch {
      return Date.now()
    }
  }

  function isExpired(): boolean {
    const elapsed = Date.now() - getLastActivity()
    return elapsed > timeoutMs.value
  }

  async function handleExpiry() {
    cleanup()
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
    await supabase.auth.signOut()
    await navigateTo('/auth/login')
  }

  function startChecking() {
    // Check every 60 seconds
    checkInterval = setInterval(() => {
      if (!user.value) {
        cleanup()
        return
      }
      if (isExpired()) {
        handleExpiry()
      }
    }, 60_000)
  }

  function onUserActivity() {
    touchActivity()
  }

  function setup() {
    if (typeof globalThis.window === 'undefined') return
    if (!user.value) return

    // Initialize last activity
    touchActivity()

    // Listen for activity events
    for (const evt of ACTIVITY_EVENTS) {
      globalThis.addEventListener(evt, onUserActivity, { passive: true })
    }

    startChecking()
  }

  function cleanup() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    if (typeof globalThis.window === 'undefined') return
    for (const evt of ACTIVITY_EVENTS) {
      globalThis.removeEventListener(evt, onUserActivity)
    }
  }

  // Auto-setup on mount, cleanup on unmount
  onMounted(() => {
    setup()
  })

  onUnmounted(() => {
    cleanup()
  })

  // Watch for login/logout
  watch(user, (newUser) => {
    if (newUser) {
      setup()
    } else {
      cleanup()
    }
  })

  return {
    isExpired,
    touchActivity,
    timeoutMs,
    isAdmin,
  }
}
