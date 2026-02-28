<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t: _t } = useI18n()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient<any>()

const email = ref('')
const prefs = ref({
  web: false,
  press: false,
  newsletter: false,
  featured: false,
  events: false,
  csr: false,
})
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMsg = ref('')

function close() {
  emit('update:modelValue', false)
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) close()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

async function handleSubmit() {
  if (!email.value.trim()) return
  isSubmitting.value = true
  errorMsg.value = ''

  try {
    const { error } = await supabase.from('subscriptions').upsert({
      email: email.value.trim(),
      pref_web: prefs.value.web,
      pref_press: prefs.value.press,
      pref_newsletter: prefs.value.newsletter,
      pref_featured: prefs.value.featured,
      pref_events: prefs.value.events,
      pref_csr: prefs.value.csr,
    })

    if (error) throw error

    isSuccess.value = true
    setTimeout(() => {
      isSuccess.value = false
      close()
    }, 3000)
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdrop">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('subscribe.title') }}</h2>
            <button
              type="button"
              class="close-button"
              :aria-label="$t('common.close')"
              @click="close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div v-if="isSuccess" class="success-message">
            <div class="success-icon">✓</div>
            <h3>{{ $t('subscribe.successTitle') }}</h3>
            <p>{{ $t('subscribe.successMessage') }}</p>
          </div>

          <form v-else class="modal-body" @submit.prevent="handleSubmit">
            <p class="modal-subtitle">{{ $t('subscribe.subtitle') }}</p>

            <div class="form-group">
              <label for="sub-email">{{ $t('auth.email') }} *</label>
              <input
                id="sub-email"
                v-model="email"
                type="email"
                class="form-input"
                autocomplete="email"
                required
                placeholder="tu@email.com"
              >
            </div>

            <div class="prefs-group">
              <h3>{{ $t('subscribe.selectPrefs') }}</h3>
              <label class="checkbox-label">
                <input v-model="prefs.web" type="checkbox" >
                <span>{{ $t('subscribe.prefWeb') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="prefs.press" type="checkbox" >
                <span>{{ $t('subscribe.prefPress') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="prefs.newsletter" type="checkbox" >
                <span>{{ $t('subscribe.prefNewsletter') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="prefs.featured" type="checkbox" >
                <span>{{ $t('subscribe.prefFeatured') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="prefs.events" type="checkbox" >
                <span>{{ $t('subscribe.prefEvents') }}</span>
              </label>
              <label class="checkbox-label">
                <input v-model="prefs.csr" type="checkbox" >
                <span>{{ $t('subscribe.prefCsr') }}</span>
              </label>
            </div>

            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

            <button type="submit" class="btn-submit" :disabled="isSubmitting || !email.trim()">
              {{ isSubmitting ? $t('common.loading') : $t('subscribe.submit') }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.modal-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.prefs-group {
  margin-bottom: 20px;
}

.prefs-group h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-text {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message {
  padding: 48px 24px;
  text-align: center;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-message h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.success-message p {
  color: #666;
  font-size: 0.9rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-backdrop {
    align-items: center;
    padding: 24px;
  }

  .modal-container {
    max-width: 480px;
    border-radius: 12px;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.9);
  }
}
</style>
