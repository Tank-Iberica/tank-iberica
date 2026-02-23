<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// --- Link item type ---
interface LinkItem {
  label_es: string
  label_en: string
  url: string
  visible: boolean
}

// --- Local form state ---
const headerLinks = ref<LinkItem[]>([])
const footerText = ref<Record<string, string>>({ es: '', en: '' })
const footerLinks = ref<LinkItem[]>([])
const socialLinks = ref<Record<string, string>>({
  linkedin: '',
  instagram: '',
  facebook: '',
  x: '',
})

function populateForm() {
  if (!config.value) return

  headerLinks.value = Array.isArray(config.value.header_links)
    ? config.value.header_links.map((link) => ({
        label_es: (link.label_es as string) || '',
        label_en: (link.label_en as string) || '',
        url: (link.url as string) || '',
        visible: link.visible !== false,
      }))
    : []

  footerText.value = { es: '', en: '', ...(config.value.footer_text || {}) }

  footerLinks.value = Array.isArray(config.value.footer_links)
    ? config.value.footer_links.map((link) => ({
        label_es: (link.label_es as string) || '',
        label_en: (link.label_en as string) || '',
        url: (link.url as string) || '',
        visible: link.visible !== false,
      }))
    : []

  socialLinks.value = {
    linkedin: '',
    instagram: '',
    facebook: '',
    x: '',
    ...(config.value.social_links || {}),
  }
}

onMounted(async () => {
  await loadConfig()
  populateForm()
})

// --- Header links helpers ---
function addHeaderLink() {
  headerLinks.value.push({ label_es: '', label_en: '', url: '', visible: true })
}

function removeHeaderLink(index: number) {
  headerLinks.value.splice(index, 1)
}

function moveHeaderLink(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= headerLinks.value.length) return
  const items = [...headerLinks.value]
  const temp = items[index]
  items[index] = items[target]
  items[target] = temp
  headerLinks.value = items
}

// --- Footer links helpers ---
function addFooterLink() {
  footerLinks.value.push({ label_es: '', label_en: '', url: '', visible: true })
}

function removeFooterLink(index: number) {
  footerLinks.value.splice(index, 1)
}

function moveFooterLink(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= footerLinks.value.length) return
  const items = [...footerLinks.value]
  const temp = items[index]
  items[index] = items[target]
  items[target] = temp
  footerLinks.value = items
}

async function handleSave() {
  const fields: Record<string, unknown> = {
    header_links: headerLinks.value,
    footer_text: footerText.value,
    footer_links: footerLinks.value,
    social_links: socialLinks.value,
  }
  await saveFields(fields)
}
</script>

