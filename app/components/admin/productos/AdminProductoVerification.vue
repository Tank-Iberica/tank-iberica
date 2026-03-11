<script setup lang="ts">
import type {
  VerificationDocument,
  VerificationLevel,
  VerificationDocType,
} from '~/composables/useVehicleVerification'
import { VERIFICATION_LEVELS, LEVEL_ORDER } from '~/composables/useVehicleVerification'

interface Props {
  open: boolean
  currentLevel: VerificationLevel
  levelBadge: string
  documents: VerificationDocument[]
  docType: VerificationDocType
  docTypes: VerificationDocType[]
  loading: boolean
  error: string | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'update:docType', value: VerificationDocType): void
  (e: 'upload', event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const verifLevels = VERIFICATION_LEVELS
const verifLevelOrder = LEVEL_ORDER
</script>

<template>
  <div class="section collapsible verification">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>🛡️ {{ t('admin.vehicleEdit.verification') }}</span>
      <span
        v-if="currentLevel !== 'none'"
        class="verif-level-badge"
        :class="`level-${currentLevel}`"
      >
        {{ levelBadge }}
      </span>
    </button>
    <div v-if="open" class="section-content">
      <!-- Current level indicator -->
      <div class="verif-current">
        <span class="verif-current-label">{{ t('admin.vehicleEdit.currentLevel') }}:</span>
        <span class="verif-current-value" :class="`level-${currentLevel}`">
          {{ levelBadge }} {{ t(`verification.level.${currentLevel}`) }}
        </span>
      </div>

      <!-- Level progress -->
      <div class="verif-progress">
        <div
          v-for="lvl in verifLevels"
          :key="lvl.level"
          class="verif-progress-step"
          :class="{
            active: verifLevelOrder[currentLevel] >= verifLevelOrder[lvl.level],
            current: currentLevel === lvl.level,
          }"
        >
          <span class="step-badge">{{ lvl.badge || '○' }}</span>
          <span class="step-label">{{ t(lvl.labelKey) }}</span>
        </div>
      </div>

      <!-- Document upload area -->
      <div class="verif-docs">
        <div class="verif-docs-header">
          <span>{{ t('admin.vehicleEdit.documents') }}</span>
        </div>

        <!-- Upload form -->
        <div class="verif-upload-row">
          <select
            :value="docType"
            class="verif-select"
            @change="
              emit(
                'update:docType',
                ($event.target as HTMLSelectElement).value as VerificationDocType,
              )
            "
          >
            <option v-for="dt in docTypes" :key="dt" :value="dt">
              {{ t(`verification.docType.${dt}`) }}
            </option>
          </select>
          <label class="btn btn-outline verif-upload-btn">
            {{ t('admin.vehicleEdit.uploadDoc') }}
            <input
              type="file"
              accept="image/*,.pdf"
              hidden
              :disabled="loading"
              @change="emit('upload', $event)"
            >
          </label>
        </div>

        <!-- Document list -->
        <div v-if="loading" class="loading-small">{{ t('common.loading') }}...</div>
        <div v-if="error" class="error-msg small">{{ error }}</div>

        <div v-if="documents.length === 0 && !loading" class="empty-msg">
          {{ t('admin.vehicleEdit.noVerifDocs') }}
        </div>

        <div v-for="doc in documents" :key="doc.id" class="verif-doc-row">
          <span class="verif-doc-type">{{ t(`verification.docType.${doc.doc_type}`) }}</span>
          <span class="verif-doc-status" :class="`status-${doc.status}`">
            {{ t(`verification.status.${doc.status}`) }}
          </span>
          <a
            v-if="doc.file_url"
            :href="doc.file_url"
            target="_blank"
            rel="noopener"
            class="verif-doc-link"
          >
            {{ t('admin.vehicleEdit.viewDoc') }}
          </a>
          <span v-if="doc.rejection_reason" class="verif-doc-rejection">
            {{ doc.rejection_reason }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
}
.section-toggle:hover {
  background: var(--color-gray-50);
}
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
.verif-current {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--color-success-bg, var(--color-success-bg));
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-3);
}
.verif-current-label {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
}
.verif-current-value {
  font-weight: 600;
  font-size: var(--font-size-sm);
}
.verif-current-value.level-none {
  color: var(--text-disabled);
}
.verif-current-value.level-verified {
  color: var(--color-success);
}
.verif-current-value.level-extended {
  color: var(--color-success-dark);
}
.verif-current-value.level-detailed {
  color: var(--color-teal-600);
}
.verif-current-value.level-audited {
  color: var(--color-warning);
}
.verif-current-value.level-certified {
  color: var(--color-violet-500);
}
.verif-level-badge {
  font-size: 0.6875rem;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  font-weight: 600;
}
.verif-level-badge.level-verified {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}
.verif-level-badge.level-extended {
  background: var(--color-emerald-100);
  color: var(--color-emerald-700);
}
.verif-level-badge.level-detailed {
  background: var(--color-teal-bg);
  color: var(--color-teal-text);
}
.verif-level-badge.level-audited {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning);
}
.verif-level-badge.level-certified {
  background: var(--color-purple-bg);
  color: var(--color-purple-600);
}
.verif-progress {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-4);
  overflow-x: auto;
  padding-bottom: var(--spacing-1);
}
.verif-progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 3.75rem;
  padding: 0.375rem 0.25rem;
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  opacity: 0.5;
  transition: all 0.2s;
}
.verif-progress-step.active {
  opacity: 1;
  background: var(--color-emerald-50);
}
.verif-progress-step.current {
  outline: 2px solid var(--color-success);
}
.step-badge {
  font-size: var(--font-size-base);
}
.step-label {
  font-size: 0.625rem;
  text-align: center;
  color: var(--color-gray-500);
}
.verif-docs-header {
  font-weight: 600;
  font-size: 0.8125rem;
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
}
.verif-upload-row {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}
.verif-select {
  flex: 1;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.8125rem;
  min-height: 2.75rem;
}
.verif-upload-btn {
  white-space: nowrap;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-outline {
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}
.verif-doc-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-gray-100);
  flex-wrap: wrap;
}
.verif-doc-type {
  font-size: 0.8125rem;
  font-weight: 500;
  flex: 1;
  min-width: 7.5rem;
}
.verif-doc-status {
  font-size: var(--font-size-xs);
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  font-weight: 500;
}
.verif-doc-status.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning);
}
.verif-doc-status.status-verified {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}
.verif-doc-status.status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}
.verif-doc-link {
  font-size: var(--font-size-xs);
  color: var(--color-focus);
  text-decoration: none;
}
.verif-doc-link:hover {
  text-decoration: underline;
}
.verif-doc-rejection {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  width: 100%;
}
.loading-small {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  padding: var(--spacing-2) 0;
}
.error-msg.small {
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
  margin-bottom: var(--spacing-2);
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border-radius: var(--border-radius);
}
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: var(--spacing-4);
}
</style>
