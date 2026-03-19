<script setup lang="ts">
import { changePasswordSchema, deleteAccountSchema } from '~/utils/schemas'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const { updatePassword, logoutAll, loading: authLoading } = useAuth()
const { deleteAccount, exportData, loading: profileLoading, error: profileError } = useUserProfile()
const {
  sessions: activeSessions,
  loading: sessionsLoading,
  fetchSessions,
  removeSession,
} = useActiveSessions()
const {
  status: mfaStatus,
  loading: mfaLoading,
  qrCodeUri,
  enroll,
  verify,
  unenroll,
  checkStatus,
} = useMfa()

/** MFA state */
const mfaCode = ref('')
const mfaError = ref<string | null>(null)
const showMfaSetup = ref(false)

onMounted(() => {
  void checkStatus()
  void fetchSessions()
})

async function onEnrollMfa() {
  mfaError.value = null
  const result = await enroll()
  if (result) {
    showMfaSetup.value = true
  } else {
    mfaError.value = t('profile.security.mfaVerifyError')
  }
}

async function onVerifyMfa() {
  mfaError.value = null
  if (mfaCode.value.length !== 6) {
    mfaError.value = t('profile.security.mfaVerifyError')
    return
  }
  const ok = await verify(mfaCode.value)
  if (ok) {
    showMfaSetup.value = false
    mfaCode.value = ''
  } else {
    mfaError.value = t('profile.security.mfaVerifyError')
  }
}

async function onDisableMfa() {
  mfaError.value = null
  const ok = await unenroll()
  if (!ok) mfaError.value = t('profile.security.mfaVerifyError')
}

/** Password change form — Zod validated */
const passwordError = ref<string | null>(null)
const passwordSuccess = ref(false)
let passwordTimer: ReturnType<typeof setTimeout> | null = null

const {
  defineField: definePasswordField,
  translatedErrors: passwordErrors,
  isSubmitting: passwordSubmitting,
  onSubmit: onPasswordSubmit,
  resetForm: resetPasswordForm,
} = useFormValidation(changePasswordSchema, {
  initialValues: { newPassword: '', confirmPassword: '' },
  onSubmit: async (values) => {
    passwordError.value = null
    passwordSuccess.value = false
    if (passwordTimer) clearTimeout(passwordTimer)

    try {
      await updatePassword(values.newPassword)
      passwordSuccess.value = true
      resetPasswordForm()
      passwordTimer = setTimeout(() => {
        passwordSuccess.value = false
      }, 3000)
    } catch {
      passwordError.value = t('profile.security.passwordError')
    }
  },
})

const [pwNewPassword] = definePasswordField('newPassword')
const [pwConfirmPassword] = definePasswordField('confirmPassword')

/** Delete account — Zod validated */
const showDeleteConfirm = ref(false)
const deleteError = ref<string | null>(null)

const {
  defineField: defineDeleteField,
  translatedErrors: deleteErrors,
  onSubmit: onDeleteSubmit,
  resetForm: resetDeleteForm,
} = useFormValidation(deleteAccountSchema, {
  initialValues: { confirmation: '' as unknown as 'ELIMINAR' },
  onSubmit: async () => {
    deleteError.value = null
    const success = await deleteAccount()

    if (success) {
      await navigateTo('/')
    } else {
      deleteError.value = profileError.value || t('profile.security.deleteError')
    }
  },
})

const [deleteConfirmText] = defineDeleteField('confirmation')

