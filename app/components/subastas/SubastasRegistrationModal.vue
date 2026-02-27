<template>
  <Teleport to="body">
    <div v-if="visible" class="reg-modal-backdrop" @click.self="$emit('close')">
      <div class="reg-modal" role="dialog" :aria-label="$t('auction.registrationTitle')">
        <div class="reg-modal-header">
          <h2 class="reg-modal-title">{{ $t('auction.registrationTitle') }}</h2>
          <button class="reg-modal-close" :aria-label="$t('auction.close')" @click="$emit('close')">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form class="reg-form" @submit.prevent="onSubmit">
          <!-- ID type -->
          <div class="form-group">
            <label for="reg-id-type" class="form-label">{{ $t('auction.idType') }}</label>
            <select id="reg-id-type" v-model="localForm.id_type" class="form-select">
              <option value="dni">DNI</option>
              <option value="nie">NIE</option>
              <option value="cif">CIF</option>
              <option value="passport">{{ $t('auction.passport') }}</option>
            </select>
          </div>

          <!-- ID number -->
          <div class="form-group">
            <label for="reg-id-number" class="form-label">{{ $t('auction.idNumber') }}</label>
            <input
              id="reg-id-number"
              v-model="localForm.id_number"
              type="text"
              class="form-input"
              :placeholder="$t('auction.idNumberPlaceholder')"
              required
            >
          </div>

          <!-- ID document upload -->
          <div class="form-group">
            <label for="reg-id-doc" class="form-label">{{ $t('auction.idDocument') }}</label>
            <div class="file-upload-wrapper">
              <input
                id="reg-id-doc"
                type="file"
                accept="image/*,.pdf"
                class="file-input"
                @change="$emit('upload-id-doc', $event)"
              >
              <div class="file-upload-label">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span v-if="idDocumentUrl">{{ $t('auction.documentUploaded') }}</span>
                <span v-else>{{ $t('auction.uploadDocument') }}</span>
              </div>
            </div>
          </div>

          <!-- Company name (shown only for CIF) -->
          <div v-if="localForm.id_type === 'cif'" class="form-group">
            <label for="reg-company" class="form-label">{{ $t('auction.companyName') }}</label>
            <input
              id="reg-company"
              v-model="localForm.company_name"
              type="text"
              class="form-input"
              :placeholder="$t('auction.companyNamePlaceholder')"
            >
          </div>

          <!-- Transport license (optional) -->
          <div class="form-group">
            <label for="reg-transport-license" class="form-label">
              {{ $t('auction.transportLicense') }}
              <span class="form-optional">{{ $t('auction.optional') }}</span>
            </label>
            <div class="file-upload-wrapper">
              <input
                id="reg-transport-license"
                type="file"
                accept="image/*,.pdf"
                class="file-input"
                @change="$emit('upload-transport-license', $event)"
              >
              <div class="file-upload-label">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span v-if="transportLicenseUrl">{{ $t('auction.documentUploaded') }}</span>
                <span v-else>{{ $t('auction.uploadDocument') }}</span>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-submit-reg" :disabled="!localForm.id_number.trim()">
            {{ $t('auction.submitRegistration') }}
          </button>

          <p class="reg-form-disclaimer">
            {{ $t('auction.registrationDisclaimer') }}
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { IdType, RegistrationFormData } from '~/composables/useAuctionRegistration'

const props = defineProps<{
  visible: boolean
  idDocumentUrl: string | null
  transportLicenseUrl: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: RegistrationFormData): void
  (e: 'upload-id-doc' | 'upload-transport-license', event: Event): void
}>()

const localForm = ref({
  id_type: 'dni' as IdType,
  id_number: '',
  company_name: null as string | null,
})

function onSubmit() {
  if (!localForm.value.id_number.trim()) return
  emit('submit', {
    id_type: localForm.value.id_type,
    id_number: localForm.value.id_number,
    id_document_url: props.idDocumentUrl,
    company_name: localForm.value.company_name,
    transport_license_url: props.transportLicenseUrl,
  })
}
</script>

<style scoped>
.reg-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.reg-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-8);
  z-index: var(--z-modal);
  animation: modal-slide-up 0.3s ease;
}

@keyframes modal-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.reg-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.reg-modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.reg-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-full);
  color: var(--text-auxiliary);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.reg-modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* ---- Registration form ---- */
.reg-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.form-optional {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-normal);
}

.form-input {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-select {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* File upload */
.file-upload-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  min-height: 48px;
}

.file-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.file-upload-wrapper:hover .file-upload-label {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.04);
}

/* Submit button */
.btn-submit-reg {
  width: 100%;
  min-height: 52px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  margin-top: var(--spacing-2);
}

.btn-submit-reg:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-submit-reg:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-submit-reg:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reg-form-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  text-align: center;
}

/* ---- Tablet+ centered modal ---- */
@media (min-width: 768px) {
  .reg-modal-backdrop {
    align-items: center;
    padding: var(--spacing-4);
  }

  .reg-modal {
    border-radius: var(--border-radius-lg);
    max-width: 520px;
    padding: var(--spacing-8) var(--spacing-6);
    animation: modal-fade-in 0.3s ease;
  }

  @keyframes modal-fade-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}
</style>
