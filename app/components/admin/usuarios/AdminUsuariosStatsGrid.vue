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
      <span class="stat-label">{{ $t('common.total') }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: var(--color-info)">{{ stats.users }}</span>
      <span class="stat-label">Usuarios</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: var(--color-violet-500)">{{ stats.admins }}</span>
      <span class="stat-label">Admins</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="color: var(--color-gray-400)">{{ stats.visitors }}</span>
      <span class="stat-label">Visitantes</span>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  text-align: center;
  box-shadow: var(--shadow-card);
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-gray-500);
  margin-top: var(--spacing-1);
}

@media (max-width: 48em) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
