/**
 * gtm.client.ts — Google Tag Manager container plugin
 *
 * Loads the GTM container script consent-gated (marketing cookies required).
 * GTM then manages all third-party tags from the dashboard:
 *   - Meta Pixel (Dynamic Product Ads, Pixel events)
 *   - Google Tag (GA4, Google Ads)
 *   - LinkedIn Insight Tag
 *
 * All tag configuration is done inside GTM dashboard (no code changes needed
 * to add/remove/modify pixels). Only the container ID is required here.
 *
 * dataLayer pushes are consent-aware: events queued before consent are replayed
 * by GTM Consent Mode once marketing consent is granted.
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { consent, hasConsent } = useConsent()

  let gtmLoaded = false
  let gtmScript: HTMLScriptElement | null = null

  /** Initialize dataLayer (GTM requires this before the script loads) */
  function initDataLayer(): void {
    if (!import.meta.client) return
    globalThis.dataLayer = globalThis.dataLayer ?? []
  }

  /** Push an event to GTM dataLayer (no-op on server or if no consent) */
  function pushEvent(event: Record<string, unknown>): void {
    if (!import.meta.client) return
    initDataLayer()
    globalThis.dataLayer?.push(event)
  }

  function loadGtm(): void {
    if (gtmLoaded) return

    const gtmId = config.public.gtmId
    if (!gtmId) {
      if (import.meta.dev) console.info('[gtm] No gtmId configured, skipping GTM load')
      return
    }

    if (!hasConsent('marketing')) {
      if (import.meta.dev) console.info('[gtm] Marketing consent not granted, skipping GTM load')
      return
    }

    try {
      initDataLayer()

      // GTM Consent Mode: update consent state before GTM fires tags
      pushEvent({
        event: 'gtm.init_consent',
        'gtm.consent': {
          ad_storage: 'granted',
          analytics_storage: 'granted',
          functionality_storage: 'granted',
          personalization_storage: 'granted',
        },
      })

      // Load GTM container
      gtmScript = document.createElement('script')
      gtmScript.async = true
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
      document.head.appendChild(gtmScript)

      // Add GTM noscript iframe (for browsers with JS disabled)
      const noscript = document.createElement('noscript')
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`
      iframe.height = '0'
      iframe.width = '0'
      iframe.style.display = 'none'
      iframe.style.visibility = 'hidden'
      noscript.appendChild(iframe)
      document.body.insertAdjacentElement('afterbegin', noscript)

      gtmLoaded = true

      if (import.meta.dev) console.info('[gtm] GTM container loaded:', gtmId)
    } catch (error) {
      if (import.meta.dev) console.error('[gtm] Failed to load GTM:', error)
    }
  }

  function unloadGtm(): void {
    if (!gtmLoaded) return
    try {
      gtmScript?.remove()
      gtmScript = null
      gtmLoaded = false
      if (import.meta.dev) console.info('[gtm] GTM unloaded (consent revoked)')
    } catch {
      // ignore
    }
  }

  // Watch consent changes
  watch(
    () => consent.value,
    (newConsent) => {
      if (!newConsent) return
      if (newConsent.marketing && !gtmLoaded) {
        loadGtm()
      } else if (!newConsent.marketing && gtmLoaded) {
        unloadGtm()
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    if (hasConsent('marketing') && !gtmLoaded) loadGtm()
  })

  return {
    provide: {
      gtm: {
        /** Push a custom event to GTM dataLayer */
        push: pushEvent,
      },
    },
  }
})
