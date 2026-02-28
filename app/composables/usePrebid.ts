/**
 * usePrebid — Prebid.js header bidding composable
 *
 * Manages header bidding auctions via Prebid.js, including:
 * - Floor price lookups from Supabase
 * - Demand partner configuration
 * - Bid request/response handling
 * - Revenue logging
 */

import type { AdPosition } from '~/composables/useAds'

type AdSenseFormat = 'horizontal' | 'vertical' | 'rectangle' | 'in-feed'

interface PrebidBidResponse {
  adId: string
  cpm: number
  bidder: string
  width: number
  height: number
  ad: string
  statusMessage: string
}

/** Demand partner placeholder configs */
const DEMAND_PARTNERS: Record<string, Record<string, unknown>> = {
  appnexus: { placementId: 'PLACEHOLDER_APPNEXUS_ID' },
  rubicon: {
    accountId: 'PLACEHOLDER_RUBICON_ACCOUNT',
    siteId: 'PLACEHOLDER_SITE',
    zoneId: 'PLACEHOLDER_ZONE',
  },
  openx: {
    unit: 'PLACEHOLDER_OPENX_UNIT',
    delDomain: 'PLACEHOLDER_DOMAIN',
  },
  ix: { siteId: 'PLACEHOLDER_IX_SITE' },
}

/** Floor price cache (per session) */
let floorPriceCache: Map<string, number> | null = null

/**
 * Map ad format to IAB standard banner sizes.
 */
function getSizesForFormat(format: AdSenseFormat): number[][] {
  switch (format) {
    case 'horizontal':
      return [
        [728, 90],
        [970, 90],
        [320, 50],
      ]
    case 'vertical':
      return [
        [160, 600],
        [120, 600],
        [300, 600],
      ]
    case 'rectangle':
      return [
        [300, 250],
        [336, 280],
      ]
    case 'in-feed':
      return [
        [300, 250],
        [1, 1],
      ]
    default:
      return [[300, 250]]
  }
}

/**
 * Composable for managing Prebid.js header bidding for a specific ad slot.
 *
 * @param position - The ad position from the ads system
 * @param elementId - The DOM element ID for the ad slot
 * @param format - The AdSense format (determines banner sizes)
 */
export function usePrebid(
  position: AdPosition,
  elementId: string,
  format: AdSenseFormat = 'rectangle',
) {
  const runtimeConfig = useRuntimeConfig()
  const supabase = useSupabaseClient()

  const prebidWon = ref(false)
  const winningBid = ref<PrebidBidResponse | null>(null)
  const loading = ref(false)

  const isEnabled = computed(() => runtimeConfig.public.prebidEnabled === true)
  const timeout = computed(() => (runtimeConfig.public.prebidTimeout as number) || 1500)

  /**
   * Fetch floor prices from Supabase (cached per session).
   */
  async function getFloorPrices(): Promise<Map<string, number>> {
    if (floorPriceCache) return floorPriceCache

    try {
      const { data } = await supabase
        .from('ad_floor_prices')
        .select('position, floor_cpm_cents')
        .eq('vertical', 'tracciona')

      floorPriceCache = new Map()
      for (const row of data || []) {
        floorPriceCache.set(
          (row as { position: string; floor_cpm_cents: number }).position,
          (row as { position: string; floor_cpm_cents: number }).floor_cpm_cents / 100,
        )
      }
    } catch {
      floorPriceCache = new Map()
    }

    return floorPriceCache
  }

  /**
   * Build a Prebid ad unit configuration for the current slot.
   */
  function buildAdUnit(floorPrice: number) {
    const sizes = getSizesForFormat(format)
    const bids = Object.entries(DEMAND_PARTNERS).map(([bidder, params]) => ({
      bidder,
      params,
    }))

    return {
      code: elementId,
      mediaTypes: {
        banner: { sizes },
      },
      bids,
      floors:
        floorPrice > 0
          ? {
              currency: 'EUR',
              schema: { fields: ['mediaType'] },
              values: { banner: floorPrice },
            }
          : undefined,
    }
  }

  /**
   * Request bids from Prebid.js demand partners.
   * Returns the winning bid or null if no bids beat the floor.
   */
  async function requestBids(): Promise<PrebidBidResponse | null> {
    if (!isEnabled.value || !window.pbjs?.requestBids) return null

    loading.value = true
    const floors = await getFloorPrices()
    const floorPrice = floors.get(position) || 0
    const adUnit = buildAdUnit(floorPrice)

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        loading.value = false
        resolve(null)
      }, timeout.value)

      window.pbjs!.que.push(() => {
        window.pbjs!.removeAdUnit?.(elementId)
        window.pbjs!.addAdUnits?.([adUnit])

        // Integration point: useAudienceSegmentation can provide
        // first-party data via getSegmentsForPrebid()

        window.pbjs!.requestBids?.({
          bidsBackHandler: (bidResponses: Record<string, { bids: PrebidBidResponse[] }>) => {
            clearTimeout(timeoutId)
            loading.value = false

            const unitBids = bidResponses[elementId]?.bids || []
            if (unitBids.length > 0) {
              // Sort by CPM descending, take highest
              const best = unitBids.sort((a, b) => b.cpm - a.cpm)[0]!

              // Check against floor price
              if (floorPrice > 0 && best.cpm < floorPrice) {
                resolve(null)
                return
              }

              winningBid.value = best
              prebidWon.value = true
              resolve(best)
            } else {
              resolve(null)
            }
          },
          timeout: timeout.value,
        })
      })
    })
  }

  /**
   * Render the winning Prebid ad into a document (typically an iframe).
   */
  function renderWinningAd(doc: Document) {
    if (winningBid.value && window.pbjs?.renderAd) {
      window.pbjs.renderAd(doc, winningBid.value.adId)
    }
  }

  /**
   * Log ad revenue to Supabase for reporting.
   */
  async function logRevenue(source: string, bidder: string | null, cpmCents: number) {
    try {
      await supabase.from('ad_revenue_log').insert({
        position,
        source,
        bidder: bidder || null,
        cpm_cents: cpmCents,
        currency: 'EUR',
        page_path: useRoute().fullPath,
      })
    } catch {
      // Fire and forget — revenue logging should not break UX
    }
  }

  return {
    /** Whether Prebid won the auction for this slot */
    prebidWon,
    /** The winning bid details (null if no winner) */
    winningBid,
    /** Whether a bid request is in progress */
    loading,
    /** Whether Prebid is enabled via runtime config */
    isEnabled,
    /** Request bids from demand partners */
    requestBids,
    /** Render the winning ad into a document */
    renderWinningAd,
    /** Log revenue event to Supabase */
    logRevenue,
  }
}
