<script setup lang="ts">
/**
 * Lead Detail
 * Full lead info, status change, private notes, timeline.
 */
import { LEAD_STATUSES, type LeadStatus } from '~/composables/useDealerLeads'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const route = useRoute()
const { dealerProfile, loadDealer } = useDealerDashboard()

const dealerId = computed(() => dealerProfile.value?.id || null)
const {
  currentLead,
  loading,
  error,
  loadLead,
  updateLeadStatus,
  updateLeadNotes,
  updateCloseReason,
} = useDealerLeads(dealerId)

const leadId = route.params.id as string
const notesText = ref('')
const closeReasonText = ref('')
const saving = ref(false)
const saveSuccess = ref(false)

async function fetchLead(): Promise<void> {
  await loadDealer()
  const lead = await loadLead(leadId)
  if (lead) {
    notesText.value = lead.dealer_notes || ''
    closeReasonText.value = lead.close_reason || ''
  }
}

onMounted(fetchLead)

async function handleStatusChange(newStatus: LeadStatus): Promise<void> {
  if (newStatus === 'lost' && !closeReasonText.value) {
    error.value = t('dashboard.leads.closeReasonRequired')
    return
  }

  saving.value = true
  const success = await updateLeadStatus(leadId, newStatus, notesText.value || undefined)

  if (success && newStatus === 'lost' && closeReasonText.value) {
    await updateCloseReason(leadId, closeReasonText.value)
  }

  saving.value = false
  if (success) {
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  }
}

async function saveNotes(): Promise<void> {
  saving.value = true
  const success = await updateLeadNotes(leadId, notesText.value)
  saving.value = false
  if (success) {
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  <div class="lead-detail-page">
    <header class="page-header">
      <NuxtLink to="/dashboard/leads" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <h1>{{ t('dashboard.leads.detail') }}</h1>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else-if="currentLead">
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="saveSuccess" class="alert-success">{{ t('dashboard.leads.saved') }}</div>

      <!-- Buyer Info -->
      <section class="card">
        <h2>{{ t('dashboard.leads.buyerInfo') }}</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">{{ t('dashboard.leads.name') }}</span>
            <span class="info-value">{{ currentLead.buyer_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('dashboard.leads.email') }}</span>
            <span class="info-value">
              <a v-if="currentLead.buyer_email" :href="`mailto:${currentLead.buyer_email}`">{{
                currentLead.buyer_email
              }}</a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('dashboard.leads.phone') }}</span>
            <span class="info-value">
              <a v-if="currentLead.buyer_phone" :href="`tel:${currentLead.buyer_phone}`">{{
                currentLead.buyer_phone
              }}</a>
              <span v-else>-</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('dashboard.leads.location') }}</span>
            <span class="info-value">{{ currentLead.buyer_location || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Vehicle Reference -->
      <section v-if="currentLead.vehicle_id" class="card">
        <h2>{{ t('dashboard.leads.vehicle') }}</h2>
        <NuxtLink :to="`/dashboard/vehiculos/${currentLead.vehicle_id}`" class="vehicle-link">
          {{ currentLead.vehicle_brand }} {{ currentLead.vehicle_model }}
          <span v-if="currentLead.vehicle_year">({{ currentLead.vehicle_year }})</span>
        </NuxtLink>
      </section>

      <!-- Message -->
      <section v-if="currentLead.message" class="card">
        <h2>{{ t('dashboard.leads.message') }}</h2>
        <p class="message-text">{{ currentLead.message }}</p>
      </section>

      <!-- Status Change -->
      <section class="card">
        <h2>{{ t('dashboard.leads.changeStatus') }}</h2>
        <div class="status-current">
          <span>{{ t('dashboard.leads.currentStatus') }}:</span>
          <span
            class="status-badge"
            :style="{
              backgroundColor: getStatusColor(currentLead.status) + '20',
              color: getStatusColor(currentLead.status),
            }"
          >
            {{ t(`dashboard.leadStatus.${currentLead.status}`) }}
          </span>
        </div>
        <div class="status-buttons">
          <button
            v-for="status in LEAD_STATUSES"
            :key="status"
            class="status-btn"
            :class="{ active: currentLead.status === status }"
            :disabled="saving || currentLead.status === status"
            :style="
              currentLead.status === status
                ? { backgroundColor: getStatusColor(status), color: 'white' }
                : {}
            "
            @click="handleStatusChange(status)"
          >
            {{ t(`dashboard.leadStatus.${status}`) }}
          </button>
        </div>
      </section>

      <!-- Close Reason (required for lost) -->
      <section v-if="currentLead.status === 'lost' || closeReasonText" class="card">
        <h2>{{ t('dashboard.leads.closeReason') }}</h2>
        <textarea
          v-model="closeReasonText"
          rows="3"
          :placeholder="t('dashboard.leads.closeReasonPlaceholder')"
        />
      </section>

      <!-- Private Notes -->
      <section class="card">
        <h2>{{ t('dashboard.leads.notes') }}</h2>
        <textarea
          v-model="notesText"
          rows="4"
          :placeholder="t('dashboard.leads.notesPlaceholder')"
        />
        <button class="btn-primary" :disabled="saving" @click="saveNotes">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </section>

      <!-- Timeline -->
      <section v-if="currentLead.status_history.length > 0" class="card">
        <h2>{{ t('dashboard.leads.timeline') }}</h2>
        <div class="timeline">
          <div v-for="(change, idx) in currentLead.status_history" :key="idx" class="timeline-item">
            <div class="timeline-dot" :style="{ backgroundColor: getStatusColor(change.to) }" />
            <div class="timeline-content">
              <span class="timeline-status">
                {{ t(`dashboard.leadStatus.${change.from}`) }} &rarr;
                {{ t(`dashboard.leadStatus.${change.to}`) }}
              </span>
              <span class="timeline-date">{{ formatDateTime(change.changed_at) }}</span>
              <span v-if="change.notes" class="timeline-notes">{{ change.notes }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Created At -->
      <div class="meta-info">
        {{ t('dashboard.leads.receivedAt') }}: {{ formatDateTime(currentLead.created_at) }}
      </div>
    </template>

    <div v-else class="empty-state">
      <p>{{ t('dashboard.leads.notFound') }}</p>
    </div>
  </div>
</template>

<style scoped>
.lead-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

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

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card h2 {
  margin: 0 0 16px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #1e293b;
}

.info-value a {
  color: var(--color-primary, #23424a);
  text-decoration: none;
}

.info-value a:hover {
  text-decoration: underline;
}

.vehicle-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--color-primary, #23424a);
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
}

.vehicle-link:hover {
  text-decoration: underline;
}

.message-text {
  margin: 0;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

.status-current {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #64748b;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-btn {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.status-btn:hover:not(:disabled) {
  background: #f8fafc;
}
.status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.status-btn.active {
  border-width: 2px;
  font-weight: 700;
}

textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 12px;
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
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
}

.btn-primary:hover {
  background: #1a3238;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 16px;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  position: absolute;
  left: -24px;
  top: 2px;
  z-index: 1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-status {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
}

.timeline-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.timeline-notes {
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
  margin-top: 4px;
}

.meta-info {
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
  padding: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

@media (min-width: 480px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .lead-detail-page {
    padding: 24px;
  }
}
</style>
