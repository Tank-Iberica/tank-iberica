<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">{{ $t('auth.login') }}</h1>
      <p class="auth-subtitle">{{ $t('auth.loginSubtitle') }}</p>

      <!-- Google OAuth -->
      <button class="btn-google" type="button" @click="handleGoogleLogin">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {{ $t('auth.loginWithGoogle') }}
      </button>

      <div class="divider">
        <span>{{ $t('auth.orContinueWith') }}</span>
      </div>

      <!-- Email form -->
      <form @submit="onSubmit">
        <div class="field">
          <label for="login-email">{{ $t('auth.email') }}</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            :placeholder="$t('auth.emailPlaceholder')"
            :aria-invalid="!!translatedErrors.email || undefined"
            :aria-describedby="translatedErrors.email ? 'error-login-email' : undefined"
          >
          <p v-if="translatedErrors.email" id="error-login-email" class="field-error" role="alert">
            {{ translatedErrors.email }}
          </p>
        </div>

        <div class="field">
          <label for="login-password">{{ $t('auth.password') }}</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            :placeholder="$t('auth.passwordPlaceholder')"
            :aria-invalid="!!translatedErrors.password || undefined"
            :aria-describedby="translatedErrors.password ? 'error-login-password' : undefined"
          >
          <p
            v-if="translatedErrors.password"
            id="error-login-password"
            class="field-error"
            role="alert"
          >
            {{ translatedErrors.password }}
          </p>
        </div>

        <p v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner" />
          {{ isSubmitting ? $t('common.loading') : $t('auth.login') }}
        </button>
      </form>

      <NuxtLink to="/auth/recuperar" class="forgot-link">
        {{ $t('auth.forgotPassword') }}
      </NuxtLink>

      <p class="toggle-mode">
        {{ $t('auth.noAccount') }}
        <NuxtLink to="/auth/registro" class="link-action">
          {{ $t('auth.register') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loginSchema } from '~/utils/schemas'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const auth = useAuth()
const errorMsg = ref('')

const { defineField, translatedErrors, isSubmitting, onSubmit } = useFormValidation(loginSchema, {
  initialValues: { email: '', password: '' },
  onSubmit: async (values) => {
    errorMsg.value = ''
    try {
      await auth.login(values.email, values.password)
      await auth.fetchProfile()

      const userType = auth.userType.value
      if (userType === 'admin') {
        await navigateTo('/admin')
      } else if (userType === 'dealer') {
        await navigateTo('/dashboard')
      } else {
        await navigateTo('/')
      }
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : t('common.error')
    }
  },
})

const [email] = defineField('email')
const [password] = defineField('password')

async function handleGoogleLogin() {
  await auth.loginWithGoogle()
}

useHead({
  title: t('auth.loginPageTitle'),
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

.field-error {
  color: var(--color-error);
  font-size: var(--font-size-xs);
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

/* Links */
.forgot-link {
  display: block;
  text-align: center;
  margin-top: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.forgot-link:hover {
  color: var(--color-primary);
}

.toggle-mode {
  text-align: center;
  margin-top: var(--spacing-6);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.link-action {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.link-action:hover {
  text-decoration: underline;
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
