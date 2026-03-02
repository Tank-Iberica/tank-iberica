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
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.admin-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.form-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 700px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
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
  width: 48px;
  height: 26px;
  background: #d1d5db;
  border-radius: 13px;
  transition: background 0.2s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
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
  color: #374151;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
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

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-card {
    padding: 16px;
  }
}
</style>
