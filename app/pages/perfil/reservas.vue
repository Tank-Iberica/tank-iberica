<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()

const {
  reservations,
  loading,
  cancelling,
  confirming,
  error,
  countdowns,
  getStatusConfig,
  canCancel,
  canConfirm,
  handleCancel,
  handleConfirm,
  init,
  cleanup,
} = usePerfilReservas()

useHead({ title: t('reservations.pageTitle') })

onMounted(() => init())
onUnmounted(() => cleanup())
</script>

<template>
  <div class="reservations-page">
    <div class="reservations-container">
      <h1 class="page-title">{{ $t('reservations.pageTitle') }}</h1>
      <p class="page-subtitle">{{ $t('reservations.pageSubtitle') }}</p>

      <div v-if="loading" class="loading-state">{{ $t('common.loading') }}</div>

      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
        <button class="error-dismiss" @click="error = null">&times;</button>
      </div>

      <div v-if="!loading && reservations.length === 0" class="empty-state">
        <div class="empty-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            width="48"
            height="48"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="empty-title">{{ $t('reservations.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('reservations.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">{{
          $t('reservations.browseCatalog')
        }}</NuxtLink>
      </div>

      <div v-if="!loading && reservations.length > 0" class="reservation-list">
        <ReservationCard
          v-for="reservation in reservations"
          :key="reservation.id"
          :reservation="reservation"
          :status-label="getStatusConfig(reservation.status).labelKey"
          :status-class="getStatusConfig(reservation.status).cssClass"
          :countdown="countdowns[reservation.id] || null"
          :can-cancel="canCancel(reservation.status)"
          :can-confirm="canConfirm(reservation.status)"
          :is-cancelling="cancelling === reservation.id"
          :is-confirming="confirming === reservation.id"
          @cancel="handleCancel(reservation.id)"
          @confirm="handleConfirm(reservation.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.reservations-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 var(--spacing-12);
}

.reservations-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-6);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid #fca5a5;
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.error-dismiss {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xl);
  color: var(--color-error);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-icon {
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-6);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.reservation-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .reservations-container {
    padding: 0 var(--spacing-8);
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }
}
</style>
