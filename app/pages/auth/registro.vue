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
        <h2 class="success-title">{{ $t('auth.registerSuccessTitle') }}</h2>
        <p class="success-message">{{ $t('auth.registerSuccessMessage') }}</p>
        <NuxtLink to="/auth/login" class="btn-primary">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <!-- Step 1: Choose user type -->
      <RegistroTypeSelector
        v-else-if="step === 1"
        :selected-type="selectedType"
        @select="
          (type) => {
            selectedType = type
            step = 2
          }
        "
      />

      <!-- Step 2: Registration form -->
      <template v-else>
        <button class="back-btn" type="button" @click="step = 1">
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
          {{ $t('common.back') }}
        </button>

        <h1 class="auth-title">
          {{ selectedType === 'buyer' ? $t('auth.registerAsBuyer') : $t('auth.registerAsDealer') }}
        </h1>

        <form @submit="onSubmit">
          <div class="field">
            <label for="reg-name">{{ $t('auth.fullName') }}</label>
            <input
              id="reg-name"
              v-model="fullName"
              type="text"
              autocomplete="name"
              :placeholder="$t('auth.fullNamePlaceholder')"
              :aria-invalid="!!translatedErrors.fullName || undefined"
            >
            <p v-if="translatedErrors.fullName" class="field-error" role="alert">
              {{ translatedErrors.fullName }}
            </p>
          </div>

          <!-- Dealer-only fields -->
          <template v-if="selectedType === 'dealer'">
            <div class="field">
              <label for="reg-company">{{ $t('auth.companyName') }}</label>
              <input
                id="reg-company"
                v-model="companyName"
                type="text"
                autocomplete="organization"
                :placeholder="$t('auth.companyNamePlaceholder')"
              >
            </div>

            <div class="field">
              <label for="reg-cif">{{ $t('auth.taxId') }}</label>
              <input
                id="reg-cif"
                v-model="taxId"
                type="text"
                :placeholder="$t('auth.taxIdPlaceholder')"
              >
            </div>

            <div class="field">
              <label for="reg-phone">{{ $t('auth.phone') }}</label>
              <input
                id="reg-phone"
                v-model="phone"
                type="tel"
                autocomplete="tel"
                :placeholder="$t('auth.phonePlaceholder')"
                :aria-invalid="!!translatedErrors.phone || undefined"
              >
              <p v-if="translatedErrors.phone" class="field-error" role="alert">
                {{ translatedErrors.phone }}
              </p>
            </div>
          </template>

          <div class="field">
            <label for="reg-email">{{ $t('auth.email') }}</label>
            <input
              id="reg-email"
              v-model="regEmail"
              type="email"
              autocomplete="email"
              :placeholder="$t('auth.emailPlaceholder')"
              :aria-invalid="!!translatedErrors.email || undefined"
              :aria-describedby="translatedErrors.email ? 'error-reg-email' : undefined"
            >
            <p v-if="translatedErrors.email" id="error-reg-email" class="field-error" role="alert">
              {{ translatedErrors.email }}
            </p>
          </div>

          <div class="field">
            <label for="reg-password">{{ $t('auth.password') }}</label>
            <input
              id="reg-password"
              v-model="regPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="$t('auth.passwordPlaceholder')"
              :aria-invalid="!!translatedErrors.password || undefined"
              :aria-describedby="translatedErrors.password ? 'error-reg-password' : undefined"
            >
            <p
              v-if="translatedErrors.password"
              id="error-reg-password"
              class="field-error"
              role="alert"
            >
              {{ translatedErrors.password }}
            </p>
            <span v-else class="field-hint">{{ $t('auth.passwordHint') }}</span>
          </div>

          <div class="field">
            <label for="reg-confirm">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="reg-confirm"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="$t('auth.confirmPasswordPlaceholder')"
              :aria-invalid="!!translatedErrors.confirmPassword || undefined"
              :aria-describedby="translatedErrors.confirmPassword ? 'error-reg-confirm' : undefined"
            >
            <p
              v-if="translatedErrors.confirmPassword"
              id="error-reg-confirm"
              class="field-error"
              role="alert"
            >
              {{ translatedErrors.confirmPassword }}
            </p>
          </div>

          <p v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</p>

          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner" />
            {{ isSubmitting ? $t('common.loading') : $t('auth.register') }}
          </button>
        </form>

        <p class="toggle-mode">
          {{ $t('auth.hasAccount') }}
          <NuxtLink to="/auth/login" class="link-action">
            {{ $t('auth.login') }}
          </NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserType } from '~/composables/useAuth'
import { registerSchema } from '~/utils/schemas'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const auth = useAuth()

const step = ref(1)
const selectedType = ref<UserType>('buyer')
const success = ref(false)
const errorMsg = ref('')

const { defineField, translatedErrors, isSubmitting, onSubmit } = useFormValidation(
  registerSchema,
  {
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      taxId: '',
      phone: '',
    },
    onSubmit: async (values) => {
      errorMsg.value = ''
      try {
        await auth.register(values.email, values.password, {
          full_name: values.fullName,
          user_type: selectedType.value,
          company_name: selectedType.value === 'dealer' ? values.companyName : undefined,
          phone: selectedType.value === 'dealer' ? values.phone : undefined,
        })
        success.value = true
      } catch (err: unknown) {
        errorMsg.value = err instanceof Error ? err.message : t('common.error')
      }
    },
  },
)

const [fullName] = defineField('fullName')
const [regEmail] = defineField('email')
const [regPassword] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')
const [companyName] = defineField('companyName')
const [taxId] = defineField('taxId')
const [phone] = defineField('phone')

useHead({
  title: t('auth.registerPageTitle'),
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

/* Back button */
.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-4);
  min-height: 44px;
  min-width: 44px;
}

.back-btn:hover {
  color: var(--color-primary);
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
}

/* Links */
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
