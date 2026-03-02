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
  gap: 12px;
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  height: 14px;
}

.skeleton-short {
  width: 120px;
}

.skeleton-badge {
  width: 80px;
  height: 24px;
  border-radius: 12px;
}

.skeleton-long {
  width: 100%;
  margin-bottom: 8px;
}

.skeleton-medium {
  width: 70%;
  margin-bottom: 16px;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

.skeleton-btn {
  width: 80px;
  height: 34px;
  border-radius: 6px;
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
