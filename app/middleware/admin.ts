/**
 * Admin middleware - Protects /admin/* routes
 * Only users with role='admin' can access admin pages
 *
 * Uses getSession() directly instead of useSupabaseUser() to avoid a race
 * condition in @nuxtjs/supabase ≤2.0.3 where getClaims() fails for HS256 JWTs
 * and resets currentUser to null on every page:start hook.
 */
export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Not authenticated - let the layout handle showing login UI
  if (!session?.user?.id) {
    return
  }

  // Check admin role with cache (5min TTL)
  const { checkAdmin } = useAdminRole()
  const isAdmin = await checkAdmin(session.user.id)

  if (!isAdmin) {
    // Authenticated but not admin - redirect to home
    return navigateTo('/')
  }
})
