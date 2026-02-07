<template>
  <div class="layout">
    <LayoutAppHeader @open-auth="authOpen = true" />
    <main class="main-content">
      <slot />
    </main>
    <LayoutAppFooter />
    <ModalsAuthModal v-model="authOpen" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authOpen = ref(false)

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

