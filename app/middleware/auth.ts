/**
 * Auth middleware - Protects routes that require authentication
 * Redirects to home with auth=login query param to trigger login modal
 *
 * Uses getSession() directly instead of useSupabaseUser() to avoid a race
 * condition in @nuxtjs/supabase ≤2.0.3 where getClaims() fails for HS256 JWTs
 * and resets currentUser to null on every page:start hook.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    return navigateTo('/?auth=login')
  }

  // Force password reset for migrated Tank Ibérica users (Session 13)
  if (
    session.user.user_metadata?.force_password_reset === true &&
    to.path !== '/auth/nueva-password'
  ) {
    return navigateTo('/auth/nueva-password')
  }
})
