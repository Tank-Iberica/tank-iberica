<script setup lang="ts">
import { renderStars } from '~/composables/useVendedorDetail'
import type { VendedorProfile } from '~/composables/useVendedorDetail'

defineProps<{
  profile: VendedorProfile
  sellerName: string
  sellerBio: string
  sellerLocation: string
  memberSince: string
  responseTimeBadge: string
  responseTimeLabel: string
  avgRating: number
}>()

const { getImageUrl } = useImageUrl()
</script>

<template>
  <section class="seller-header">
    <div class="seller-header__inner">
      <div class="seller-header__logo-wrap">
        <img
          v-if="profile.logo_url"
          :src="getImageUrl(profile.logo_url, 'thumb')"
          :alt="sellerName"
          class="seller-header__logo"
        />
        <div v-else class="seller-header__logo-placeholder">
          {{ sellerName.charAt(0).toUpperCase() }}
        </div>
      </div>

      <div class="seller-header__info">
        <h1 class="seller-header__name">
          {{ sellerName }}
          <span v-if="profile.verified" class="verified-badge" :title="$t('seller.verified')">
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <span v-if="profile.badge === 'founding'" class="founding-badge">
            {{ $t('dealer.foundingBadge') }}
          </span>
        </h1>

        <p v-if="sellerLocation" class="seller-header__location">
          {{ sellerLocation }}
        </p>

        <div class="seller-header__meta">
          <span class="meta-item">{{ $t('seller.memberSince') }}: {{ memberSince }}</span>
          <span class="meta-item meta-item--badge" :class="`badge--${responseTimeBadge}`">
            {{ responseTimeLabel }}
          </span>
        </div>

        <div v-if="avgRating > 0" class="seller-header__rating">
          <span class="stars" aria-hidden="true">{{ renderStars(avgRating) }}</span>
          <span class="rating-value">{{ avgRating }}</span>
          <span class="rating-count">({{ profile.total_reviews }} {{ $t('seller.reviews') }})</span>
        </div>
      </div>
    </div>

    <!-- Bio -->
    <p v-if="sellerBio" class="seller-header__bio">
      {{ sellerBio }}
    </p>
  </section>
</template>

<style scoped>
.seller-header {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.seller-header__inner {
  display: flex;
  gap: var(--spacing-4);
  align-items: flex-start;
}

.seller-header__logo-wrap {
  flex-shrink: 0;
}

.seller-header__logo {
  width: 72px;
  height: 72px;
  border-radius: var(--border-radius-md);
  object-fit: cover;
  border: 2px solid var(--border-color-light);
}

.seller-header__logo-placeholder {
  width: 72px;
  height: 72px;
  border-radius: var(--border-radius-md);
  background: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.seller-header__info {
  min-width: 0;
  flex: 1;
}

.seller-header__name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.verified-badge {
  color: var(--color-info);
  display: inline-flex;
  flex-shrink: 0;
}

.founding-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  background: linear-gradient(135deg, #f5d547 0%, var(--color-gold) 100%);
  color: #5a4500;
}

.seller-header__location {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
}

.seller-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.meta-item {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.meta-item--badge {
  padding: 2px var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
}

.badge--fast {
  background: #d1fae5;
  color: #065f46;
}

.badge--good {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning-text);
}

.badge--slow {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}

.badge--unknown {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
}

.seller-header__rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
}

.stars {
  color: var(--color-gold);
  letter-spacing: 1px;
}

.rating-value {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.rating-count {
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
}

.seller-header__bio {
  margin-top: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .seller-header {
    padding: 0 var(--spacing-8);
  }

  .seller-header__logo {
    width: 96px;
    height: 96px;
  }

  .seller-header__logo-placeholder {
    width: 96px;
    height: 96px;
    font-size: var(--font-size-3xl);
  }

  .seller-header__name {
    font-size: var(--font-size-2xl);
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .seller-header__inner {
    gap: var(--spacing-6);
  }
}
</style>
