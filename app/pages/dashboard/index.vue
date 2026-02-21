<script setup lang="ts">
/**
 * Dealer Dashboard Home
 * Shows KPI cards, recent leads, top vehicles, and onboarding progress.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { dealerProfile, stats, recentLeads, topVehicles, loading, error, loadDashboardData } =
  useDealerDashboard()
const { userId } = useAuth()
const { currentPlan, planLimits, fetchSubscription } = useSubscriptionPlan(
  userId.value || undefined,
)

onMounted(async () => {
  await Promise.all([loadDashboardData(), fetchSubscription()])
})

function formatPrice(price: number | null | undefined): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#3b82f6',
    viewed: '#8b5cf6',
    contacted: '#f59e0b',
    negotiating: '#f97316',
    won: '#22c55e',
    lost: '#ef4444',
  }
  return colors[status] || '#64748b'
}

const onboardingComplete = computed(() => dealerProfile.value?.onboarding_completed ?? false)

const onboardingSteps = computed(() => {
  const dealer = dealerProfile.value
  if (!dealer) return []
  return [
    { key: 'profile', done: !!dealer.company_name, label: t('dashboard.onboarding.profile') },
    { key: 'logo', done: !!dealer.logo_url, label: t('dashboard.onboarding.logo') },
    {
      key: 'contact',
      done: !!(dealer.phone || dealer.email),
      label: t('dashboard.onboarding.contact'),
    },
    {
      key: 'vehicle',
      done: (stats.value.activeListings || 0) > 0,
      label: t('dashboard.onboarding.vehicle'),
    },
  ]
})

const onboardingProgress = computed(() => {
  const steps = onboardingSteps.value
  if (!steps.length) return 0
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
})
</script>

<template>
  <div class="dashboard-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.title') }}</h1>
        <p class="subtitle">
          {{ t('dashboard.welcome', { name: dealerProfile?.company_name || '' }) }}
        </p>
      </div>
      <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-primary">
        {{ t('dashboard.publishNew') }}
      </NuxtLink>
    </header>

    <!-- Onboarding CTA -->
    <div v-if="!onboardingComplete && dealerProfile" class="onboarding-card">
      <div class="onboarding-header">
        <h3>{{ t('dashboard.onboarding.title') }}</h3>
        <span class="progress-text">{{ onboardingProgress }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: onboardingProgress + '%' }" />
      </div>
      <div class="onboarding-steps">
        <div
          v-for="step in onboardingSteps"
          :key="step.key"
          class="step"
          :class="{ done: step.done }"
        >
          <span class="step-check">{{ step.done ? '&#10003;' : '' }}</span>
          <span>{{ step.label }}</span>
        </div>
      </div>
      <NuxtLink to="/dashboard/portal" class="btn-secondary">
        {{ t('dashboard.onboarding.complete') }}
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('common.loading') }}...</span>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-value">{{ stats.activeListings }}</span>
          <span class="kpi-label">{{ t('dashboard.kpi.activeVehicles') }}</span>
          <span class="kpi-limit">
            {{ stats.activeListings }}/{{
              planLimits.maxActiveListings === Infinity ? '&infin;' : planLimits.maxActiveListings
            }}
            {{ t('dashboard.kpi.planLimit') }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ stats.totalViews }}</span>
          <span class="kpi-label">{{ t('dashboard.kpi.totalViews') }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ stats.leadsThisMonth }}</span>
          <span class="kpi-label">{{ t('dashboard.kpi.leadsMonth') }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ stats.responseRate }}%</span>
          <span class="kpi-label">{{ t('dashboard.kpi.responseRate') }}</span>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Recent Leads -->
        <section class="card">
          <div class="card-header">
            <h2>{{ t('dashboard.recentLeads') }}</h2>
            <NuxtLink to="/dashboard/leads" class="link-more">
              {{ t('dashboard.viewAll') }}
            </NuxtLink>
          </div>
          <div v-if="recentLeads.length === 0" class="empty-state">
            <p>{{ t('dashboard.noLeadsYet') }}</p>
          </div>
          <div v-else class="leads-list">
            <NuxtLink
              v-for="lead in recentLeads"
              :key="lead.id"
              :to="`/dashboard/leads/${lead.id}`"
              class="lead-item"
            >
              <div class="lead-info">
                <span class="lead-name">{{
                  lead.buyer_name || lead.buyer_email || t('dashboard.anonymous')
                }}</span>
                <span class="lead-vehicle">{{ lead.vehicle_brand }} {{ lead.vehicle_model }}</span>
              </div>
              <div class="lead-meta">
                <span
                  class="status-badge"
                  :style="{
                    backgroundColor: getStatusColor(lead.status) + '20',
                    color: getStatusColor(lead.status),
                  }"
                >
                  {{ t(`dashboard.leadStatus.${lead.status}`) }}
                </span>
                <span class="lead-date">{{ formatDate(lead.created_at) }}</span>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Top Vehicles -->
        <section class="card">
          <div class="card-header">
            <h2>{{ t('dashboard.topVehicles') }}</h2>
            <NuxtLink to="/dashboard/vehiculos" class="link-more">
              {{ t('dashboard.viewAll') }}
            </NuxtLink>
          </div>
          <div v-if="topVehicles.length === 0" class="empty-state">
            <p>{{ t('dashboard.noVehiclesYet') }}</p>
            <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-secondary">
              {{ t('dashboard.publishFirst') }}
            </NuxtLink>
          </div>
          <div v-else class="vehicles-list">
            <NuxtLink
              v-for="vehicle in topVehicles"
              :key="vehicle.id"
              :to="`/dashboard/vehiculos/${vehicle.id}`"
              class="vehicle-item"
            >
              <div class="vehicle-info">
                <span class="vehicle-name">{{ vehicle.brand }} {{ vehicle.model }}</span>
                <span class="vehicle-price">{{ formatPrice(vehicle.price) }}</span>
              </div>
              <div class="vehicle-stats">
                <span class="stat">{{ vehicle.views }} {{ t('dashboard.views') }}</span>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <NuxtLink to="/dashboard/vehiculos/nuevo" class="action-card">
          <span class="action-icon">+</span>
          <span>{{ t('dashboard.actions.publish') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/portal" class="action-card">
          <span class="action-icon">&#9881;</span>
          <span>{{ t('dashboard.actions.portal') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/estadisticas" class="action-card">
          <span class="action-icon">&#9776;</span>
          <span>{{ t('dashboard.actions.stats') }}</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/suscripcion" class="action-card">
          <span class="action-icon">&#9733;</span>
          <span>{{ t('dashboard.actions.plan') }} ({{ t(`dashboard.plans.${currentPlan}`) }})</span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
}

/* Onboarding */
.onboarding-card {
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 20px;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.onboarding-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e40af;
}

