<script setup lang="ts">
import { useDealerPortal } from '~/composables/dashboard/useDealerPortal'

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
  needsProfile,
  portalUrl,
  companyName,
  logoUrl,
  faviconUrl,
  coverImageUrl,
  logoTextConfig,
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
  brokerageOptOut,
  toggleBrokerageOptOut,
  simpleMode,
  phoneModeOptions,
  loadPortal,
  createDealerProfile,
  save,
  resetThemeColors,
  addCertification,
  removeCertification,
  updateCertificationField,
} = useDealerPortal()

const newDealerName = ref('')

async function onCreateProfile() {
  if (!newDealerName.value.trim()) return
  await createDealerProfile(newDealerName.value.trim())
}

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

    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonCard :lines="5" />
    </div>

    <!-- ── CREATE PROFILE (no dealer record yet) ─────────── -->
    <section v-else-if="needsProfile" class="form-section create-profile-section">
      <h2>{{ t('dashboard.portal.createProfileTitle', 'Crea tu perfil de concesionario') }}</h2>
      <p class="section-desc">
        {{
          t(
            'dashboard.portal.createProfileDesc',
            'Introduce el nombre de tu empresa para empezar a configurar tu portal.',
          )
        }}
      </p>
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div class="form-group">
        <label for="new_dealer_name">{{ t('dashboard.portal.companyName') }}</label>
        <input
          id="new_dealer_name"
          v-model="newDealerName"
          type="text"
          autocomplete="organization"
          :placeholder="t('dashboard.portal.companyNamePlaceholder')"
          @keyup.enter="onCreateProfile"
        >
      </div>
      <button
        type="button"
        class="btn-primary"
        :disabled="saving || !newDealerName.trim()"
        @click="onCreateProfile"
      >
        {{ saving ? t('common.loading') : t('dashboard.portal.createProfile', 'Crear perfil') }}
      </button>
    </section>

    <template v-else>
      <div v-if="error" class="alert-error">{{ error }}</div>
      <div v-if="saved" class="alert-success" role="status">
        {{ t('dashboard.portal.saved') }}
      </div>

      <!-- ── 1. IDENTIDAD ─────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionIdentity') }}</h2>
        <p class="section-desc">{{ t('dashboard.portal.identityDesc') }}</p>

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
        <SharedImageUploader
          v-model="logoUrl"
          :label="t('dashboard.portal.logo')"
          folder="tracciona/dealers/logos"
          preview-class="logo-preview"
          :recommendations="logoRecommendations"
          enable-bg-removal
        />

        <!-- Favicon upload -->
        <SharedImageUploader
          v-model="faviconUrl"
          :label="t('dashboard.portal.favicon')"
          folder="tracciona/dealers/favicons"
          preview-class="favicon-preview"
          :recommendations="faviconRecommendations"
        />

        <!-- Cover image upload -->
        <SharedImageUploader
          v-model="coverImageUrl"
          :label="t('dashboard.portal.coverImage')"
          folder="tracciona/dealers/covers"
          preview-class="cover-preview"
          :recommendations="coverRecommendations"
        />
      </section>

      <!-- ── 1b. NOMBRE COMO LOGO ──────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionLogoText') }}</h2>
        <p class="section-desc">
          {{ t('dashboard.portal.logoTextDesc') }}
        </p>
        <SharedLogoTextConfig
          v-model="logoTextConfig"
          :preview-name="companyName.es || companyName.en || ''"
        />
      </section>

      <!-- ── 2. COLORES ─────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionColors') }}</h2>
        <p class="section-desc">{{ t('dashboard.portal.colorsDesc') }}</p>

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
                placeholder="var(--color-primary)"
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
          {{ t('dashboard.portal.resetColors') }}
        </button>
      </section>

      <!-- ── 3. SOBRE NOSOTROS ───────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.bio') }}</h2>
        <p class="section-desc">{{ t('dashboard.portal.bioDesc') }}</p>

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
          <label for="phone_mode">{{ t('dashboard.portal.phoneModeLabel') }}</label>
          <select id="phone_mode" v-model="phoneMode">
            <option v-for="opt in phoneModeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- CTA text -->
        <div class="form-group">
          <label>{{ t('dashboard.portal.ctaTextLabel') }}</label>
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
          <label>{{ t('dashboard.portal.workingHoursLabel') }}</label>
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
        <h2>{{ t('dashboard.portal.sectionCertifications') }}</h2>
        <p class="section-desc">
          {{ t('dashboard.portal.certificationsDesc') }}
        </p>

        <TransitionGroup v-if="certifications.length" name="list" tag="div" class="cert-list">
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
                {{ t('dashboard.portal.certified') }}
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
        </TransitionGroup>

        <button type="button" class="btn-outline" @click="addCertification">
          {{ t('dashboard.portal.addCertification') }}
        </button>
      </section>

      <!-- ── 7. CATÁLOGO ────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionCatalog') }}</h2>

        <div class="form-group">
          <label for="catalog_sort">{{ t('dashboard.portal.catalogSortLabel') }}</label>
          <select id="catalog_sort" v-model="catalogSort">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </section>

      <!-- ── 8. RESPUESTA AUTOMÁTICA ────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionAutoReply') }}</h2>
        <p class="section-desc">
          {{ t('dashboard.portal.autoReplyDesc') }}
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
        <h2>{{ t('dashboard.portal.sectionNotifications') }}</h2>

        <div class="toggle-list">
          <label class="toggle-row">
            <span class="toggle-label">{{ t('dashboard.portal.notifNewLead') }}</span>
            <input v-model="emailOnLead" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">{{ t('dashboard.portal.notifSale') }}</span>
            <input v-model="emailOnSale" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">{{ t('dashboard.portal.notifWeeklyStats') }}</span>
            <input v-model="emailWeeklyStats" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <label class="toggle-row">
            <span class="toggle-label">{{ t('dashboard.portal.notifAuctionUpdates') }}</span>
            <input
              v-model="emailAuctionUpdates"
              type="checkbox"
              class="toggle-input"
              role="switch"
            >
          </label>
        </div>
      </section>

      <!-- ── SERVICIOS ──────────────────────────────────────── -->
      <section class="form-section">
        <h2>{{ t('dashboard.portal.sectionServices') }}</h2>
        <div class="toggle-group">
          <label class="toggle-row">
            <span class="toggle-label">{{
              t('dashboard.portal.simpleModeLabel', 'Modo simple')
            }}</span>
            <input v-model="simpleMode" type="checkbox" class="toggle-input" role="switch" >
          </label>
          <p class="field-hint">
            {{
              t(
                'dashboard.portal.simpleModeHint',
                'Auto-renovar anuncios sin CRM avanzado. Publica y olvídate.',
              )
            }}
          </p>
        </div>
        <div class="toggle-group">
          <label class="toggle-row">
            <span class="toggle-label">{{ t('dashboard.portal.brokerageLabel') }}</span>
            <input
              :checked="!brokerageOptOut"
              type="checkbox"
              class="toggle-input"
              role="switch"
              @change="toggleBrokerageOptOut(!($event.target as HTMLInputElement).checked)"
            >
          </label>
          <p class="field-hint">
            {{ t('dashboard.portal.brokerageHint') }}
          </p>
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
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: 0.9rem;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem var(--spacing-5);
  background: var(--bg-primary);
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}