<template>
  <div class="admin-navigation">
    <div class="section-header">
      <div>
        <h2>Navegacion</h2>
        <p class="section-subtitle">Configura los enlaces del header, footer y redes sociales</p>
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
      <!-- Header Links -->
      <div class="config-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Enlaces del Header</h3>
            <p class="card-subtitle">Enlaces de navegacion principal del sitio</p>
          </div>
          <button class="btn-add" @click="addHeaderLink">+ Anadir</button>
        </div>

        <div v-if="headerLinks.length === 0" class="empty-links">
          No hay enlaces configurados. Anade el primero.
        </div>

        <div v-else class="links-table-wrapper">
          <table class="links-table">
            <thead>
              <tr>
                <th class="th-order">Orden</th>
                <th>Label ES</th>
                <th>Label EN</th>
                <th>URL</th>
                <th class="th-toggle">Visible</th>
                <th class="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(link, index) in headerLinks" :key="index">
                <td class="td-order">
                  <div class="order-buttons">
                    <button
                      class="btn-icon-sm"
                      :disabled="index === 0"
                      title="Subir"
                      @click="moveHeaderLink(index, -1)"
                    >
                      ▲
                    </button>
                    <button
                      class="btn-icon-sm"
                      :disabled="index === headerLinks.length - 1"
                      title="Bajar"
                      @click="moveHeaderLink(index, 1)"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td>
                  <input v-model="link.label_es" type="text" placeholder="Inicio" >
                </td>
                <td>
                  <input v-model="link.label_en" type="text" placeholder="Home" >
                </td>
                <td>
                  <input v-model="link.url" type="text" placeholder="/ruta" >
                </td>
                <td class="td-toggle">
                  <label class="toggle-switch">
                    <input v-model="link.visible" type="checkbox" >
                    <span class="toggle-slider" />
                  </label>
                </td>
                <td class="td-actions">
                  <button class="btn-remove" title="Eliminar" @click="removeHeaderLink(index)">
                    ×
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile card version for header links -->
        <div v-if="headerLinks.length > 0" class="links-cards-mobile">
          <div v-for="(link, index) in headerLinks" :key="index" class="link-card-mobile">
            <div class="link-card-header">
              <span class="link-card-index">#{{ index + 1 }}</span>
              <div class="link-card-actions">
                <button
                  class="btn-icon-sm"
                  :disabled="index === 0"
                  @click="moveHeaderLink(index, -1)"
                >
                  ▲
                </button>
                <button
                  class="btn-icon-sm"
                  :disabled="index === headerLinks.length - 1"
                  @click="moveHeaderLink(index, 1)"
                >
                  ▼
                </button>
                <button class="btn-remove" @click="removeHeaderLink(index)">×</button>
              </div>
            </div>
            <div class="link-card-fields">
              <div class="form-group-sm">
                <label>ES</label>
                <input v-model="link.label_es" type="text" placeholder="Inicio" >
              </div>
              <div class="form-group-sm">
                <label>EN</label>
                <input v-model="link.label_en" type="text" placeholder="Home" >
              </div>
              <div class="form-group-sm">
                <label>URL</label>
                <input v-model="link.url" type="text" placeholder="/ruta" >
              </div>
              <div class="form-group-sm">
                <label class="toggle-label-mobile">
                  <input v-model="link.visible" type="checkbox" >
                  <span>Visible</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer section -->
      <div class="config-card">
        <h3 class="card-title">Footer</h3>
        <p class="card-subtitle">Texto del pie de pagina y enlaces adicionales</p>

        <div class="form-group">
          <label>Texto del footer</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="footerText.es" type="text" placeholder="Texto del pie de pagina" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="footerText.en" type="text" placeholder="Footer text" >
            </div>
          </div>
        </div>

        <!-- Footer links -->
        <div class="form-group">
          <div class="card-header-row">
            <label class="section-label">Enlaces del footer</label>
            <button class="btn-add btn-add-sm" @click="addFooterLink">+ Anadir</button>
          </div>
        </div>

        <div v-if="footerLinks.length === 0" class="empty-links">
          No hay enlaces de footer. Anade el primero.
        </div>

        <div v-else class="links-table-wrapper">
          <table class="links-table">
            <thead>
              <tr>
                <th class="th-order">Orden</th>
                <th>Label ES</th>
                <th>Label EN</th>
                <th>URL</th>
                <th class="th-toggle">Visible</th>
                <th class="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(link, index) in footerLinks" :key="index">
                <td class="td-order">
                  <div class="order-buttons">
                    <button
                      class="btn-icon-sm"
                      :disabled="index === 0"
                      @click="moveFooterLink(index, -1)"
                    >
                      ▲
                    </button>
                    <button
                      class="btn-icon-sm"
                      :disabled="index === footerLinks.length - 1"
                      @click="moveFooterLink(index, 1)"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td>
                  <input v-model="link.label_es" type="text" placeholder="Aviso legal" >
                </td>
                <td>
                  <input v-model="link.label_en" type="text" placeholder="Legal notice" >
                </td>
                <td>
                  <input v-model="link.url" type="text" placeholder="/legal" >
                </td>
                <td class="td-toggle">
                  <label class="toggle-switch">
                    <input v-model="link.visible" type="checkbox" >
                    <span class="toggle-slider" />
                  </label>
                </td>
                <td class="td-actions">
                  <button class="btn-remove" @click="removeFooterLink(index)">×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile card version for footer links -->
        <div v-if="footerLinks.length > 0" class="links-cards-mobile">
          <div v-for="(link, index) in footerLinks" :key="index" class="link-card-mobile">
            <div class="link-card-header">
              <span class="link-card-index">#{{ index + 1 }}</span>
              <div class="link-card-actions">
                <button
                  class="btn-icon-sm"
                  :disabled="index === 0"
                  @click="moveFooterLink(index, -1)"
                >
                  ▲
                </button>
                <button
                  class="btn-icon-sm"
                  :disabled="index === footerLinks.length - 1"
                  @click="moveFooterLink(index, 1)"
                >
                  ▼
                </button>
                <button class="btn-remove" @click="removeFooterLink(index)">×</button>
              </div>
            </div>
            <div class="link-card-fields">
              <div class="form-group-sm">
                <label>ES</label>
                <input v-model="link.label_es" type="text" placeholder="Aviso legal" >
              </div>
              <div class="form-group-sm">
                <label>EN</label>
                <input v-model="link.label_en" type="text" placeholder="Legal notice" >
              </div>
              <div class="form-group-sm">
                <label>URL</label>
                <input v-model="link.url" type="text" placeholder="/legal" >
              </div>
              <div class="form-group-sm">
                <label class="toggle-label-mobile">
                  <input v-model="link.visible" type="checkbox" >
                  <span>Visible</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Social links -->
      <div class="config-card">
        <h3 class="card-title">Redes Sociales</h3>
        <p class="card-subtitle">URLs de los perfiles de redes sociales</p>

        <div class="social-grid">
          <div class="form-group">
            <label for="social-linkedin">LinkedIn</label>
            <input
              id="social-linkedin"
              v-model="socialLinks.linkedin"
              type="text"
              placeholder="https://linkedin.com/company/..."
            >
          </div>
          <div class="form-group">
            <label for="social-instagram">Instagram</label>
            <input
              id="social-instagram"
              v-model="socialLinks.instagram"
              type="text"
              placeholder="https://instagram.com/..."
            >
          </div>
          <div class="form-group">
            <label for="social-facebook">Facebook</label>
            <input
              id="social-facebook"
              v-model="socialLinks.facebook"
              type="text"
              placeholder="https://facebook.com/..."
            >
          </div>
          <div class="form-group">
            <label for="social-x">X (Twitter)</label>
            <input
              id="social-x"
              v-model="socialLinks.x"
              type="text"
              placeholder="https://x.com/..."
            >
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
.admin-navigation {
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
}

