/**
 * Dealer middleware - Protects /dashboard/* routes
 * Only users with user_type='dealer' or 'admin' can access dashboard pages
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

  if (!session?.user?.id) {
    return navigateTo('/?auth=login')
  }

  const { data } = await supabase
    .from('users')
    .select('user_type, role')
    .eq('id', session.user.id)
    .single<{ user_type: string; role: string }>()

  if (!data || (data.user_type !== 'dealer' && data.role !== 'admin')) {
    return navigateTo('/')
  }
})
