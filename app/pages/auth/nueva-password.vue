<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Success state -->
      <div v-if="success" class="success-state">
        <div class="success-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 class="success-title">{{ $t('auth.newPasswordSuccessTitle') }}</h2>
        <p class="success-message">{{ $t('auth.newPasswordSuccessMessage') }}</p>
        <p class="redirect-notice">
          {{ $t('auth.redirectingIn', { seconds: countdown }) }}
        </p>
        <NuxtLink to="/auth/login" class="btn-primary">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <!-- New password form -->
      <template v-else>
        <h1 class="auth-title">{{ $t('auth.newPasswordTitle') }}</h1>
        <p class="auth-subtitle">{{ $t('auth.newPasswordSubtitle') }}</p>

        <form @submit.prevent="handleUpdatePassword">
          <div class="field">
            <label for="new-password">{{ $t('auth.newPassword') }}</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              required
              autocomplete="new-password"
              :placeholder="$t('auth.newPasswordPlaceholder')"
              minlength="6"
            >
            <span class="field-hint">{{ $t('auth.passwordHint') }}</span>
          </div>

          <div class="field">
            <label for="confirm-new-password">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="confirm-new-password"
              v-model="confirmNewPassword"
              type="password"
              required
              autocomplete="new-password"
              :placeholder="$t('auth.confirmPasswordPlaceholder')"
              minlength="6"
            >
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner" />
            {{ loading ? $t('common.loading') : $t('auth.updatePassword') }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const auth = useAuth()

const newPassword = ref('')
const confirmNewPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)
const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

async function handleUpdatePassword() {
  errorMsg.value = ''

  if (newPassword.value !== confirmNewPassword.value) {
    errorMsg.value = t('auth.passwordMismatch')
    return
  }

  if (newPassword.value.length < 6) {
    errorMsg.value = t('auth.passwordTooShort')
    return
  }

  loading.value = true

  try {
    await auth.updatePassword(newPassword.value)
    success.value = true
    startRedirectCountdown()
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

function startRedirectCountdown() {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      navigateTo('/auth/login')
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

useHead({
  title: t('auth.newPasswordPageTitle'),
})
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - var(--header-height) - 80px);
  padding: var(--spacing-6) var(--spacing-4);
}

.auth-card {
  background: var(--bg-primary);
  width: 100%;
  max-width: 440px;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8) var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.auth-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--spacing-2);
}

.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  margin-bottom: var(--spacing-6);
  line-height: var(--line-height-relaxed);
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

.field-hint {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-1);
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: background var(--transition-fast);
  min-height: 48px;
  text-decoration: none;
  text-align: center;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-white);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Success state */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) 0;
}

.success-icon {
  color: var(--color-success);
}

.success-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.success-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 320px;
  line-height: var(--line-height-relaxed);
}

.redirect-notice {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Desktop */
@media (min-width: 768px) {
  .auth-page {
    align-items: center;
    padding: var(--spacing-12) var(--spacing-4);
  }

  .auth-card {
    padding: var(--spacing-10) var(--spacing-8);
  }
}
</style>
