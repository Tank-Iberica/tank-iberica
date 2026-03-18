<template>
  <div class="vehicle-seller-section">
    <!-- Seller Info (DSA compliance) -->
    <div v-if="sellerInfo" class="vehicle-seller-info">
      <h3>{{ $t('vehicle.sellerInfo') }}</h3>
      <!-- Trust badge based on dealer health score -->
      <SharedDealerTrustBadge
        v-if="dealerTierFromScore !== null"
        :tier="dealerTierFromScore"
        class="trust-badge-wrap"
      />
      <div class="seller-details">
        <span v-if="sellerInfo.company_name" class="seller-item seller-name-row">
          <strong>{{ sellerInfo.company_name }}</strong>
          <SharedDealerTrustBadge v-if="dealerTier" :tier="dealerTier" />
        </span>
        <span v-if="sellerInfo.location" class="seller-item">{{ sellerInfo.location }}</span>
        <span v-if="sellerInfo.cif" class="seller-item"
          >{{ $t('vehicle.sellerCif') }}: {{ sellerInfo.cif }}</span
        >
        <span v-if="responseLabel" :class="['seller-item', 'response-badge', `response-badge--${responseBadge}`]">
          {{ responseLabel }}
        </span>
      </div>
    </div>

    <!-- Seller profile link -->
    <NuxtLink
      v-if="sellerInfo && dealerId"
      :to="`/${dealerSlug || dealerId}`"
      class="seller-profile-link"
    >
      {{ $t('vehicle.viewSellerProfile') }}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </NuxtLink>

    <!-- Dealer reviews section -->
    <DealerReviewsSection v-if="dealerId" :dealer-id="dealerId" />

    <!-- Disclaimer for terceros -->
    <div v-if="isTerceros" class="vehicle-disclaimer">
      {{ $t('vehicle.disclaimer') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SellerInfo } from '~/composables/useVehicleDetail'
import type { TrustBadgeTier } from '~/composables/useDealerTrustScore'

const props = defineProps<{
  sellerInfo: SellerInfo | null
  dealerId: string | null
  dealerSlug: string | null
  isTerceros: boolean
  dealerTier?: TrustBadgeTier
}>()

const { t } = useI18n()

// Response time badge
type ResponseBadge = 'fast' | 'good' | 'slow' | 'unknown'

const responseBadge = computed<ResponseBadge>(() => {
  const minutes = props.sellerInfo?.avg_response_minutes
  if (minutes === null || minutes === undefined) return 'unknown'
  if (minutes < 60) return 'fast'
  if (minutes < 240) return 'good'
  return 'slow'
})

const responseLabel = computed<string | null>(() => {
  const badge = responseBadge.value
  if (badge === 'unknown') return null
  if (badge === 'fast') return t('vehicle.responseTimeFast')
  if (badge === 'good') return t('vehicle.responseTimeGood')
  return t('vehicle.responseTimeSlow')
})

// Lazily load dealer health score to show trust badge
const dealerScore = ref<number | null>(null)

const dealerTierFromScore = computed<TrustBadgeTier | null>(() => {
  if (dealerScore.value === null) return null
  if (dealerScore.value >= 80) return 'top'
  if (dealerScore.value >= 60) return 'verified'
  return null
})

onMounted(async () => {
  if (!props.dealerId) return
  const { score, calculateScore } = useDealerHealthScore(props.dealerId)
  await calculateScore()
  dealerScore.value = score.value?.total ?? null
})
</script>

<style scoped>
.vehicle-seller-info {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  margin-bottom: var(--spacing-4);
  border-left: 3px solid var(--color-primary);
}

.vehicle-seller-info h3 {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.5rem 0;
}

.seller-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seller-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.seller-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.vehicle-disclaimer {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  border-left: 4px solid var(--color-error-text);
  margin-bottom: var(--spacing-4);
}

.seller-profile-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  margin-top: var(--spacing-2);
  min-height: 2.75rem;
  transition: color var(--transition-fast);
}

.seller-profile-link:hover {
  color: var(--color-primary-dark);
}

/* Response time badge */
.response-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.response-badge--fast {
  background: var(--color-success-bg, rgba(16, 185, 129, 0.1));
  color: var(--color-success-text, #065f46);
}

.response-badge--good {
  background: var(--color-warning-bg, rgba(245, 158, 11, 0.1));
  color: var(--color-warning-text, #92400e);
}

.response-badge--slow {
  background: var(--color-error-bg, rgba(239, 68, 68, 0.1));
  color: var(--color-error-text, #991b1b);
}
</style>
