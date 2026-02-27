<template>
  <div class="banner-status-card" :class="{ active: enabled, inactive: !enabled }">
    <div class="banner-status-info">
      <span class="banner-status-icon">&#x1F514;</span>
      <div class="banner-status-text">
        <strong>Banner:</strong>
        <span v-if="enabled" class="status-label status-active">ACTIVO</span>
        <span v-else class="status-label status-inactive">INACTIVO</span>
        <span v-if="text" class="banner-preview-text">
          - "{{ text.length > 40 ? text.substring(0, 40) + '...' : text }}"
        </span>
      </div>
    </div>
    <div class="banner-actions">
      <button
        class="btn-banner-toggle"
        :class="{ 'btn-deactivate': enabled, 'btn-activate': !enabled }"
        @click="$emit('toggle')"
      >
        {{ enabled ? 'Desactivar' : 'Activar' }}
      </button>
      <NuxtLink to="/admin/banner" class="btn-banner-edit"> Editar </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  enabled: boolean
  text: string
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.banner-status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-5);
  border-radius: var(--border-radius-lg);
  border: 2px solid;
  margin-bottom: var(--spacing-4);
  transition: all 0.3s ease;
  flex-wrap: wrap;
}

.banner-status-card.active {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: #28a745;
}

.banner-status-card.inactive {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-color: #ffc107;
}

.banner-status-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
}

.banner-status-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.banner-status-text {
  font-size: var(--font-size-sm);
  color: #333;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.banner-status-text strong {
  color: #0f2a2e;
}

.status-label {
  font-weight: var(--font-weight-bold);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
}

.status-label.status-active {
  background: #28a745;
  color: white;
}

.status-label.status-inactive {
  background: #ffc107;
  color: #333;
}

.banner-preview-text {
  color: #555;
  font-style: italic;
}

.banner-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.btn-banner-toggle {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
}

.btn-banner-toggle.btn-deactivate {
  background: #dc3545;
  color: white;
}

.btn-banner-toggle.btn-deactivate:hover {
  background: #c82333;
}

.btn-banner-toggle.btn-activate {
  background: #28a745;
  color: white;
}

.btn-banner-toggle.btn-activate:hover {
  background: #218838;
}

.btn-banner-edit {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: background 0.2s;
}

.btn-banner-edit:hover {
  background: var(--color-primary-dark);
}

/* Mobile base: banner stacked */
.banner-status-card {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-3);
}

.banner-status-info {
  justify-content: center;
  text-align: center;
  flex-direction: column;
}

.banner-status-text {
  justify-content: center;
}

.banner-actions {
  justify-content: center;
}

@media (min-width: 640px) {
  .banner-status-card {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-4);
  }

  .banner-status-info {
    justify-content: flex-start;
    text-align: left;
    flex-direction: row;
  }

  .banner-status-text {
    justify-content: flex-start;
  }

  .banner-actions {
    justify-content: flex-end;
  }
}
</style>
