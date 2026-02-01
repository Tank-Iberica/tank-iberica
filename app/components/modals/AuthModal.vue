<template>
  <Teleport to="body">
    <Transition name="auth-modal">
      <div v-if="modelValue" class="auth-backdrop" @click.self="close">
        <div class="auth-panel" role="dialog" :aria-label="$t('auth.login')">
          <button class="close-btn" :aria-label="$t('common.close')" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 class="auth-title">
            {{ mode === 'login' ? $t('auth.login') : $t('auth.register') }}
          </h2>

          <!-- Google OAuth -->
          <button class="btn-google" @click="loginWithGoogle">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {{ $t('auth.loginWithGoogle') }}
          </button>

          <div class="divider">
            <span>{{ $t('auth.orContinueWith') }}</span>
          </div>

          <!-- Email form -->
          <form @submit.prevent="handleSubmit">
            <div class="field">
              <label for="auth-email">{{ $t('auth.email') }}</label>
              <input
                id="auth-email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                :placeholder="$t('auth.email')"
              >
            </div>

            <div class="field">
              <label for="auth-password">{{ $t('auth.password') }}</label>
              <input
                id="auth-password"
                v-model="password"
                type="password"
                required
                autocomplete="current-password"
                :placeholder="$t('auth.password')"
                minlength="6"
              >
            </div>

            <div v-if="mode === 'register'" class="field">
              <label for="auth-confirm">{{ $t('auth.confirmPassword') }}</label>
              <input
                id="auth-confirm"
                v-model="confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                :placeholder="$t('auth.confirmPassword')"
                minlength="6"
              >
            </div>

            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? $t('common.loading') : (mode === 'login' ? $t('auth.login') : $t('auth.register')) }}
            </button>
          </form>

          <!-- Toggle mode -->
          <p class="toggle-mode">
            {{ mode === 'login' ? $t('auth.noAccount') : $t('auth.hasAccount') }}
            <button class="link-btn" @click="toggleMode">
              {{ mode === 'login' ? $t('auth.register') : $t('auth.login') }}
            </button>
          </p>

          <button v-if="mode === 'login'" class="link-btn forgot" @click="forgotPassword">
            {{ $t('auth.forgotPassword') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const supabase = useSupabaseClient()
const { t } = useI18n()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

function close() {
  emit('update:modelValue', false)
  errorMsg.value = ''
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  errorMsg.value = ''
}

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true

  try {
    if (mode.value === 'register') {
      if (password.value !== confirmPassword.value) {
        errorMsg.value = t('auth.passwordMismatch')
        return
      }
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      close()
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      close()
    }
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/confirm` },
  })
  if (error) {
    errorMsg.value = error.message
  }
}

async function forgotPassword() {
  if (!email.value) {
    errorMsg.value = t('auth.enterEmail')
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    errorMsg.value = ''
    close()
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Backdrop */
.auth-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

/* Panel: bottom sheet on mobile */
.auth-panel {
  background: var(--bg-primary);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-8);
  position: relative;
}

.close-btn {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  color: var(--text-auxiliary);
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-6);
  text-align: center;
}

/* Google button */
.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all var(--transition-fast);
  min-height: 48px;
}

.btn-google:hover {
  background: var(--bg-secondary);
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin: var(--spacing-6) 0;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color-light);
}

/* Form */
.field {
  margin-bottom: var(--spacing-4);
}

.field label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-1);
}

.field input {
  width: 100%;
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-primary {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: background var(--transition-fast);
  min-height: 48px;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toggle & forgot */
.toggle-mode {
  text-align: center;
  margin-top: var(--spacing-6);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.link-btn {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  min-height: auto;
  min-width: auto;
  font-size: inherit;
}

.forgot {
  display: block;
  margin: var(--spacing-4) auto 0;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Transitions */
.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity var(--transition-fast);
}

.auth-modal-enter-active .auth-panel,
.auth-modal-leave-active .auth-panel {
  transition: transform var(--transition-bounce);
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;
}

.auth-modal-enter-from .auth-panel {
  transform: translateY(100%);
}

.auth-modal-leave-to .auth-panel {
  transform: translateY(100%);
}

/* ---- Desktop (1024px): centered modal ---- */
@media (min-width: 1024px) {
  .auth-backdrop {
    align-items: center;
    justify-content: center;
  }

  .auth-panel {
    max-width: 440px;
    border-radius: var(--border-radius-xl);
    max-height: 85vh;
  }

  .auth-modal-enter-from .auth-panel {
    transform: translateY(20px);
  }

  .auth-modal-leave-to .auth-panel {
    transform: translateY(20px);
  }
}
</style>
