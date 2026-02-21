<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { t } = useI18n()
const { loading, saving, error, loadPreferences, isEnabled, isAlwaysOn, togglePreference } =
  useEmailPreferences()

/** Toast feedback state */
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2500)
}

/** Handle toggle for a single email type */
async function onToggle(emailType: string) {
  const newValue = !isEnabled(emailType)
  const success = await togglePreference(emailType, newValue)
  if (success) {
    showToast(t('profile.notifications.saved'))
  } else {
    showToast(t('profile.notifications.errorSaving'), 'error')
  }
}

interface NotificationType {
  key: string
  labelKey: string
  descKey: string
}

interface NotificationCategory {
  id: string
  titleKey: string
  types: NotificationType[]
}

/** Notification categories and their email types */
const categories: NotificationCategory[] = [
  {
    id: 'activity',
    titleKey: 'profile.notifications.categoryActivity',
    types: [
      {
        key: 'lead_notification',
        labelKey: 'profile.notifications.leadNotification',
        descKey: 'profile.notifications.leadNotificationDesc',
      },
      {
        key: 'vehicle_published',
        labelKey: 'profile.notifications.vehiclePublished',
        descKey: 'profile.notifications.vehiclePublishedDesc',
      },
      {
        key: 'vehicle_sold',
        labelKey: 'profile.notifications.vehicleSold',
        descKey: 'profile.notifications.vehicleSoldDesc',
      },
      {
        key: 'weekly_stats',
        labelKey: 'profile.notifications.weeklyStats',
        descKey: 'profile.notifications.weeklyStatsDesc',
      },
      {
        key: 'monthly_stats',
        labelKey: 'profile.notifications.monthlyStats',
        descKey: 'profile.notifications.monthlyStatsDesc',
      },
    ],
  },
  {
    id: 'subscription',
    titleKey: 'profile.notifications.categorySubscription',
    types: [
      {
        key: 'subscription_activated',
        labelKey: 'profile.notifications.subscriptionActivated',
        descKey: 'profile.notifications.subscriptionActivatedDesc',
      },
      {
        key: 'subscription_expiring',
        labelKey: 'profile.notifications.subscriptionExpiring',
        descKey: 'profile.notifications.subscriptionExpiringDesc',
      },
      {
        key: 'payment_failed',
        labelKey: 'profile.notifications.paymentFailed',
        descKey: 'profile.notifications.paymentFailedDesc',
      },
      {
        key: 'subscription_cancelled',
        labelKey: 'profile.notifications.subscriptionCancelled',
        descKey: 'profile.notifications.subscriptionCancelledDesc',
      },
    ],
  },
  {
    id: 'alerts',
    titleKey: 'profile.notifications.categoryAlerts',
    types: [
      {
        key: 'search_alert_match',
        labelKey: 'profile.notifications.searchAlertMatch',
        descKey: 'profile.notifications.searchAlertMatchDesc',
      },
      {
        key: 'favorite_price_change',
        labelKey: 'profile.notifications.favoritePriceChange',
        descKey: 'profile.notifications.favoritePriceChangeDesc',
      },
      {
        key: 'favorite_sold',
        labelKey: 'profile.notifications.favoriteSold',
        descKey: 'profile.notifications.favoriteSoldDesc',
      },
      {
        key: 'demand_match',
        labelKey: 'profile.notifications.demandMatch',
        descKey: 'profile.notifications.demandMatchDesc',
      },
    ],
  },
  {
    id: 'auctions',
    titleKey: 'profile.notifications.categoryAuctions',
    types: [
      {
        key: 'auction_registered',
        labelKey: 'profile.notifications.auctionRegistered',
        descKey: 'profile.notifications.auctionRegisteredDesc',
      },
      {
        key: 'auction_starting',
        labelKey: 'profile.notifications.auctionStarting',
        descKey: 'profile.notifications.auctionStartingDesc',
      },
      {
        key: 'auction_ended',
        labelKey: 'profile.notifications.auctionEnded',
        descKey: 'profile.notifications.auctionEndedDesc',
      },
      {
        key: 'auction_outbid',
        labelKey: 'profile.notifications.auctionOutbid',
        descKey: 'profile.notifications.auctionOutbidDesc',
      },
      {
        key: 'auction_won',
        labelKey: 'profile.notifications.auctionWon',
        descKey: 'profile.notifications.auctionWonDesc',
      },
      {
        key: 'auction_lost',
        labelKey: 'profile.notifications.auctionLost',
        descKey: 'profile.notifications.auctionLostDesc',
      },
    ],
  },
  {
    id: 'system',
    titleKey: 'profile.notifications.categorySystem',
    types: [
      {
        key: 'confirm_email',
        labelKey: 'profile.notifications.confirmEmail',
        descKey: 'profile.notifications.confirmEmailDesc',
      },
      {
        key: 'suspicious_activity',
        labelKey: 'profile.notifications.suspiciousActivity',
        descKey: 'profile.notifications.suspiciousActivityDesc',
      },
      {
        key: 'verification_completed',
        labelKey: 'profile.notifications.verificationCompleted',
        descKey: 'profile.notifications.verificationCompletedDesc',
      },
      {
        key: 'verification_available',
        labelKey: 'profile.notifications.verificationAvailable',
        descKey: 'profile.notifications.verificationAvailableDesc',
      },
      {
        key: 'new_article_sector',
        labelKey: 'profile.notifications.newArticleSector',
        descKey: 'profile.notifications.newArticleSectorDesc',
      },
    ],
  },
]

