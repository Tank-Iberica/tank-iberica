<script setup lang="ts">
import { useDealerPortal } from '~/composables/dashboard/useDealerPortal'
import DealerImageUploader from '~/components/dashboard/portal/DealerImageUploader.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  loading,
  saving,
  saved,
  error,
  portalUrl,
  companyName,
  logoUrl,
  faviconUrl,
  coverImageUrl,
  themePrimary,
  themeAccent,
  bio,
  phone,
  email,
  address,
  whatsapp,
  phoneMode,
  workingHours,
  ctaText,
  socialLinkedIn,
  socialInstagram,
  socialFacebook,
  socialYouTube,
  certifications,
  iconOptions,
  catalogSort,
  sortOptions,
  autoReplyMessage,
  emailOnLead,
  emailOnSale,
  emailWeeklyStats,
  emailAuctionUpdates,
  phoneModeOptions,
  loadPortal,
  save,
  resetThemeColors,
  addCertification,
  removeCertification,
  updateCertificationField,
} = useDealerPortal()

onMounted(loadPortal)

const logoRecommendations = [
  'Tamaño recomendado: 400 × 120 px (ratio 3:1 aprox.)',
  'Fondo transparente (PNG) o blanco',
  'Mínimo 200 px de ancho para buena calidad',
]

const faviconRecommendations = [
  'Tamaño recomendado: 64 × 64 px (cuadrado)',
  'PNG con fondo transparente o color sólido',
  'Se mostrará en la pestaña del navegador dentro de tu portal',
]

const coverRecommendations = [
  'Tamaño recomendado: 1200 × 400 px',
  'Formato JPG o WebP para mejor compresión',
  'Evita texto importante cerca de los bordes',
]
</script>

