interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const config = useRuntimeConfig()
  const secret = process.env.TURNSTILE_SECRET_KEY || config.turnstileSecretKey

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Fail closed: reject in production without secret
      return false
    }
    // Dev mode: skip verification when no secret is configured
    return true
  }

  try {
    const body: Record<string, string> = {
      secret,
      response: token,
    }

    if (ip) {
      body.remoteip = ip
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as TurnstileVerifyResponse
    return data.success === true
  } catch {
    // If verification service is unavailable, fail closed
    return false
  }
}
