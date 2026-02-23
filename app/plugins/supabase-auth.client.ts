/**
 * Plugin to ensure Supabase client has the session from cookies
 */
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()

  // Non-blocking session refresh
  supabase.auth.getSession()
})
