<template>
  <div class="admin-dashboard">
    <!-- KPI Summary Widget -->
    <AdminDashboardKpiSummary
      :kpi-summary="kpiSummary"
      :format-euros="formatKpiEuros"
      :change-class="kpiChangeClass"
    />

    <!-- Banner Status Card -->
    <AdminDashboardBannerStatus
      :enabled="bannerEnabled"
      :text="bannerText"
      @toggle="toggleBanner"
    />

    <!-- Quick Actions Bar -->
    <div class="quick-actions-bar">
      <NuxtLink to="/admin/productos" class="action-btn" title="Nuevo Vehiculo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h5l3 3v9a2 2 0 01-2 2h-6" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span>Vehiculo</span>
      </NuxtLink>
      <NuxtLink to="/admin/noticias" class="action-btn" title="Nueva Noticia">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span>Noticia</span>
      </NuxtLink>
      <NuxtLink to="/admin/balance" class="action-btn" title="Balance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
        <span>Balance</span>
      </NuxtLink>
    </div>

    <!-- Notifications, Pendientes, Coincidencias -->
    <AdminDashboardNotifications :stats="stats" :total-pending="totalPending" :matches="matches" />

    <!-- Collapsible Stats Sections -->
    <AdminDashboardCollapsibleStats
      :product-stats="productStats"
      :user-stats="userStats"
      :sections-open="sectionsOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { useAdminDashboard } from '~/composables/admin/useAdminDashboard'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  // KPI
  kpiSummary,
  formatKpiEuros,
  kpiChangeClass,
  // Notification stats
  stats,
  totalPending,
  // Product stats
  productStats,
  // User stats
  userStats,
  // Banner
  bannerEnabled,
  bannerText,
  toggleBanner,
  // Collapsible sections
  sectionsOpen,
  // Matches
  matches,
  // Actions
  init,
} = useAdminDashboard()

onMounted(() => {
  init()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* Quick Actions Bar */
.quick-actions-bar {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.quick-actions-bar .action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.quick-actions-bar .action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.quick-actions-bar .action-btn svg {
  width: 18px;
  height: 18px;
}

.quick-actions-bar .action-btn span {
  font-weight: var(--font-weight-medium);
}

/* Mobile base: quick actions stacked */
.quick-actions-bar {
  justify-content: center;
}

.quick-actions-bar .action-btn span {
  display: none;
}

.quick-actions-bar .action-btn {
  padding: var(--spacing-3);
}

@media (min-width: 640px) {
  .quick-actions-bar {
    justify-content: flex-start;
  }

  .quick-actions-bar .action-btn span {
    display: inline;
  }

  .quick-actions-bar .action-btn {
    padding: var(--spacing-2) var(--spacing-4);
  }
}
</style>
