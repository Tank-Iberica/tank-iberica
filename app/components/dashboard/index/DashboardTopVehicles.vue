<script setup lang="ts">
import type { DashboardVehicle } from '~/composables/dashboard/useDashboardIndex'
import { formatPrice } from '~/composables/dashboard/useDashboardIndex'

defineProps<{
  vehicles: readonly DashboardVehicle[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>{{ t('dashboard.topVehicles') }}</h2>
      <NuxtLink to="/dashboard/vehiculos" class="link-more">
        {{ t('dashboard.viewAll') }}
      </NuxtLink>
    </div>
    <div v-if="vehicles.length === 0" class="empty-state">
      <p>{{ t('dashboard.noVehiclesYet') }}</p>
      <NuxtLink to="/dashboard/vehiculos/nuevo" class="btn-secondary">
        {{ t('dashboard.publishFirst') }}
      </NuxtLink>
    </div>
    <div v-else class="vehicles-list">
      <NuxtLink
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        :to="`/dashboard/vehiculos/${vehicle.id}`"
        class="vehicle-item"
      >
        <div class="vehicle-info">
          <span class="vehicle-name">{{ vehicle.brand }} {{ vehicle.model }}</span>
          <span class="vehicle-price">{{ formatPrice(vehicle.price) }}</span>
        </div>
        <div class="vehicle-stats">
          <span class="stat">{{ vehicle.views }} {{ t('dashboard.views') }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-gray-100);
}

.card-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.link-more {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.link-more:hover {
  text-decoration: underline;
}

.empty-state {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.empty-state p {
  margin: 0 0 12px 0;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

.vehicles-list {
  display: flex;
  flex-direction: column;
}

.vehicle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  text-decoration: none;
  border-bottom: 1px solid var(--color-gray-50);
  min-height: 44px;
}

.vehicle-item:hover {
  background: var(--bg-secondary);
}

.vehicle-item:last-child {
  border-bottom: none;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vehicle-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.vehicle-price {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
}

.vehicle-stats {
  text-align: right;
}

.stat {
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}
</style>
