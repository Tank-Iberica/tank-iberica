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
  <div class="lead-detail-page">
    <header class="page-header">
      <NuxtLink to="/dashboard/leads" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <h1>{{ t('dashboard.leads.detail') }}</h1>
    </header>

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="5" />
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
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
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

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
}

.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card h2 {
  margin: 0 0 var(--spacing-4) 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-disabled);
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.info-value a {
  color: var(--color-primary);
  text-decoration: none;
}

.info-value a:hover {
  text-decoration: underline;
}

.vehicle-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
}

.vehicle-link:hover {
  text-decoration: underline;
}

.message-text {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.status-current {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  font-size: 0.9rem;
  color: var(--text-auxiliary);
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 600;
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.status-btn {
  min-height: 2.75rem;
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.status-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
}
.status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.status-btn.active {
  border-width: 0.125rem;
  font-weight: 700;
}

textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 5rem;
  margin-bottom: var(--spacing-3);
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-6);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
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
  padding-left: var(--spacing-6);
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.4375rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 0.125rem;
  background: var(--bg-tertiary);
}

.timeline-item {
  display: flex;
  gap: var(--spacing-4);
  position: relative;
  padding-bottom: var(--spacing-4);
}

.timeline-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  flex-shrink: 0;
  position: absolute;
  left: -24px;
  top: 0.125rem;
  z-index: 1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.timeline-status {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.timeline-date {
  font-size: 0.8rem;
  color: var(--text-disabled);
}

.timeline-notes {
  font-size: 0.85rem;
  color: var(--text-auxiliary);
  font-style: italic;
  margin-top: var(--spacing-1);
}

.meta-info {
  font-size: 0.8rem;
  color: var(--text-disabled);
  text-align: center;
  padding: var(--spacing-2);
}

.empty-state {
  text-align: center;
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

@media (min-width: 30em) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 48em) {
  .lead-detail-page {
    padding: var(--spacing-6);
  }
}
</style>
