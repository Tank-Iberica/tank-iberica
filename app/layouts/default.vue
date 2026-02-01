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
const authOpen = ref(false)
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: var(--header-height);
}
</style>
