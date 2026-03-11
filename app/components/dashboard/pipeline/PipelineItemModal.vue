<script setup lang="ts">
/**
 * Add/Edit modal for a pipeline item.
 * Teleported to body for proper stacking context.
 *
 * Uses :value + @input/emit pattern — never v-model on props.
 */
import type {
  PipelineItem,
  PipelineItemForm,
  PipelineStage,
} from '~/composables/dashboard/useDashboardPipeline'
import { STAGES } from '~/composables/dashboard/useDashboardPipeline'

const props = defineProps<{
  show: boolean
  editingItem: PipelineItem | null
  form: PipelineItemForm
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: []
  delete: []
  'update:field': [key: keyof PipelineItemForm, value: PipelineItemForm[keyof PipelineItemForm]]
}>()

const { t } = useI18n()

function updateField<K extends keyof PipelineItemForm>(key: K, value: PipelineItemForm[K]): void {
  emit('update:field', key, value)
}

function onEstimatedValueInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const parsed = raw === '' ? null : Number(raw)
  updateField('estimated_value', parsed)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal-content"
        role="dialog"
        :aria-label="
          editingItem ? t('dashboard.pipeline.editItem') : t('dashboard.pipeline.addItem')
        "
      >
        <div class="modal-header">
          <h2>
            {{ editingItem ? t('dashboard.pipeline.editItem') : t('dashboard.pipeline.addItem') }}
          </h2>
          <button class="btn-close" :aria-label="t('common.close')" @click="emit('close')">
            &times;
          </button>
        </div>

        <form class="modal-form" @submit.prevent="emit('save')">
          <div class="form-group">
            <label for="pip-title">{{ t('dashboard.pipeline.fieldTitle') }} *</label>
            <input
              id="pip-title"
              type="text"
              required
              :value="form.title"
              :placeholder="t('dashboard.pipeline.fieldTitlePlaceholder')"
              @input="updateField('title', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="pip-contact-name">{{ t('dashboard.pipeline.fieldContactName') }}</label>
              <input
                id="pip-contact-name"
                type="text"
                :value="form.contact_name"
                :placeholder="t('dashboard.pipeline.fieldContactNamePlaceholder')"
                @input="updateField('contact_name', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label for="pip-contact-phone">{{ t('dashboard.pipeline.fieldContactPhone') }}</label>
              <input
                id="pip-contact-phone"
                type="tel"
                :value="form.contact_phone"
                :placeholder="t('dashboard.pipeline.fieldContactPhonePlaceholder')"
                @input="updateField('contact_phone', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="pip-contact-email">{{ t('dashboard.pipeline.fieldContactEmail') }}</label>
              <input
                id="pip-contact-email"
                type="email"
                :value="form.contact_email"
                :placeholder="t('dashboard.pipeline.fieldContactEmailPlaceholder')"
                @input="updateField('contact_email', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label for="pip-value">{{ t('dashboard.pipeline.fieldValue') }}</label>
              <input
                id="pip-value"
                type="number"
                min="0"
                step="1"
                :value="form.estimated_value"
                :placeholder="t('dashboard.pipeline.fieldValuePlaceholder')"
                @input="onEstimatedValueInput"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="pip-stage">{{ t('dashboard.pipeline.fieldStage') }}</label>
            <select
              id="pip-stage"
              :value="form.stage"
              @change="
                updateField('stage', ($event.target as HTMLSelectElement).value as PipelineStage)
              "
            >
              <option v-for="s in STAGES" :key="s" :value="s">
                {{ t(`dashboard.pipeline.stage.${s}`) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="pip-notes">{{ t('dashboard.pipeline.fieldNotes') }}</label>
            <textarea
              id="pip-notes"
              rows="3"
              :value="form.notes"
              :placeholder="t('dashboard.pipeline.fieldNotesPlaceholder')"
              @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <div v-if="form.stage === 'closed_lost'" class="form-group">
            <label for="pip-close-reason">{{ t('dashboard.pipeline.fieldCloseReason') }}</label>
            <input
              id="pip-close-reason"
              type="text"
              :value="form.close_reason"
              :placeholder="t('dashboard.pipeline.fieldCloseReasonPlaceholder')"
              @input="updateField('close_reason', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="modal-actions">
            <button
              v-if="props.editingItem"
              type="button"
              class="btn-danger"
              :disabled="saving"
              @click="emit('delete')"
            >
              {{ t('common.delete') }}
            </button>
            <div class="modal-actions-right">
              <button type="button" class="btn-secondary" @click="emit('close')">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="saving || !form.title.trim()">
                {{ saving ? t('common.loading') + '...' : t('common.save') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  width: 100%;
  max-width: 35rem;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  background: none;
  font-size: var(--font-size-2xl);
  color: var(--text-auxiliary);
  cursor: pointer;
  border-radius: var(--border-radius);
}

.btn-close:hover {
  background: var(--bg-secondary);
}

.modal-form {
  padding: 1rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 5rem;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-gray-100);
}

.modal-actions-right {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

/* ── Buttons ───────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 48em) {
  .modal-overlay {
    align-items: center;
    padding: 1.5rem;
  }

  .modal-content {
    border-radius: var(--border-radius-lg);
    max-height: 85vh;
  }

  .form-row {
    flex-direction: row;
  }

  .form-row .form-group {
    flex: 1;
  }
}
</style>