<template>
  <div class="portal-page">
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.portal.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.portal.subtitle') }}</p>
      </div>
      <a v-if="portalUrl" :href="portalUrl" target="_blank" rel="noopener" class="btn-secondary">
        {{ t('dashboard.portal.preview') }}
      </a>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <template v-else>
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="saved" class="alert-success" role="status">
        {{ t('dashboard.portal.saved') }}
      </div>

      <!-- ── 1. IDENTIDAD ─────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionIdentity') }}</h2>
        <p class="section-desc">Nombre, logotipo, favicon e imagen de portada de tu portal</p>

        <!-- Company name (ES / EN) -->
        <div class="form-group">
          <label>{{ t('dashboard.portal.companyName') }}</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input
                :value="companyName.es"
                type="text"
                autocomplete="organization"
                :placeholder="t('dashboard.portal.companyNamePlaceholder')"
                @input="companyName.es = ($event.target as HTMLInputElement).value"
              >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input
                :value="companyName.en"
                type="text"
                autocomplete="organization"
                placeholder="Company name in English"
                @input="companyName.en = ($event.target as HTMLInputElement).value"
              >
            </div>
          </div>
        </div>

        <!-- Logo upload -->
        <DealerImageUploader
          v-model="logoUrl"
          :label="t('dashboard.portal.logo')"
          folder="tracciona/dealers/logos"
          preview-class="logo-preview"
          :recommendations="logoRecommendations"
        />

        <!-- Favicon upload -->
        <DealerImageUploader
          v-model="faviconUrl"
          :label="t('dashboard.portal.favicon')"
          folder="tracciona/dealers/favicons"
          preview-class="favicon-preview"
          :recommendations="faviconRecommendations"
        />

        <!-- Cover image upload -->
        <DealerImageUploader
          v-model="coverImageUrl"
          :label="t('dashboard.portal.coverImage')"
          folder="tracciona/dealers/covers"
          preview-class="cover-preview"
          :recommendations="coverRecommendations"
        />
      </section>

      <!-- ── 2. COLORES ─────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionColors') }}</h2>
        <p class="section-desc">Se aplican sobre la base de Tracciona en tu portal</p>

        <div class="color-row">
          <div class="form-group color-group">
            <label for="theme_primary">{{ t('dashboard.portal.primaryColor') }}</label>
            <div class="color-input">
              <input id="theme_primary" v-model="themePrimary" type="color" class="color-picker" >
              <input
                v-model="themePrimary"
                type="text"
                class="color-hex"
                maxlength="7"
                placeholder="#23424A"
              >
            </div>
          </div>
          <div class="form-group color-group">
            <label for="theme_accent">{{ t('dashboard.portal.accentColor') }}</label>
            <div class="color-input">
              <input id="theme_accent" v-model="themeAccent" type="color" class="color-picker" >
              <input
                v-model="themeAccent"
                type="text"
                class="color-hex"
                maxlength="7"
                placeholder="#7FD1C8"
              >
            </div>
          </div>
        </div>

        <button type="button" class="btn-outline" @click="resetThemeColors">
          Restaurar colores de Tracciona
        </button>
      </section>

      <!-- ── 3. SOBRE NOSOTROS ───────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.bio') }}</h2>
        <p class="section-desc">Descripción de tu empresa (se muestra en tu portal)</p>

        <div class="lang-col">
          <div class="lang-field-block">
            <span class="lang-badge">ES</span>
            <textarea
              :value="bio.es"
              rows="4"
              :placeholder="t('dashboard.portal.bioPlaceholder')"
              @input="bio.es = ($event.target as HTMLTextAreaElement).value"
            />
          </div>
          <div class="lang-field-block">
            <span class="lang-badge">EN</span>
            <textarea
              :value="bio.en"
              rows="4"
              placeholder="Company description in English..."
              @input="bio.en = ($event.target as HTMLTextAreaElement).value"
            />
          </div>
        </div>
      </section>

      <!-- ── 4. CONTACTO ────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionContact') }}</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="phone">{{ t('dashboard.portal.phone') }}</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              autocomplete="tel"
              placeholder="+34 600 000 000"
            >
          </div>
          <div class="form-group">
            <label for="email">{{ t('dashboard.portal.email') }}</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="contacto@empresa.com"
            >
          </div>
          <div class="form-group">
            <label for="whatsapp">WhatsApp</label>
            <input
              id="whatsapp"
              v-model="whatsapp"
              type="tel"
              autocomplete="tel"
              placeholder="+34 600 000 000"
            >
          </div>
          <div class="form-group full-width">
            <label for="address">{{ t('dashboard.portal.address') }}</label>
            <input
              id="address"
              v-model="address"
              type="text"
              autocomplete="street-address"
              :placeholder="t('dashboard.portal.addressPlaceholder')"
            >
          </div>
        </div>

        <!-- Phone display mode -->
        <div class="form-group">
          <label for="phone_mode">Cómo mostrar el teléfono</label>
          <select id="phone_mode" v-model="phoneMode">
            <option v-for="opt in phoneModeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- CTA text -->
        <div class="form-group">
          <label>Texto del botón de contacto</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input
                :value="ctaText.es"
                type="text"
                placeholder="Contactar"
                @input="ctaText.es = ($event.target as HTMLInputElement).value"
              >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input
                :value="ctaText.en"
                type="text"
                placeholder="Contact"
                @input="ctaText.en = ($event.target as HTMLInputElement).value"
              >
            </div>
          </div>
        </div>

        <!-- Working hours -->
        <div class="form-group">
          <label>Horario de atención</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input
                :value="workingHours.es"
                type="text"
                placeholder="Lunes a Viernes 9:00–18:00"
                @input="workingHours.es = ($event.target as HTMLInputElement).value"
              >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input
                :value="workingHours.en"
                type="text"
                placeholder="Mon–Fri 9:00–18:00"
                @input="workingHours.en = ($event.target as HTMLInputElement).value"
              >
            </div>
          </div>
        </div>
      </section>

      <!-- ── 5. REDES SOCIALES ───────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionSocial') }}</h2>

        <div class="form-group">
          <label for="linkedin">LinkedIn</label>
          <input
            id="linkedin"
            v-model="socialLinkedIn"
            type="url"
            autocomplete="url"
            placeholder="https://linkedin.com/company/..."
          >
        </div>
        <div class="form-group">
          <label for="instagram">Instagram</label>
          <input
            id="instagram"
            v-model="socialInstagram"
            type="url"
            autocomplete="url"
            placeholder="https://instagram.com/..."
          >
        </div>
        <div class="form-group">
          <label for="facebook">Facebook</label>
          <input
            id="facebook"
            v-model="socialFacebook"
            type="url"
            autocomplete="url"
            placeholder="https://facebook.com/..."
          >
        </div>
        <div class="form-group">
          <label for="youtube">YouTube</label>
          <input
            id="youtube"
            v-model="socialYouTube"
            type="url"
            autocomplete="url"
            placeholder="https://youtube.com/@..."
          >
        </div>
      </section>

      <!-- ── 6. CERTIFICACIONES ──────────────────────────────── -->
      <section class="form-section">
        <h2>Certificaciones y sellos</h2>
        <p class="section-desc">
          Badges que se muestran en tu portal (dealer verificado, garantía, etc.)
        </p>

        <div v-if="certifications.length" class="cert-list">
          <div v-for="cert in certifications" :key="cert.id" class="cert-item">
            <div class="cert-row">
              <select
                :value="cert.icon"
                class="cert-icon-select"
                @change="
                  updateCertificationField(
                    cert.id,
                    'icon',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <input
                :value="cert.label.es"
                type="text"
                placeholder="Etiqueta ES"
                class="cert-label-input"
                @input="
                  updateCertificationField(cert.id, 'label', {
                    ...cert.label,
                    es: ($event.target as HTMLInputElement).value,
                  })
                "
              >
              <input
                :value="cert.label.en"
                type="text"
                placeholder="Label EN"
                class="cert-label-input"
                @input="
                  updateCertificationField(cert.id, 'label', {
                    ...cert.label,
                    en: ($event.target as HTMLInputElement).value,
                  })
                "
              >
              <label class="cert-verified">
                <input
                  :checked="cert.verified"
                  type="checkbox"
                  @change="
                    updateCertificationField(
                      cert.id,
                      'verified',
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
                >
                Verificado
              </label>
              <button
                type="button"
                class="cert-remove"
                aria-label="Eliminar certificación"
                @click="removeCertification(cert.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="btn-outline" @click="addCertification">
          + Añadir certificación
        </button>
      </section>

      <!-- ── 7. CATÁLOGO ────────────────────────────────────── -->
      <section class="form-section">
        <h2>Configuración del catálogo</h2>

        <div class="form-group">
          <label for="catalog_sort">Ordenación por defecto</label>
          <select id="catalog_sort" v-model="catalogSort">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </section>

      <!-- ── 8. RESPUESTA AUTOMÁTICA ────────────────────────── -->
      <section class="form-section">
        <h2>Respuesta automática</h2>
        <p class="section-desc">
          Mensaje que recibirá el comprador al contactarte fuera de horario
        </p>

        <div class="lang-col">
          <div class="lang-field-block">
            <span class="lang-badge">ES</span>
            <textarea
              :value="autoReplyMessage.es"
              rows="3"
              placeholder="Gracias por contactar con nosotros. Responderemos en 24h."
              @input="autoReplyMessage.es = ($event.target as HTMLTextAreaElement).value"
            />
          </div>
          <div class="lang-field-block">
            <span class="lang-badge">EN</span>
            <textarea
              :value="autoReplyMessage.en"
              rows="3"
              placeholder="Thank you for reaching out. We will reply within 24h."
              @input="autoReplyMessage.en = ($event.target as HTMLTextAreaElement).value"
            />
          </div>
        </div>
      </section>

      <!-- ── 9. NOTIFICACIONES ───────────────────────────────── -->
      <section class="form-section">
        <h2>Notificaciones por email</h2>

        <div class="toggle-list">
          <label class="toggle-row">
            <span class="toggle-label">Nuevo lead recibido</span>
            <input v-model="emailOnLead" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">Venta completada</span>
            <input v-model="emailOnSale" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">Resumen semanal de estadísticas</span>
            <input v-model="emailWeeklyStats" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">Actualizaciones de subastas</span>
            <input
              v-model="emailAuctionUpdates"
              type="checkbox"
              class="toggle-input"
              role="switch"
            >
          </label>
        </div>
      </section>

      <!-- ── SUBMIT ─────────────────────────────────────────── -->
      <div class="form-actions">
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.portal-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

/* ── Sections ── */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.section-desc {
  margin: -8px 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

/* ── Form elements ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.form-group input[type='text'],
.form-group input[type='tel'],
.form-group input[type='email'],
.form-group input[type='url'],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
  background: #fff;
  color: #1e293b;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 90px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* ── Language inputs ── */
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

.lang-field input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  min-height: 44px;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.lang-badge {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
  padding: 4px 0;
  text-transform: uppercase;
}

.lang-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lang-field-block .lang-badge {
  align-self: flex-start;
}

.lang-field-block textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  box-sizing: border-box;
}

.lang-field-block textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* ── Colors ── */
.color-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.color-group {
  gap: 6px;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 44px;
  height: 44px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
  background: none;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.color-hex {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: monospace;
  text-transform: uppercase;
  min-height: 44px;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* ── Certifications ── */
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cert-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.cert-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.cert-icon-select {
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  min-height: 44px;
  background: #fff;
}

.cert-label-input {
  flex: 1;
  min-width: 100px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  min-height: 44px;
}

.cert-label-input:focus,
.cert-icon-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.cert-verified {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #475569;
  cursor: pointer;
  min-height: 44px;
}

.cert-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
  min-height: 44px;
  min-width: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (hover: hover) {
  .cert-remove:hover {
    background: #fef2f2;
  }
}

/* ── Toggles ── */
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  min-height: 44px;
}

.toggle-row:last-child {
  border-bottom: none;
}

.toggle-label {
  font-size: 0.9rem;
  color: #334155;
}

.toggle-input {
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

/* ── Shared buttons ── */
.btn-outline {
  align-self: flex-start;
  background: transparent;
  color: var(--color-primary, #23424a);
  border: 1px solid var(--color-primary, #23424a);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition:
    background 0.15s,
    color 0.15s;
}

@media (hover: hover) {
  .btn-outline:hover {
    background: var(--color-primary, #23424a);
    color: white;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 28px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

@media (hover: hover) {
  .btn-primary:hover {
    background: #1a3238;
  }
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Responsive ── */
@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .full-width {
    grid-column: span 2;
  }

  .color-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .portal-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .form-section {
    padding: 24px;
  }

  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
