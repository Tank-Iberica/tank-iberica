<script lang="ts">
export interface NotificationType {
  key: string
  labelKey: string
  descKey: string
}

export interface NotificationCategory {
  id: string
  titleKey: string
  types: NotificationType[]
}

export const notificationCategories: NotificationCategory[] = [
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
</script>

<script setup lang="ts">
defineProps<{
  category: NotificationCategory
  saving: boolean
  isEnabled: (key: string) => boolean
  isAlwaysOn: (key: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', key: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="category-card">
    <h2 class="category-title">
      {{ t(category.titleKey) }}
    </h2>
    <div class="preference-list">
      <div v-for="emailType in category.types" :key="emailType.key" class="preference-item">
        <div class="preference-info">
          <span class="preference-label">{{ t(emailType.labelKey) }}</span>
          <span class="preference-desc">{{ t(emailType.descKey) }}</span>
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
            @change="emit('toggle', emailType.key)"
          >
          <span class="toggle__slider" />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.toggle--active .toggle__slider {
  background-color: var(--color-primary);
}

.toggle--active .toggle__slider::before {
  transform: translateX(20px);
}

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

@media (min-width: 768px) {
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
