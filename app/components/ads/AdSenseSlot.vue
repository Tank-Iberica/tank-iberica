<template>
  <div ref="adSenseSlotRef" class="adsense-slot">
    <!-- 1. Direct ad (highest priority) -->
    <AdSlot v-if="hasDirectAd" :position="position" :category="category" />

    <!-- 2. Prebid.js winning bid -->
    <div
      v-else-if="prebidWon"
      :id="prebidElementId"
      class="prebid-container"
      :class="`prebid-container--${format}`"
    />

    <!-- 3. AdSense fallback -->
    <div
      v-else-if="showAdSense"
      ref="adSenseContainer"
      class="adsense-container"
      :class="`adsense-container--${format}`"
    >
      <ins
        v-if="isVisible"
        class="adsbygoogle"
        :style="adSenseStyle"
        :data-ad-client="adClient"
        :data-ad-slot="adSlotId"
        :data-ad-format="adSenseFormat"
        data-full-width-responsive="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdPosition } from '~/composables/useAds'
import { usePrebid } from '~/composables/usePrebid'
import { useAdViewability } from '~/composables/useAdViewability'

const props = withDefaults(
  defineProps<{
    position: AdPosition
    category?: string
    format?: 'horizontal' | 'vertical' | 'rectangle' | 'in-feed'
  }>(),
  {
    category: undefined,
    format: 'rectangle',
  },
)

const runtimeConfig = useRuntimeConfig()
const adClient = computed(() => (runtimeConfig.public.adsenseId as string) || '')
const adSlotId = computed(() => (runtimeConfig.public.adsenseSlotId as string) || '')

// Positions where AdSense is NOT allowed
const ADSENSE_BLOCKED_POSITIONS: AdPosition[] = [
  'pro_teaser',
  'search_top',
  'vehicle_services',
  'email_footer',
  'pdf_footer',
]

const { ads, loading } = useAds(props.position, {
  category: props.category,
})

const hasDirectAd = computed(() => !loading.value && ads.value.length > 0)

// Prebid.js integration
const prebidElementId = `prebid-${props.position}-${Date.now()}`
const {
  prebidWon,
  requestBids,
  renderWinningAd,
  logRevenue,
  isEnabled: prebidEnabled,
} = usePrebid(props.position, prebidElementId, props.format)

// Viewability tracking for the whole slot
const adSenseSlotRef = ref<HTMLElement | null>(null)
const slotAdId = computed(() => {
  if (ads.value.length > 0) return ads.value[0].id
  return prebidWon.value ? `prebid-${props.position}` : ''
})
const adSource = computed<'direct' | 'prebid' | 'adsense'>(() => {
  if (ads.value.length > 0) return 'direct'
  if (prebidWon.value) return 'prebid'
  return 'adsense'
})
useAdViewability(adSenseSlotRef, slotAdId, {
  source: adSource.value,
  position: props.position,
})

const showAdSense = computed(() => {
  if (loading.value) return false
  if (ads.value.length > 0) return false
  if (prebidWon.value) return false
  if (ADSENSE_BLOCKED_POSITIONS.includes(props.position as AdPosition)) return false
  if (!adClient.value) return false
  return true
})

const adSenseFormat = computed(() => {
  switch (props.format) {
    case 'horizontal':
      return 'horizontal'
    case 'vertical':
      return 'vertical'
    case 'in-feed':
      return 'fluid'
    case 'rectangle':
    default:
      return 'auto'
  }
})

const adSenseStyle = computed(() => {
  switch (props.format) {
    case 'horizontal':
      return 'display:block; width:100%; height:90px;'
    case 'vertical':
      return 'display:block; width:160px; height:600px;'
    case 'in-feed':
      return 'display:block;'
    case 'rectangle':
    default:
      return 'display:block; width:100%; height:250px;'
  }
})

// Lazy load: only render AdSense ins when container is visible in viewport
const adSenseContainer = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

function setupAdSenseObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isVisible.value = true
          nextTick(() => {
            try {
              const w = window as Record<string, unknown>
              const adsbygoogle = (w.adsbygoogle || []) as unknown[]
              adsbygoogle.push({})
              w.adsbygoogle = adsbygoogle
            } catch {
              // AdSense script may not be loaded yet
            }
          })
          observer?.disconnect()
          observer = null
        }
      }
    },
    { rootMargin: '200px' },
  )
  if (adSenseContainer.value) {
    observer.observe(adSenseContainer.value)
  }
}

onMounted(async () => {
  // If no direct ads and Prebid is enabled, try header bidding first
  if (!hasDirectAd.value && prebidEnabled.value) {
    const bid = await requestBids()
    if (bid) {
      // Prebid won — render the ad and log revenue
      nextTick(() => {
        const el = document.getElementById(prebidElementId)
        if (el) {
          const iframe = document.createElement('iframe')
          iframe.style.cssText = 'border:none; width:100%; height:100%;'
          el.appendChild(iframe)
          const doc = iframe.contentDocument || iframe.contentWindow?.document
          if (doc) {
            renderWinningAd(doc)
          }
        }
      })
      logRevenue('prebid', bid.bidder, Math.round(bid.cpm * 100))
      return // Don't load AdSense
    }
  }

  // Fallback: set up lazy AdSense loading
  if (!showAdSense.value) return

  setupAdSenseObserver()
})

// Watch for when showAdSense becomes true after loading completes
watch(showAdSense, (val) => {
  if (val && adSenseContainer.value && observer === null && !isVisible.value) {
    nextTick(() => {
      setupAdSenseObserver()
    })
  }
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.adsense-slot {
  width: 100%;
}

.adsense-container {
  width: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  min-height: 50px;
}

.adsense-container--horizontal {
  min-height: 90px;
}

.adsense-container--vertical {
  min-height: 250px;
  max-width: 160px;
}

.adsense-container--rectangle {
  min-height: 250px;
}

.adsense-container--in-feed {
  min-height: 100px;
}

.prebid-container {
  width: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  min-height: 250px;
}

.prebid-container--horizontal {
  min-height: 90px;
}

.prebid-container--vertical {
  min-height: 250px;
  max-width: 160px;
}

.prebid-container--rectangle {
  min-height: 250px;
}

.prebid-container--in-feed {
  min-height: 100px;
}

/* Ensure AdSense ins element fills container */
.adsense-container :deep(.adsbygoogle) {
  display: block;
}
</style>
