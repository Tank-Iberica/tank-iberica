<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()

type LeadStatus = 'new' | 'viewed' | 'contacted' | 'negotiating' | 'won' | 'lost'

interface Lead {
  id: string
  vehicle_title: string
  dealer_name: string
  status: LeadStatus
  created_at: string
  vehicle_id: string
}

const leads = ref<Lead[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusColors: Record<LeadStatus, string> = {
  new: '#3B82F6',
  viewed: '#8B5CF6',
  contacted: '#F59E0B',
  negotiating: '#10B981',
  won: '#059669',
  lost: '#EF4444',
}

async function loadLeads() {
  if (!userId.value) return

  loading.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('leads')
      .select(
        'id, status, created_at, vehicle_id, vehicles(brand, model), dealer:dealer_user_id(full_name, company_name)',
      )
      .eq('buyer_user_id', userId.value)
      .order('created_at', { ascending: false })

    if (err) throw err

    leads.value = (data ?? []).map((row: Record<string, unknown>) => {
      const vehicle = row.vehicles as Record<string, unknown> | null
      const dealer = row.dealer as Record<string, unknown> | null
      const brand = (vehicle?.brand as string) ?? ''
      const model = (vehicle?.model as string) ?? ''

      return {
        id: row.id as string,
        vehicle_title: `${brand} ${model}`.trim() || t('profile.contacts.unknownVehicle'),
        dealer_name:
          (dealer?.company_name as string) ||
          (dealer?.full_name as string) ||
          t('profile.contacts.unknownDealer'),
        status: (row.status as LeadStatus) ?? 'new',
        created_at: row.created_at as string,
        vehicle_id: row.vehicle_id as string,
      }
    })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading contacts'
  } finally {
    loading.value = false
  }
}

function statusLabel(status: LeadStatus): string {
  return t(`profile.contacts.status_${status}`)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

useHead({
  title: t('profile.contacts.title'),
})

onMounted(() => {
  loadLeads()
})
</script>

<template>
  <div class="contacts-page">
    <div class="contacts-container">
      <h1 class="page-title">
        {{ $t('profile.contacts.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.contacts.subtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="leads.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('profile.contacts.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('profile.contacts.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">
          {{ $t('profile.contacts.browseCatalog') }}
        </NuxtLink>
      </div>

      <!-- Lead list -->
      <div v-else class="leads-list">
        <div v-for="lead in leads" :key="lead.id" class="lead-card">
          <div class="lead-info">
            <h3 class="lead-vehicle">{{ lead.vehicle_title }}</h3>
            <p class="lead-dealer">{{ lead.dealer_name }}</p>
            <p class="lead-date">{{ formatDate(lead.created_at) }}</p>
          </div>
          <span
            class="status-badge"
            :style="{
              backgroundColor: statusColors[lead.status] + '1A',
              color: statusColors[lead.status],
            }"
          >
            {{ statusLabel(lead.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.contacts-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Loading & error */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-state {
  color: var(--color-error);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Lead list */
.leads-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lead-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.lead-info {
  flex: 1;
  min-width: 0;
}

.lead-vehicle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lead-dealer {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 0.125rem;
}

.lead-date {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Status badge */
.status-badge {
  flex-shrink: 0;
  padding: 0.25rem 0.625rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-full);
  white-space: nowrap;
}

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .contacts-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }

  .lead-vehicle {
    font-size: var(--font-size-base);
  }

  .lead-dealer,
  .lead-date {
    font-size: var(--font-size-sm);
  }
}
</style>
