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
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 class="success-title">{{ $t('auth.resetSentTitle') }}</h2>
        <p class="success-message">{{ $t('auth.resetSentMessage') }}</p>
        <NuxtLink to="/auth/login" class="btn-primary">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <!-- Reset form -->
      <template v-else>
        <NuxtLink to="/auth/login" class="back-link">
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {{ $t('auth.backToLogin') }}
        </NuxtLink>

        <h1 class="auth-title">{{ $t('auth.resetPasswordTitle') }}</h1>
        <p class="auth-subtitle">{{ $t('auth.resetPasswordSubtitle') }}</p>

        <form @submit.prevent="handleReset">
          <div class="field">
            <label for="reset-email">{{ $t('auth.email') }}</label>
            <input
              id="reset-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              :placeholder="$t('auth.emailPlaceholder')"
            >
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner" />
            {{ loading ? $t('common.loading') : $t('auth.sendResetLink') }}
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

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)

async function handleReset() {
  errorMsg.value = ''

  if (!email.value) {
    errorMsg.value = t('auth.enterEmail')
    return
  }

  loading.value = true

  try {
    await auth.resetPassword(email.value)
    success.value = true
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

useHead({
  title: t('auth.resetPasswordPageTitle'),
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

/* Back link */
.back-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-6);
  min-height: 44px;
}

.back-link:hover {
  color: var(--color-primary);
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
  color: var(--color-primary);
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
