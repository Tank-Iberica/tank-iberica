<template>
  <div v-if="visible" class="announcement-banner">
    <span>
      {{ bannerText }}
      <a
        v-if="bannerLink"
        :href="bannerLink"
        :target="isExternalLink ? '_blank' : undefined"
        :rel="isExternalLink ? 'noopener' : undefined"
        class="banner-link"
      >{{ $t('banner.moreInfo') }}</a>
    </span>
    <button class="announcement-close" :aria-label="$t('common.close')" @click="dismiss">
      &#215;
    </button>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { locale } = useI18n()

interface BannerConfig {
  active?: boolean
  enabled?: boolean
  text_es?: string
  text_en?: string
  link?: string
  url?: string
  fecha_inicio?: string
  fecha_fin?: string
  from_date?: string
  to_date?: string
}

const bannerData = ref<BannerConfig | null>(null)
const dismissed = ref(false)

const isActive = computed(() => {
  if (!bannerData.value) return false
  // 'enabled' (set by admin) takes priority; fallback to 'active' for backwards compat
  if (bannerData.value.enabled !== undefined) return !!bannerData.value.enabled
  if (bannerData.value.active !== undefined) return !!bannerData.value.active
  return false
})

const bannerText = computed(() => {
  if (!isActive.value) return null
  if (locale.value === 'en' && bannerData.value?.text_en) return bannerData.value.text_en
  return bannerData.value?.text_es || null
})

const bannerLink = computed(() => bannerData.value?.link || bannerData.value?.url || null)

const isExternalLink = computed(() => {
  if (!bannerLink.value) return false
  try {
    const url = new URL(bannerLink.value, window.location.origin)
    return url.hostname !== window.location.hostname
  }
  catch {
    return false
  }
})

const isWithinSchedule = computed(() => {
  if (!bannerData.value) return false
  const now = new Date()
  const startDate = bannerData.value.fecha_inicio || bannerData.value.from_date
  const endDate = bannerData.value.fecha_fin || bannerData.value.to_date
  if (startDate) {
    const start = new Date(startDate)
    if (now < start) return false
  }
  if (endDate) {
    const end = new Date(endDate)
    if (now > end) return false
  }
  return true
})

const visible = computed(() => {
  return bannerText.value && isWithinSchedule.value && !dismissed.value
})

function dismiss() {
  dismissed.value = true
  document.body.classList.remove('banner-visible')
}

watch(visible, (val) => {
  if (val) {
    document.body.classList.add('banner-visible')
  }
  else {
    document.body.classList.remove('banner-visible')
  }
}, { immediate: false })

onMounted(async () => {
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'banner')
    .single()

  if (data) {
    bannerData.value = (data as Record<string, unknown>).value as BannerConfig
    if (visible.value) {
      document.body.classList.add('banner-visible')
    }
  }
})

onUnmounted(() => {
  document.body.classList.remove('banner-visible')
})
</script>

<style scoped>
.announcement-banner {
  background: linear-gradient(135deg, #BF6B52 0%, #A3523B 100%);
  color: var(--color-white);
  padding: 0.38rem 2rem;
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-banner);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.banner-link {
  color: var(--color-white);
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
}

.announcement-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: var(--color-white);
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  line-height: 1;
  flex-shrink: 0;
}

.announcement-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
