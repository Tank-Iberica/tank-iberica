<script setup lang="ts">
/**
 * DealerAutoSettingsSection — Auto-settings for dealer portal configuration.
 *
 * Settings:
 *   - auto_highlight_threshold: score threshold to auto-highlight vehicles
 *   - auto_notify_leads: send push notification on new leads
 *   - auto_renew_listings: automatically renew listings before expiry
 *   - listing_duration_days: default duration for new listings
 *
 * Used in admin/dealer/config.vue.
 */

const props = defineProps<{
  autoHighlightThreshold: number | null
  autoNotifyLeads: boolean
  autoRenewListings: boolean
  listingDurationDays: number
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:autoHighlightThreshold', value: number | null): void
  (e: 'update:autoNotifyLeads' | 'update:autoRenewListings', value: boolean): void
  (e: 'update:listingDurationDays', value: number): void
}>()

const { t } = useI18n()

const DURATION_OPTIONS = [7, 14, 30, 60, 90]

const thresholdValue = computed({
  get: () => props.autoHighlightThreshold ?? 80,
  set: (v: number) => emit('update:autoHighlightThreshold', v),
})
</script>

<template>
  <section class="auto-settings-section">
    <h2 class="section-title">{{ t('dealer.autoSettings.title') }}</h2>
    <p class="section-desc">{{ t('dealer.autoSettings.description') }}</p>

    <div class="settings-list">
      <!-- Auto-notify on leads -->
      <label class="setting-row">
        <div class="setting-info">
          <span class="setting-label">{{ t('dealer.autoSettings.autoNotifyLeads') }}</span>
          <span class="setting-hint">{{ t('dealer.autoSettings.autoNotifyLeadsHint') }}</span>
        </div>
        <input
          type="checkbox"
          class="toggle"
          :checked="autoNotifyLeads"
          :disabled="saving"
          @change="emit('update:autoNotifyLeads', ($event.target as HTMLInputElement).checked)"
        >
      </label>

      <!-- Auto-renew listings -->
      <label class="setting-row">
        <div class="setting-info">
          <span class="setting-label">{{ t('dealer.autoSettings.autoRenew') }}</span>
          <span class="setting-hint">{{ t('dealer.autoSettings.autoRenewHint') }}</span>
        </div>
        <input
          type="checkbox"
          class="toggle"
          :checked="autoRenewListings"
          :disabled="saving"
          @change="emit('update:autoRenewListings', ($event.target as HTMLInputElement).checked)"
        >
      </label>

      <!-- Default listing duration -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">{{ t('dealer.autoSettings.listingDuration') }}</span>
          <span class="setting-hint">{{ t('dealer.autoSettings.listingDurationHint') }}</span>
        </div>
        <select
          class="setting-select"
          :value="listingDurationDays"
          :disabled="saving"
          @change="
            emit('update:listingDurationDays', Number(($event.target as HTMLSelectElement).value))
          "
        >
          <option v-for="days in DURATION_OPTIONS" :key="days" :value="days">
            {{ t('dealer.autoSettings.days', { n: days }) }}
          </option>
        </select>
      </div>

      <!-- Auto-highlight threshold -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">{{ t('dealer.autoSettings.highlightThreshold') }}</span>
          <span class="setting-hint">{{ t('dealer.autoSettings.highlightThresholdHint') }}</span>
        </div>
        <div class="setting-slider-wrap">
          <input
            v-model.number="thresholdValue"
            type="range"
            class="setting-slider"
            min="0"
            max="100"
            step="5"
            :disabled="saving"
          >
          <span class="setting-slider-value">{{ thresholdValue }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auto-settings-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.section-title {
  margin: 0 0 0.25rem;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0 0 1.25rem;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.setting-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.setting-hint {
  font-size: 0.6875rem;
  color: var(--text-secondary);
}

/* Toggle checkbox */
.toggle {
  appearance: none;
  width: 2.5rem;
  height: 1.375rem;
  background: var(--bg-tertiary);
  border-radius: 9999px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
  min-width: 2.5rem;
}

.toggle:checked {
  background: var(--color-primary, #23424a);
}
.toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.125rem;
  height: 1.125rem;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle:checked::after {
  transform: translateX(1.125rem);
}

/* Select */
.setting-select {
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius);
  padding: 0.375rem 0.625rem;
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  min-width: 7rem;
}

/* Slider */
.setting-slider-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 8rem;
}

.setting-slider {
  flex: 1;
  accent-color: var(--color-primary, #23424a);
}

.setting-slider-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 2rem;
  text-align: right;
}
</style>
