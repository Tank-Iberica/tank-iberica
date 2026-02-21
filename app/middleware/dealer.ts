/**
 * Dealer middleware - Protects /dashboard/* routes
 * Only users with user_type='dealer' or 'admin' can access dashboard pages
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  if (!user.value?.id) {
    return navigateTo('/?auth=login')
  }

  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.value.id)
    .single<{ user_type: string }>()

  if (!data || (data.user_type !== 'dealer' && data.user_type !== 'admin')) {
    return navigateTo('/')
  }
})
