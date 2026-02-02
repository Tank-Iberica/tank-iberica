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
  padding-top: 64px;
  transition: padding-top 0.3s ease;
}

@media (min-width: 768px) {
  .main-content {
    padding-top: 60px;
  }
}
</style>

<!-- Global (unscoped) styles for banner-visible body class -->
<style>
body.banner-visible .app-header {
  top: var(--banner-height);
}

body.banner-visible .main-content {
  padding-top: calc(64px + var(--banner-height));
}

@media (min-width: 768px) {
  body.banner-visible .main-content {
    padding-top: calc(60px + var(--banner-height));
  }
}
</style>
