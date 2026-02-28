<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()

const {
  alerts,
  loading,
  error,
  editingAlert,
  editForm,
  loadAlerts,
  toggleActive,
  deleteAlert,
  filterSummary,
  frequencyLabel,
  openEdit,
  closeEdit,
  updateEditField,
  saveEdit,
} = usePerfilAlertas()

useHead({ title: t('profile.alerts.title') })

onMounted(() => {
  loadAlerts()
})
</script>

<template>
  <div class="alerts-page">
    <div class="alerts-container">
      <h1 class="page-title">{{ $t('profile.alerts.title') }}</h1>
      <p class="page-subtitle">{{ $t('profile.alerts.subtitle') }}</p>

      <div v-if="loading" class="loading-state">{{ $t('common.loading') }}</div>

      <div v-else-if="error" class="error-state">{{ error }}</div>

      <div v-else-if="alerts.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('profile.alerts.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('profile.alerts.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">{{
          $t('profile.alerts.createFromCatalog')
        }}</NuxtLink>
      </div>

      <div v-else class="alerts-list">
        <AlertCard
          v-for="alert in alerts"
          :key="alert.id"
          :alert="alert"
          :filter-summary="filterSummary(alert.filters)"
          :frequency-label="frequencyLabel(alert.frequency)"
          @toggle-active="toggleActive(alert)"
          @edit="openEdit(alert)"
          @delete="deleteAlert(alert.id)"
        />
      </div>
    </div>

    <AlertEditModal
      :visible="editingAlert !== null"
      :target-alert="editingAlert"
      :edit-form="editForm"
      @close="closeEdit"
      @save="saveEdit"
      @update-field="updateEditField"
    />
  </div>
</template>

<style scoped>
.alerts-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.alerts-container {
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

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
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

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .alerts-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }
}
</style>
