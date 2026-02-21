/**
 * Auth middleware - Protects routes that require authentication
 * Redirects to home with auth=login query param to trigger login modal
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value?.id) {
    return navigateTo('/?auth=login')
  }

  // Force password reset for migrated Tank Ibérica users (Session 13)
  // Users migrated from the legacy Tank Ibérica system must reset their password
  // for security reasons before accessing protected routes
  if (
    user.value.user_metadata?.force_password_reset === true &&
    to.path !== '/auth/nueva-password'
  ) {
    return navigateTo('/auth/nueva-password')
  }
})
