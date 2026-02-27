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
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
}

.btn-close:hover {
  background: #f1f5f9;
}

.modal-form {
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.modal-actions-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ── Buttons ───────────────────────────────────────────────────── */
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  font-size: 0.95rem;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #fee2e2;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Desktop layout ────────────────────────────────────────────── */
@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 24px;
  }

  .modal-content {
    border-radius: 16px;
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