useHead({
  title: t('profile.notifications.title'),
})

// Load preferences on mount
onMounted(() => {
  loadPreferences()
})
</script>

<template>
  <div class="notifications-page">
    <div class="notifications-container">
      <h1 class="page-title">
        {{ $t('profile.notifications.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.notifications.subtitle') }}
      </p>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Categories -->
      <template v-else>
        <!-- Critical emails info -->
        <div class="info-banner">
          <svg
            class="info-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ $t('profile.notifications.criticalInfo') }}</span>
        </div>

        <div v-for="category in categories" :key="category.id" class="category-card">
          <h2 class="category-title">
            {{ $t(category.titleKey) }}
          </h2>

          <div class="preference-list">
            <div v-for="emailType in category.types" :key="emailType.key" class="preference-item">
              <div class="preference-info">
                <span class="preference-label">{{ $t(emailType.labelKey) }}</span>
                <span class="preference-desc">{{ $t(emailType.descKey) }}</span>
              </div>

              <label
                class="toggle"
                :class="{
                  'toggle--disabled': isAlwaysOn(emailType.key),
                  'toggle--active': isEnabled(emailType.key),
                }"
              >
                <input
                  type="checkbox"
                  class="toggle__input"
                  :checked="isEnabled(emailType.key)"
                  :disabled="isAlwaysOn(emailType.key) || saving"
                  @change="onToggle(emailType.key)"
                >
                <span class="toggle__slider" />
              </label>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Toast notification -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`toast--${toast.type}`"
        role="status"
        aria-live="polite"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notifications-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.notifications-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Info banner */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  font-size: var(--font-size-sm);
  color: #1e40af;
  line-height: var(--line-height-normal);
}

.info-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Loading & error */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-state {
  color: var(--color-error);
}

/* Category cards */
.category-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-sm);
}

.category-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color-light);
}

/* Preference items */
.preference-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.preference-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
}

.preference-item + .preference-item {
  border-top: 1px solid var(--color-gray-100);
}

.preference-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.preference-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.preference-desc {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-normal);
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  width: 48px;
  height: 28px;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__slider {
  position: absolute;
  width: 48px;
  height: 28px;
  background-color: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  transition: background-color var(--transition-fast);
}

.toggle__slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background-color: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

/* Active toggle */
.toggle--active .toggle__slider {
  background-color: var(--color-primary);
}

.toggle--active .toggle__slider::before {
  transform: translateX(20px);
}

/* Disabled toggle (always-on) */
.toggle--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle--disabled .toggle__slider {
  background-color: var(--color-primary-light);
}

.toggle--disabled .toggle__slider::before {
  transform: translateX(20px);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}

.toast--success {
  background-color: var(--color-success);
}

.toast--error {
  background-color: var(--color-error);
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* ---- Tablet breakpoint ---- */
@media (min-width: 768px) {
  .notifications-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }

  .category-card {
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .category-title {
    font-size: var(--font-size-lg);
  }

  .preference-label {
    font-size: var(--font-size-base);
  }

  .preference-desc {
    font-size: var(--font-size-sm);
  }
}
</style>
