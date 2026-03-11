<script setup lang="ts">
/** Competition Observatory Page — Premium/Founding only */
import { useDashboardObservatorio } from '~/composables/dashboard/useDashboardObservatorio'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  isPremium,
  currentPlan,
  loading,
  error,
  platforms,
  filteredEntries,
  selectablePlatforms,
  platformMap,
  activePlatformIds,
  filterPlatform,
  filterStatus,
  searchQuery,
  getPlatformColor,
  getStatusClass,
  showEntryModal,
  editingEntry,
  savingEntry,
  entryForm,
  openAddEntry,
  openEditEntry,
  closeEntryModal,
  saveEntry,
  confirmDeleteId,
  handleDelete,
  showPlatformModal,
  openPlatformSettings,
  closePlatformSettings,
  togglePlatform,
  init,
} = useDashboardObservatorio()

onMounted(init)

function onUpdateForm(value: typeof entryForm.value): void {
  entryForm.value = value
}
</script>

<template>
  <div class="observatory-page">
    <!-- Plan Gate: Upgrade prompt for free/basic users -->
    <template v-if="!isPremium">
      <header class="page-header">
        <h1>{{ t('dashboard.observatory.title') }}</h1>
        <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
      </header>
      <div class="upgrade-card">
        <h3>{{ t('dashboard.observatory.upgradeTitle') }}</h3>
        <p>{{ t('dashboard.observatory.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.observatory.upgradeCta') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Premium/Founding Content -->
    <template v-else>
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.observatory.title') }}</h1>
          <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn-icon"
            :title="t('dashboard.observatory.platformSettings')"
            @click="openPlatformSettings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M17.73 12.02l-1.09-.63a6.07 6.07 0 000-2.78l1.09-.63a.5.5 0 00.18-.68l-1-1.73a.5.5 0 00-.68-.18l-1.09.63a5.97 5.97 0 00-2.4-1.39V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5v1.26a5.97 5.97 0 00-2.4 1.39l-1.09-.63a.5.5 0 00-.68.18l-1 1.73a.5.5 0 00.18.68l1.09.63a6.07 6.07 0 000 2.78l-1.09.63a.5.5 0 00-.18.68l1 1.73a.5.5 0 00.68.18l1.09-.63a5.97 5.97 0 002.4 1.39v1.26a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-1.26a5.97 5.97 0 002.4-1.39l1.09.63a.5.5 0 00.68-.18l1-1.73a.5.5 0 00-.18-.68z"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <button type="button" class="btn-primary" @click="openAddEntry">
            {{ t('dashboard.observatory.addEntry') }}
          </button>
        </div>
      </header>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state" aria-busy="true">
        <UiSkeletonCard :lines="4" />
      </div>

      <template v-else>
        <!-- Filters -->
        <DashboardObservatorioObservatorioFilters
          :filter-platform="filterPlatform"
          :filter-status="filterStatus"
          :search-query="searchQuery"
          :selectable-platforms="selectablePlatforms"
          @update:filter-platform="filterPlatform = $event"
          @update:filter-status="filterStatus = $event"
          @update:search-query="searchQuery = $event"
        />

        <!-- Empty State -->
        <div v-if="filteredEntries.length === 0" class="empty-state">
          <p>{{ t('dashboard.observatory.empty') }}</p>
          <button type="button" class="btn-primary" @click="openAddEntry">
            {{ t('dashboard.observatory.addFirst') }}
          </button>
        </div>

        <!-- Card Grid -->
        <div v-else class="card-grid">
          <DashboardObservatorioObservatorioEntryCard
            v-for="entry in filteredEntries"
            :key="entry.id"
            :entry="entry"
            :platform-name="platformMap.get(entry.platform_id ?? '')"
            :platform-color="getPlatformColor(entry.platform_id)"
            :status-class="getStatusClass(entry.status)"
            :is-confirming-delete="confirmDeleteId === entry.id"
            @edit="openEditEntry"
            @delete="handleDelete"
          />
        </div>
      </template>

      <!-- Add/Edit Entry Modal -->
      <DashboardObservatorioObservatorioEntryModal
        :visible="showEntryModal"
        :editing-entry="editingEntry"
        :form="entryForm"
        :saving="savingEntry"
        :selectable-platforms="selectablePlatforms"
        @close="closeEntryModal"
        @save="saveEntry"
        @update:form="onUpdateForm"
      />

      <!-- Platform Settings Modal -->
      <DashboardObservatorioObservatorioPlatformModal
        :visible="showPlatformModal"
        :platforms="platforms"
        :active-platform-ids="activePlatformIds"
        @close="closePlatformSettings"
        @toggle="togglePlatform"
      />
    </template>
  </div>
</template>

<style scoped>
.observatory-page {
  max-width: 68.75rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.plan-badge {
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Alerts */
.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty */
.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-5);
  color: var(--text-auxiliary);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
}

.empty-state p {
  margin: 0 0 var(--spacing-4) 0;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

/* Upgrade Card */
.upgrade-card {
  background: linear-gradient(135deg, var(--color-sky-50), var(--color-blue-50));
  border: 1px solid var(--color-info-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  text-align: center;
}

.upgrade-card h3 {
  margin: 0 0 var(--spacing-2) 0;
  font-size: 1.1rem;
  color: var(--badge-info-bg);
}

.upgrade-card p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-info);
  font-size: 0.9rem;
}

/* Responsive */
@media (min-width: 48em) {
  .observatory-page {
    padding: var(--spacing-6);
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 64em) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
