<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// Local form state
const activeActions = ref<string[]>([])

const availableActions = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'subasta', label: 'Subasta' },
]

const catalogLinks = [
  {
    title: 'Subcategorias',
    description: 'Gestiona las subcategorias del catalogo: nivel jerarquico superior a los tipos.',
    link: '/admin/config/subcategorias',
  },
  {
    title: 'Tipos',
    description: 'Gestiona los tipos de vehiculos: cisternas, tractoras, remolques, etc.',
    link: '/admin/config/tipos',
  },
  {
    title: 'Caracteristicas',
    description: 'Define las caracteristicas y filtros de busqueda del catalogo.',
    link: '/admin/config/caracteristicas',
  },
]

onMounted(async () => {
  const cfg = await loadConfig()
  if (cfg) {
    activeActions.value = [...(cfg.active_actions || [])]
  }
})

const hasChanges = computed(() => {
  if (!config.value) return false
  const original = config.value.active_actions || []
  if (activeActions.value.length !== original.length) return true
  return (
    activeActions.value.some((a) => !original.includes(a)) ||
    original.some((a) => !activeActions.value.includes(a))
  )
})

async function handleSave() {
  await saveFields({
    active_actions: [...activeActions.value],
  })
}
</script>

<template>
  <div class="admin-config-catalog">
    <div class="section-header">
      <h2>{{ $t('admin.configCatalog.title') }}</h2>
      <p class="section-subtitle">{{ $t('admin.configCatalog.subtitle') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else>
      <!-- Error banner -->
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Success banner -->
      <div v-if="saved" class="success-banner">{{ $t('admin.common.savedOk') }}</div>

      <!-- Active Actions Section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configCatalog.activeActionsTitle') }}</h3>
        <p class="card-description">{{ $t('admin.configCatalog.activeActionsDesc') }}</p>
        <div class="checkbox-grid">
          <label v-for="action in availableActions" :key="action.value" class="checkbox-label">
            <input v-model="activeActions" type="checkbox" :value="action.value" >
            <span>{{ action.label }}</span>
          </label>
        </div>
      </div>

      <!-- Save Button -->
      <div class="save-section">
        <button class="btn-primary" :disabled="saving || !hasChanges" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>

      <!-- Catalog Management Section -->
      <div class="management-section">
        <h3 class="management-title">Gestion del Catalogo</h3>
        <div class="management-grid">
          <NuxtLink
            v-for="item in catalogLinks"
            :key="item.link"
            :to="item.link"
            class="management-card"
          >
            <div class="management-card-content">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </div>
            <div class="management-card-arrow">&rarr;</div>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-config-catalog {
  padding: 0;
}

.section-header {
  margin-bottom: var(--spacing-8);
}

.section-header h2 {
  margin: 0 0 var(--spacing-2);
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-6);
}

.card-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1.125rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.checkbox-grid {
  display: flex;
  gap: var(--spacing-6);
  flex-wrap: wrap;
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--color-gray-700);
  min-height: 2.75rem;
}

.checkbox-label input {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.save-section {
  margin-bottom: var(--spacing-10);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.management-section {
  border-top: 1px solid var(--color-gray-200);
  padding-top: var(--spacing-8);
}

.management-title {
  margin: 0 0 var(--spacing-5);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.management-grid {
  display: grid;
  gap: var(--spacing-4);
}

.management-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5) var(--spacing-6);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.management-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.management-card-content {
  flex: 1;
}

.management-card-content h4 {
  margin: 0 0 var(--spacing-1);
  font-size: 1.05rem;
  color: var(--color-gray-800);
}

.management-card-content p {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.management-card-arrow {
  font-size: 1.5rem;
  color: var(--text-disabled);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.management-card:hover .management-card-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

/* Mobile responsive */
@media (max-width: 48em) {
  .section-header h2 {
    font-size: 1.5rem;
  }

  .config-card {
    padding: var(--spacing-4);
  }

  .checkbox-grid {
    flex-direction: column;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
  }

  .management-card {
    padding: var(--spacing-4);
  }

  .management-card-arrow {
    display: none;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>
