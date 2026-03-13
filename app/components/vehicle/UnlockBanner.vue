<script setup lang="ts">
const props = defineProps<{
  vehicleId: string
  visibleFrom: string
}>()

const vehicleIdRef = computed(() => props.vehicleId)
const { loading, error, unlocked, creditsRemaining, unlock } = useVehicleUnlock(vehicleIdRef)

const visibleDate = computed(() => {
  const d = new Date(props.visibleFrom)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
})
</script>

<template>
  <div v-if="!unlocked" class="unlock-banner">
    <div class="unlock-banner__icon">🔒</div>
    <div class="unlock-banner__content">
      <p class="unlock-banner__title">{{ $t('unlock.hiddenUntil', { date: visibleDate }) }}</p>
      <p class="unlock-banner__desc">{{ $t('unlock.unlockDesc') }}</p>
      <p v-if="error" class="unlock-banner__error">{{ error }}</p>
    </div>
    <button class="unlock-banner__btn" :disabled="loading" @click="unlock">
      {{ loading ? $t('unlock.unlocking') : $t('unlock.cta') }}
    </button>
  </div>
  <div v-else class="unlock-banner unlock-banner--success">
    <span class="unlock-banner__icon">✅</span>
    <p class="unlock-banner__title">{{ $t('unlock.unlocked') }}</p>
    <p v-if="creditsRemaining !== null" class="unlock-banner__desc">
      {{ $t('unlock.creditsRemaining', { count: creditsRemaining }) }}
    </p>
  </div>
</template>

<style scoped>
.unlock-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-warning-subtle, #fffbeb);
  border: 1px solid var(--color-warning, #f59e0b);
  border-radius: var(--radius-md, 0.5rem);
  margin-bottom: var(--spacing-4);
}

.unlock-banner--success {
  background: var(--bg-success-subtle, #f0fdf4);
  border-color: var(--color-success, #22c55e);
}

.unlock-banner__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.unlock-banner__content {
  flex: 1;
}

.unlock-banner__title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1);
}

.unlock-banner__desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
}

.unlock-banner__error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin: var(--spacing-1) 0 0;
}

.unlock-banner__btn {
  flex-shrink: 0;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: var(--radius-sm, 0.25rem);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  min-height: 2.75rem;
  transition: opacity 0.15s;
}

.unlock-banner__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 30em) {
  .unlock-banner {
    flex-direction: column;
  }

  .unlock-banner__btn {
    width: 100%;
  }
}
</style>
