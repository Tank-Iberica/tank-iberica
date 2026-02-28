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
        <h3 class="card-title">Acciones Activas</h3>
        <p class="card-description">
          Selecciona los tipos de accion disponibles en el catalogo de vehiculos.
        </p>
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
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 1.125rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.875rem;
}

.checkbox-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  min-height: 44px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.save-section {
  margin-bottom: 40px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.management-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 32px;
}

.management-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  color: #1f2937;
}

.management-grid {
  display: grid;
  gap: 16px;
}

.management-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.management-card:hover {
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.management-card-content {
  flex: 1;
}

.management-card-content h4 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  color: #1f2937;
}

.management-card-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.management-card-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.management-card:hover .management-card-arrow {
  transform: translateX(4px);
  color: var(--color-primary, #23424a);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .section-header h2 {
    font-size: 1.5rem;
  }

  .config-card {
    padding: 16px;
  }

  .checkbox-grid {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .management-card {
    padding: 16px;
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
