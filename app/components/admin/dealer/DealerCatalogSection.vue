<script setup lang="ts">
import type {
  Certification,
  IconOption,
  SelectOption,
  CatalogSortOption,
} from '~/composables/admin/useAdminDealerConfig'

const props = defineProps<{
  certifications: Certification[]
  catalogSort: CatalogSortOption
  pinnedVehicles: string[]
  newPinnedUuid: string
  autoReplyMessage: Record<string, string>
  iconOptions: IconOption[]
  sortOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:catalogSort': [value: CatalogSortOption]
  'update:newPinnedUuid': [value: string]
  'update:autoReplyMessage': [value: Record<string, string>]
  addCertification: []
  removeCertification: [id: string]
  updateCertificationIcon: [id: string, icon: Certification['icon']]
  updateCertificationVerified: [id: string, verified: boolean]
  updateCertificationLabel: [id: string, lang: string, value: string]
  addPinnedVehicle: []
  removePinnedVehicle: [uuid: string]
}>()

function updateAutoReplyLang(lang: string, value: string) {
  emit('update:autoReplyMessage', { ...props.autoReplyMessage, [lang]: value })
}
</script>

<template>
  <!-- SECTION 6: CERTIFICACIONES -->
  <div class="config-card">
    <h3 class="card-title">{{ $t('admin.dealer.certificationsTitle') }}</h3>
    <p class="card-subtitle">
      {{ $t('admin.dealer.certificationsSubtitle') }}
    </p>

    <div v-if="certifications.length === 0" class="empty-list">
      {{ $t('admin.dealer.noCertifications') }}
    </div>

    <div v-for="cert in certifications" :key="cert.id" class="cert-item">
      <div class="cert-header">
        <div class="cert-controls">
          <select
            :value="cert.icon"
            class="cert-icon-select"
            @change="
              emit(
                'updateCertificationIcon',
                cert.id,
                ($event.target as HTMLSelectElement).value as Certification['icon'],
              )
            "
          >
            <option v-for="ico in iconOptions" :key="ico.value" :value="ico.value">
              {{ ico.label }}
            </option>
          </select>
          <label class="cert-verified">
            <input
              :checked="cert.verified"
              type="checkbox"
              @change="
                emit(
                  'updateCertificationVerified',
                  cert.id,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            >
            {{ $t('admin.dealer.verified') }}
          </label>
        </div>
        <button
          class="btn-remove"
          :title="$t('admin.dealer.deleteCertification')"
          @click="emit('removeCertification', cert.id)"
        >
          {{ $t('common.delete') }}
        </button>
      </div>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="cert.label.es"
            type="text"
            :placeholder="$t('admin.dealer.certLabelPlaceholderEs')"
            @input="
              emit(
                'updateCertificationLabel',
                cert.id,
                'es',
                ($event.target as HTMLInputElement).value,
              )
            "
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="cert.label.en"
            type="text"
            :placeholder="$t('admin.dealer.certLabelPlaceholderEn')"
            @input="
              emit(
                'updateCertificationLabel',
                cert.id,
                'en',
                ($event.target as HTMLInputElement).value,
              )
            "
          >
        </div>
      </div>
    </div>

    <button class="btn-add-item" @click="emit('addCertification')">+ {{ $t('admin.dealer.addCertification') }}</button>
  </div>

  <!-- SECTION 7: CATALOGO -->
  <div class="config-card">
    <h3 class="card-title">{{ $t('admin.dealer.catalogTitle') }}</h3>
    <p class="card-subtitle">{{ $t('admin.dealer.catalogSubtitle') }}</p>

    <div class="form-group">
      <label for="catalog-sort">{{ $t('admin.dealer.defaultSort') }}</label>
      <select
        id="catalog-sort"
        :value="catalogSort"
        @change="
          emit(
            'update:catalogSort',
            ($event.target as HTMLSelectElement).value as CatalogSortOption,
          )
        "
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>{{ $t('admin.dealer.pinnedVehicles') }}</label>
      <div v-if="pinnedVehicles.length === 0" class="empty-list">{{ $t('admin.dealer.noPinnedVehicles') }}</div>
      <div v-for="uuid in pinnedVehicles" :key="uuid" class="pinned-item">
        <span class="pinned-uuid">{{ uuid }}</span>
        <button
          class="btn-remove-sm"
          :title="$t('admin.dealer.removePinned')"
          @click="emit('removePinnedVehicle', uuid)"
        >
          {{ $t('admin.dealer.removePinned') }}
        </button>
      </div>
      <div class="pin-input-row">
        <input
          :value="newPinnedUuid"
          type="text"
          :placeholder="$t('admin.dealer.pinVehiclePlaceholder')"
          @input="emit('update:newPinnedUuid', ($event.target as HTMLInputElement).value)"
          @keyup.enter="emit('addPinnedVehicle')"
        >
        <button class="btn-add-inline" @click="emit('addPinnedVehicle')">{{ $t('admin.dealer.pinVehicle') }}</button>
      </div>
    </div>
  </div>

  <!-- SECTION 8: RESPUESTA AUTOMATICA -->
  <div class="config-card">
    <h3 class="card-title">{{ $t('admin.dealer.autoReplyTitle') }}</h3>
    <p class="card-subtitle">{{ $t('admin.dealer.autoReplySubtitle') }}</p>

    <div class="form-group">
      <div class="lang-col">
        <div class="lang-field-block">
          <span class="lang-badge">ES</span>
          <textarea
            :value="autoReplyMessage.es"
            rows="3"
            placeholder="Gracias por tu interes. Nos pondremos en contacto contigo lo antes posible."
            @input="updateAutoReplyLang('es', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="lang-field-block">
          <span class="lang-badge">EN</span>
          <textarea
            :value="autoReplyMessage.en"
            rows="3"
            placeholder="Thank you for your interest. We will get back to you as soon as possible."
            @input="updateAutoReplyLang('en', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
}

.form-group select {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 2.75rem;
}

.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Language rows */
.lang-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.lang-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.lang-badge {
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Language column layout for textareas */
.lang-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.lang-field-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.lang-field-block .lang-badge {
  align-self: flex-start;
}

.lang-field-block textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  resize: vertical;
  min-height: 5rem;
  font-family: var(--font-family);
}

.lang-field-block textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Certifications */
.empty-list {
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.cert-item {
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.cert-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.cert-icon-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
  background: var(--bg-primary);
}

.cert-verified {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 2.75rem;
}

.cert-verified input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.btn-remove {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-height: 2.75rem;
}

.btn-remove:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.btn-add-item {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  width: 100%;
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.btn-add-item:hover {
  background: var(--color-primary-dark);
}

/* Pinned vehicles */
.pinned-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-2);
}

.pinned-uuid {
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: var(--spacing-2);
}

.btn-remove-sm {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: none;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  min-height: 2.75rem;
}

.btn-remove-sm:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.pin-input-row {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.pin-input-row input {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: monospace;
  min-height: 2.75rem;
}

.pin-input-row input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-add-inline {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.btn-add-inline:hover {
  background: var(--color-primary-dark);
}

/* Responsive: 48em */
@media (min-width: 48em) {
  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }

  .config-card {
    padding: var(--spacing-6);
  }
}

/* Responsive: 64em */
@media (min-width: 64em) {
  .config-card {
    padding: var(--spacing-8);
  }
}
</style>
