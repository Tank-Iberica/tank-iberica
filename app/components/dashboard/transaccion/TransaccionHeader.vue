<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  vehicleId: string
  vehicleTitle: string
}>()
</script>

<template>
  <header class="page-header">
    <NuxtLink :to="`/dashboard/vehiculos/${vehicleId}`" class="back-link">
      {{ t('common.back') }}
    </NuxtLink>
    <h1>{{ t('dashboard.transaction.title') }}</h1>
    <p v-if="vehicleTitle" class="vehicle-name">{{ vehicleTitle }}</p>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.vehicle-name {
  margin: 0;
  font-size: 1rem;
  color: var(--text-auxiliary);
  font-weight: 500;
}
</style>
