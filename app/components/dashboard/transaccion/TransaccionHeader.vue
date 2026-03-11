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
  gap: 0.5rem;
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
}

.vehicle-name {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-auxiliary);
  font-weight: 500;
}
</style>
