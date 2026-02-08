<template>
  <div class="layout">
    <LayoutAppHeader
      @open-auth="authOpen = true"
      @open-user-panel="userPanelOpen = true"
      @open-anunciate="advertiseOpen = true"
    />
    <main class="main-content">
      <slot />
    </main>
    <LayoutAppFooter />
    <ModalsAuthModal v-model="authOpen" />
    <UserPanel v-model="userPanelOpen" />
    <ModalsAdvertiseModal v-model="advertiseOpen" @open-auth="authOpen = true" />
    <ModalsDemandModal v-model="demandOpen" @open-auth="authOpen = true" />
    <ModalsSubscribeModal v-model="subscribeOpen" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authOpen = ref(false)
const userPanelOpen = ref(false)
const advertiseOpen = ref(false)
const demandOpen = ref(false)
const subscribeOpen = ref(false)

// Provide modal openers for child components
provide('openDemandModal', () => { demandOpen.value = true })
provide('openAuthModal', () => { authOpen.value = true })
provide('openSubscribeModal', () => { subscribeOpen.value = true })

// Auto-open auth modal if ?auth=login is in URL
onMounted(() => {
  if (route.query.auth === 'login') {
    authOpen.value = true
  }
})

// Watch for route changes (in case of client-side navigation)
watch(() => route.query.auth, (auth) => {
  if (auth === 'login') {
    authOpen.value = true
  }
})
</script>

<style scoped>
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

