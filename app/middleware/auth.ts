/**
 * Auth middleware - Protects routes that require authentication
 * Redirects to home with auth=login query param to trigger login modal
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  if (!user.value?.id) {
    return navigateTo('/?auth=login')
  }
})
