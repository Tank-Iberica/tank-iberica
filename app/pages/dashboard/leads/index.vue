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
    new: 'var(--color-info)',
    viewed: 'var(--color-violet-500)',
    contacted: 'var(--color-warning)',
    negotiating: '#f97316',
    won: '#22c55e',
    lost: 'var(--color-error)',
  }
  return colors[status] || 'var(--color-slate-500)'
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
    <div v-if="loading" class="loading-skeleton" aria-busy="true">
      <UiSkeletonCard v-for="n in 5" :key="n" :lines="3" />
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
  max-width: 56.25rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
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
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}

.tabs-row {
  display: flex;
  gap: var(--spacing-1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-1);
}

.tab-btn {
  min-height: 2.75rem;
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
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
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.empty-state {
  text-align: center;
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.leads-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.lead-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  transition: box-shadow 0.15s;
  min-height: 2.75rem;
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
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
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
  gap: var(--spacing-3);
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

@media (min-width: 48em) {
  .leads-page {
    padding: var(--spacing-6);
  }
}
</style>
