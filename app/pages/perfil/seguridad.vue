<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const { updatePassword, loading: authLoading } = useAuth()
const { deleteAccount, exportData, loading: profileLoading, error: profileError } = useUserProfile()

/** Password change form */
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref<string | null>(null)
const passwordSuccess = ref(false)
let passwordTimer: ReturnType<typeof setTimeout> | null = null

async function onChangePassword() {
  passwordError.value = null
  passwordSuccess.value = false
  if (passwordTimer) clearTimeout(passwordTimer)

  if (passwordForm.newPassword.length < 8) {
    passwordError.value = t('profile.security.passwordTooShort')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('auth.passwordMismatch')
    return
  }

  try {
    await updatePassword(passwordForm.newPassword)
    passwordSuccess.value = true
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordTimer = setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch {
    passwordError.value = t('profile.security.passwordError')
  }
}

/** Delete account */
const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const deleteError = ref<string | null>(null)

async function onDeleteAccount() {
  if (deleteConfirmText.value !== 'ELIMINAR') {
    deleteError.value = t('profile.security.deleteConfirmError')
    return
  }

  deleteError.value = null
  const success = await deleteAccount()

  if (success) {
    await navigateTo('/')
  } else {
    deleteError.value = profileError.value || t('profile.security.deleteError')
  }
}

/** Export data (GDPR) */
const exporting = ref(false)

async function onExportData() {
  exporting.value = true

  const data = await exportData()

  if (data) {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-data-tracciona.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  exporting.value = false
}

useHead({
  title: t('profile.security.title'),
})
</script>

<template>
  <div class="security-page">
    <div class="security-container">
      <h1 class="page-title">
        {{ $t('profile.security.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.security.subtitle') }}
      </p>

      <!-- Change password section -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.changePassword') }}</h2>

        <form class="password-form" @submit.prevent="onChangePassword">
          <div class="form-group">
            <label for="new_password" class="form-label">{{
              $t('profile.security.newPassword')
            }}</label>
            <input
              id="new_password"
              v-model="passwordForm.newPassword"
              type="password"
              class="form-input"
              :placeholder="$t('profile.security.newPasswordPlaceholder')"
              autocomplete="new-password"
              minlength="8"
              required
            >
          </div>

          <div class="form-group">
            <label for="confirm_password" class="form-label">{{
              $t('profile.security.confirmPassword')
            }}</label>
            <input
              id="confirm_password"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="form-input"
              :placeholder="$t('profile.security.confirmPasswordPlaceholder')"
              autocomplete="new-password"
              minlength="8"
              required
            >
          </div>

          <div v-if="passwordError" class="form-error" role="alert">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="form-success" role="status">
            {{ $t('profile.security.passwordChanged') }}
          </div>

          <button type="submit" class="btn-primary" :disabled="authLoading">
            {{ authLoading ? $t('common.loading') : $t('profile.security.changePasswordBtn') }}
          </button>
        </form>
      </section>

      <!-- Export data (GDPR) -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.exportDataTitle') }}</h2>
        <p class="section-desc">{{ $t('profile.security.exportDataDesc') }}</p>
        <button class="btn-outline" :disabled="exporting || profileLoading" @click="onExportData">
          {{ exporting ? $t('common.loading') : $t('profile.security.exportDataBtn') }}
        </button>
      </section>

      <!-- Delete account -->
      <section class="section-card section-card--danger">
        <h2 class="section-title section-title--danger">
          {{ $t('profile.security.deleteAccountTitle') }}
        </h2>
        <p class="section-desc">{{ $t('profile.security.deleteAccountWarning') }}</p>

        <button v-if="!showDeleteConfirm" class="btn-danger" @click="showDeleteConfirm = true">
          {{ $t('profile.security.deleteAccountBtn') }}
        </button>

        <div v-else class="delete-confirm">
          <p class="delete-instruction">{{ $t('profile.security.deleteConfirmInstruction') }}</p>
          <input
            v-model="deleteConfirmText"
            type="text"
            class="form-input"
            placeholder="ELIMINAR"
          >
          <div v-if="deleteError" class="form-error" role="alert">
            {{ deleteError }}
          </div>
          <div class="delete-actions">
            <button class="btn-danger" :disabled="profileLoading" @click="onDeleteAccount">
              {{ profileLoading ? $t('common.loading') : $t('profile.security.confirmDelete') }}
            </button>
            <button
              class="btn-ghost"
              @click="
                showDeleteConfirm = false
                deleteConfirmText = ''
                deleteError = null
              "
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.security-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.security-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Section cards */
.section-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1.25rem 1rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.section-card--danger {
  border-color: #fecaca;
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.section-title--danger {
  color: var(--color-error);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: 1rem;
  line-height: var(--line-height-normal);
}

/* Form */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: var(--font-size-base);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.form-error {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-success {
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  display: inline-block;
  padding: 0.625rem 1.25rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: transparent;
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-error);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  min-height: 44px;
}

.btn-ghost:hover {
  color: var(--text-primary);
}

/* Delete confirmation */
.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.delete-instruction {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.delete-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .security-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }

  .section-card {
    padding: 1.5rem;
  }

  .section-title {
    font-size: var(--font-size-lg);
  }

  .btn-primary {
    width: auto;
    align-self: flex-start;
  }
}
</style>
