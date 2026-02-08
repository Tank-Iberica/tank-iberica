/**
 * Admin middleware - Protects /admin/* routes
 * Only users with role='admin' can access admin pages
 *
 * Unlike other protected routes, admin shows its own login UI
 * instead of redirecting to the main site
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // Not authenticated - let the layout handle showing login UI
  if (!user.value?.id) {
    return
  }

  // Check admin role in users table
  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.value.id)
    .single<{ role: string }>()

  if (error || data?.role !== 'admin') {
    // Authenticated but not admin - redirect to home
    return navigateTo('/')
  }
})
