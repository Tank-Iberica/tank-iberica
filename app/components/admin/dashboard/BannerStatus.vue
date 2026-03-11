<template>
  <div class="banner-status-card" :class="{ active: enabled, inactive: !enabled }">
    <div class="banner-status-info">
      <span class="banner-status-icon">&#x1F514;</span>
      <div class="banner-status-text">
        <strong>Banner:</strong>
        <span v-if="enabled" class="status-label status-active">{{ $t('admin.banner.statusActive') }}</span>
        <span v-else class="status-label status-inactive">{{ $t('admin.banner.statusInactive') }}</span>
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
        {{ enabled ? $t('admin.banner.deactivate') : $t('admin.banner.activate') }}
      </button>
      <NuxtLink to="/admin/banner" class="btn-banner-edit"> {{ $t('common.edit') }} </NuxtLink>
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
  align-items: stretch;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-5);
  border-radius: var(--border-radius-lg);
  border: 2px solid;
  margin-bottom: var(--spacing-4);
  transition: all 0.3s ease;
  flex-wrap: wrap;
  flex-direction: column;
}

.banner-status-card.active {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: var(--color-success-bs);
}

.banner-status-card.inactive {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-color: var(--color-amber-300);
}

.banner-status-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
  justify-content: center;
  text-align: center;
  flex-direction: column;
}

.banner-status-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.banner-status-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  justify-content: center;
}

.banner-status-text strong {
  color: var(--color-primary-darker);
}

.status-label {
  font-weight: var(--font-weight-bold);
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.status-label.status-active {
  background: var(--badge-success-bg);
  color: var(--badge-success-text);
}

.status-label.status-inactive {
  background: var(--color-amber-300);
  color: var(--text-primary);
}

.banner-preview-text {
  color: #555;
  font-style: italic;
}

.banner-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-shrink: 0;
  justify-content: center;
}

.btn-banner-toggle {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
}

.btn-banner-toggle.btn-deactivate {
  background: var(--color-error-mid);
  color: white;
}

.btn-banner-toggle.btn-deactivate:hover {
  background: var(--color-error-dark);
}

.btn-banner-toggle.btn-activate {
  background: var(--badge-success-bg);
  color: var(--badge-success-text);
}

.btn-banner-toggle.btn-activate:hover {
  background: var(--color-success-mid);
}

.btn-banner-edit {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: background 0.2s;
}

.btn-banner-edit:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 40em) {
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
