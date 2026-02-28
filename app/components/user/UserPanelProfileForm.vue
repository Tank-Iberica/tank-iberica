<script setup lang="ts">
import type { ProfileFormData } from '~/composables/user/useUserPanel'

const props = defineProps<{
  initialData: ProfileFormData
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
}>()

const emit = defineEmits<{
  (e: 'save', data: ProfileFormData): void
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
      <input v-model="form.pseudonimo" type="text" >
    </div>
    <div class="form-field">
      <label>{{ t('user.fullName') }}</label>
      <div class="form-row">
        <input v-model="form.name" type="text" :placeholder="t('user.name')" >
        <input v-model="form.apellidos" type="text" :placeholder="t('user.surname')" >
      </div>
    </div>
    <div class="form-field">
      <label>{{ t('user.phone') }}</label>
      <input v-model="form.telefono" type="tel" placeholder="+34 600 000 000" >
    </div>
    <div class="form-field">
      <label>{{ t('user.email') }}</label>
      <input v-model="form.email" type="email" >
    </div>
    <button class="btn-primary" :disabled="saving" @click="emit('save', { ...form })">
      {{ saving ? '...' : t('user.saveChanges') }}
    </button>
    <div v-if="message" :class="['form-message', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.form-field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row input {
  flex: 1;
  min-width: 0;
}

.form-message {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.form-message.success {
  background: #dcfce7;
  color: #16a34a;
}

.form-message.error {
  background: #fee2e2;
  color: #dc2626;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary:disabled {
  opacity: 0.6;
}
</style>
