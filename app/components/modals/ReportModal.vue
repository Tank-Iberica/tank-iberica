<script setup lang="ts">
/**
 * ReportModal — DSA content reporting form
 * Allows users to flag vehicles, dealers, articles, or comments.
 */
const props = defineProps<{
  visible: boolean
  entityType: 'vehicle' | 'dealer' | 'article' | 'comment'
  entityId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { submitReport, submitting, submitted, error, reset } = useReports()
const user = useSupabaseUser()

const dialogRef = ref<HTMLElement | null>(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap()

const email = ref(user.value?.email || '')
const reason = ref('')
const details = ref('')

const reasons = computed(() => [
  { value: 'illegal_content', label: t('report.reasonIllegal') },
  { value: 'fraud_scam', label: t('report.reasonFraud') },
  { value: 'misleading_info', label: t('report.reasonMisleading') },
  { value: 'stolen_vehicle', label: t('report.reasonStolen') },
  { value: 'counterfeit', label: t('report.reasonCounterfeit') },
  { value: 'spam', label: t('report.reasonSpam') },
  { value: 'privacy_violation', label: t('report.reasonPrivacy') },
  { value: 'other', label: t('report.reasonOther') },
])

async function handleSubmit() {
  if (!email.value || !reason.value) return

  await submitReport({
    reporter_email: email.value,
    entity_type: props.entityType,
    entity_id: props.entityId,
    reason: reason.value,
    details: details.value || undefined,
  })
}

function handleClose() {
  reset()
  reason.value = ''
  details.value = ''
  emit('close')
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      reset()
      email.value = user.value?.email || ''
      nextTick(() => activateTrap(dialogRef.value))
    } else {
      deactivateTrap()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="report-overlay" @click.self="handleClose">
      <div ref="dialogRef" class="report-modal">
        <div class="report-header">
          <h2>{{ t('report.title') }}</h2>
          <button type="button" class="report-close" @click="handleClose">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Success state -->
        <div v-if="submitted" class="report-success">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-green-600)"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>{{ t('report.successMessage') }}</p>
          <button type="button" class="report-btn-primary" @click="handleClose">
            {{ t('common.close') }}
          </button>
        </div>

        <!-- Form -->
        <form v-else class="report-form" @submit.prevent="handleSubmit">
          <p class="report-description">{{ t('report.description') }}</p>

          <div class="report-field">
            <label for="report-email">{{ t('report.email') }} *</label>
            <input
              id="report-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              :placeholder="t('report.emailPlaceholder')"
            >
          </div>

          <div class="report-field">
            <label for="report-reason">{{ t('report.reason') }} *</label>
            <select id="report-reason" v-model="reason" required>
              <option value="" disabled>{{ t('report.selectReason') }}</option>
              <option v-for="r in reasons" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>
          </div>

          <div class="report-field">
            <label for="report-details">{{ t('report.details') }}</label>
            <textarea
              id="report-details"
              v-model="details"
              rows="4"
              :placeholder="t('report.detailsPlaceholder')"
            />
          </div>

          <div v-if="error" class="report-error" role="alert">{{ error }}</div>

          <div class="report-actions">
            <button type="button" class="report-btn-secondary" @click="handleClose">
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="report-btn-primary"
              :disabled="submitting || !email || !reason"
            >
              {{ submitting ? t('common.loading') : t('report.submit') }}
            </button>
          </div>

          <p class="report-legal">{{ t('report.legalNote') }}</p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.report-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.report-modal {
  background: var(--bg-primary, white);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 30em;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--border-color-light, var(--color-gray-200));
}

.report-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary, var(--color-gray-800));
}

.report-close {
  width: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  color: var(--text-auxiliary, var(--color-gray-400));
  cursor: pointer;
  transition: background 0.2s;
}

.report-close:hover {
  background: var(--bg-secondary, var(--color-gray-100));
}

.report-form {
  padding: var(--spacing-5);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.report-description {
  font-size: 0.875rem;
  color: var(--text-secondary, var(--color-gray-600));
  margin: 0;
  line-height: 1.5;
}

.report-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.report-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, var(--color-gray-600));
}

.report-field input,
.report-field select,
.report-field textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color, var(--color-gray-200));
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.report-field input:focus,
.report-field select:focus,
.report-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.report-field textarea {
  resize: vertical;
  min-height: 5rem;
}

.report-error {
  padding: 0.625rem 0.875rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.875rem;
}

.report-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.report-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.report-btn-primary:hover {
  opacity: 0.9;
}

.report-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  background: var(--bg-primary);
  color: var(--text-secondary, var(--color-gray-600));
  border: 1px solid var(--border-color, var(--color-gray-200));
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
}

.report-legal {
  font-size: 0.75rem;
  color: var(--text-auxiliary, var(--color-gray-400));
  margin: 0;
  line-height: 1.4;
}

.report-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-10) var(--spacing-5);
  text-align: center;
}

.report-success p {
  font-size: 0.95rem;
  color: var(--text-secondary, var(--color-gray-600));
  margin: 0;
}
</style>
