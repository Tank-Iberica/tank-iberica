/**
 * Composable for the /subastas index page.
 * Handles tab switching, auction fetching, countdown timer, helpers, and SEO.
 */
import { useAuction, formatCents, type AuctionStatus, type Auction } from '~/composables/useAuction'

export type SubastasTab = 'live' | 'scheduled' | 'ended'

const STATUS_MAP: Record<SubastasTab, AuctionStatus[]> = {
  live: ['active'],
  scheduled: ['scheduled'],
  ended: ['ended', 'adjudicated', 'no_sale'],
}

export function useSubastasIndex() {
  const { t } = useI18n()
  const route = useRoute()
  const { auctions, loading, error, fetchAuctions } = useAuction()

  const activeTab = ref<SubastasTab>('live')

  // Countdown timer tick
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  // --- Data loading ---

  async function loadTab(): Promise<void> {
    await fetchAuctions({ status: STATUS_MAP[activeTab.value] })
  }

  // --- Helpers ---

  function getFirstImage(item: Auction): string | null {
    const images = item.vehicle?.vehicle_images
    if (!images || images.length === 0) return null
    const sorted = [...images].sort((a, b) => a.position - b.position)
    return sorted[0]?.url ?? null
  }

  function getVehicleTitle(item: Auction): string {
    if (item.title) return item.title
    if (item.vehicle) return `${item.vehicle.brand} ${item.vehicle.model}`
    return t('auction.untitledAuction')
  }

  function getStatusLabel(status: AuctionStatus): string {
    const map: Record<AuctionStatus, string> = {
      draft: t('auction.draft'),
      scheduled: t('auction.scheduled'),
      active: t('auction.live'),
      ended: t('auction.ended'),
      adjudicated: t('auction.adjudicated'),
      cancelled: t('auction.cancelled'),
      no_sale: t('auction.noSaleTitle'),
    }
    return map[status] || status
  }

  function getCardCountdown(item: Auction): string {
    let target: number

    if (item.status === 'scheduled') {
      target = new Date(item.starts_at).getTime()
    } else if (item.status === 'active') {
      target = new Date(item.extended_until || item.ends_at).getTime()
    } else {
      return t('auction.ended')
    }

    const diff = Math.max(0, target - now.value)
    if (diff === 0 && item.status === 'active') return t('auction.ending')

    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, '0')}h`
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  // --- Computed ---

  const emptyMessage = computed(() => {
    const map: Record<SubastasTab, string> = {
      live: t('auction.emptyLive'),
      scheduled: t('auction.emptyScheduled'),
      ended: t('auction.emptyEnded'),
    }
    return map[activeTab.value]
  })

  // --- SEO ---

  const currentPath = computed(() => route.fullPath)

  const itemListJsonLd = computed(() => {
    if (!auctions.value || auctions.value.length === 0) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: t('auction.seoTitle'),
      description: t('auction.seoDescription'),
      numberOfItems: auctions.value.length,
      itemListElement: auctions.value.map((auction, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: auction.title || `${auction.vehicle?.brand} ${auction.vehicle?.model}`,
          url: `https://tracciona.com/subastas/${auction.id}`,
          offers: {
            '@type': 'Offer',
            price:
              auction.current_bid_cents > 0
                ? (auction.current_bid_cents / 100).toString()
                : (auction.start_price_cents / 100).toString(),
            priceCurrency: 'EUR',
            availability:
              auction.status === 'active'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        },
      })),
    }
  })

  function setupSeo(): void {
    usePageSeo({
      title: t('auction.seoTitle'),
      description: t('auction.seoDescription'),
      path: currentPath.value,
      jsonLd: itemListJsonLd.value || undefined,
    })
  }

  // --- Lifecycle ---

  function init(): void {
    // Start countdown timer
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)

    // Watch tab changes
    watch(activeTab, loadTab)

    // Initial load
    loadTab()

    // Setup SEO
    setupSeo()
  }

  function destroy(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    // State
    activeTab,
    auctions,
    loading,
    error,
    now,
    emptyMessage,

    // Methods
    init,
    destroy,
    loadTab,

    // Helpers
    getFirstImage,
    getVehicleTitle,
    getStatusLabel,
    getCardCountdown,
    formatCents,
  }
}
