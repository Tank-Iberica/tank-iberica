<template>
  <div class="layout">
    <CatalogAnnounceBanner />
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
  padding-top: 57px;
  transition: padding-top 0.3s ease;
}

@media (min-width: 768px) {
  .main-content {
    padding-top: var(--header-height);
  }
}
</style>

<!-- Global (unscoped) styles for banner-visible body class -->
<style>
body.banner-visible .app-header {
  top: var(--banner-height);
}

body.banner-visible .main-content {
  padding-top: calc(57px + var(--banner-height));
}

@media (min-width: 768px) {
  body.banner-visible .main-content {
    padding-top: calc(var(--header-height) + var(--banner-height));
  }
}
</style>