function cancelDelete() {
  showDeleteConfirm.value = false
  resetDeleteForm()
  deleteError.value = null
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
    link.remove()
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
      <UiBreadcrumbNav
        :items="[
          { label: $t('nav.home'), to: '/' },
          { label: $t('profile.dashboard.title'), to: '/perfil' },
          { label: $t('profile.security.title') },
        ]"
      />
      <PerfilProfileNavPills />
      <h1 class="page-title">
        {{ $t('profile.security.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.security.subtitle') }}
      </p>

      <!-- Change password section -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.changePassword') }}</h2>

        <form class="password-form" @submit="onPasswordSubmit">
          <div class="form-group">
            <label for="new_password" class="form-label">{{
              $t('profile.security.newPassword')
            }}</label>
            <input
              id="new_password"
              v-model="pwNewPassword"
              type="password"
              autocomplete="new-password"
              class="form-input"
              :class="{ 'input-error': passwordErrors.newPassword }"
              :placeholder="$t('profile.security.newPasswordPlaceholder')"
              :aria-invalid="!!passwordErrors.newPassword || undefined"
              :aria-describedby="passwordErrors.newPassword ? 'err-sec-pw' : undefined"
            >
            <p v-if="passwordErrors.newPassword" id="err-sec-pw" class="field-error" role="alert">
              {{ passwordErrors.newPassword }}
            </p>
          </div>

          <div class="form-group">
            <label for="confirm_password" class="form-label">{{
              $t('profile.security.confirmPassword')
            }}</label>
            <input
              id="confirm_password"
              v-model="pwConfirmPassword"
              type="password"
              autocomplete="new-password"
              class="form-input"
              :class="{ 'input-error': passwordErrors.confirmPassword }"
              :placeholder="$t('profile.security.confirmPasswordPlaceholder')"
              :aria-invalid="!!passwordErrors.confirmPassword || undefined"
              :aria-describedby="passwordErrors.confirmPassword ? 'err-sec-confirm' : undefined"
            >
            <p
              v-if="passwordErrors.confirmPassword"
              id="err-sec-confirm"
              class="field-error"
              role="alert"
            >
              {{ passwordErrors.confirmPassword }}
            </p>
          </div>

          <div v-if="passwordError" class="form-error" role="alert">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="form-success" role="status">
            {{ $t('profile.security.passwordChanged') }}
          </div>

          <button type="submit" class="btn-primary" :disabled="passwordSubmitting">
            {{
              passwordSubmitting ? $t('common.loading') : $t('profile.security.changePasswordBtn')
            }}
          </button>
        </form>
      </section>

      <!-- MFA / 2FA -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.mfaTitle') }}</h2>
        <p class="section-desc">{{ $t('profile.security.mfaDesc') }}</p>

        <template v-if="mfaStatus === 'not_enrolled'">
          <button class="btn-outline" :disabled="mfaLoading" @click="onEnrollMfa">
            {{ mfaLoading ? $t('common.loading') : $t('profile.security.mfaEnable') }}
          </button>
        </template>

        <template v-else-if="showMfaSetup">
          <div class="mfa-setup">
            <p class="mfa-instruction">{{ $t('profile.security.mfaScanQr') }}</p>
            <img
              v-if="qrCodeUri"
              :src="qrCodeUri"
              alt="QR Code"
              class="mfa-qr"
              width="200"
              height="200"
            >
            <div class="form-group">
              <label for="mfa_code" class="form-label">{{
                $t('profile.security.mfaCodeLabel')
              }}</label>
              <input
                id="mfa_code"
                v-model="mfaCode"
                type="text"
                autocomplete="one-time-code"
                inputmode="numeric"
                pattern="[0-9]{6}"
                maxlength="6"
                class="form-input"
                :placeholder="$t('profile.security.mfaCodePlaceholder')"
              >
            </div>
            <button class="btn-primary" :disabled="mfaLoading" @click="onVerifyMfa">
              {{ mfaLoading ? $t('common.loading') : $t('profile.security.mfaVerify') }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="mfa-active">
            <p class="form-success" role="status">{{ $t('profile.security.mfaActive') }}</p>
            <button
              class="btn-outline btn-outline--danger"
              :disabled="mfaLoading"
              @click="onDisableMfa"
            >
              {{ mfaLoading ? $t('common.loading') : $t('profile.security.mfaDisable') }}
            </button>
          </div>
        </template>

        <div v-if="mfaError" class="form-error" role="alert">{{ mfaError }}</div>
      </section>

      <!-- Active sessions / devices -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.activeSessionsTitle') }}</h2>
        <p class="section-desc">{{ $t('profile.security.activeSessionsDesc') }}</p>

        <div v-if="sessionsLoading" class="sessions-loading">
          <p>{{ $t('common.loading') }}...</p>
        </div>
        <div v-else-if="activeSessions.length === 0" class="sessions-empty">
          <p>{{ $t('profile.security.activeSessionsEmpty') }}</p>
        </div>
        <ul v-else class="sessions-list">
          <li v-for="session in activeSessions" :key="session.id" class="session-item">
            <div class="session-info">
              <span class="session-device">{{ session.device_label }}</span>
              <span v-if="session.ip_hint" class="session-ip">IP: {{ session.ip_hint }}.*.*</span>
              <div class="session-meta">
                <span
                  >{{ $t('profile.security.activeSessionsLastSeen') }}:
                  {{ new Date(session.last_seen).toLocaleDateString() }}</span
                >
                <span class="session-sep">&middot;</span>
                <span>{{
                  $t('profile.security.activeSessionsRequests', { count: session.request_count })
                }}</span>
              </div>
            </div>
            <button
              class="btn-session-remove"
              :aria-label="$t('profile.security.activeSessionsRemove')"
              @click="removeSession(session.id)"
            >
              {{ $t('profile.security.activeSessionsRemove') }}
            </button>
          </li>
        </ul>
      </section>

      <!-- Logout all devices -->
      <section class="section-card">
        <h2 class="section-title">{{ $t('profile.security.logoutAllTitle') }}</h2>
        <p class="section-desc">{{ $t('profile.security.logoutAllDesc') }}</p>
        <button class="btn-outline" :disabled="authLoading" @click="logoutAll">
          {{ authLoading ? $t('common.loading') : $t('profile.security.logoutAllBtn') }}
        </button>
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

        <form v-else class="delete-confirm" @submit="onDeleteSubmit">
          <p class="delete-instruction">{{ $t('profile.security.deleteConfirmInstruction') }}</p>
          <input
            v-model="deleteConfirmText"
            type="text"
            autocomplete="off"
            class="form-input"
            :class="{ 'input-error': deleteErrors.confirmation }"
            placeholder="ELIMINAR"
            :aria-invalid="!!deleteErrors.confirmation || undefined"
            :aria-describedby="deleteErrors.confirmation ? 'err-del-confirm' : undefined"
          >
          <p v-if="deleteErrors.confirmation" id="err-del-confirm" class="field-error" role="alert">
            {{ deleteErrors.confirmation }}
          </p>
          <div v-if="deleteError" class="form-error" role="alert">
            {{ deleteError }}
          </div>
          <div class="delete-actions">
            <button type="submit" class="btn-danger" :disabled="profileLoading">
              {{ profileLoading ? $t('common.loading') : $t('profile.security.confirmDelete') }}
            </button>
            <button type="button" class="btn-ghost" @click="cancelDelete">
              {{ $t('common.cancel') }}
            </button>
          </div>
        </form>
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
  max-width: 37.5rem;
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
  border-color: var(--color-error-border);
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
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring-strong);
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: 0.25rem;
}

.input-error {
  border-color: var(--color-error);
}

.form-error {
  padding: 0.75rem 1rem;
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}

.form-success {
  padding: 0.75rem 1rem;
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
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
  min-height: 2.75rem;
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
  min-height: 2.75rem;
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
  min-height: 2.75rem;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error);
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
  min-height: 2.75rem;
}

.btn-ghost:hover {
  color: var(--text-primary);
}

/* Sessions */
.sessions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--bg-secondary, #f9fafb);
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.session-device {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.session-ip {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-family: monospace;
}

.session-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.session-sep {
  margin: 0 0.25rem;
}

.btn-session-remove {
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 2rem;
}

.btn-session-remove:hover {
  background: var(--color-error);
  color: var(--color-white);
}

.sessions-loading,
.sessions-empty {
  padding: 1rem 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

/* MFA */
.mfa-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mfa-instruction {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.mfa-qr {
  align-self: center;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.mfa-active {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.btn-outline--danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.btn-outline--danger:hover:not(:disabled) {
  background: var(--color-error);
  color: var(--color-white);
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
@media (min-width: 48em) {
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
