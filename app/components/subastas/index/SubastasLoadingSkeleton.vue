<template>
  <div class="auctions-loading">
    <div v-for="i in 6" :key="i" class="skeleton-card">
      <div class="skeleton-img" />
      <div class="skeleton-body">
        <div class="skeleton-line wide" />
        <div class="skeleton-line medium" />
        <div class="skeleton-line narrow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auctions-loading {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.skeleton-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.skeleton-img {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 14px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 85%;
}
.skeleton-line.medium {
  width: 60%;
}
.skeleton-line.narrow {
  width: 40%;
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

/* Breakpoint: 768px (tablet) */
@media (min-width: 768px) {
  .auctions-loading {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-5);
  }
}

/* Breakpoint: 1024px (desktop) */
@media (min-width: 1024px) {
  .auctions-loading {
    gap: var(--spacing-6);
  }
}

/* Breakpoint: 1280px (large desktop) */
@media (min-width: 1280px) {
  .auctions-loading {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
