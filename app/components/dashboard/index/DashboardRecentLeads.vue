<script setup lang="ts">
import type { DashboardLead } from '~/composables/dashboard/useDashboardIndex'

defineProps<{
  leads: DashboardLead[]
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

.empty-state {
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state p {
  margin: 0 0 12px 0;
}

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
</style>
