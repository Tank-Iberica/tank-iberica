/**
 * Composable for authentication state and user role management.
 * Wraps Supabase auth with role-aware helpers.
 */

export type UserType = 'buyer' | 'dealer' | 'admin'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  user_type: UserType
  role: string | null
  company_name: string | null
  phone: string | null
  phone_verified: boolean
  onboarding_completed: boolean
  avatar_url: string | null
  preferred_locale: string | null
  last_login_at: string | null
  login_count: number
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()
  const profile = useState<UserProfile | null>('auth-profile', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = useState<number>('auth-profile-ts', () => 0)
  const TTL = 5 * 60 * 1000 // 5 min cache

  const isAuthenticated = computed(() => !!supabaseUser.value)
  const userId = computed(() => supabaseUser.value?.id || null)
  const userEmail = computed(() => supabaseUser.value?.email || '')
  const userType = computed<UserType>(() => profile.value?.user_type || 'buyer')
  const isDealer = computed(() => userType.value === 'dealer')
  const isBuyer = computed(() => userType.value === 'buyer')
  const isAdmin = computed(() => profile.value?.role === 'admin')

  const displayName = computed(() => {
    if (profile.value?.full_name) return profile.value.full_name
    if (supabaseUser.value?.user_metadata?.pseudonimo)
      return supabaseUser.value.user_metadata.pseudonimo
    if (supabaseUser.value?.user_metadata?.name) return supabaseUser.value.user_metadata.name
    return userEmail.value.split('@')[0] || ''
  })

  /**
   * Fetch the user profile from the database.
   * Cached for 5 minutes to avoid redundant DB calls.
   */
  async function fetchProfile(): Promise<UserProfile | null> {
    if (!supabaseUser.value?.id) {
      profile.value = null
      return null
    }

    const now = Date.now()
    if (profile.value && now - lastFetched.value < TTL) {
      return profile.value
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('users')
        .select(
          'id, email, full_name, user_type, role, company_name, phone, phone_verified, onboarding_completed, avatar_url, preferred_locale, last_login_at, login_count',
        )
        .eq('id', supabaseUser.value.id)
        .single()

      if (err) throw err
      profile.value = data as unknown as UserProfile
      lastFetched.value = Date.now()
      return profile.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /** Sign in with email and password. Throws on failure. */
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      await fetchProfile()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Login error'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Register a new user with email, password and optional profile metadata. Throws on failure. */
  async function register(
    email: string,
    password: string,
    metadata?: { full_name?: string; user_type?: UserType; company_name?: string; phone?: string },
  ) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata?.full_name || '',
            user_type: metadata?.user_type || 'buyer',
            company_name: metadata?.company_name || '',
          },
        },
      })
      if (err) throw err
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Registration error'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Initiate Google OAuth flow. Optional redirectPath is encoded in the callback URL. */
  async function loginWithGoogle(redirectPath?: string) {
    const callbackUrl = redirectPath
      ? `${window.location.origin}/confirm?redirect=${encodeURIComponent(redirectPath)}`
      : `${window.location.origin}/confirm`

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (err) {
      error.value = err.message
    }
  }

  /** Sign out and redirect to home page. Clears local profile cache. */
  async function logout() {
    await supabase.auth.signOut()
    profile.value = null
    lastFetched.value = 0
    await navigateTo('/')
  }

  /** Send a password-reset email. Throws on failure. */
  async function resetPassword(email: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/nueva-password`,
      })
      if (err) throw err
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error sending reset email'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Update the current user's password. Throws on failure. */
  async function updatePassword(newPassword: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) throw err
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating password'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Invalidate the local profile cache (forces next fetchProfile to hit the DB). */
  function clearCache() {
    profile.value = null
    lastFetched.value = 0
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    error,
    isAuthenticated,
    userId,
    userEmail,
    userType,
    isDealer,
    isBuyer,
    isAdmin,
    displayName,
    fetchProfile,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updatePassword,
    clearCache,
  }
}
