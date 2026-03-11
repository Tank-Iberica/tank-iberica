<script setup lang="ts">
import type { UserPanelBannerForm } from '~/composables/admin/useAdminBanner'

const props = defineProps<{
  form: UserPanelBannerForm
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'update-field', key: keyof UserPanelBannerForm, value: string | boolean | null): void
}>()
</script>

<template>
  <div class="user-panel-banner-section">
    <div class="section-header">
      <h2>{{ $t('admin.banner.userPanelTitle') }}</h2>
    </div>
    <p class="admin-hint">{{ $t('admin.banner.userPanelHint') }}</p>

    <div class="form-card">
      <div class="form-group">
        <label>{{ $t('admin.banner.textEs') }}</label>
        <input
          type="text"
          class="form-input"
          :value="props.form.text_es"
          @input="emit('update-field', 'text_es', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>{{ $t('admin.banner.textEn') }}</label>
        <input
          type="text"
          class="form-input"
          :value="props.form.text_en"
          @input="emit('update-field', 'text_en', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>{{ $t('admin.banner.url') }}</label>
        <input
          type="url"
          class="form-input"
          :value="props.form.url"
          @input="emit('update-field', 'url', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>{{ $t('admin.banner.fromDate') }}</label>
          <input
            type="date"
            class="form-input"
            :value="props.form.from_date ?? ''"
            @input="
              emit('update-field', 'from_date', ($event.target as HTMLInputElement).value || null)
            "
          >
        </div>
        <div class="form-group">
          <label>{{ $t('admin.banner.toDate') }}</label>
          <input
            type="date"
            class="form-input"
            :value="props.form.to_date ?? ''"
            @input="
              emit('update-field', 'to_date', ($event.target as HTMLInputElement).value || null)
            "
          >
        </div>
      </div>
      <div class="form-group">
        <label class="toggle-label">
          <input
            type="checkbox"
            class="toggle-input"
            :checked="props.form.active"
            @change="emit('update-field', 'active', ($event.target as HTMLInputElement).checked)"
          >
          <span class="toggle-switch" />
          <span class="toggle-text">{{ $t('admin.banner.active') }}</span>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn-primary" :disabled="props.saving" @click="emit('save')">
          {{ props.saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-panel-banner-section {
  margin-top: var(--spacing-10);
  padding-top: var(--spacing-8);
  border-top: 2px solid var(--color-gray-200);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.admin-hint {
  font-size: 0.85rem;
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-5);
}

.form-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  max-width: 43.75rem;
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
}

.form-input {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  width: 3rem;
  height: 1.625rem;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-md);
  transition: background 0.2s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--bg-primary);
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: var(--color-success);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 48em) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-card {
    padding: var(--spacing-4);
  }
}
</style>
