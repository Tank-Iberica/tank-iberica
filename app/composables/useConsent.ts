/**
 * useConsent — GDPR cookie consent composable
 *
 * Manages cookie consent state with localStorage persistence,
 * cookie storage, and Supabase consents table sync.
 */

export interface ConsentState {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  timestamp: string
}

const CONSENT_KEY = 'tracciona_consent'

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
}

/** Shared reactive state across all consumers */
const consent = ref<ConsentState | null>(null)
const loaded = ref(false)

export function useConsent() {
  const user = useSupabaseUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient<any>()

  /**
   * Read consent from localStorage (client only).
   * Returns null if no consent has been stored.
   */
  function loadConsent(): ConsentState | null {
    if (import.meta.server) return null

    try {
      const raw = localStorage.getItem(CONSENT_KEY)
      if (!raw) {
        loaded.value = true
        return null
      }
      const parsed = JSON.parse(raw) as ConsentState
      // Ensure necessary is always true
      parsed.necessary = true
      consent.value = parsed
      loaded.value = true
      return parsed
    } catch {
      loaded.value = true
      return null
    }
  }

  /**
   * Check if a specific consent type is granted.
   */
  function hasConsent(type: 'necessary' | 'analytics' | 'marketing'): boolean {
    if (type === 'necessary') return true
    if (!consent.value) return false
    return consent.value[type] === true
  }

  /**
   * Save consent to localStorage, cookie, and Supabase consents table.
   */
  async function saveConsent(newConsent: ConsentState): Promise<void> {
    if (import.meta.server) return

    // Ensure necessary is always true and add timestamp
    const consentToSave: ConsentState = {
      ...newConsent,
      necessary: true,
      timestamp: new Date().toISOString(),
    }

    // Update reactive state
    consent.value = consentToSave

    // Store in localStorage
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentToSave))
    } catch {
      // Silently fail if localStorage is unavailable
    }

    // Also set as a cookie (for SSR access if needed)
    try {
      const cookieValue = encodeURIComponent(JSON.stringify(consentToSave))
      const maxAge = 365 * 24 * 60 * 60 // 1 year
      document.cookie = `${CONSENT_KEY}=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`
    } catch {
      // Silently fail
    }

    // Save to Supabase consents table if user is logged in
    if (user.value) {
      try {
        const consentTypes: Array<'necessary' | 'analytics' | 'marketing'> = [
          'necessary',
          'analytics',
          'marketing',
        ]
        const inserts = consentTypes.map((type) => ({
          user_id: user.value!.id,
          consent_type: `cookie_${type}`,
          granted: consentToSave[type],
          user_agent: navigator.userAgent,
        }))

        await supabase.from('consents').insert(inserts)
      } catch {
        // Non-blocking: consent UI works even if DB insert fails
      }
    }

    // Handle cookie cleanup based on consent changes
    if (!consentToSave.analytics) {
      removeAnalyticsCookies()
    }
    if (!consentToSave.marketing) {
      removeMarketingCookies()
    }
  }

  /**
   * Revoke all non-necessary consent.
   */
  async function revokeConsent(): Promise<void> {
    await saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    })

    removeAnalyticsCookies()
    removeMarketingCookies()
  }

  /**
   * Remove Google Analytics cookies.
   */
  function removeAnalyticsCookies(): void {
    if (import.meta.server) return

    const cookiesToRemove = ['_ga', '_ga_', '_gid', '_gat']
    const hostname = window.location.hostname
    const domains = [hostname, `.${hostname}`]

    for (const name of cookiesToRemove) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`
      }
      // Also try without domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }

    // Also remove cookies that start with _ga_ (GA4 measurement IDs)
    const allCookies = document.cookie.split(';')
    for (const cookie of allCookies) {
      const cookieName = (cookie.split('=')[0] ?? '').trim()
      if (cookieName.startsWith('_ga_')) {
        for (const domain of domains) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`
        }
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    }
  }

  /**
   * Remove marketing / ads tracking cookies.
   */
  function removeMarketingCookies(): void {
    if (import.meta.server) return

    const cookiesToRemove = [
      '_fbp',
      '_fbc',
      'fr',
      '_gcl_au',
      '_gcl_aw',
      'IDE',
      'DSID',
      'test_cookie',
    ]
    const hostname = window.location.hostname
    const domains = [hostname, `.${hostname}`]

    for (const name of cookiesToRemove) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`
      }
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  }

  return {
    /** Current consent state (reactive, null if not yet loaded/given) */
    consent: readonly(consent),
    /** Whether consent has been loaded from storage */
    loaded: readonly(loaded),
    /** Default consent values */
    defaultConsent,
    /** Load consent from localStorage */
    loadConsent,
    /** Check if a specific consent type is granted */
    hasConsent,
    /** Save consent to localStorage + cookie + Supabase */
    saveConsent,
    /** Revoke all non-necessary consent */
    revokeConsent,
  }
}
