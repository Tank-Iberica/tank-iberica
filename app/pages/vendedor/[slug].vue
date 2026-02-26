<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const route = useRoute()
const { getImageUrl } = useImageUrl()

const {
  profile,
  reviews,
  loading,
  reviewsLoading,
  avgRating,
  responseTimeBadge,
  memberSince,
  activeVehicles,
  fetchProfile,
  fetchReviews,
  fetchActiveVehicles,
  submitReview,
  canReview,
} = useSellerProfile()

// --------------- Review form state ---------------

const reviewPage = ref(1)
const reviewRating = ref(5)
const reviewTitle = ref('')
const reviewContent = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

// --------------- Computed helpers ---------------

const sellerName = computed<string>(() => {
  if (!profile.value) return ''
  return localizedField(profile.value.company_name, locale.value) || profile.value.legal_name || ''
})

const sellerBio = computed<string>(() => {
  if (!profile.value?.bio) return ''
  return localizedField(profile.value.bio, locale.value)
})

const sellerLocation = computed<string>(() => {
  if (!profile.value?.location_data) return ''
  const loc = profile.value.location_data
  return [loc.city, loc.province, loc.country].filter(Boolean).join(', ')
})

const responseTimeLabel = computed<string>(() => {
  const badge = responseTimeBadge.value
  if (badge === 'fast') return t('seller.responseTimeFast')
  if (badge === 'good') return t('seller.responseTimeGood')
  if (badge === 'slow') return t('seller.responseTimeSlow')
  return t('seller.responseTimeUnknown')
})

const responseRateFormatted = computed<string>(() => {
  const rate = profile.value?.response_rate_pct
  if (rate === null || rate === undefined) return '--'
  return `${rate}%`
})

// --------------- SEO ---------------

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
  link: computed(() => {
    const slug = route.params.slug as string
    const path = `/vendedor/${slug}`
    return [
      { rel: 'canonical', href: `https://tracciona.com${path}` },
      { rel: 'alternate', hreflang: 'es', href: `https://tracciona.com${path}` },
      { rel: 'alternate', hreflang: 'en', href: `https://tracciona.com/en${path}` },
      { rel: 'alternate', hreflang: 'x-default', href: `https://tracciona.com${path}` },
    ]
  }),
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!profile.value) return ''
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: sellerName.value,
          description: sellerBio.value,
          image: profile.value.logo_url || undefined,
          address: profile.value.location_data
            ? {
                '@type': 'PostalAddress',
                addressLocality: profile.value.location_data.city || undefined,
                addressRegion: profile.value.location_data.province || undefined,
                addressCountry: profile.value.location_data.country || undefined,
              }
            : undefined,
          aggregateRating:
            profile.value.total_reviews > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: avgRating.value,
                  reviewCount: profile.value.total_reviews,
                }
              : undefined,
          url: profile.value.website || undefined,
          telephone: profile.value.phone || undefined,
        })
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!sellerName.value) return ''
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://tracciona.com' },
            {
              '@type': 'ListItem',
              position: 2,
              name: sellerName.value,
              item: `https://tracciona.com/vendedor/${route.params.slug}`,
            },
          ],
        })
      }),
    },
  ],
})

// --------------- Actions ---------------

async function loadMoreReviews(): Promise<void> {
  reviewPage.value += 1
  await fetchReviews(reviewPage.value)
}

async function handleSubmitReview(): Promise<void> {
  submitError.value = null
  submitSuccess.value = false

  if (reviewRating.value < 1 || reviewRating.value > 5) {
    submitError.value = t('seller.reviewErrorRating')
    return
  }
  if (!reviewContent.value.trim()) {
    submitError.value = t('seller.reviewErrorContent')
    return
  }

  submitting.value = true
  try {
    const success = await submitReview(
      reviewRating.value,
      reviewTitle.value.trim(),
      reviewContent.value.trim(),
    )
    if (success) {
      submitSuccess.value = true
      reviewRating.value = 5
      reviewTitle.value = ''
      reviewContent.value = ''
    } else {
      submitError.value = t('seller.reviewErrorGeneric')
    }
  } catch {
    submitError.value = t('seller.reviewErrorGeneric')
  } finally {
    submitting.value = false
  }
}

function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty)
}

