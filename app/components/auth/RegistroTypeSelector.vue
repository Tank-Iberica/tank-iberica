<script setup lang="ts">
defineProps<{
  selectedType: string
}>()

const emit = defineEmits<{
  (e: 'select', type: 'buyer' | 'dealer'): void
}>()

const { t } = useI18n()
</script>

<template>
  <h1 class="auth-title">{{ t('auth.register') }}</h1>
  <p class="auth-subtitle">{{ t('auth.registerSubtitle') }}</p>

  <div class="type-cards">
    <button
      class="type-card"
      :class="{ active: selectedType === 'buyer' }"
      @click="emit('select', 'buyer')"
    >
      <div class="type-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 class="type-label">{{ t('auth.typeBuyer') }}</h3>
      <p class="type-desc">{{ t('auth.typeBuyerDesc') }}</p>
    </button>

    <button
      class="type-card"
      :class="{ active: selectedType === 'dealer' }"
      @click="emit('select', 'dealer')"
    >
      <div class="type-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h3 class="type-label">{{ t('auth.typeDealer') }}</h3>
      <p class="type-desc">{{ t('auth.typeDealerDesc') }}</p>
    </button>
  </div>
</template>

<style scoped>
.auth-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--spacing-2);
}

.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.type-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: center;
  transition: all var(--transition-fast);
  min-height: 44px;
}

.type-card:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.type-card.active {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.05);
}

.type-icon {
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.type-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.type-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

@media (min-width: 768px) {
  .type-cards {
    flex-direction: row;
  }

  .type-card {
    flex: 1;
  }
}
</style>
