<script setup lang="ts">
defineProps<{
  emailOnLead: boolean
  emailOnSale: boolean
  emailWeeklyStats: boolean
  emailAuctionUpdates: boolean
}>()

const emit = defineEmits<{
  'update:emailOnLead': [value: boolean]
  'update:emailOnSale': [value: boolean]
  'update:emailWeeklyStats': [value: boolean]
  'update:emailAuctionUpdates': [value: boolean]
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Notificaciones</h3>
    <p class="card-subtitle">Elige que notificaciones por email quieres recibir</p>

    <div class="notification-list">
      <label class="notification-item">
        <input
          :checked="emailOnLead"
          type="checkbox"
          @change="emit('update:emailOnLead', ($event.target as HTMLInputElement).checked)"
        >
        <div class="notification-text">
          <strong>Nuevo lead</strong>
          <span>Recibir email cuando un cliente solicita informacion</span>
        </div>
      </label>

      <label class="notification-item">
        <input
          :checked="emailOnSale"
          type="checkbox"
          @change="emit('update:emailOnSale', ($event.target as HTMLInputElement).checked)"
        >
        <div class="notification-text">
          <strong>Nueva venta</strong>
          <span>Recibir email cuando se registra una venta</span>
        </div>
      </label>

      <label class="notification-item">
        <input
          :checked="emailWeeklyStats"
          type="checkbox"
          @change="emit('update:emailWeeklyStats', ($event.target as HTMLInputElement).checked)"
        >
        <div class="notification-text">
          <strong>Resumen semanal</strong>
          <span>Recibir un resumen semanal de estadisticas</span>
        </div>
      </label>

      <label class="notification-item">
        <input
          :checked="emailAuctionUpdates"
          type="checkbox"
          @change="emit('update:emailAuctionUpdates', ($event.target as HTMLInputElement).checked)"
        >
        <div class="notification-text">
          <strong>Actualizaciones de subastas</strong>
          <span>Recibir notificaciones sobre pujas y subastas</span>
        </div>
      </label>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* Notifications */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  min-height: 44px;
}

.notification-item:hover {
  background: var(--color-gray-50);
  border-color: var(--border-color);
}

.notification-item input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notification-text strong {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.notification-text span {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Responsive: 768px */
@media (min-width: 768px) {
  .config-card {
    padding: var(--spacing-6);
  }
}

/* Responsive: 1024px */
@media (min-width: 1024px) {
  .config-card {
    padding: var(--spacing-8);
  }
}
</style>
