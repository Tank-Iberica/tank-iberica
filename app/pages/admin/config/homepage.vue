<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// --- Banner item type ---
interface BannerItem {
  id: string
  content_es: string
  content_en: string
  url: string
  bg_color: string
  text_color: string
  active: boolean
  starts_at: string
  ends_at: string
}

// --- Homepage sections definition ---
const sectionDefinitions: { key: string; label: string; description: string }[] = [
  {
    key: 'featured_vehicles',
    label: 'Vehiculos destacados',
    description: 'Carrusel de vehiculos destacados',
  },
  {
    key: 'categories_grid',
    label: 'Grid de categorias',
    description: 'Rejilla de subcategorias con imagen',
  },
  { key: 'latest_news', label: 'Ultimas noticias', description: 'Seccion de noticias recientes' },
  {
    key: 'comparatives',
    label: 'Comparativas',
    description: 'Seccion de comparativas de vehiculos',
  },
  { key: 'auctions', label: 'Subastas', description: 'Seccion de subastas activas' },
  {
    key: 'stats_counter',
    label: 'Contador de estadisticas',
    description: 'Numeros del marketplace',
  },
  {
    key: 'dealer_logos',
    label: 'Logos de distribuidores',
    description: 'Carrusel de logos de concesionarios',
  },
  {
    key: 'newsletter_cta',
    label: 'Newsletter CTA',
    description: 'Seccion de suscripcion al boletin',
  },
]

// --- Local form state ---
const heroTitle = ref<Record<string, string>>({ es: '', en: '' })
const heroSubtitle = ref<Record<string, string>>({ es: '', en: '' })
const heroCtaText = ref<Record<string, string>>({ es: '', en: '' })
const heroCtaUrl = ref('')
const heroImageUrl = ref('')
const homepageSections = ref<Record<string, boolean>>({})
const banners = ref<BannerItem[]>([])

