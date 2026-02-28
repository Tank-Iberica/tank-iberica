<script setup lang="ts">
import { useAdminDealerConfig } from '~/composables/admin/useAdminDealerConfig'
import DealerIdentitySection from '~/components/admin/dealer/DealerIdentitySection.vue'
import DealerContactSection from '~/components/admin/dealer/DealerContactSection.vue'
import DealerCatalogSection from '~/components/admin/dealer/DealerCatalogSection.vue'
import DealerNotificationsSection from '~/components/admin/dealer/DealerNotificationsSection.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // UI State
  saving,
  saved,
  error,
  loading,
  dealerExists,
  dealerSlug,

  // Identity
  logoUrl,
  coverImageUrl,
  companyName,

  // Theme
  themePrimary,
  themeAccent,

  // Bio
  bio,

  // Contact
  phone,
  email,
  website,
  address,
  whatsapp,
  workingHours,
  phoneMode,
  ctaText,

  // Social Links
  socialLinkedIn,
  socialInstagram,
  socialFacebook,
  socialYouTube,

  // Certifications
  certifications,

  // Catalog
  catalogSort,
  pinnedVehicles,
  newPinnedUuid,

  // Auto Reply
  autoReplyMessage,

  // Notifications
  emailOnLead,
  emailOnSale,
  emailWeeklyStats,
  emailAuctionUpdates,

  // Static Options
  iconOptions,
  sortOptions,
  phoneModeOptions,

  // Actions
  init,
  addCertification,
  removeCertification,
  updateCertificationIcon,
  updateCertificationVerified,
  updateCertificationLabel,
  addPinnedVehicle,
  removePinnedVehicle,
  resetThemeColors,
  handleSave,
} = useAdminDealerConfig()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="dealer-config">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>{{ $t('admin.dealerConfig.title') }}</h2>
        <p class="page-subtitle">
          Personaliza tu perfil publico, contacto, catalogo y notificaciones
        </p>
      </div>
      <NuxtLink to="/admin" class="btn-back"> Volver </NuxtLink>
    </div>

    <!-- Feedback banners -->
    <div v-if="error" class="feedback-banner error-banner">
      {{ error }}
    </div>
    <div v-if="saved" class="feedback-banner success-banner">{{ $t('admin.common.savedOk') }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <!-- No dealer profile -->
    <div v-else-if="!dealerExists" class="empty-state">
      <div class="empty-state-icon">!</div>
      <p>{{ $t('admin.dealerConfig.noDealer') }}</p>
      <span class="empty-state-hint">
        Contacta con el administrador para crear tu perfil de dealer.
      </span>
    </div>

    <!-- Main form -->
    <template v-else>
      <DealerIdentitySection
        v-model:company-name="companyName"
        v-model:logo-url="logoUrl"
        v-model:cover-image-url="coverImageUrl"
        v-model:theme-primary="themePrimary"
        v-model:theme-accent="themeAccent"
        v-model:bio="bio"
        @reset-theme="resetThemeColors"
      />

      <DealerContactSection
        v-model:phone="phone"
        v-model:email="email"
        v-model:website="website"
        v-model:address="address"
        v-model:whatsapp="whatsapp"
        v-model:phone-mode="phoneMode"
        v-model:working-hours="workingHours"
        v-model:cta-text="ctaText"
        v-model:social-linked-in="socialLinkedIn"
        v-model:social-instagram="socialInstagram"
        v-model:social-facebook="socialFacebook"
        v-model:social-you-tube="socialYouTube"
        :phone-mode-options="phoneModeOptions"
      />

      <DealerCatalogSection
        v-model:catalog-sort="catalogSort"
        v-model:new-pinned-uuid="newPinnedUuid"
        v-model:auto-reply-message="autoReplyMessage"
        :certifications="certifications"
        :pinned-vehicles="pinnedVehicles"
        :icon-options="iconOptions"
        :sort-options="sortOptions"
        @add-certification="addCertification"
        @remove-certification="removeCertification"
        @update-certification-icon="updateCertificationIcon"
        @update-certification-verified="updateCertificationVerified"
        @update-certification-label="updateCertificationLabel"
        @add-pinned-vehicle="addPinnedVehicle"
        @remove-pinned-vehicle="removePinnedVehicle"
      />

      <DealerNotificationsSection
        v-model:email-on-lead="emailOnLead"
        v-model:email-on-sale="emailOnSale"
        v-model:email-weekly-stats="emailWeeklyStats"
        v-model:email-auction-updates="emailAuctionUpdates"
      />

      <!-- Bottom bar: Preview + Save -->
      <div class="bottom-bar">
        <NuxtLink v-if="dealerSlug" :to="`/${dealerSlug}`" target="_blank" class="btn-preview">
          Ver portal publico
        </NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dealer-config {
  padding: 0;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 100px;
}

/* Page header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.page-header h2 {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: var(--font-weight-bold);
}

.page-subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--color-gray-300);
}

/* Feedback banners */
.feedback-banner {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm);
}

.error-banner {
  background: #fef2f2;
  color: var(--color-error);
}

.success-banner {
  background: #f0fdf4;
  color: var(--color-success);
}

/* Loading / Empty states */
.loading-state {
  text-align: center;
  padding: var(--spacing-12);
  color: var(--text-auxiliary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--spacing-4);
  background: var(--color-gray-100);
  color: var(--text-auxiliary);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.empty-state p {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.empty-state-hint {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* Bottom bar (sticky on mobile) */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color-light);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: var(--z-sticky);
}

.btn-preview {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.btn-preview:hover {
  background: var(--color-primary);
  color: var(--bg-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive: 480px */
@media (min-width: 480px) {
  .page-header h2 {
    font-size: var(--font-size-2xl);
  }
}

/* Responsive: 768px */
@media (min-width: 768px) {
  .bottom-bar {
    position: static;
    background: transparent;
    border-top: none;
    box-shadow: none;
    padding: var(--spacing-6) 0;
  }

  .dealer-config {
    padding-bottom: 0;
  }
}
</style>
