<script setup lang="ts">
import { useDashboardWidget } from '~/composables/dashboard/useDashboardWidget'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const {
  categories,
  loading,
  error,
  copySuccess,
  vehicleCount,
  theme,
  selectedCategory,
  widgetWidth,
  widgetHeight,
  useAutoHeight,
  VEHICLE_COUNT_OPTIONS,
  canUseWidget,
  embedCode,
  previewUrl,
  iframeWidth,
  init,
  handleCopyCode,
} = useDashboardWidget()

onMounted(() => init())
</script>

<template>
  <div class="widget-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.widget.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.widget.subtitle') }}</p>
      </div>
      <NuxtLink to="/dashboard" class="btn-back">
        {{ t('common.back') }}
      </NuxtLink>
    </header>

    <!-- Plan gate -->
    <div v-if="!canUseWidget" class="upgrade-card">
      <h2>{{ t('dashboard.widget.upgradeTitle') }}</h2>
      <p>{{ t('dashboard.widget.upgradeDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-upgrade">
        {{ t('dashboard.widget.upgradeCta') }}
      </NuxtLink>
    </div>

    <template v-else>
      <div v-if="error" class="alert-error">{{ error }}</div>

      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <template v-else>
        <div class="config-layout">
          <WidgetConfigCard
            :vehicle-count="vehicleCount"
            :theme="theme"
            :categories="categories"
            :selected-category="selectedCategory"
            :widget-width="widgetWidth"
            :widget-height="widgetHeight"
            :use-auto-height="useAutoHeight"
            :count-options="VEHICLE_COUNT_OPTIONS"
            @set-count="vehicleCount = $event"
            @set-theme="theme = $event"
            @set-category="selectedCategory = $event"
            @set-width="widgetWidth = $event"
            @set-height="widgetHeight = $event"
            @toggle-auto-height="useAutoHeight = $event"
          />
          <WidgetPreviewCard :preview-url="previewUrl" :iframe-width="iframeWidth" :theme="theme" />
        </div>

        <WidgetEmbedSection
          v-if="embedCode"
          :embed-code="embedCode"
          :copy-success="copySuccess"
          @copy="handleCopyCode"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.widget-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  align-self: flex-start;
}

.btn-back:hover {
  background: var(--bg-secondary);
}

.upgrade-card {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.upgrade-card h2 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-warning-text);
}

.upgrade-card p {
  margin: 0 0 16px 0;
  color: #a16207;
  font-size: 0.95rem;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-warning);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}

.btn-upgrade:hover {
  background: var(--color-warning);
}

.alert-error {
  padding: 12px 16px;
  background: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.spinner {
  width: 24px;
  height: 24px;
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

.config-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .widget-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .config-layout {
    flex-direction: row;
  }

  .config-layout :deep(.config-card) {
    flex: 0 0 360px;
  }

  .config-layout :deep(.preview-card) {
    flex: 1;
    min-width: 0;
  }
}
</style>
