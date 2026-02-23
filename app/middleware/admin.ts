/**
 * Admin middleware - Protects /admin/* routes
 * Only users with role='admin' can access admin pages
 *
 * Uses cached role check to avoid querying DB on every navigation
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // Not authenticated - let the layout handle showing login UI
  if (!user.value?.id) {
    return
  }

  // Check admin role with cache (5min TTL)
  const { checkAdmin } = useAdminRole()
  const isAdmin = await checkAdmin(user.value.id)

  if (!isAdmin) {
    // Authenticated but not admin - redirect to home
    return navigateTo('/')
  }
})
