<script setup lang="ts">
import type { LeadFilters, LeadStatus } from '~/composables/useDealerLeads'

/**
 * All Leads - Filterable list of received leads.
 * Tabs: all, new, viewed, contacted, negotiating, won, lost
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { dealerProfile, loadDealer } = useDealerDashboard()

const dealerId = computed(() => dealerProfile.value?.id || null)

const { leads, loading, error, total, loadLeads } = useDealerLeads(dealerId)

type StatusTab = 'all' | 'new' | 'viewed' | 'contacted' | 'negotiating' | 'won' | 'lost'
const activeTab = ref<StatusTab>('all')
const searchQuery = ref('')

const statusTabs: StatusTab[] = ['all', 'new', 'viewed', 'contacted', 'negotiating', 'won', 'lost']

async function fetchData(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  const filters: Partial<LeadFilters> = {
    status: activeTab.value === 'all' ? null : (activeTab.value as LeadStatus),
    search: searchQuery.value,
  } as Partial<LeadFilters>

  await loadLeads(filters)
}

onMounted(fetchData)

watch([activeTab, searchQuery], () => {
  fetchData()
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
</script>

<template>
  <div class="leads-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.leads.title') }}</h1>
        <span v-if="total > 0" class="total-badge">{{ total }}</span>
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs-row">
      <button
        v-for="tab in statusTabs"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ t(`dashboard.leads.tab.${tab}`) }}
      </button>
    </div>

    <!-- Search -->
    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('dashboard.leads.searchPlaceholder')"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <!-- Empty -->
    <div v-else-if="leads.length === 0" class="empty-state">
      <p>{{ t('dashboard.leads.empty') }}</p>
    </div>

    <!-- Leads List -->
    <div v-else class="leads-list">
      <NuxtLink
        v-for="lead in leads"
        :key="lead.id"
        :to="`/dashboard/leads/${lead.id}`"
        class="lead-card"
      >
        <div class="lead-top">
          <span class="lead-name">{{
            lead.buyer_name || lead.buyer_email || t('dashboard.anonymous')
          }}</span>
          <span
            class="status-badge"
            :style="{
              backgroundColor: getStatusColor(lead.status) + '20',
              color: getStatusColor(lead.status),
            }"
          >
            {{ t(`dashboard.leadStatus.${lead.status}`) }}
          </span>
        </div>
        <div class="lead-vehicle">
          {{ lead.vehicle_brand }} {{ lead.vehicle_model }}
          <span v-if="lead.vehicle_year"> ({{ lead.vehicle_year }})</span>
        </div>
        <div class="lead-bottom">
          <span class="lead-date">{{ formatDate(lead.created_at) }}</span>
          <span v-if="lead.message" class="lead-preview"
            >{{ lead.message.substring(0, 60) }}{{ lead.message.length > 60 ? '...' : '' }}</span
          >
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.leads-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.total-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.tabs-row {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.tab-btn {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tab-btn:hover:not(.active) {
  background: var(--bg-secondary);
}

.search-box input {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
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
  justify-content: center;
  padding: 40px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-auxiliary);
}

.leads-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lead-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: box-shadow 0.15s;
  min-height: 44px;
}

.lead-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.lead-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lead-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.lead-vehicle {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
}

.lead-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.lead-date {
  font-size: 0.8rem;
  color: var(--text-disabled);
  white-space: nowrap;
}

.lead-preview {
  font-size: 0.8rem;
  color: var(--text-disabled);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .leads-page {
    padding: 24px;
  }
}
</style>
