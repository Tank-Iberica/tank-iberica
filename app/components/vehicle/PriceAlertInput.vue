<script setup lang="ts">
/**
 * PriceAlertInput — Configurable price drop alert for a favorited vehicle.
 * Shown when the vehicle is in the user's favorites list.
 * Lets the user set a target price; they'll be notified when the price
 * drops to or below that value.
 */
const props = defineProps<{
  vehicleId: string
  currentPrice: number | null
}>()

const { t } = useI18n()
const user = useSupabaseUser()
const { isFavorite, setThreshold } = useFavorites()

const isFav = computed(() => isFavorite(props.vehicleId))
const thresholdInput = ref('')
const saving = ref(false)
const saved = ref(false)

async function saveThreshold(): Promise<void> {
  const raw = thresholdInput.value.trim()
  const parsed = raw === '' ? null : Number.parseFloat(raw.replace(',', '.'))
  if (parsed !== null && (Number.isNaN(parsed) || parsed <= 0)) return

  saving.value = true
  await setThreshold(props.vehicleId, parsed)
  saving.value = false
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2500)
}
</script>

<template>
  <div v-if="user && isFav" class="price-alert-input">
    <label class="alert-label" :for="`price-alert-${vehicleId}`">
      {{ t('vehicle.priceAlert.label') }}
    </label>
    <div class="alert-row">
      <input
        :id="`price-alert-${vehicleId}`"
        v-model="thresholdInput"
        type="number"
        class="alert-input"
        :placeholder="
          currentPrice
            ? String(Math.round(currentPrice * 0.9))
            : t('vehicle.priceAlert.placeholder')
        "
        min="0"
        step="500"
        autocomplete="off"
        @keydown.enter="saveThreshold"
      >
      <button
        class="alert-btn"
        :disabled="saving"
        :aria-label="t('vehicle.priceAlert.save')"
        @click="saveThreshold"
      >
        {{ saving ? '…' : t('vehicle.priceAlert.save') }}
      </button>
    </div>
    <p v-if="saved" class="alert-success" aria-live="polite">
      {{ t('vehicle.priceAlert.saved') }}
    </p>
    <p class="alert-hint">{{ t('vehicle.priceAlert.hint') }}</p>
  </div>
</template>

<style scoped>
.price-alert-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.alert-row {
  display: flex;
  gap: 0.5rem;
}

.alert-input {
  flex: 1;
  min-width: 0;
  height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.95rem;
  appearance: textfield;
}

.alert-input::-webkit-outer-spin-button,
.alert-input::-webkit-inner-spin-button {
  appearance: none;
}

.alert-btn {
  min-height: 2.75rem;
  padding: 0 1rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.alert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-disabled);
}

.alert-success {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-success);
  font-weight: 500;
}
</style>
