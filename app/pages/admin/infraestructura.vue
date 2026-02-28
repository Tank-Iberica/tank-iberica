<template>
  <div class="infra-page">
    <!-- Page Header -->
    <div class="infra-header">
      <h1 class="infra-title">{{ $t('admin.infra.seoTitle', 'Infraestructura') }}</h1>
      <span v-if="criticalAlertCount > 0" class="infra-alert-badge">
        {{ criticalAlertCount }}
      </span>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="tab-icon" v-html="tab.icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="infra-loading">
      <div class="infra-spinner" />
      <span>{{ $t('admin.infra.loading', 'Cargando datos...') }}</span>
    </div>

    <!-- Error banner -->
    <div v-if="infraError" class="infra-error-banner">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="error-icon"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ infraError }}</span>
    </div>

    <!-- Tab Content -->
    <div v-show="activeTab === 'status'" class="tab-content">
      <InfraOverview
        :component-cards="componentCards"
        :clusters="clusters"
        :pipeline-mode="pipelineMode"
        :cloudinary-only-count="cloudinaryOnlyCount"
        :cf-images-count="cfImagesCount"
        :migrating-images="migratingImages"
        :configuring-variants="configuringVariants"
        :pipeline-message="pipelineMessage"
        :pipeline-message-type="pipelineMessageType"
        :get-status-color="getStatusColor"
        @migrate-images="migrateImages"
        @setup-cf-variants="setupCfVariants"
      />
    </div>

    <div v-show="activeTab === 'alerts'" class="tab-content">
      <InfraAlerts :alerts="alerts" @acknowledge="handleAcknowledge" />
    </div>

    <div v-show="activeTab === 'history'" class="tab-content">
      <InfraHistory
        :history-chart-data-sets="historyChartDataSets"
        :chart-options="chartOptions"
        @change-period="changePeriod"
      />
    </div>

    <div v-show="activeTab === 'migration'" class="tab-content">
      <InfraMigration
        :clusters="clusters"
        :wizard-open="wizardOpen"
        :wizard-step="wizardStep"
        :wizard-vertical="wizardVertical"
        :wizard-target-cluster="wizardTargetCluster"
        :wizard-confirmed="wizardConfirmed"
        :wizard-executing="wizardExecuting"
        :wizard-complete="wizardComplete"
        :wizard-progress="wizardProgress"
        :wizard-result="wizardResult"
        :wizard-error-message="wizardErrorMessage"
        :get-status-color="getStatusColor"
        @open-wizard="openMigrationWizard"
        @close-wizard="closeWizard"
        @update:wizard-step="wizardStep = $event"
        @update:wizard-vertical="wizardVertical = $event"
        @update:wizard-target-cluster="wizardTargetCluster = $event"
        @update:wizard-confirmed="wizardConfirmed = $event"
        @execute-migration="executeMigration"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t: $t } = useI18n()

useHead({
  title: $t('admin.infra.seoTitle', 'Infraestructura - Admin'),
})

const {
  alerts,
  clusters,
  loading,
  infraError,
  criticalAlertCount,
  getStatusColor,
  activeTab,
  tabs,
  componentCards,
  pipelineMode,
  cloudinaryOnlyCount,
  cfImagesCount,
  migratingImages,
  configuringVariants,
  pipelineMessage,
  pipelineMessageType,
  migrateImages,
  setupCfVariants,
  handleAcknowledge,
  historyChartDataSets,
  chartOptions,
  changePeriod,
  wizardOpen,
  wizardStep,
  wizardVertical,
  wizardTargetCluster,
  wizardConfirmed,
  wizardExecuting,
  wizardComplete,
  wizardProgress,
  wizardResult,
  wizardErrorMessage,
  openMigrationWizard,
  closeWizard,
  executeMigration,
  init,
} = useAdminInfrastructura()

onMounted(() => init())
</script>

<style scoped>
.infra-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.infra-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.infra-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.infra-alert-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--color-error);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-full);
}

.tab-bar {
  display: flex;
  gap: var(--spacing-1);
  border-bottom: 2px solid var(--border-color);
  margin-bottom: var(--spacing-6);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: all var(--transition-fast);
  min-height: 48px;
  min-width: 44px;
  cursor: pointer;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.tab-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tab-label {
  display: none;
}

@media (min-width: 480px) {
  .tab-label {
    display: inline;
  }
}

.infra-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.infra-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.infra-error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius-md);
  color: #b91c1c;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.tab-content {
  min-height: 200px;
}
</style>
