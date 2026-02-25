/**
 * prebid.client.ts — Prebid.js header bidding plugin
 *
 * Dynamically loads Prebid.js based on:
 * 1. Runtime config (prebidEnabled must be true)
 * 2. User consent for marketing cookies
 *
 * Watches consent changes and loads/unloads Prebid accordingly.
 */

declare global {
  interface Window {
    pbjs?: {
      que: Array<() => void>
      setConfig?: (config: Record<string, unknown>) => void
      addAdUnits?: (units: unknown[]) => void
      requestBids?: (config: Record<string, unknown>) => void
      renderAd?: (doc: Document, adId: string) => void
      removeAdUnit?: (code: string) => void
      getBidResponses?: () => Record<string, unknown>
      getHighestCpmBids?: (adUnitCode?: string) => unknown[]
    }
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { consent, hasConsent } = useConsent()

  let prebidLoaded = false
  let prebidScript: HTMLScriptElement | null = null

  /**
   * Load Prebid.js script.
   */
  function loadPrebid(): void {
    if (prebidLoaded) return

    if (!config.public.prebidEnabled) {
      if (import.meta.dev) {
        console.info('[prebid] prebidEnabled is false, skipping Prebid.js load')
      }
      return
    }

    if (!hasConsent('marketing')) {
      if (import.meta.dev) {
        console.info('[prebid] Marketing consent not granted, skipping Prebid.js load')
      }
      return
    }

    try {
      window.pbjs = window.pbjs || { que: [] }

      prebidScript = document.createElement('script')
      prebidScript.async = true
      prebidScript.src = 'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js'
      document.head.appendChild(prebidScript)

      prebidLoaded = true

      if (import.meta.dev) console.info('[prebid] Prebid.js loaded')
    } catch (error) {
      if (import.meta.dev) {
        console.error('[prebid] Failed to load Prebid.js:', error)
      }
    }
  }

  /**
   * Unload Prebid.js and clean up.
   */
  function unloadPrebid(): void {
    if (!prebidLoaded) return

    try {
      if (prebidScript?.parentNode) {
        prebidScript.parentNode.removeChild(prebidScript)
        prebidScript = null
      }

      delete window.pbjs

      prebidLoaded = false

      if (import.meta.dev) console.info('[prebid] Prebid.js unloaded')
    } catch (error) {
      if (import.meta.dev) {
        console.error('[prebid] Failed to unload Prebid.js:', error)
      }
    }
  }

  /**
   * Watch consent changes and load/unload Prebid accordingly.
   */
  watch(
    () => consent.value,
    (newConsent) => {
      if (!newConsent) return

      if (newConsent.marketing === true && !prebidLoaded) {
        loadPrebid()
      } else if (newConsent.marketing !== true && prebidLoaded) {
        unloadPrebid()
      }
    },
    { immediate: true },
  )

  /**
   * Also check on initial load (in case consent was already given).
   */
  onMounted(() => {
    if (hasConsent('marketing') && !prebidLoaded) {
      loadPrebid()
    }
  })
})
