/**
 * locale-by-country.client.ts
 *
 * Priority chain for language detection:
 *   1. Logged-in user's `lang` from DB (highest — survives travel)
 *   2. Cookie 'tracciona_lang' (manual choice without login)
 *   3. Country via Cloudflare IP → Spanish-speaking → 'es', else → 'en'
 *   4. Default 'es'
 */
import { getLocaleFallbackForCountry } from '~/utils/geoData'

export default defineNuxtPlugin(async () => {
  const { $i18n } = useNuxtApp()
  const { profile, fetchProfile } = useAuth()
  const COOKIE_KEY = 'tracciona_lang'
  const langCookie = useCookie(COOKIE_KEY)

  // 1. Logged-in user preference from DB
  const p = profile.value ?? (await fetchProfile())
  if (p?.lang) {
    if ($i18n.locale.value !== p.lang) {
      await $i18n.setLocale(p.lang)
    }
    langCookie.value = p.lang
    return
  }

  // 2. Manual cookie preference (non-logged-in user)
  if (langCookie.value) return

  // 3. Auto-detect by IP country
  try {
    const { country } = await $fetch<{ country: string | null }>('/api/geo')
    const targetLocale = getLocaleFallbackForCountry(country)

    if ($i18n.locale.value !== targetLocale) {
      await $i18n.setLocale(targetLocale)
    }

    langCookie.value = targetLocale
  } catch {
    // Geo detection failed — leave current locale as-is
  }
})
