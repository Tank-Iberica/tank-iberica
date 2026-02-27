<template>
  <div class="vehicle-loading">
    <div class="skeleton-gallery" />
    <div class="skeleton-info">
      <div class="skeleton-line wide" />
      <div class="skeleton-line medium" />
      <div class="skeleton-line short" />
    </div>
  </div>
</template>

<style scoped>
.vehicle-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.skeleton-gallery {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-line {
  height: 20px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 70%;
}
.skeleton-line.medium {
  width: 45%;
}
.skeleton-line.short {
  width: 25%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
