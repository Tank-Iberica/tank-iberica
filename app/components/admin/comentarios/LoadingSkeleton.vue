<script setup lang="ts">
// Pure presentational component — no props or emits needed
</script>

<template>
  <div class="skeleton-list">
    <div v-for="i in 5" :key="i" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-short" />
        <div class="skeleton-line skeleton-badge" />
      </div>
      <div class="skeleton-line skeleton-long" />
      <div class="skeleton-line skeleton-medium" />
      <div class="skeleton-actions">
        <div class="skeleton-line skeleton-btn" />
        <div class="skeleton-line skeleton-btn" />
        <div class="skeleton-line skeleton-btn" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.skeleton-line {
  background: linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--border-radius-sm);
  height: 0.875rem;
}

.skeleton-short {
  width: 7.5rem;
}

.skeleton-badge {
  width: 5rem;
  height: 1.5rem;
  border-radius: var(--border-radius-md);
}

.skeleton-long {
  width: 100%;
  margin-bottom: var(--spacing-2);
}

.skeleton-medium {
  width: 70%;
  margin-bottom: var(--spacing-4);
}

.skeleton-actions {
  display: flex;
  gap: var(--spacing-2);
}

.skeleton-btn {
  width: 5rem;
  height: 2.125rem;
  border-radius: var(--border-radius);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
