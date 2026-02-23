<template>
  <div class="adsense-slot">
    <!-- Priority: direct ad if available -->
    <AdSlot v-if="hasDirectAd" :position="position" :category="category" />

    <!-- Fallback: AdSense (only if no direct ad AND position allows it) -->
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

const showAdSense = computed(() => {
  if (loading.value) return false
  if (ads.value.length > 0) return false
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

onMounted(() => {
  if (!showAdSense.value) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isVisible.value = true
          // Push adsbygoogle after the ins element renders
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
          // Disconnect after first intersection
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
})

// Watch for when showAdSense becomes true after loading completes
watch(showAdSense, (val) => {
  if (val && adSenseContainer.value && observer === null && !isVisible.value) {
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
    nextTick(() => {
      if (adSenseContainer.value) {
        observer?.observe(adSenseContainer.value)
      }
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

/* Ensure AdSense ins element fills container */
.adsense-container :deep(.adsbygoogle) {
  display: block;
}
</style>
