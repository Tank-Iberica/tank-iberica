<script setup lang="ts">
import type { ProfileFormData } from '~/composables/user/useUserPanel'

const props = defineProps<{
  initialData: ProfileFormData
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
}>()

const emit = defineEmits<{
  save: [data: ProfileFormData]
}>()

const { t } = useI18n()

const form = reactive({ ...props.initialData })

watch(
  () => props.initialData,
  (newData) => Object.assign(form, newData),
  { deep: true },
)
</script>

<template>
  <div>
    <div class="form-field">
      <label>{{ t('user.pseudonym') }}</label>
      <input v-model="form.pseudonimo" type="text" autocomplete="username" >
    </div>
    <div class="form-field">
      <label>{{ t('user.fullName') }}</label>
      <div class="form-row">
        <input v-model="form.name" type="text" :placeholder="t('user.name')" autocomplete="given-name" >
        <input v-model="form.apellidos" type="text" :placeholder="t('user.surname')" autocomplete="family-name" >
      </div>
    </div>
    <div class="form-field">
      <label>{{ t('user.phone') }}</label>
      <input v-model="form.telefono" type="tel" :placeholder="t('user.phonePlaceholder')" autocomplete="tel" >
    </div>
    <div class="form-field">
      <label>{{ t('user.email') }}</label>
      <input v-model="form.email" type="email" autocomplete="email" >
    </div>
    <button class="btn-primary" :disabled="saving" @click="emit('save', { ...form })">
      {{ saving ? t('common.saving') : t('user.saveChanges') }}
    </button>
    <div v-if="message" :class="['form-message', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.375rem;
}

.form-field input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.form-row {
  display: flex;
  gap: 0.5rem;
}

.form-row input {
  flex: 1;
  min-width: 0;
}

.form-message {
  margin-top: 0.75rem;
  padding: 0.625rem;
  border-radius: var(--border-radius);
  font-size: 0.85rem;
}

.form-message.success {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.form-message.error {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
}

.btn-primary:disabled {
  opacity: 0.6;
}
</style>
