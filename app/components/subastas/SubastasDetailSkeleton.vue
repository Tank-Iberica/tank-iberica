<template>
  <div class="auction-detail-loading">
    <div class="skeleton-hero" />
    <div class="skeleton-info">
      <div class="skeleton-line wide" />
      <div class="skeleton-line medium" />
      <div class="skeleton-line narrow" />
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or emits — purely presentational skeleton
</script>

<style scoped>
.auction-detail-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.skeleton-hero {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-line {
  height: 16px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 55%;
}
.skeleton-line.narrow {
  width: 35%;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
