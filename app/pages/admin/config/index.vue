<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const configSections = [
  {
    title: 'Identidad / Branding',
    description: 'Nombre, tagline, logotipos, favicon, colores y tipografía de la plataforma.',
    icon: 'palette',
    link: '/admin/config/branding',
    features: [
      'Nombre y tagline bilingüe',
      'Logotipos y favicon',
      'Colores del tema',
      'Tipografía',
    ],
  },
  {
    title: 'Navegación',
    description: 'Menú del header, enlaces del footer y redes sociales.',
    icon: 'menu',
    link: '/admin/config/navigation',
    features: ['Header links', 'Footer links', 'Redes sociales', 'Reordenar'],
  },
  {
    title: 'Homepage',
    description: 'Hero, secciones visibles y banners de la página principal.',
    icon: 'home',
    link: '/admin/config/homepage',
    features: ['Hero title/CTA', 'Secciones on/off', 'Banners con fechas', 'Imagen hero'],
  },
  {
    title: 'Catálogo',
    description:
      'Acciones activas del catálogo y gestión de subcategorías, tipos y características.',
    icon: 'inventory',
    link: '/admin/config/catalog',
    features: ['Venta/Alquiler/Subasta', 'Subcategorías', 'Tipos', 'Características'],
  },
  {
    title: 'Idiomas',
    description: 'Idiomas activos, idioma por defecto y motor de traducción automática.',
    icon: 'translate',
    link: '/admin/config/languages',
    features: ['Idiomas activos', 'Idioma por defecto', 'Motor de traducción', 'Auto-traducir'],
  },
  {
    title: 'Precios',
    description: 'Precios de suscripción dealer y comisiones de la plataforma.',
    icon: 'payments',
    link: '/admin/config/pricing',
    features: [
      'Planes mensual/anual',
      'Niveles Basic/Pro/Premium',
      'Comisiones %',
      'Comisiones fijas',
    ],
  },
  {
    title: 'Integraciones',
    description: 'Google Analytics, Search Console, AdSense y Cloudinary.',
    icon: 'extension',
    link: '/admin/config/integrations',
    features: ['Google Analytics', 'Search Console', 'AdSense', 'Cloudinary'],
  },
  {
    title: 'Emails',
    description: 'Plantillas de email: asunto, cuerpo y variables disponibles.',
    icon: 'email',
    link: '/admin/config/emails',
    features: ['Plantillas bilingües', 'Variables dinámicas', 'Asunto/cuerpo', 'Preview'],
  },
  {
    title: 'Editorial',
    description: 'Opciones de publicación de artículos, aprobación y redes sociales.',
    icon: 'article',
    link: '/admin/config/editorial',
    features: ['Aprobación artículos', 'Auto-publicar RRSS', 'Gestión noticias', 'Calendario'],
  },
  {
    title: 'Sistema',
    description: 'Moderación de vehículos/artículos y logs de actividad del sistema.',
    icon: 'settings',
    link: '/admin/config/system',
    features: ['Moderación vehículos', 'Moderación artículos', 'Logs de actividad', 'Auditoría'],
  },
]

const iconPaths: Record<string, string> = {
  palette:
    'M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22z',
  menu: 'M3 12h18M3 6h18M3 18h18',
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  translate:
    'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  payments: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  extension:
    'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a2 2 0 01-2 2h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H6a2 2 0 01-2-2v-3a1 1 0 00-1-1H2a2 2 0 110-4h1a1 1 0 001-1V6a2 2 0 012-2h3a1 1 0 001-1V2',
  email:
    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  article:
    'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
}
</script>

<template>
  <div class="admin-config-index">
    <div class="section-header">
      <h2>Configuración</h2>
      <p class="section-subtitle">Gestiona todas las opciones de la plataforma</p>
    </div>

    <div class="config-grid">
      <NuxtLink
        v-for="section in configSections"
        :key="section.title"
        :to="section.link"
        class="config-card"
      >
        <div class="card-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="iconPaths[section.icon]" />
          </svg>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
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
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .config-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.config-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.config-card:hover {
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 10px;
  color: var(--color-primary, #23424a);
}

.card-icon svg {
  width: 22px;
  height: 22px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h3 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: #1f2937;
}

.card-content p {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
}

.feature-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-list li {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  color: #4b5563;
}

.card-arrow {
  color: #9ca3af;
  transition: transform 0.2s;
  align-self: center;
  flex-shrink: 0;
}

.card-arrow svg {
  width: 20px;
  height: 20px;
}

.config-card:hover .card-arrow {
  transform: translateX(4px);
  color: var(--color-primary, #23424a);
}

@media (max-width: 479px) {
  .config-card {
    padding: 16px;
    gap: 12px;
  }

  .card-arrow {
    display: none;
  }
}
</style>
