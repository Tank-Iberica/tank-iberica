<template>
  <div v-if="ads.length > 0" ref="adSlotRef" class="ad-slot" :class="`ad-slot--${position}`">
    <div v-for="ad in ads" :key="ad.id" class="ad-item" :class="`ad-item--${ad.format}`">
      <!-- Card format -->
      <div v-if="ad.format === 'card'" class="ad-card" @click="handleClick(ad)">
        <span class="ad-badge">{{ $t('ads.sponsored') }}</span>
        <div class="ad-card__header">
          <img
            v-if="ad.logo_url"
            :src="ad.logo_url"
            :alt="ad.title || $t('ads.sponsoredAd')"
            class="ad-card__logo"
            loading="lazy"
          >
        </div>
        <div class="ad-card__body">
          <h3 v-if="ad.title" class="ad-card__title">{{ ad.title }}</h3>
          <p v-if="ad.description" class="ad-card__description">{{ ad.description }}</p>
        </div>
        <div class="ad-card__footer">
          <a
            v-if="ad.phone"
            :href="`tel:${ad.phone}`"
            class="ad-card__phone"
            :aria-label="$t('ads.callNow')"
            @click.stop="handlePhoneClick(ad)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              />
            </svg>
            {{ ad.phone }}
          </a>
          <button v-if="ad.link_url" class="ad-card__cta" @click.stop="handleClick(ad)">
            {{ ctaText(ad) }}
          </button>
        </div>
      </div>

      <!-- Banner format -->
      <div v-else-if="ad.format === 'banner'" class="ad-banner" @click="handleClick(ad)">
        <span class="ad-badge">{{ $t('ads.sponsored') }}</span>
        <img
          v-if="ad.image_url"
          :src="ad.image_url"
          :alt="ad.title || $t('ads.sponsoredAd')"
          class="ad-banner__image"
          loading="lazy"
        >
        <div v-if="ad.title || ad.description" class="ad-banner__overlay">
          <h3 v-if="ad.title" class="ad-banner__title">{{ ad.title }}</h3>
          <p v-if="ad.description" class="ad-banner__description">{{ ad.description }}</p>
        </div>
      </div>

      <!-- Text format -->
      <div v-else-if="ad.format === 'text'" class="ad-text" @click="handleClick(ad)">
        <span class="ad-text__label">{{ $t('ads.sponsored') }}</span>
        <a
          :href="ad.link_url"
          class="ad-text__link"
          target="_blank"
          rel="noopener"
          @click.prevent="handleClick(ad)"
        >
          {{ ad.title || ad.link_url }}
        </a>
      </div>

      <!-- Logo strip format (for PDF footer) -->
      <div v-else-if="ad.format === 'logo_strip'" class="ad-logo-strip">
        <img
          v-if="ad.logo_url"
          :src="ad.logo_url"
          :alt="ad.title || $t('ads.sponsoredAd')"
          class="ad-logo-strip__logo"
          loading="lazy"
        >
        <div class="ad-logo-strip__info">
          <span v-if="ad.title" class="ad-logo-strip__name">{{ ad.title }}</span>
          <a
            v-if="ad.phone"
            :href="`tel:${ad.phone}`"
            class="ad-logo-strip__phone"
            @click.stop="handlePhoneClick(ad)"
          >
            {{ ad.phone }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdPosition, Ad } from '~/composables/useAds'
import { useAdViewability } from '~/composables/useAdViewability'
import { useAudienceSegmentation } from '~/composables/useAudienceSegmentation'

const props = withDefaults(
  defineProps<{
    position: AdPosition
    category?: string
    action?: string
    vehicleLocation?: string
    maxAds?: number
  }>(),
  {
    category: undefined,
    action: undefined,
    vehicleLocation: undefined,
    maxAds: 1,
  },
)

const adSlotRef = ref<HTMLElement | null>(null)

const { locale } = useI18n()
const { segments } = useAudienceSegmentation()

const { ads, handleClick, handlePhoneClick } = useAds(props.position, {
  category: props.category,
  action: props.action,
  vehicleLocation: props.vehicleLocation,
  maxAds: props.maxAds,
  userSegments: segments.value,
})

const firstAdId = computed(() => ads.value[0]?.id || '')

useAdViewability(adSlotRef, firstAdId.value || null, { source: 'direct', position: props.position })

function ctaText(ad: Ad): string {
  if (ad.cta_text) {
    return localizedField(ad.cta_text, locale.value)
  }
  return ''
}
</script>

<style scoped>
.ad-slot {
  width: 100%;
}

/* ---- Badge (always visible) ---- */
.ad-badge {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  z-index: 2;
  line-height: 1;
  letter-spacing: 0.02em;
}

/* ==================================
   CARD FORMAT
   ================================== */
.ad-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition:
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.ad-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.ad-card__header {
  display: flex;
  align-items: center;
  padding: var(--spacing-4);
  padding-right: calc(var(--spacing-2) + 80px); /* space for badge */
}

.ad-card__logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: var(--border-radius);
  flex-shrink: 0;
}

.ad-card__body {
  padding: 0 var(--spacing-4);
  flex: 1;
}

.ad-card__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
  line-height: var(--line-height-tight);
}

.ad-card__description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ad-card__footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
  flex-wrap: wrap;
}

.ad-card__phone {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.ad-card__phone:hover {
  background: var(--bg-secondary);
}

.ad-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  transition: background var(--transition-fast);
  margin-left: auto;
}

.ad-card__cta:hover {
  background: var(--color-primary-dark);
}

/* ==================================
   BANNER FORMAT
   ================================== */
.ad-banner {
  position: relative;
  width: 100%;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}

.ad-banner:hover {
  box-shadow: var(--shadow-md);
}

.ad-banner__image {
  width: 100%;
  height: auto;
  display: block;
  min-height: 100px;
  object-fit: cover;
}

.ad-banner__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-4);
  color: var(--color-white);
}

.ad-banner__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-1) 0;
  line-height: var(--line-height-tight);
}

.ad-banner__description {
  font-size: var(--font-size-sm);
  margin: 0;
  opacity: 0.9;
  line-height: var(--line-height-normal);
}

/* ==================================
   TEXT FORMAT
   ================================== */
.ad-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
  cursor: pointer;
  min-height: 44px;
}

.ad-text__label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ad-text__link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color var(--transition-fast);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-text:hover .ad-text__link {
  text-decoration-color: var(--color-primary);
}

/* ==================================
   LOGO STRIP FORMAT (PDF footer)
   ================================== */
.ad-logo-strip {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
}

.ad-logo-strip__logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
}

.ad-logo-strip__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.ad-logo-strip__name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-logo-strip__phone {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

/* ==================================
   Multiple ads: stack vertically on mobile
   ================================== */
.ad-slot > .ad-item + .ad-item {
  margin-top: var(--spacing-4);
}

/* ==================================
   Responsive: tablet+
   ================================== */
@media (min-width: 768px) {
  .ad-card__title {
    font-size: var(--font-size-lg);
  }

  .ad-card__description {
    -webkit-line-clamp: 4;
  }

  .ad-banner__title {
    font-size: var(--font-size-xl);
  }

  .ad-banner__overlay {
    padding: var(--spacing-8) var(--spacing-6) var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .ad-card__logo {
    width: 56px;
    height: 56px;
  }

  .ad-banner__title {
    font-size: var(--font-size-2xl);
  }
}
</style>
