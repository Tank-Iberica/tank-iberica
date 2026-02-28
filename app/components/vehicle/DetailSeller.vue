<template>
  <div class="vehicle-seller-section">
    <!-- Seller Info (DSA compliance) -->
    <div v-if="sellerInfo" class="vehicle-seller-info">
      <h3>{{ $t('vehicle.sellerInfo') }}</h3>
      <div class="seller-details">
        <span v-if="sellerInfo.company_name" class="seller-item">
          <strong>{{ sellerInfo.company_name }}</strong>
        </span>
        <span v-if="sellerInfo.location" class="seller-item">{{ sellerInfo.location }}</span>
        <span v-if="sellerInfo.cif" class="seller-item"
          >{{ $t('vehicle.sellerCif') }}: {{ sellerInfo.cif }}</span
        >
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

    <!-- Disclaimer for terceros -->
    <div v-if="isTerceros" class="vehicle-disclaimer">
      {{ $t('vehicle.disclaimer') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SellerInfo } from '~/composables/useVehicleDetail'

defineProps<{
  sellerInfo: SellerInfo | null
  dealerId: string | null
  dealerSlug: string | null
  isTerceros: boolean
}>()
</script>

<style scoped>
.vehicle-seller-info {
  background: var(--bg-secondary, #f8fafc);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: var(--spacing-4);
  border-left: 3px solid var(--color-primary, #23424a);
}

.vehicle-seller-info h3 {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.seller-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seller-item {
  font-size: 0.875rem;
  color: var(--text-secondary, #475569);
}

.vehicle-disclaimer {
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  border-left: 4px solid #c0392b;
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
  min-height: 44px;
  transition: color var(--transition-fast);
}

.seller-profile-link:hover {
  color: var(--color-primary-dark);
}
</style>
