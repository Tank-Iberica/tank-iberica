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
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
}
.section-toggle:hover {
  background: #f9fafb;
}
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}
.verif-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-success-bg, #dcfce7);
  border-radius: 6px;
  margin-bottom: 12px;
}
.verif-current-label {
  font-size: 13px;
  color: #6b7280;
}
.verif-current-value {
  font-weight: 600;
  font-size: 14px;
}
.verif-current-value.level-none {
  color: var(--text-disabled);
}
.verif-current-value.level-verified {
  color: var(--color-success);
}
.verif-current-value.level-extended {
  color: #059669;
}
.verif-current-value.level-detailed {
  color: #0d9488;
}
.verif-current-value.level-audited {
  color: var(--color-warning);
}
.verif-current-value.level-certified {
  color: #8b5cf6;
}
.verif-level-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.verif-level-badge.level-verified {
  background: #d1fae5;
  color: #059669;
}
.verif-level-badge.level-extended {
  background: #d1fae5;
  color: #047857;
}
.verif-level-badge.level-detailed {
  background: #ccfbf1;
  color: #0d9488;
}
.verif-level-badge.level-audited {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning);
}
.verif-level-badge.level-certified {
  background: #ede9fe;
  color: #7c3aed;
}
.verif-progress {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.verif-progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  padding: 6px 4px;
  border-radius: 6px;
  background: var(--bg-secondary);
  opacity: 0.5;
  transition: all 0.2s;
}
.verif-progress-step.active {
  opacity: 1;
  background: #ecfdf5;
}
.verif-progress-step.current {
  outline: 2px solid var(--color-success);
}
.step-badge {
  font-size: 16px;
}
.step-label {
  font-size: 10px;
  text-align: center;
  color: #6b7280;
}
.verif-docs-header {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  color: #374151;
}
.verif-upload-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.verif-select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  min-height: 44px;
}
.verif-upload-btn {
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
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
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.verif-doc-type {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 120px;
}
.verif-doc-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.verif-doc-status.status-pending {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning);
}
.verif-doc-status.status-verified {
  background: #d1fae5;
  color: #059669;
}
.verif-doc-status.status-rejected {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
}
.verif-doc-link {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
}
.verif-doc-link:hover {
  text-decoration: underline;
}
.verif-doc-rejection {
  font-size: 12px;
  color: var(--color-error);
  width: 100%;
}
.loading-small {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0;
}
.error-msg.small {
  font-size: 0.75rem;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  border-radius: 6px;
}
.empty-msg {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.8rem;
  padding: 16px;
}
</style>
