<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="confirm-state">
        <div class="confirm-icon">
          <svg
            width="56"
            height="56"
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
        <h1 class="confirm-title">{{ $t('auth.confirmTitle') }}</h1>
        <p class="confirm-message">{{ $t('auth.confirmMessage') }}</p>

        <p v-if="redirectTarget" class="redirect-notice">
          {{ $t('auth.redirectingIn', { seconds: countdown }) }}
        </p>

        <NuxtLink :to="redirectTarget || '/'" class="btn-primary">
          {{ $t('auth.continueToHome') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()

const redirectTarget = computed(() => {
  const redirect = route.query.redirect as string | undefined
  return redirect || null
})

const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (redirectTarget.value) {
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (timer) clearInterval(timer)
        navigateTo(redirectTarget.value as string)
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

useHead({
  title: t('auth.confirmPageTitle'),
})
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
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

.confirm-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) 0;
}

.confirm-icon {
  color: var(--color-success);
}

.confirm-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.confirm-message {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  max-width: 340px;
  line-height: var(--line-height-relaxed);
}

.redirect-notice {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-2);
}

.btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: background var(--transition-fast);
  min-height: 48px;
  margin-top: var(--spacing-4);
  text-decoration: none;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

/* Desktop */
@media (min-width: 768px) {
  .auth-card {
    padding: var(--spacing-10) var(--spacing-8);
  }
}
</style>
