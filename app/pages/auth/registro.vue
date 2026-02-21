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
      <template v-else-if="step === 1">
        <h1 class="auth-title">{{ $t('auth.register') }}</h1>
        <p class="auth-subtitle">{{ $t('auth.registerSubtitle') }}</p>

        <div class="type-cards">
          <button
            class="type-card"
            :class="{ active: selectedType === 'buyer' }"
            @click="selectType('buyer')"
          >
            <div class="type-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 class="type-label">{{ $t('auth.typeBuyer') }}</h3>
            <p class="type-desc">{{ $t('auth.typeBuyerDesc') }}</p>
          </button>

          <button
            class="type-card"
            :class="{ active: selectedType === 'dealer' }"
            @click="selectType('dealer')"
          >
            <div class="type-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3 class="type-label">{{ $t('auth.typeDealer') }}</h3>
            <p class="type-desc">{{ $t('auth.typeDealerDesc') }}</p>
          </button>
        </div>
      </template>

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

        <form @submit.prevent="handleRegister">
          <div class="field">
            <label for="reg-name">{{ $t('auth.fullName') }}</label>
            <input
              id="reg-name"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              :placeholder="$t('auth.fullNamePlaceholder')"
            >
          </div>

          <!-- Dealer-only fields -->
          <template v-if="selectedType === 'dealer'">
            <div class="field">
              <label for="reg-company">{{ $t('auth.companyName') }}</label>
              <input
                id="reg-company"
                v-model="form.companyName"
                type="text"
                required
                autocomplete="organization"
                :placeholder="$t('auth.companyNamePlaceholder')"
              >
            </div>

            <div class="field">
              <label for="reg-cif">{{ $t('auth.taxId') }}</label>
              <input
                id="reg-cif"
                v-model="form.taxId"
                type="text"
                required
                :placeholder="$t('auth.taxIdPlaceholder')"
              >
            </div>

            <div class="field">
              <label for="reg-phone">{{ $t('auth.phone') }}</label>
              <input
                id="reg-phone"
                v-model="form.phone"
                type="tel"
                required
                autocomplete="tel"
                :placeholder="$t('auth.phonePlaceholder')"
              >
            </div>
          </template>

          <div class="field">
            <label for="reg-email">{{ $t('auth.email') }}</label>
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              :placeholder="$t('auth.emailPlaceholder')"
            >
          </div>

          <div class="field">
            <label for="reg-password">{{ $t('auth.password') }}</label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              required
              autocomplete="new-password"
              :placeholder="$t('auth.passwordPlaceholder')"
              minlength="6"
            >
            <span class="field-hint">{{ $t('auth.passwordHint') }}</span>
          </div>

          <div class="field">
            <label for="reg-confirm">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="reg-confirm"
              v-model="form.confirmPassword"
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
            {{ loading ? $t('common.loading') : $t('auth.register') }}
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

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const auth = useAuth()

const step = ref(1)
const selectedType = ref<UserType>('buyer')
const success = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  name: '',
  companyName: '',
  taxId: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function selectType(type: UserType) {
  selectedType.value = type
  step.value = 2
}

async function handleRegister() {
  errorMsg.value = ''

  if (form.password !== form.confirmPassword) {
    errorMsg.value = t('auth.passwordMismatch')
    return
  }

  if (form.password.length < 6) {
    errorMsg.value = t('auth.passwordTooShort')
    return
  }

  loading.value = true

  try {
    await auth.register(form.email, form.password, {
      full_name: form.name,
      user_type: selectedType.value,
      company_name: selectedType.value === 'dealer' ? form.companyName : undefined,
      phone: selectedType.value === 'dealer' ? form.phone : undefined,
    })
    success.value = true
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    loading.value = false
  }
}

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

.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  text-align: center;
  margin-bottom: var(--spacing-8);
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

/* Type selection cards */
.type-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: center;
  transition: all var(--transition-fast);
  min-height: 44px;
}

.type-card:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.type-card.active {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.05);
}

.type-icon {
  color: var(--color-primary);
  margin-bottom: var(--spacing-1);
}

.type-label {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.type-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
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

  .type-cards {
    flex-direction: row;
  }

  .type-card {
    flex: 1;
  }
}
</style>
