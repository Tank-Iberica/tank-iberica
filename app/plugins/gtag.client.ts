/**
 * gtag.client.ts — Google Ads pixel plugin
 *
 * Dynamically loads gtag.js based on:
 * 1. Runtime config (googleAdsId must be set)
 * 2. User consent for marketing cookies
 *
 * Watches consent changes and loads/unloads gtag accordingly.
 */

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { consent, hasConsent } = useConsent()

  // Track if gtag has been loaded
  let gtagLoaded = false
  let gtagScript: HTMLScriptElement | null = null

  /**
   * Load gtag.js script and initialize.
   */
  function loadGtag(): void {
    // Skip if already loaded
    if (gtagLoaded) return

    // Skip if no Google Ads ID configured
    const adsId = config.public.googleAdsId
    if (!adsId) {
      if (import.meta.dev) {
        console.info('[gtag] No googleAdsId configured, skipping gtag.js load')
      }
      return
    }

    // Skip if user hasn't consented to marketing
    if (!hasConsent('marketing')) {
      if (import.meta.dev) {
        console.info('[gtag] Marketing consent not granted, skipping gtag.js load')
      }
      return
    }

    try {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments)
      }

      // Set initial timestamp
      window.gtag('js', new Date())

      // Configure Google Ads
      window.gtag('config', adsId, {
        send_page_view: true,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      })

      // Load gtag.js script
      gtagScript = document.createElement('script')
      gtagScript.async = true
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`
      document.head.appendChild(gtagScript)

      gtagLoaded = true

      if (import.meta.dev) {
        console.info('[gtag] Google Ads tracking loaded:', adsId)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[gtag] Failed to load gtag.js:', error)
      }
    }
  }

  /**
   * Unload gtag.js and clean up.
   */
  function unloadGtag(): void {
    if (!gtagLoaded) return

    try {
      // Remove script tag
      if (gtagScript && gtagScript.parentNode) {
        gtagScript.parentNode.removeChild(gtagScript)
        gtagScript = null
      }

      // Clear dataLayer and gtag function
      delete window.dataLayer
      delete window.gtag

      gtagLoaded = false

      if (import.meta.dev) {
        console.info('[gtag] Google Ads tracking unloaded')
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[gtag] Failed to unload gtag.js:', error)
      }
    }
  }

  /**
   * Watch consent changes and load/unload gtag accordingly.
   */
  watch(
    () => consent.value,
    (newConsent) => {
      if (!newConsent) return

      const hasMarketingConsent = newConsent.marketing === true

      if (hasMarketingConsent && !gtagLoaded) {
        // User just gave consent → load gtag
        loadGtag()
      } else if (!hasMarketingConsent && gtagLoaded) {
        // User revoked consent → unload gtag
        unloadGtag()
      }
    },
    { immediate: true },
  )

  /**
   * Also check on initial load (in case consent was already given).
   */
  onMounted(() => {
    if (hasConsent('marketing') && !gtagLoaded) {
      loadGtag()
    }
  })
})
