<script setup lang="ts">
import { notificationCategories } from '~/components/perfil/NotificationCategoryCard.vue'

definePageMeta({
  middleware: ['auth'],
})

const { t } = useI18n()
const { loading, saving, error, loadPreferences, isEnabled, isAlwaysOn, togglePreference } =
  useEmailPreferences()

/** Toast feedback state */
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 2500)
}

/** Handle toggle for a single email type */
async function onToggle(emailType: string) {
  const newValue = !isEnabled(emailType)
  const success = await togglePreference(emailType, newValue)
  if (success) {
    showToast(t('profile.notifications.saved'))
  } else {
    showToast(t('profile.notifications.errorSaving'), 'error')
  }
}

useHead({
  title: t('profile.notifications.title'),
})

onMounted(() => {
  loadPreferences()
})
</script>

<template>
  <div class="notifications-page">
    <div class="notifications-container">
      <h1 class="page-title">
        {{ $t('profile.notifications.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.notifications.subtitle') }}
      </p>

      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <template v-else>
        <div class="info-banner">
          <svg
            class="info-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ $t('profile.notifications.criticalInfo') }}</span>
        </div>

        <NotificationCategoryCard
          v-for="category in notificationCategories"
          :key="category.id"
          :category="category"
          :saving="saving"
          :is-enabled="isEnabled"
          :is-always-on="isAlwaysOn"
          @toggle="onToggle"
        />
      </template>
    </div>

    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`toast--${toast.type}`"
        role="status"
        aria-live="polite"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notifications-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.notifications-container {
  max-width: 720px;
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

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  font-size: var(--font-size-sm);
  color: #1e40af;
  line-height: var(--line-height-normal);
}

.info-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-state {
  color: var(--color-error);
}

.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}

.toast--success {
  background-color: var(--color-success);
}

.toast--error {
  background-color: var(--color-error);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

@media (min-width: 768px) {
  .notifications-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }
}
</style>