.section-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

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

.btn-add-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.empty-links {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 0.875rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

/* Links table - desktop only */
.links-table-wrapper {
  display: none;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 12px;
}

.links-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.links-table th,
.links-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.links-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
  white-space: nowrap;
}

.links-table tr:last-child td {
  border-bottom: none;
}

.links-table input[type='text'] {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
}

.links-table input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.th-order {
  width: 60px;
}

.th-toggle {
  width: 70px;
  text-align: center;
}

.th-actions {
  width: 60px;
  text-align: center;
}

.td-order {
  text-align: center;
}

.td-toggle {
  text-align: center;
}

.td-actions {
  text-align: center;
}

.order-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.btn-icon-sm {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s;
  line-height: 1;
}

.btn-icon-sm:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-icon-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 11px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary, #23424a);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* Mobile card version for links */
.links-cards-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.link-card-mobile {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
}

.link-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.link-card-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
}

.link-card-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.link-card-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-sm label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 2px;
}

.form-group-sm input[type='text'] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
  box-sizing: border-box;
}

.form-group-sm input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.toggle-label-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.toggle-label-mobile input {
  width: 16px;
  height: 16px;
}

/* Footer / Social */
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

.social-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
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
@media (min-width: 768px) {
  .links-table-wrapper {
    display: block;
  }

  .links-cards-mobile {
    display: none;
  }

  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }

  .social-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
