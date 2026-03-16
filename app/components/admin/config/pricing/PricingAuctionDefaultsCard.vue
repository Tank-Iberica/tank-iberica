<script setup lang="ts">
import type { AuctionDefaults } from '~/composables/admin/useAdminConfigPricing'

defineProps<{
  auctionDefaults: AuctionDefaults
  savingAuctionDefaults: boolean
  successAuctionDefaults: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'update', payload: { key: keyof AuctionDefaults; value: number }): void
}>()

const { t } = useI18n()

const centFields = new Set<keyof AuctionDefaults>(['bid_increment_cents', 'deposit_cents'])

function onInput(key: keyof AuctionDefaults, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = Number(target.value)
  const value = centFields.has(key) ? Math.round(raw * 100) : raw
  emit('update', { key, value })
}

function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}
</script>

<template>
  <div class="config-card">
    <h2 class="card-title">{{ t('admin.configPricing.auctionDefaultsTitle') }}</h2>
    <p class="card-description">{{ t('admin.configPricing.auctionDefaultsDesc') }}</p>

    <div class="auction-grid">
      <!-- Bid increment -->
      <div class="auction-field">
        <label for="auction-bid-increment" class="auction-label">
          {{ t('admin.configPricing.auctionBidIncrement') }}
        </label>
        <div class="input-with-suffix">
          <input
            id="auction-bid-increment"
            type="number"
            min="100"
            step="100"
            class="auction-input"
            :value="centsToEuros(auctionDefaults.bid_increment_cents)"
            @input="onInput('bid_increment_cents', $event)"
          >
          <span class="input-suffix">&euro;</span>
        </div>
        <p class="field-hint">{{ t('admin.configPricing.auctionBidIncrementHint') }}</p>
      </div>

      <!-- Deposit -->
      <div class="auction-field">
        <label for="auction-deposit" class="auction-label">
          {{ t('admin.configPricing.auctionDepositDefault') }}
        </label>
        <div class="input-with-suffix">
          <input
            id="auction-deposit"
            type="number"
            min="0"
            step="100"
            class="auction-input"
            :value="centsToEuros(auctionDefaults.deposit_cents)"
            @input="onInput('deposit_cents', $event)"
          >
          <span class="input-suffix">&euro;</span>
        </div>
        <p class="field-hint">{{ t('admin.configPricing.auctionDepositHint') }}</p>
      </div>

      <!-- Duration -->
      <div class="auction-field">
        <label for="auction-duration" class="auction-label">
          {{ t('admin.configPricing.auctionDurationDays') }}
        </label>
        <div class="input-with-suffix">
          <input
            id="auction-duration"
            type="number"
            min="1"
            max="30"
            step="1"
            class="auction-input"
            :value="auctionDefaults.duration_days"
            @input="onInput('duration_days', $event)"
          >
          <span class="input-suffix">{{ t('admin.configPricing.days') }}</span>
        </div>
      </div>

      <!-- Anti-snipe -->
      <div class="auction-field">
        <label for="auction-anti-snipe" class="auction-label">
          {{ t('admin.configPricing.auctionAntiSnipe') }}
        </label>
        <div class="input-with-suffix">
          <input
            id="auction-anti-snipe"
            type="number"
            min="0"
            max="600"
            step="30"
            class="auction-input"
            :value="auctionDefaults.anti_snipe_seconds"
            @input="onInput('anti_snipe_seconds', $event)"
          >
          <span class="input-suffix">{{ t('admin.configPricing.seconds') }}</span>
        </div>
        <p class="field-hint">{{ t('admin.configPricing.auctionAntiSnipeHint') }}</p>
      </div>
    </div>

    <div v-if="successAuctionDefaults" class="success-banner">
      {{ t('admin.configPricing.auctionDefaultsSaved') }}
    </div>

    <div class="save-section">
      <button class="btn-primary" :disabled="savingAuctionDefaults" @click="emit('save')">
        {{
          savingAuctionDefaults
            ? t('admin.configPricing.saving')
            : t('admin.configPricing.saveAuctionDefaults')
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-description {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: 0.875rem;
}

.auction-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.auction-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.auction-label {
  font-weight: 500;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  max-width: 12.5rem;
}

.auction-input {
  width: 100%;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.auction-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.input-suffix {
  color: var(--color-gray-500);
  font-weight: 500;
  font-size: 0.95rem;
  flex-shrink: 0;
  min-width: 2rem;
}

.field-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.success-banner {
  background: var(--color-success-bg, rgba(16, 185, 129, 0.1));
  color: var(--color-success);
  padding: 0.625rem var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  margin-top: var(--spacing-3);
}

.save-section {
  margin-top: var(--spacing-4);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background var(--transition-fast);
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .auction-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-5);
  }
}

@media (max-width: 48em) {
  .config-card {
    padding: var(--spacing-4);
  }

  .input-with-suffix {
    max-width: 100%;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
