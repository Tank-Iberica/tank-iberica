/**
 * Plugin to ensure the user profile is loaded as early as possible.
 * Fires fetchProfile() both on startup (if session exists) and on every
 * auth state change. This guarantees isAdmin/isDealer are populated in
 * the header dropdown regardless of SSR vs SPA context.
 */
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const { fetchProfile } = useAuth()

  // Load profile on startup if a session already exists
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user?.id) {
      fetchProfile()
    }
  })

  // Reload profile whenever auth state changes (login, refresh, logout)
  // Detect refresh token reuse (indicates potential token theft)
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user?.id) {
      fetchProfile()
    }

    // TOKEN_REFRESHED with no session = refresh token was revoked (reuse detected)
    if (event === 'TOKEN_REFRESHED' && !session) {
      console.warn('[auth] Refresh token reuse detected — forcing re-login')
      supabase.auth.signOut()
      navigateTo('/auth/login?reason=session_expired')
    }
  })
})
