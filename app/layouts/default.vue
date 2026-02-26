<template>
  <div class="layout">
    <a href="#main-content" class="skip-link">
      {{ $t('a11y.skipToContent') }}
    </a>
    <CatalogAnnounceBanner />
    <LayoutAppHeader
      @open-auth="authOpen = true"
      @open-user-panel="handleOpenUserPanel"
      @open-anunciate="advertiseOpen = true"
    />
    <main id="main-content" class="main-content">
      <slot />
    </main>
    <LayoutAppFooter />
    <ModalsAuthModal v-model="authOpen" />
    <UserPanel v-model="userPanelOpen" />
    <ModalsAdvertiseModal v-model="advertiseOpen" @open-auth="authOpen = true" />
    <ModalsDemandModal v-model="demandOpen" @open-auth="authOpen = true" />
    <ModalsSubscribeModal v-model="subscribeOpen" />
    <LayoutCookieBanner />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
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
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 10000;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
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
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 64px;
  transition: padding-top 0.3s ease;
}

@media (min-width: 768px) {
  .main-content {
    padding-top: 60px;
  }
}
</style>

<!-- Global (non-scoped) styles for banner offset -->
<style>
body.banner-visible .app-header {
  top: 32px;
}

body.banner-visible .main-content {
  padding-top: 96px; /* 64px header + 32px banner */
}

@media (min-width: 768px) {
  body.banner-visible .main-content {
    padding-top: 92px; /* 60px header + 32px banner */
  }
}
</style>