.progress-text {
  font-weight: 700;
  color: #1e40af;
  font-size: 0.95rem;
}

.progress-bar {
  height: 8px;
  background: #dbeafe;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  transition: width 0.4s;
}

.onboarding-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #64748b;
}

.step.done {
  color: #16a34a;
  background: #f0fdf4;
}

.step-check {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  border: 1px solid #e2e8f0;
}

.step.done .step-check {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

/* Error & Loading */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
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

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
  line-height: 1;
}

.kpi-label {
  font-size: 0.85rem;
  color: #64748b;
}

.kpi-limit {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Content Grid */
.content-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.link-more {
  font-size: 0.85rem;
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-weight: 500;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.link-more:hover {
  text-decoration: underline;
}

/* Leads List */
.leads-list {
  display: flex;
  flex-direction: column;
}

.lead-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  text-decoration: none;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.15s;
  min-height: 44px;
}

.lead-item:hover {
  background: #f8fafc;
}
.lead-item:last-child {
  border-bottom: none;
}

.lead-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lead-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.lead-vehicle {
  font-size: 0.8rem;
  color: #64748b;
}

.lead-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.lead-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Vehicles List */
.vehicles-list {
  display: flex;
  flex-direction: column;
}

.vehicle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  text-decoration: none;
  border-bottom: 1px solid #f8fafc;
  min-height: 44px;
}

.vehicle-item:hover {
  background: #f8fafc;
}
.vehicle-item:last-child {
  border-bottom: none;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vehicle-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.vehicle-price {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary, #23424a);
}

.vehicle-stats {
  text-align: right;
}

.stat {
  font-size: 0.8rem;
  color: #64748b;
}

/* Empty State */
.empty-state {
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state p {
  margin: 0 0 12px 0;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  transition: box-shadow 0.2s;
  min-height: 44px;
}

.action-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.action-icon {
  font-size: 1.5rem;
  color: var(--color-primary, #23424a);
}

/* Responsive */
@media (min-width: 768px) {
  .dashboard-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .content-grid {
    flex-direction: row;
  }

  .content-grid .card {
    flex: 1;
  }

  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
