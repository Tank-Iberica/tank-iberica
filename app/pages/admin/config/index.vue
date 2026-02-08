<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const configSections = [
  {
    title: 'Subcategorias',
    description: 'Gestiona las subcategorias del catálogo: nivel jerárquico superior a los tipos.',
    icon: '📁',
    link: '/admin/config/subcategorias',
    features: ['Nombre bilingüe (ES/EN)', 'Agrupa tipos', 'Filtros aplicables', 'Orden personalizado'],
  },
  {
    title: 'Tipos',
    description: 'Gestiona los tipos de vehículos: cisternas, tractoras, remolques, etc.',
    icon: '📋',
    link: '/admin/config/tipos',
    features: ['Nombre bilingüe (ES/EN)', 'Pertenece a subcategorias', 'Características aplicables', 'Estado publicado/oculto'],
  },
  {
    title: 'Características',
    description: 'Define las características de búsqueda para el catálogo de vehículos.',
    icon: '🔍',
    link: '/admin/config/caracteristicas',
    features: ['6 tipos de característica', 'Características condicionales', 'Valores por defecto', 'Estados múltiples'],
  },
]
</script>

<template>
  <div class="admin-config-index">
    <div class="section-header">
      <h2>Configuración</h2>
      <p class="section-subtitle">
        Gestiona las opciones del sistema
      </p>
    </div>

    <div class="config-grid">
      <NuxtLink
        v-for="section in configSections"
        :key="section.title"
        :to="section.link"
        class="config-card"
      >
        <div class="card-icon">
          {{ section.icon }}
        </div>
        <div class="card-content">
          <h3>{{ section.title }}</h3>
          <p>{{ section.description }}</p>
          <ul class="feature-list">
            <li v-for="feature in section.features" :key="feature">
              {{ feature }}
            </li>
          </ul>
        </div>
        <div class="card-arrow">
          →
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.admin-config-index {
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

.config-grid {
  display: grid;
  gap: 20px;
}

.config-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.config-card:hover {
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 12px;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-content p {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 0.95rem;
}

.feature-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-list li {
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #4b5563;
}

.card-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  transition: transform 0.2s;
  align-self: center;
}

.config-card:hover .card-arrow {
  transform: translateX(4px);
  color: var(--color-primary, #23424A);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .config-card {
    flex-direction: column;
    gap: 16px;
  }

  .card-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .card-arrow {
    display: none;
  }

  .feature-list {
    flex-direction: column;
    gap: 4px;
  }

  .feature-list li {
    width: fit-content;
  }
}
</style>
