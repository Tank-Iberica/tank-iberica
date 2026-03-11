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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group select,
.form-group input[type='file'] {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
}

.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.alert-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.alert-success {
  padding: 0.75rem 1rem;
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
}

/* Verification Section */
.verification-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-xl);
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
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  font-weight: 500;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-value {
  color: var(--color-primary);
  font-weight: 700;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success), var(--color-info));
  transition: width 0.3s ease;
}

.next-level-hint {
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
}

.hint-title {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.hint-label {
  margin: 0 0 0.5rem 0;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.missing-docs-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.missing-docs-list li {
  margin-bottom: 0.25rem;
}

.documents-list {
  margin-bottom: 1.5rem;
}

.documents-list h3 {
  margin: 0 0 0.75rem 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.no-documents {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px dashed var(--color-gray-200);
}

.no-documents p {
  margin: 0;
}

.document-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
}

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.doc-type {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.doc-status {
  font-size: var(--font-size-sm);
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
  width: fit-content;
}

.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-verified {
  background: var(--color-emerald-100);
  color: var(--color-success-text);
}

.status-rejected {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.doc-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  min-height: 2.25rem;
  display: inline-flex;
  align-items: center;
  padding: 0 0.75rem;
}

.doc-link:hover {
  text-decoration: underline;
}

.upload-form {
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-gray-200);
}

.upload-form h3 {
  margin: 0 0 1rem 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.btn-upload {
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
}

.btn-upload:hover {
  background: var(--color-primary-dark);
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 30em) {
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
    gap: 0.75rem;
  }
}

@media (min-width: 48em) {
  .verification-header {
    flex-direction: row;
  }
}
</style>