function generateBannerId(): string {
  return `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

function populateForm() {
  if (!config.value) return

  heroTitle.value = { es: '', en: '', ...(config.value.hero_title || {}) }
  heroSubtitle.value = { es: '', en: '', ...(config.value.hero_subtitle || {}) }
  heroCtaText.value = { es: '', en: '', ...(config.value.hero_cta_text || {}) }
  heroCtaUrl.value = config.value.hero_cta_url || ''
  heroImageUrl.value = config.value.hero_image_url || ''

  // Sections: default all to false, then overlay saved values
  const sections: Record<string, boolean> = {}
  for (const def of sectionDefinitions) {
    sections[def.key] = false
  }
  if (config.value.homepage_sections) {
    Object.assign(sections, config.value.homepage_sections)
  }
  homepageSections.value = sections

  banners.value = Array.isArray(config.value.banners)
    ? config.value.banners.map((b) => ({
        id: (b.id as string) || generateBannerId(),
        content_es: (b.content_es as string) || '',
        content_en: (b.content_en as string) || '',
        url: (b.url as string) || '',
        bg_color: (b.bg_color as string) || '#23424A',
        text_color: (b.text_color as string) || '#FFFFFF',
        active: b.active !== false,
        starts_at: (b.starts_at as string) || '',
        ends_at: (b.ends_at as string) || '',
      }))
    : []
}

onMounted(async () => {
  await loadConfig()
  populateForm()
})

// --- Banner helpers ---
function addBanner() {
  banners.value.push({
    id: generateBannerId(),
    content_es: '',
    content_en: '',
    url: '',
    bg_color: '#23424A',
    text_color: '#FFFFFF',
    active: true,
    starts_at: '',
    ends_at: '',
  })
}

function removeBanner(index: number) {
  banners.value.splice(index, 1)
}

async function handleSave() {
  const fields: Record<string, unknown> = {
    hero_title: heroTitle.value,
    hero_subtitle: heroSubtitle.value,
    hero_cta_text: heroCtaText.value,
    hero_cta_url: heroCtaUrl.value || null,
    hero_image_url: heroImageUrl.value || null,
    homepage_sections: homepageSections.value,
    banners: banners.value,
  }
  await saveFields(fields)
}
</script>

<template>
  <div class="admin-homepage">
    <div class="section-header">
      <div>
        <h2>Pagina de inicio</h2>
        <p class="section-subtitle">
          Configura el hero, las secciones visibles y los banners promocionales
        </p>
      </div>
      <NuxtLink to="/admin/config" class="btn-back"> Volver </NuxtLink>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="feedback-banner error-banner">
      {{ error }}
    </div>
    <div v-if="saved" class="feedback-banner success-banner">Cambios guardados correctamente</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando configuracion...</div>

    <template v-else-if="config">
      <!-- Hero section -->
      <div class="config-card">
        <h3 class="card-title">Hero</h3>
        <p class="card-subtitle">Contenido principal de la pagina de inicio</p>

        <div class="form-group">
          <label>Titulo</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="heroTitle.es" type="text" placeholder="Titulo principal en espanol" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="heroTitle.en" type="text" placeholder="Main title in English" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Subtitulo</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="heroSubtitle.es" type="text" placeholder="Subtitulo en espanol" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="heroSubtitle.en" type="text" placeholder="Subtitle in English" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Texto del boton (CTA)</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="heroCtaText.es" type="text" placeholder="Ver catalogo" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="heroCtaText.en" type="text" placeholder="View catalog" >
            </div>
          </div>
        </div>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="hero_cta_url">URL del boton</label>
            <input id="hero_cta_url" v-model="heroCtaUrl" type="text" placeholder="/catalogo" >
          </div>
          <div class="form-group">
            <label for="hero_image_url">Imagen del hero (URL)</label>
            <input
              id="hero_image_url"
              v-model="heroImageUrl"
              type="text"
              placeholder="https://res.cloudinary.com/..."
            >
          </div>
        </div>

        <div v-if="heroImageUrl" class="image-preview">
          <img :src="heroImageUrl" alt="Hero preview" >
        </div>
      </div>

      <!-- Sections -->
      <div class="config-card">
        <h3 class="card-title">Secciones</h3>
        <p class="card-subtitle">Activa o desactiva las secciones de la pagina de inicio</p>

        <div class="sections-grid">
          <label
            v-for="section in sectionDefinitions"
            :key="section.key"
            class="section-toggle-card"
            :class="{ active: homepageSections[section.key] }"
          >
            <div class="section-toggle-content">
              <span class="section-toggle-label">{{ section.label }}</span>
              <span class="section-toggle-desc">{{ section.description }}</span>
            </div>
            <input
              v-model="homepageSections[section.key]"
              type="checkbox"
              class="section-checkbox"
            >
          </label>
        </div>
      </div>

      <!-- Banners -->
      <div class="config-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Banners</h3>
            <p class="card-subtitle">Banners promocionales con programacion de fechas</p>
          </div>
          <button class="btn-add" @click="addBanner">+ Anadir banner</button>
        </div>

        <div v-if="banners.length === 0" class="empty-state">
          No hay banners configurados. Anade el primero.
        </div>

        <div v-else class="banners-list">
          <div v-for="(banner, index) in banners" :key="banner.id" class="banner-item">
            <div class="banner-item-header">
              <span class="banner-index">#{{ index + 1 }}</span>
              <div class="banner-header-actions">
                <label class="toggle-label-inline">
                  <input v-model="banner.active" type="checkbox" >
                  <span>{{ banner.active ? 'Activo' : 'Inactivo' }}</span>
                </label>
                <button class="btn-remove" title="Eliminar" @click="removeBanner(index)">×</button>
              </div>
            </div>

            <div class="banner-fields">
              <div class="form-group">
                <label>Contenido</label>
                <div class="lang-row">
                  <div class="lang-field">
                    <span class="lang-badge">ES</span>
                    <input
                      v-model="banner.content_es"
                      type="text"
                      placeholder="Texto del banner en espanol"
                    >
                  </div>
                  <div class="lang-field">
                    <span class="lang-badge">EN</span>
                    <input
                      v-model="banner.content_en"
                      type="text"
                      placeholder="Banner text in English"
                    >
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>URL de enlace</label>
                <input v-model="banner.url" type="text" placeholder="https://... o /ruta" >
              </div>

              <div class="banner-row-colors">
                <div class="form-group">
                  <label>Color de fondo</label>
                  <div class="color-input-wrapper">
                    <input v-model="banner.bg_color" type="color" class="color-picker-sm" >
                    <input
                      v-model="banner.bg_color"
                      type="text"
                      class="color-hex-sm"
                      maxlength="7"
                      placeholder="#23424A"
                    >
                  </div>
                </div>
                <div class="form-group">
                  <label>Color del texto</label>
                  <div class="color-input-wrapper">
                    <input v-model="banner.text_color" type="color" class="color-picker-sm" >
                    <input
                      v-model="banner.text_color"
                      type="text"
                      class="color-hex-sm"
                      maxlength="7"
                      placeholder="#FFFFFF"
                    >
                  </div>
                </div>
              </div>

              <div class="banner-row-dates">
                <div class="form-group">
                  <label>Fecha inicio</label>
                  <input v-model="banner.starts_at" type="datetime-local" >
                </div>
                <div class="form-group">
                  <label>Fecha fin</label>
                  <input v-model="banner.ends_at" type="datetime-local" >
                </div>
              </div>

              <!-- Banner preview -->
              <div
                v-if="banner.content_es || banner.content_en"
                class="banner-preview"
                :style="{ backgroundColor: banner.bg_color, color: banner.text_color }"
              >
                {{ banner.content_es || banner.content_en }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="save-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-homepage {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.btn-back {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-back:hover {
  background: #d1d5db;
}

.feedback-banner {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-group input[type='datetime-local']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.lang-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-badge {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 4px 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.image-preview {
  margin-top: 12px;
  padding: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

/* Sections grid */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.section-toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-toggle-card:hover {
  border-color: #9ca3af;
}

.section-toggle-card.active {
  border-color: var(--color-primary, #23424a);
  background: #f0fdfa;
}

.section-toggle-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.section-toggle-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
}

.section-toggle-desc {
  font-size: 0.8rem;
  color: #6b7280;
}

.section-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: var(--color-primary, #23424a);
}

/* Banners */
.btn-add {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--color-primary-dark, #1a3238);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 0.875rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.banners-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.banner-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  background: #fafafa;
}

.banner-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.banner-index {
  font-weight: 700;
  font-size: 0.9rem;
  color: #6b7280;
}

.banner-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #374151;
  font-weight: 500;
}

.toggle-label-inline input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #23424a);
}

.btn-remove {
  background: none;
  border: 1px solid #fca5a5;
  color: #dc2626;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fef2f2;
}

.banner-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.banner-row-colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.banner-row-dates {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-sm {
  width: 36px;
  height: 36px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-picker-sm::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-sm::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-hex-sm {
  flex: 1;
  padding: 7px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex-sm:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.banner-preview {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
}

/* Save bar */
.save-bar {
  padding: 20px 0;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (min-width: 480px) {
  .sections-grid {
    grid-template-columns: 1fr 1fr;
  }

  .banner-row-dates {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .form-row-2col {
    grid-template-columns: 1fr 1fr;
  }

  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