// --------------- Fetch on mount ---------------

const slug = computed(() => route.params.slug as string)

onMounted(async () => {
  await fetchProfile(slug.value)
  await Promise.all([fetchReviews(), fetchActiveVehicles()])
})
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
      <!-- Header -->
      <section class="seller-header">
        <div class="seller-header__inner">
          <div class="seller-header__logo-wrap">
            <img
              v-if="profile.logo_url"
              :src="getImageUrl(profile.logo_url, 'thumb')"
              :alt="sellerName"
              class="seller-header__logo"
            >
            <div v-else class="seller-header__logo-placeholder">
              {{ sellerName.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="seller-header__info">
            <h1 class="seller-header__name">
              {{ sellerName }}
              <span v-if="profile.verified" class="verified-badge" :title="$t('seller.verified')">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
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
              <span class="rating-count"
                >({{ profile.total_reviews }} {{ $t('seller.reviews') }})</span
              >
            </div>
          </div>
        </div>

        <!-- Bio -->
        <p v-if="sellerBio" class="seller-header__bio">
          {{ sellerBio }}
        </p>
      </section>

      <!-- Stats row -->
      <section class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ profile.active_listings }}</span>
          <span class="stat-label">{{ $t('seller.activeVehicles') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ profile.total_reviews }}</span>
          <span class="stat-label">{{ $t('seller.totalReviews') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ avgRating > 0 ? avgRating : '--' }}</span>
          <span class="stat-label">{{ $t('seller.avgRating') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ responseRateFormatted }}</span>
          <span class="stat-label">{{ $t('seller.responseRate') }}</span>
        </div>
      </section>

      <!-- Reviews section -->
      <section class="reviews-section">
        <h2 class="section-title">{{ $t('seller.reviewsTitle') }}</h2>

        <div v-if="reviewsLoading" class="loading-state">
          {{ $t('common.loading') }}
        </div>

        <div v-else-if="reviews.length === 0" class="empty-reviews">
          <p>{{ $t('seller.noReviews') }}</p>
        </div>

        <div v-else class="reviews-list">
          <article v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-card__header">
              <span class="review-stars" aria-hidden="true">{{ renderStars(review.rating) }}</span>
              <span class="review-rating">{{ review.rating }}/5</span>
              <span v-if="review.verified_purchase" class="review-verified">
                {{ $t('seller.verifiedPurchase') }}
              </span>
            </div>
            <h3 v-if="review.title" class="review-title">{{ review.title }}</h3>
            <p v-if="review.content" class="review-content">{{ review.content }}</p>
            <div class="review-footer">
              <span class="review-author">{{
                review.reviewer_name || $t('seller.anonymous')
              }}</span>
              <time class="review-date" :datetime="review.created_at">
                {{ new Date(review.created_at).toLocaleDateString() }}
              </time>
            </div>
          </article>

          <button
            v-if="reviews.length >= 10"
            class="btn-load-more"
            :disabled="reviewsLoading"
            @click="loadMoreReviews"
          >
            {{ $t('seller.loadMoreReviews') }}
          </button>
        </div>
      </section>

      <!-- Submit review form -->
      <section v-if="canReview" class="review-form-section">
        <h2 class="section-title">{{ $t('seller.writeReview') }}</h2>

        <div v-if="submitSuccess" class="success-banner">
          {{ $t('seller.reviewSubmitted') }}
        </div>

        <form v-else class="review-form" @submit.prevent="handleSubmitReview">
          <!-- Rating selector -->
          <fieldset class="form-group">
            <legend class="form-label">{{ $t('seller.yourRating') }}</legend>
            <div class="rating-selector">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="rating-star-btn"
                :class="{ 'rating-star-btn--active': star <= reviewRating }"
                :aria-label="`${star} ${$t('seller.stars')}`"
                @click="reviewRating = star"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="28"
                  height="28"
                  aria-hidden="true"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </button>
            </div>
          </fieldset>

          <!-- Title -->
          <div class="form-group">
            <label for="review-title" class="form-label">{{ $t('seller.reviewTitleLabel') }}</label>
            <input
              id="review-title"
              v-model="reviewTitle"
              type="text"
              class="form-input"
              :placeholder="$t('seller.reviewTitlePlaceholder')"
              maxlength="120"
            >
          </div>

          <!-- Content -->
          <div class="form-group">
            <label for="review-content" class="form-label"
              >{{ $t('seller.reviewContentLabel') }} *</label
            >
            <textarea
              id="review-content"
              v-model="reviewContent"
              class="form-textarea"
              :placeholder="$t('seller.reviewContentPlaceholder')"
              rows="4"
              maxlength="2000"
              required
            />
          </div>

          <!-- Error -->
          <p v-if="submitError" class="form-error">{{ submitError }}</p>

          <!-- Submit -->
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? $t('common.loading') : $t('seller.submitReview') }}
          </button>
        </form>
      </section>

      <!-- Active vehicles -->
      <section v-if="activeVehicles.length > 0" class="vehicles-section">
        <h2 class="section-title">{{ $t('seller.vehiclesTitle') }}</h2>

        <div class="vehicles-grid">
          <NuxtLink
            v-for="vehicle in activeVehicles"
            :key="vehicle.id"
            :to="`/vehiculo/${vehicle.slug}`"
            class="vehicle-card"
          >
            <div class="vehicle-card__image">
              <img
                v-if="vehicle.images_json && vehicle.images_json.length > 0"
                :src="getImageUrl(String(vehicle.images_json[0]), 'thumb')"
                :alt="`${vehicle.brand} ${vehicle.model}`"
                loading="lazy"
              >
              <div v-else class="vehicle-card__placeholder">
                {{ vehicle.brand.charAt(0) }}
              </div>
            </div>
            <div class="vehicle-card__body">
              <h3 class="vehicle-card__title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
              <span v-if="vehicle.price" class="vehicle-card__price">
                {{ vehicle.price.toLocaleString() }} &euro;
              </span>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.seller-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 var(--spacing-12);
}

