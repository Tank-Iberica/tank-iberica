<script setup lang="ts">
import type { DashboardLead } from '~/composables/dashboard/useDashboardIndex'

defineProps<{
  leads: readonly DashboardLead[]
  getStatusColor: (status: string) => string
  formatDate: (dateStr: string | null) => string
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>{{ t('dashboard.recentLeads') }}</h2>
      <NuxtLink to="/dashboard/leads" class="link-more">
        {{ t('dashboard.viewAll') }}
      </NuxtLink>
    </div>
    <div v-if="leads.length === 0" class="empty-state">
      <p>{{ t('dashboard.noLeadsYet') }}</p>
    </div>
    <div v-else class="leads-list">
      <NuxtLink
        v-for="lead in leads"
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
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.card-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.link-more {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
}

.link-more:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.empty-state p {
  margin: 0 0 0.75rem 0;
}

.leads-list {
  display: flex;
  flex-direction: column;
}

.lead-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  text-decoration: none;
  border-bottom: 1px solid var(--color-gray-50);
  transition: background 0.15s;
  min-height: 2.75rem;
}

.lead-item:hover {
  background: var(--bg-secondary);
}

.lead-item:last-child {
  border-bottom: none;
}

.lead-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.lead-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.lead-vehicle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.lead-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.lead-date {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}
</style>
