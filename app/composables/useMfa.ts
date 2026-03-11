/**
 * MFA (Multi-Factor Authentication) Composable
 *
 * Wraps Supabase Auth MFA with TOTP enrollment and verification.
 * Supports admin and dealer premium accounts.
 */

export type MfaStatus = 'not_enrolled' | 'enrolled' | 'verified'

export function useMfa() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  useI18n()

  const status = ref<MfaStatus>('not_enrolled')
  const loading = ref(false)
  const qrCodeUri = ref<string | null>(null)
  const secret = ref<string | null>(null)
  const factorId = ref<string | null>(null)

  /**
   * Check the current MFA enrollment status.
   */
  async function checkStatus(): Promise<MfaStatus> {
    if (!user.value) {
      status.value = 'not_enrolled'
      return status.value
    }

    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      console.error('[mfa] Failed to list factors:', error.message)
      status.value = 'not_enrolled'
      return status.value
    }

    const totpFactors = data.totp ?? []
    if (totpFactors.length === 0) {
      status.value = 'not_enrolled'
    } else {
      const verified = totpFactors.find((f: { status: string }) => f.status === 'verified')
      status.value = verified ? 'verified' : 'enrolled'
      factorId.value = totpFactors[0]?.id ?? null
    }

    return status.value
  }

  /**
   * Start MFA enrollment — generates QR code for authenticator app.
   */
  async function enroll(): Promise<{ qrUri: string; secret: string } | null> {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Tracciona Authenticator',
      })

      if (error) throw error

      qrCodeUri.value = data.totp.qr_code
      secret.value = data.totp.secret
      factorId.value = data.id

      return { qrUri: data.totp.qr_code, secret: data.totp.secret }
    } catch (e) {
      console.error('[mfa] Enrollment failed:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Verify TOTP code to complete enrollment or authenticate.
   */
  async function verify(code: string): Promise<boolean> {
    if (!factorId.value) return false

    loading.value = true
    try {
      const challenge = await supabase.auth.mfa.challenge({
        factorId: factorId.value,
      })

      if (challenge.error) throw challenge.error

      const verification = await supabase.auth.mfa.verify({
        factorId: factorId.value,
        challengeId: challenge.data.id,
        code,
      })

      if (verification.error) throw verification.error

      status.value = 'verified'
      return true
    } catch (e) {
      console.error('[mfa] Verification failed:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Unenroll MFA (remove factor).
   */
  async function unenroll(): Promise<boolean> {
    if (!factorId.value) return false

    loading.value = true
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId.value,
      })

      if (error) throw error

      status.value = 'not_enrolled'
      factorId.value = null
      qrCodeUri.value = null
      secret.value = null
      return true
    } catch (e) {
      console.error('[mfa] Unenroll failed:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if the current session has a verified MFA factor.
   * Use this to gate admin pages.
   */
  async function requireMfa(): Promise<boolean> {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) return false
    return data.currentLevel === 'aal2'
  }

  return {
    status,
    loading,
    qrCodeUri,
    secret,
    factorId,
    checkStatus,
    enroll,
    verify,
    unenroll,
    requireMfa,
  }
}
