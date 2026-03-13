<script setup lang="ts">
/**
 * DealerExpiryAlert — Warning banner shown in dealer dashboard when listings
 * are expiring soon or have already expired.
 *
 * Queries vehicles by status (expired) or those approaching expiry (published > 50 days).
 * Provides quick actions: renew now, view all expired.
 */
const props = defineProps<{
  dealerId: string
  /** Days before expiry to start showing the warning (default: 10) */
  warnDaysBefore?: number
}>()

const { t } = useI18n()
const supabase = useSupabaseClient()

const warnDays = computed(() => props.warnDaysBefore ?? 10)

const expiredCount = ref(0)
const expiringSoonCount = ref(0)
const loading = ref(true)
const dismissed = ref(false)

const showAlert = computed(() => !dismissed.value && (expiredCount.value > 0 || expiringSoonCount.value > 0))

const alertLevel = computed<'critical' | 'warning'>(() =>
  expiredCount.value > 0 ? 'critical' : 'warning'
)

onMounted(async () => {
  loading.value = true
  try {
    const cutoffExpiry = new Date()
    cutoffExpiry.setDate(cutoffExpiry.getDate() - 60) // 60 days = expired threshold

    const warnDate = new Date()
    warnDate.setDate(warnDate.getDate() - (60 - warnDays.value)) // approaching expiry

    const [expiredRes, soonRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', props.dealerId)
        .eq('status', 'expired'),

      supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', props.dealerId)
        .eq('status', 'published')
        .lt('published_at', warnDate.toISOString()),
    ])

    expiredCount.value = expiredRes.count ?? 0
    expiringSoonCount.value = soonRes.count ?? 0
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div
    v-if="showAlert"
    class="expiry-alert"
    :class="`alert-${alertLevel}`"
    role="alert"
  >
    <div class="alert-icon" aria-hidden="true">
      {{ alertLevel === 'critical' ? '⚠️' : '🕐' }}
    </div>
    <div class="alert-content">
      <p class="alert-title">
        <template v-if="expiredCount > 0 && expiringSoonCount > 0">
          {{ t('lifecycle.expiryAlert.bothTitle', { expired: expiredCount, soon: expiringSoonCount }) }}
        </template>
        <template v-else-if="expiredCount > 0">
          {{ t('lifecycle.expiryAlert.expiredTitle', { count: expiredCount }) }}
        </template>
        <template v-else>
          {{ t('lifecycle.expiryAlert.soonTitle', { count: expiringSoonCount, days: warnDays }) }}
        </template>
      </p>
      <p class="alert-desc">{{ t('lifecycle.expiryAlert.desc') }}</p>
    </div>
    <div class="alert-actions">
      <NuxtLink
        :to="`/dashboard/vehiculos?status=expired`"
        class="alert-btn alert-btn-primary"
      >
        {{ t('lifecycle.expiryAlert.renewNow') }}
      </NuxtLink>
      <button
        class="alert-btn alert-btn-dismiss"
        :aria-label="t('common.dismiss')"
        @click="dismissed = true"
      >
        {{ t('common.dismiss') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expiry-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: var(--border-radius-md);
  border-left: 4px solid;
  margin-bottom: 1rem;
}

.alert-critical {
  background: #fef2f2;
  border-color: #ef4444;
}

.alert-warning {
  background: #fffbeb;
  border-color: #f59e0b;
}

.alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  padding-top: 0.125rem;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  margin: 0 0 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.alert-desc {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.alert-actions {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex-shrink: 0;
}

.alert-btn {
  padding: 0.375rem 0.75rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  border: none;
  text-decoration: none;
  text-align: center;
  display: inline-block;
  min-height: 2.75rem;
  line-height: 2;
}

.alert-btn-primary {
  background: var(--color-primary, #23424A);
  color: white;
}

.alert-critical .alert-btn-primary {
  background: #ef4444;
}

.alert-warning .alert-btn-primary {
  background: #f59e0b;
}

.alert-btn-dismiss {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

@media (min-width: 480px) {
  .expiry-alert {
    align-items: center;
  }

  .alert-actions {
    flex-direction: row;
  }
}
</style>
