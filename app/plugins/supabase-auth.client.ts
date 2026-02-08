/**
 * Plugin to ensure Supabase client has the session from cookies
 */
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()

  // Non-blocking session check
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('Session active:', session.user?.email)
    }
  })
})
