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
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) {
      fetchProfile()
    }
  })
})
