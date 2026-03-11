<template>
  <div class="layout">
    <NuxtLoadingIndicator />
    <a href="#main-content" class="skip-link">
      {{ $t('a11y.skipToContent') }}
    </a>
    <a href="#catalog-results" class="skip-link">
      {{ $t('a11y.skipToCatalog') }}
    </a>
    <a href="#main-form" class="skip-link">
      {{ $t('a11y.skipToForm') }}
    </a>
    <CatalogAnnounceBanner />
    <LayoutAppHeader
      @open-auth="authOpen = true"
      @open-user-panel="handleOpenUserPanel"
      @open-anunciate="advertiseOpen = true"
    />
    <main id="main-content" class="main-content" :aria-busy="isPageLoading">
      <NuxtErrorBoundary @error="(e) => console.error('[layout] Error boundary caught:', e)">
        <template #error="{ error, clearError }">
          <div class="error-boundary">
            <p class="error-boundary__msg">{{ $t('errors.unexpected') }}</p>
            <div class="error-boundary__actions">
              <button class="error-boundary__btn" @click="clearError">
                {{ $t('errors.retry') }}
              </button>
              <NuxtLink to="/" class="error-boundary__link" @click="clearError">
                {{ $t('errors.goHome') }}
              </NuxtLink>
            </div>
          </div>
        </template>
        <slot />
      </NuxtErrorBoundary>
    </main>
    <LayoutAppFooter />
    <LazyModalsAuthModal v-model="authOpen" />
    <LazyUserPanel v-model="userPanelOpen" />
    <LazyModalsAdvertiseModal v-model="advertiseOpen" @open-auth="authOpen = true" />
    <LazyModalsDemandModal v-model="demandOpen" @open-auth="authOpen = true" />
    <LazyModalsSubscribeModal v-model="subscribeOpen" />
    <LayoutCookieBanner />
    <AccessibilityFAB />
    <UiToastContainer />
    <UiScrollToTop />

    <!-- ARIA live region para notificaciones dinámicas (screen readers) -->
    <div id="aria-live-region" aria-live="polite" aria-atomic="true" class="sr-only" />
    <div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" class="sr-only" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const nuxtApp = useNuxtApp()
const isPageLoading = ref(false)

// Track page loading for aria-busy
nuxtApp.hook('page:start', () => { isPageLoading.value = true })
nuxtApp.hook('page:finish', () => { isPageLoading.value = false })

const authOpen = ref(false)
const userPanelOpen = ref(false)
const advertiseOpen = ref(false)
const demandOpen = ref(false)
const subscribeOpen = ref(false)

// Prevent user panel from opening right after auth modal closes
let authRecentlyClosed = false
watch(authOpen, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    authRecentlyClosed = true
    setTimeout(() => {
      authRecentlyClosed = false
    }, 600)
  }
})

function handleOpenUserPanel() {
  if (authRecentlyClosed) return
  userPanelOpen.value = true
}

// Provide modal openers for child components
provide('openDemandModal', () => {
  demandOpen.value = true
})
provide('openAuthModal', () => {
  authOpen.value = true
})
provide('openSubscribeModal', () => {
  subscribeOpen.value = true
})

// Auto-open auth modal if ?auth=login is in URL
onMounted(() => {
  if (route.query.auth === 'login') {
    authOpen.value = true
  }
})

// Watch for route changes (in case of client-side navigation)
watch(
  () => route.query.auth,
  (auth) => {
    if (auth === 'login') {
      authOpen.value = true
    }
  },
)
</script>

<style scoped>
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  min-height: 20rem;
}

.error-boundary__msg {
  font-size: 1rem;
  color: var(--text-secondary, #555);
  max-width: 28rem;
}

.error-boundary__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-boundary__btn {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary, var(--color-primary));
  color: var(--color-white);
  border: none;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 2.75rem;
}

.error-boundary__btn:hover {
  opacity: 0.9;
}

.error-boundary__link {
  padding: 0.625rem 1.25rem;
  border: 1.5px solid var(--color-primary, var(--color-primary));
  color: var(--color-primary, var(--color-primary));
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  z-index: 10000;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: white;
  border-radius: 0 0 8px 8px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}

.layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: var(--header-offset);
  transition: padding-top 0.3s ease;
}

@media (min-width: 48em) {
  .main-content {
    padding-top: var(--header-offset-desktop);
  }
}
</style>

<!-- Global (non-scoped) styles for banner offset -->
<style>
body.banner-visible .app-header {
  top: 2rem;
}

body.banner-visible .main-content {
  padding-top: calc(var(--header-offset) + 32px);
}

@media (min-width: 48em) {
  body.banner-visible .main-content {
    padding-top: calc(var(--header-offset-desktop) + 32px);
  }
}
</style>
