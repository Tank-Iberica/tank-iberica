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
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.plan-badge {
  padding: 4px 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f8fafc;
  color: var(--color-primary, #23424a);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #1a3238;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
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
  padding: 48px 20px;
  color: #64748b;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-state p {
  margin: 0 0 16px 0;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

/* Upgrade Card */
.upgrade-card {
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1e40af;
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #3b82f6;
  font-size: 0.9rem;
}

/* Responsive */
@media (min-width: 768px) {
  .observatory-page {
    padding: 24px;
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

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