/* Loading / empty */
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

/* ---- Header ---- */
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
  background: linear-gradient(135deg, #f5d547 0%, #d4a017 100%);
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
  background: #fef3c7;
  color: #92400e;
}

.badge--slow {
  background: #fee2e2;
  color: #991b1b;
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

/* ---- Stats row ---- */
.stats-row {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* ---- Section title ---- */
.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

/* ---- Reviews section ---- */
.reviews-section {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.empty-reviews {
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.review-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.review-card__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.review-stars {
  color: var(--color-gold);
  font-size: var(--font-size-sm);
  letter-spacing: 1px;
}

.review-rating {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.review-verified {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

.review-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.review-content {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-3);
}

.review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.review-author {
  font-weight: var(--font-weight-medium);
}

.btn-load-more {
  display: block;
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-load-more:hover {
  background: var(--bg-secondary);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Review form ---- */
.review-form-section {
  max-width: 960px;
  margin: 0 auto var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.success-banner {
  padding: var(--spacing-4);
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: var(--border-radius);
  color: #065f46;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.review-form {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: var(--spacing-4);
  border: none;
  padding: 0;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.rating-selector {
  display: flex;
  gap: var(--spacing-1);
}

.rating-star-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-300);
  transition: color var(--transition-fast);
}

.rating-star-btn--active {
  color: var(--color-gold);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  margin-bottom: var(--spacing-3);
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Vehicles section ---- */
.vehicles-section {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.vehicle-card {
  display: block;
  text-decoration: none;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.vehicle-card:hover {
  box-shadow: var(--shadow-md);
}

.vehicle-card__image {
  width: 100%;
  height: 120px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.vehicle-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.vehicle-card__body {
  padding: var(--spacing-3);
}

.vehicle-card__title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--spacing-1);
}

.vehicle-card__price {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
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

  .stats-row {
    grid-template-columns: repeat(4, 1fr);
    padding: 0 var(--spacing-8);
  }

  .reviews-section,
  .review-form-section,
  .vehicles-section {
    padding: 0 var(--spacing-8);
  }

  .section-title {
    font-size: var(--font-size-xl);
  }

  .vehicles-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .vehicle-card__image {
    height: 140px;
  }

  .vehicle-card__title {
    font-size: var(--font-size-sm);
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .seller-header__inner {
    gap: var(--spacing-6);
  }

  .vehicles-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }

  .vehicle-card__image {
    height: 160px;
  }

  .review-form {
    padding: var(--spacing-6);
  }
}
</style>
