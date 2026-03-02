<script setup lang="ts">
import type { UserStats } from '~/composables/admin/useAdminUsuariosPage'

defineProps<{
  stats: UserStats
}>()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{{ stats.total }}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: #3b82f6">{{ stats.users }}</span>
      <span class="stat-label">Usuarios</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: #8b5cf6">{{ stats.admins }}</span>
      <span class="stat-label">Admins</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: #9ca3af">{{ stats.visitors }}</span>
      <span class="stat-label">Visitantes</span>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
