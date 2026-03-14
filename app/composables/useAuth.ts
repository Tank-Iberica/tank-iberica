/**
 * Composable for authentication state and user role management.
 * Wraps Supabase auth with role-aware helpers.
 */

export type UserType = 'buyer' | 'dealer' | 'admin'

interface UserProfile {
  id: string
  email: string
  pseudonimo: string | null
  name: string | null
  user_type: UserType
  role: string | null
  company_name: string | null
  phone: string | null
  phone_verified: boolean
  onboarding_completed: boolean
  avatar_url: string | null
  lang: string | null
  preferred_country: string | null
  preferred_location_level: string | null
  last_login_at: string | null
  login_count: number
}

// Client-side login rate limiting (defense in depth — Supabase has server-side limits too)
// Persists to localStorage so it survives page refreshes
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LS_PREFIX = 'lr_' // login-rate prefix

function _getLSEntry(key: string): { count: number; firstAttempt: number } | null {
  if (typeof globalThis.window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? (JSON.parse(raw) as { count: number; firstAttempt: number }) : null
  } catch {
    return null
  }
}

function _setLSEntry(key: string, entry: { count: number; firstAttempt: number }): void {
  if (typeof globalThis.window === 'undefined') return
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry))
  } catch {
    // Ignore storage errors (private browsing, quota exceeded)
  }
}

function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterMs: number } {
  const key = email.toLowerCase().trim()
  const now = Date.now()
  const entry = _getLSEntry(key)

  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    _setLSEntry(key, { count: 1, firstAttempt: now })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfterMs = LOGIN_WINDOW_MS - (now - entry.firstAttempt)
    return { allowed: false, retryAfterMs }
  }

  _setLSEntry(key, { count: entry.count + 1, firstAttempt: entry.firstAttempt })
  return { allowed: true, retryAfterMs: 0 }
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()
  const profile = useState<UserProfile | null>('auth-profile', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = useState<number>('auth-profile-ts', () => 0)
  // Safe for plugin context: useI18n() requires Vue instance (unavailable in some plugins)
  let t: (key: string, values?: Record<string, unknown>) => string
  try {
    ;({ t } = useI18n())
  } catch {
    t = (key: string) => key
  }
  const TTL = 5 * 60 * 1000 // 5 min cache

  const isAuthenticated = computed(() => !!supabaseUser.value || !!profile.value?.id)
  const userId = computed(() => supabaseUser.value?.id || profile.value?.id || null)
  const userEmail = computed(() => supabaseUser.value?.email || '')
  const userType = computed<UserType>(() => profile.value?.user_type || 'buyer')
  const isDealer = computed(() => userType.value === 'dealer')
  const isBuyer = computed(() => userType.value === 'buyer')
  const isAdmin = computed(() => profile.value?.role === 'admin')

  const displayName = computed(() => {
    if (profile.value?.pseudonimo) return profile.value.pseudonimo
    if (profile.value?.name) return profile.value.name
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
    let uid = supabaseUser.value?.id
    if (!uid) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      uid = session?.user?.id || null
    }
    if (!uid) {
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
          'id, email, pseudonimo, name, user_type, role, company_name, phone, phone_verified, onboarding_completed, avatar_url, lang, preferred_country, last_login_at, login_count',
        )
        .eq('id', uid)
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

  const accountLocked = ref(false)
  const lockoutRetrySeconds = ref(0)
  const showCaptcha = ref(false)

  /** Sign in with email and password. Throws on failure. */
  async function login(email: string, password: string, turnstileToken?: string) {
    // Client-side rate limit check (defense in depth)
    const { allowed, retryAfterMs } = checkLoginRateLimit(email)
    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60_000)
      const msg = t('auth.tooManyLoginAttempts', { minutes })
      error.value = msg
      throw new Error(msg)
    }

    // Server-side lockout check
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lockoutCheck = (await ($fetch as any)('/api/auth/check-lockout', {
        method: 'POST',
        body: { email, action: 'check', turnstileToken },
      })) as { locked: boolean; retryAfterSeconds?: number; attemptsRemaining?: number }

      if (lockoutCheck.locked) {
        accountLocked.value = true
        lockoutRetrySeconds.value = lockoutCheck.retryAfterSeconds ?? 0
        showCaptcha.value = true
        const minutes = Math.ceil((lockoutCheck.retryAfterSeconds ?? 0) / 60)
        const msg = t('auth.accountLocked', { minutes })
        error.value = msg
        throw new Error(msg)
      }
      accountLocked.value = false
      showCaptcha.value = false
    } catch (err: unknown) {
      // If it's our lockout error, re-throw
      if (
        err instanceof Error &&
        err.message.includes(t('auth.accountLocked', { minutes: 0 }).split('0')[0] ?? '')
      ) {
        throw err
      }
      // Server check failed — continue with login (graceful degradation)
    }

    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        // Record failure server-side (fire-and-forget)
        void $fetch('/api/auth/check-lockout', {
          method: 'POST',
          body: { email, action: 'record_failure' },
        }).catch(() => {})
        throw err
      }
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
      ? `${globalThis.location.origin}/confirm?redirect=${encodeURIComponent(redirectPath)}`
      : `${globalThis.location.origin}/confirm`

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

  /** Invalidate ALL sessions (all devices) then redirect to home. */
  async function logoutAll() {
    loading.value = true
    error.value = null
    try {
      await supabase.auth.signOut({ scope: 'global' })
      profile.value = null
      lastFetched.value = 0
      await navigateTo('/')
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error signing out'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Send a password-reset email. Throws on failure. */
  async function resetPassword(email: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/auth/nueva-password`,
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
    accountLocked: readonly(accountLocked),
    lockoutRetrySeconds: readonly(lockoutRetrySeconds),
    showCaptcha: readonly(showCaptcha),
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
    logoutAll,
    resetPassword,
    updatePassword,
    clearCache,
  }
}