.create-profile-section {
  text-align: center;
  max-width: 28rem;
  margin: var(--spacing-8) auto 0;
}

.create-profile-section .form-group {
  text-align: left;
}

.create-profile-section .btn-primary {
  width: 100%;
  margin-top: var(--spacing-2);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.9rem;
}

.alert-success {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-success-bg, var(--color-success-bg));
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius);
  color: var(--color-success);
  font-size: 0.9rem;
}

/* ── Sections ── */
.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-section h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  margin: -8px 0 0;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

/* ── Form elements ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input[type='text'],
.form-group input[type='tel'],
.form-group input[type='email'],
.form-group input[type='url'],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 2.75rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-group textarea {
  resize: vertical;
  min-height: 5.625rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* ── Language inputs ── */
.lang-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.lang-field input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  min-height: 2.75rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.lang-badge {
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-auxiliary);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) 0;
  text-transform: uppercase;
}

.lang-col {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.lang-field-block {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.lang-field-block .lang-badge {
  align-self: flex-start;
}

.lang-field-block textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 5.625rem;
  box-sizing: border-box;
}

.lang-field-block textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* ── Colors ── */
.color-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

.color-group {
  gap: 0.375rem;
}

.color-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.color-picker {
  width: 2.75rem;
  height: 2.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  cursor: pointer;
  padding: 0.125rem;
  flex-shrink: 0;
  background: none;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--border-radius);
}

.color-hex {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-family: monospace;
  text-transform: uppercase;
  min-height: 2.75rem;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* ── Certifications ── */
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.cert-item {
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
}

.cert-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}

.cert-icon-select {
  flex: 0 0 auto;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  min-height: 2.75rem;
  background: var(--bg-primary);
}

.cert-label-input {
  flex: 1;
  min-width: 6.25rem;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.cert-label-input:focus,
.cert-icon-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.cert-verified {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 2.75rem;
}

.cert-remove {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 1rem;
  cursor: pointer;
  padding: var(--spacing-2);
  min-height: 2.75rem;
  min-width: 2.75rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (hover: hover) {
  .cert-remove:hover {
    background: var(--color-error-bg, var(--color-error-bg));
  }
}

/* ── Toggles ── */
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
  cursor: pointer;
  min-height: 2.75rem;
}

.toggle-row:last-child {
  border-bottom: none;
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.toggle-input {
  width: 2.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* ── Shared buttons ── */
.btn-outline {
  align-self: flex-start;
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 0.625rem var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 2.75rem;
  transition:
    background 0.15s,
    color 0.15s;
}

@media (hover: hover) {
  .btn-outline:hover {
    background: var(--color-primary);
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
  min-height: 2.75rem;
  padding: 0.625rem 1.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

@media (hover: hover) {
  .btn-primary:hover {
    background: var(--color-primary-dark);
  }
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Responsive ── */
@media (min-width: 30em) {
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

@media (min-width: 48em) {
  .portal-page {
    padding: var(--spacing-6);
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .form-section {
    padding: var(--spacing-6);
  }

  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}

/* ── List transitions ── */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.list-move {
  transition: transform 0.25s ease;
}
</style>
