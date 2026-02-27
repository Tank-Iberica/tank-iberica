<template>
  <div class="vehicle-not-found">
    <p>{{ $t('vehicle.notFound') }}</p>
    <NuxtLink to="/" class="back-link">
      {{ $t('vehicle.backToCatalog') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.vehicle-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--spacing-4);
  color: var(--text-auxiliary);
  font-size: var(--font-size-lg);
}
</style>
