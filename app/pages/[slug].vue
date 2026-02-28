<script setup lang="ts">
import { useVendedorDetail } from '~/composables/useVendedorDetail'

definePageMeta({ layout: 'default' })

const { t } = useI18n()

const {
  profile,
  reviews,
  loading,
  reviewsLoading,
  activeVehicles,
  canReview,
  avgRating,
  responseTimeBadge,
  memberSince,
  sellerName,
  sellerBio,
  sellerLocation,
  responseTimeLabel,
  responseRateFormatted,
  reviewRating,
  reviewTitle,
  reviewContent,
  submitting,
  submitError,
  submitSuccess,
  init,
  loadMoreReviews,
  handleSubmitReview,
  setReviewRating,
  setReviewTitle,
  setReviewContent,
  jsonLdBusiness,
  jsonLdBreadcrumb,
  hrefLinks,
} = useVendedorDetail()

// ---- SEO ----

useSeoMeta({
  title: () => (sellerName.value ? `${sellerName.value} — Tracciona` : 'Tracciona'),
  ogTitle: () => sellerName.value || 'Tracciona',
  description: () => sellerBio.value || t('seller.seoDefaultDescription'),
  ogDescription: () => sellerBio.value || t('seller.seoDefaultDescription'),
  ogImage: () => profile.value?.logo_url || '/og-default.png',
  ogType: 'profile',
  ogLocale: 'es_ES',
  ogLocaleAlternate: ['en_GB'],
  ogSiteName: 'Tracciona',
  twitterCard: 'summary_large_image',
  twitterTitle: () => sellerName.value || 'Tracciona',
  twitterDescription: () => sellerBio.value || t('seller.seoDefaultDescription'),
  twitterImage: () => profile.value?.logo_url || '/og-default.png',
})

useHead({
  link: hrefLinks,
  script: [
    { type: 'application/ld+json', innerHTML: jsonLdBusiness },
    { type: 'application/ld+json', innerHTML: jsonLdBreadcrumb },
  ],
})

// ---- Init ----

onMounted(() => init())
</script>

<template>
  <div class="seller-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <!-- Not found -->
    <div v-else-if="!profile" class="empty-state">
      <p class="empty-title">{{ $t('seller.notFound') }}</p>
      <NuxtLink to="/" class="btn-primary">
        {{ $t('common.backHome') }}
      </NuxtLink>
    </div>

    <!-- Seller profile -->
    <template v-else>
      <BreadcrumbNav :items="[{ label: $t('nav.home'), to: '/' }, { label: sellerName || '' }]" />

      <VendedorHeader
        :profile="profile"
        :seller-name="sellerName"
        :seller-bio="sellerBio"
        :seller-location="sellerLocation"
        :member-since="memberSince"
        :response-time-badge="responseTimeBadge"
        :response-time-label="responseTimeLabel"
        :avg-rating="avgRating"
      />

      <VendedorStats
        :active-listings="profile.active_listings"
        :total-reviews="profile.total_reviews"
        :avg-rating="avgRating"
        :response-rate-formatted="responseRateFormatted"
      />

      <VendedorReviewsList
        :reviews="reviews"
        :reviews-loading="reviewsLoading"
        @load-more="loadMoreReviews"
      />

      <VendedorReviewForm
        :can-review="canReview"
        :review-rating="reviewRating"
        :review-title="reviewTitle"
        :review-content="reviewContent"
        :submitting="submitting"
        :submit-error="submitError"
        :submit-success="submitSuccess"
        @update-rating="setReviewRating"
        @update-title="setReviewTitle"
        @update-content="setReviewContent"
        @submit="handleSubmitReview"
      />

      <VendedorVehiclesGrid :vehicles="activeVehicles" />
    </template>
  </div>
</template>

<style scoped>
.seller-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 var(--spacing-12);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
