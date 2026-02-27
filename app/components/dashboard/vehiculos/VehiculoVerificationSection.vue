<script setup lang="ts">
import type {
  VerificationLevel,
  VerificationDocument,
  VerificationLevelDefinition,
} from '~/composables/useVehicleVerification'

const { t } = useI18n()

const props = defineProps<{
  currentLevel: VerificationLevel
  progressPercentage: number
  nextLevel: VerificationLevel | null
  missingDocuments: string[]
  verificationDocs: readonly VerificationDocument[]
  verificationError: string | null
  uploadDocType: string
  uploadFile: File | null
  uploadSuccess: boolean
  cloudinaryUploading: boolean
  getLevelColor: (level: string) => string
  getLevelDefinition: (level: VerificationLevel) => VerificationLevelDefinition | undefined
}>()

const emit = defineEmits<{
  (e: 'update:uploadDocType', value: string): void
  (e: 'fileSelect', event: Event): void
  (e: 'uploadDocument'): void
}>()

function onDocTypeChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update:uploadDocType', target.value)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.vehicles.sectionVerification') }}</h2>

    <!-- Current Level Display -->
    <div class="verification-header">
      <div
        class="level-badge"
        :style="{ backgroundColor: props.getLevelColor(props.currentLevel) }"
      >
        <span class="badge-icon">{{
          props.getLevelDefinition(props.currentLevel)?.badge || ''
        }}</span>
        <span class="badge-text">{{
          t(`dashboard.verification.level.${props.currentLevel}`)
        }}</span>
      </div>
      <div class="level-info">
        <p class="level-label">{{ t('dashboard.verification.currentLevel') }}</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-label">
        <span>{{ t('dashboard.verification.progress') }}</span>
        <span class="progress-value">{{ props.progressPercentage }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${props.progressPercentage}%` }" />
      </div>
    </div>

    <!-- Next Level Hint -->
    <div v-if="props.nextLevel && props.missingDocuments.length > 0" class="next-level-hint">
      <p class="hint-title">
        {{ t('dashboard.verification.nextLevel') }}:
        {{ t(`dashboard.verification.level.${props.nextLevel}`) }}
      </p>
      <p class="hint-label">{{ t('dashboard.verification.missingDocs') }}:</p>
      <ul class="missing-docs-list">
        <li v-for="docType in props.missingDocuments" :key="docType">
          {{ t(`dashboard.verification.docType.${docType}`) }}
        </li>
      </ul>
    </div>

    <!-- Uploaded Documents List -->
    <div class="documents-list">
      <h3>{{ t('dashboard.verification.uploadedDocuments') }}</h3>
      <div v-if="props.verificationDocs.length === 0" class="no-documents">
        <p>{{ t('dashboard.verification.noDocuments') }}</p>
      </div>
      <div v-else class="document-items">
        <div v-for="doc in props.verificationDocs" :key="doc.id" class="document-item">
          <div class="doc-info">
            <span class="doc-type">{{ t(`dashboard.verification.docType.${doc.doc_type}`) }}</span>
            <span class="doc-status" :class="`status-${doc.status}`">
              {{ t(`dashboard.verification.status.${doc.status}`) }}
            </span>
          </div>
          <a
            v-if="doc.file_url"
            :href="doc.file_url"
            target="_blank"
            rel="noopener noreferrer"
            class="doc-link"
          >
            Ver documento
          </a>
        </div>
      </div>
    </div>

    <!-- Upload Form -->
    <div class="upload-form">
      <h3>{{ t('dashboard.verification.uploadDocument') }}</h3>
      <div v-if="props.uploadSuccess" class="alert-success">
        {{ t('dashboard.verification.uploadSuccess') }}
      </div>
      <div v-if="props.verificationError" class="alert-error">{{ props.verificationError }}</div>

      <div class="form-grid">
        <div class="form-group">
          <label for="docType">{{ t('dashboard.verification.documentType') }} *</label>
          <select
            id="docType"
            :value="props.uploadDocType"
            :disabled="props.cloudinaryUploading"
            @change="onDocTypeChange"
          >
            <option value="">{{ t('dashboard.verification.selectDocType') }}</option>
            <option value="ficha_tecnica">
              {{ t('dashboard.verification.docType.ficha_tecnica') }}
            </option>
            <option value="itv">{{ t('dashboard.verification.docType.itv') }}</option>
            <option value="permiso_circulacion">
              {{ t('dashboard.verification.docType.permiso_circulacion') }}
            </option>
            <option value="seguro">{{ t('dashboard.verification.docType.seguro') }}</option>
            <option value="contrato">{{ t('dashboard.verification.docType.contrato') }}</option>
            <option value="foto_bastidor">
              {{ t('dashboard.verification.docType.foto_bastidor') }}
            </option>
            <option value="other">{{ t('dashboard.verification.docType.other') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="verification-file">{{ t('dashboard.verification.selectFile') }} *</label>
          <input
            id="verification-file"
            type="file"
            accept="image/*,application/pdf"
            :disabled="props.cloudinaryUploading"
            @change="emit('fileSelect', $event)"
          >
        </div>
      </div>
      <button
        type="button"
        class="btn-upload"
        :disabled="props.cloudinaryUploading || !props.uploadDocType || !props.uploadFile"
        @click="emit('uploadDocument')"
      >
        {{
          props.cloudinaryUploading
            ? t('dashboard.verification.uploading')
            : t('dashboard.verification.upload')
        }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group select,
.form-group input[type='file'] {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
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

/* Verification Section */
.verification-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-icon {
  font-size: 1.1rem;
}

.badge-text {
  white-space: nowrap;
}

.level-info {
  display: flex;
  flex-direction: column;
}

.level-label {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.progress-value {
  color: var(--color-primary, #23424a);
  font-weight: 700;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.3s ease;
}

.next-level-hint {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 24px;
}

.hint-title {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.hint-label {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: #64748b;
}

.missing-docs-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.875rem;
  color: #475569;
}

.missing-docs-list li {
  margin-bottom: 4px;
}

.documents-list {
  margin-bottom: 24px;
}

.documents-list h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.no-documents {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

.no-documents p {
  margin: 0;
}

.document-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-type {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.doc-status {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-verified {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.doc-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
}

.doc-link:hover {
  text-decoration: underline;
}

.upload-form {
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.upload-form h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-upload {
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 16px;
}

.btn-upload:hover {
  background: #1a3238;
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .btn-upload {
    width: auto;
  }

  .document-item {
    flex-direction: row;
  }

  .doc-info {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}

@media (min-width: 768px) {
  .verification-header {
    flex-direction: row;
  }
}
</style>
