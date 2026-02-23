<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const saving = ref(false)
const saved = ref(false)
const error = ref<string | null>(null)
const loading = ref(true)
const dealerExists = ref(true)
const dealerId = ref<string | null>(null)
const dealerSlug = ref<string>('')

// --- IDENTITY ---
const logoUrl = ref('')
const coverImageUrl = ref('')
const companyName = ref<Record<string, string>>({ es: '', en: '' })

// --- THEME ---
const themePrimary = ref('#23424A')
const themeAccent = ref('#7FD1C8')

// --- BIO ---
const bio = ref<Record<string, string>>({ es: '', en: '' })

// --- CONTACT ---
const phone = ref('')
const email = ref('')
const website = ref('')
const address = ref('')
const whatsapp = ref('')
const workingHours = ref<Record<string, string>>({ es: '', en: '' })
const phoneMode = ref<'visible' | 'click_to_reveal' | 'form_only'>('visible')
const ctaText = ref<Record<string, string>>({ es: '', en: '' })

// --- SOCIAL LINKS ---
const socialLinkedIn = ref('')
const socialInstagram = ref('')
const socialFacebook = ref('')
const socialYouTube = ref('')

// --- CERTIFICATIONS ---
interface Certification {
  id: string
  label: Record<string, string>
  icon: 'badge' | 'shield' | 'star'
  verified: boolean
}
const certifications = ref<Certification[]>([])

// --- CATALOG ---
const catalogSort = ref<'newest' | 'price_asc' | 'price_desc' | 'featured_first'>('newest')
const pinnedVehicles = ref<string[]>([])
const newPinnedUUID = ref('')

// --- AUTO REPLY ---
const autoReplyMessage = ref<Record<string, string>>({ es: '', en: '' })

// --- NOTIFICATIONS ---
const emailOnLead = ref(false)
const emailOnSale = ref(false)
const emailWeeklyStats = ref(false)
const emailAuctionUpdates = ref(false)

// Icon options for certifications
const iconOptions: { value: 'badge' | 'shield' | 'star'; label: string }[] = [
  { value: 'badge', label: 'Insignia' },
  { value: 'shield', label: 'Escudo' },
  { value: 'star', label: 'Estrella' },
]

// Sort options for catalog
const sortOptions: { value: string; label: string }[] = [
  { value: 'newest', label: 'Mas recientes primero' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'featured_first', label: 'Destacados primero' },
]

// Phone mode options
const phoneModeOptions: { value: string; label: string }[] = [
  { value: 'visible', label: 'Visible siempre' },
  { value: 'click_to_reveal', label: 'Click para revelar' },
  { value: 'form_only', label: 'Solo formulario' },
]

// --- INIT ---
function initForm(data: Record<string, unknown>) {
  dealerSlug.value = (data.slug as string) || ''

  // Identity
  logoUrl.value = (data.logo_url as string) || ''
  coverImageUrl.value = (data.cover_image_url as string) || ''
  const cn = (data.company_name as Record<string, string>) || {}
  companyName.value = { es: cn.es || '', en: cn.en || '' }

  // Theme
  const th = (data.theme as Record<string, string>) || {}
  themePrimary.value = th.primary || '#23424A'
  themeAccent.value = th.accent || '#7FD1C8'

  // Bio
  const b = (data.bio as Record<string, string>) || {}
  bio.value = { es: b.es || '', en: b.en || '' }

  // Contact
  phone.value = (data.phone as string) || ''
  email.value = (data.email as string) || ''
  website.value = (data.website as string) || ''
  address.value = (data.address as string) || ''
  whatsapp.value = (data.whatsapp as string) || ''
  const cc = (data.contact_config as Record<string, unknown>) || {}
  phoneMode.value = (cc.phone_mode as 'visible' | 'click_to_reveal' | 'form_only') || 'visible'
  const wh = (cc.working_hours as Record<string, string>) || {}
  workingHours.value = { es: wh.es || '', en: wh.en || '' }
  const cta = (cc.cta_text as Record<string, string>) || {}
  ctaText.value = { es: cta.es || '', en: cta.en || '' }

  // Social links
  const sl = (data.social_links as Record<string, string>) || {}
  socialLinkedIn.value = sl.linkedin || ''
  socialInstagram.value = sl.instagram || ''
  socialFacebook.value = sl.facebook || ''
  socialYouTube.value = sl.youtube || ''

  // Certifications
  const certs = (data.certifications as Certification[]) || []
  certifications.value = certs.map((c) => ({
    id: c.id || crypto.randomUUID(),
    label: { es: c.label?.es || '', en: c.label?.en || '' },
    icon: c.icon || 'badge',
    verified: c.verified ?? false,
  }))

  // Catalog
  catalogSort.value = (data.catalog_sort as typeof catalogSort.value) || 'newest'
  pinnedVehicles.value = (data.pinned_vehicles as string[]) || []

  // Auto reply
  const ar = (data.auto_reply_message as Record<string, string>) || {}
  autoReplyMessage.value = { es: ar.es || '', en: ar.en || '' }

  // Notifications
  const nc = (data.notification_config as Record<string, boolean>) || {}
  emailOnLead.value = nc.email_on_lead ?? false
  emailOnSale.value = nc.email_on_sale ?? false
  emailWeeklyStats.value = nc.email_weekly_stats ?? false
  emailAuctionUpdates.value = nc.email_auction_updates ?? false
}

onMounted(async () => {
  if (!user.value?.id) {
    loading.value = false
    dealerExists.value = false
    return
  }

  const { data, error: fetchError } = await supabase
    .from('dealers')
    .select('*')
    .eq('user_id', user.value.id)
    .single()

  loading.value = false

  if (fetchError || !data) {
    dealerExists.value = false
    return
  }

  dealerExists.value = true
  dealerId.value = (data as Record<string, unknown>).id as string
  initForm(data as Record<string, unknown>)
})

// --- CERTIFICATIONS MANAGEMENT ---
function addCertification() {
  certifications.value.push({
    id: crypto.randomUUID(),
    label: { es: '', en: '' },
    icon: 'badge',
    verified: false,
  })
}

function removeCertification(id: string) {
  certifications.value = certifications.value.filter((c) => c.id !== id)
}

// --- PINNED VEHICLES ---
function addPinnedVehicle() {
  const uuid = newPinnedUUID.value.trim()
  if (!uuid) return
  // Basic UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    error.value = 'El UUID introducido no tiene un formato valido'
    return
  }
  if (pinnedVehicles.value.includes(uuid)) {
    error.value = 'Este vehiculo ya esta fijado'
    return
  }
  pinnedVehicles.value.push(uuid)
  newPinnedUUID.value = ''
  error.value = null
}

function removePinnedVehicle(uuid: string) {
  pinnedVehicles.value = pinnedVehicles.value.filter((v) => v !== uuid)
}

// --- THEME RESET ---
function resetThemeColors() {
  themePrimary.value = '#23424A'
  themeAccent.value = '#7FD1C8'
}

// --- SAVE ---
async function handleSave() {
  if (!dealerId.value) return

  saving.value = true
  saved.value = false
  error.value = null

  const updatePayload = {
    logo_url: logoUrl.value || null,
    cover_image_url: coverImageUrl.value || null,
    company_name: companyName.value,
    theme: {
      primary: themePrimary.value,
      accent: themeAccent.value,
    },
    bio: bio.value,
    phone: phone.value || null,
    email: email.value || null,
    website: website.value || null,
    address: address.value || null,
    whatsapp: whatsapp.value || null,
    contact_config: {
      phone_mode: phoneMode.value,
      working_hours: workingHours.value,
      cta_text: ctaText.value,
    },
    social_links: {
      linkedin: socialLinkedIn.value || null,
      instagram: socialInstagram.value || null,
      facebook: socialFacebook.value || null,
      youtube: socialYouTube.value || null,
    },
    certifications: certifications.value.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      verified: c.verified,
    })),
    catalog_sort: catalogSort.value,
    pinned_vehicles: pinnedVehicles.value,
    auto_reply_message: autoReplyMessage.value,
    notification_config: {
      email_on_lead: emailOnLead.value,
      email_on_sale: emailOnSale.value,
      email_weekly_stats: emailWeeklyStats.value,
      email_auction_updates: emailAuctionUpdates.value,
    },
  }

  const { error: updateError } = await supabase
    .from('dealers')
    .update(updatePayload)
    .eq('id', dealerId.value)

  saving.value = false

  if (updateError) {
    error.value = updateError.message
    return
  }

  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 3000)
}
</script>

<template>
  <div class="dealer-config">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Configuracion del portal de dealer</h2>
        <p class="page-subtitle">
          Personaliza tu perfil publico, contacto, catalogo y notificaciones
        </p>
      </div>
      <NuxtLink to="/admin" class="btn-back"> Volver </NuxtLink>
    </div>

    <!-- Feedback banners -->
    <div v-if="error" class="feedback-banner error-banner">
      {{ error }}
    </div>
    <div v-if="saved" class="feedback-banner success-banner">Cambios guardados correctamente</div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando perfil de dealer...</div>

    <!-- No dealer profile -->
    <div v-else-if="!dealerExists" class="empty-state">
      <div class="empty-state-icon">!</div>
      <p>No tienes un perfil de dealer</p>
      <span class="empty-state-hint">
        Contacta con el administrador para crear tu perfil de dealer.
      </span>
    </div>

    <!-- Main form -->
    <template v-else>
      <!-- ============================================
           SECTION 1: IDENTIDAD
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Identidad</h3>
        <p class="card-subtitle">Logo, imagen de portada y nombre de la empresa</p>

        <div class="form-group">
          <label>Nombre de la empresa</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="companyName.es" type="text" placeholder="Nombre en espanol" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="companyName.en" type="text" placeholder="Company name in English" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="dealer-logo-url">Logo (URL)</label>
          <input
            id="dealer-logo-url"
            v-model="logoUrl"
            type="text"
            placeholder="https://res.cloudinary.com/..."
          >
          <div v-if="logoUrl" class="image-preview">
            <img :src="logoUrl" alt="Logo preview" >
          </div>
        </div>

        <div class="form-group">
          <label for="dealer-cover-url">Imagen de portada (URL)</label>
          <input
            id="dealer-cover-url"
            v-model="coverImageUrl"
            type="text"
            placeholder="https://res.cloudinary.com/..."
          >
          <div v-if="coverImageUrl" class="image-preview">
            <img :src="coverImageUrl" alt="Cover image preview" class="cover-preview-img" >
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 2: COLORES DE ACENTO
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Colores de acento</h3>
        <p class="card-subtitle">
          Personaliza los colores de tu portal. Se aplicaran sobre la base de Tracciona.
        </p>

        <div class="color-row">
          <div class="color-field">
            <label for="theme-primary">Color primario</label>
            <div class="color-input-wrapper">
              <input id="theme-primary" v-model="themePrimary" type="color" class="color-picker" >
              <input
                v-model="themePrimary"
                type="text"
                class="color-hex"
                maxlength="7"
                placeholder="#23424A"
              >
            </div>
          </div>

          <div class="color-field">
            <label for="theme-accent">Color acento</label>
            <div class="color-input-wrapper">
              <input id="theme-accent" v-model="themeAccent" type="color" class="color-picker" >
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

        <button class="btn-outline" @click="resetThemeColors">
          Restaurar colores de Tracciona
        </button>
      </div>

      <!-- ============================================
           SECTION 3: SOBRE NOSOTROS
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Sobre nosotros</h3>
        <p class="card-subtitle">Descripcion de tu empresa que se mostrara en tu portal publico</p>

        <div class="form-group">
          <label>Biografia / Descripcion</label>
          <div class="lang-col">
            <div class="lang-field-block">
              <span class="lang-badge">ES</span>
              <textarea
                v-model="bio.es"
                rows="4"
                placeholder="Descripcion de la empresa en espanol..."
              />
            </div>
            <div class="lang-field-block">
              <span class="lang-badge">EN</span>
              <textarea v-model="bio.en" rows="4" placeholder="Company description in English..." />
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 4: CONTACTO
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Contacto</h3>
        <p class="card-subtitle">Informacion de contacto que veran tus clientes</p>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="dealer-phone">Telefono</label>
            <input id="dealer-phone" v-model="phone" type="tel" placeholder="+34 600 000 000" >
          </div>
          <div class="form-group">
            <label for="dealer-whatsapp">WhatsApp</label>
            <input
              id="dealer-whatsapp"
              v-model="whatsapp"
              type="tel"
              placeholder="+34 600 000 000"
            >
          </div>
        </div>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="dealer-email">Email</label>
            <input id="dealer-email" v-model="email" type="email" placeholder="info@empresa.com" >
          </div>
          <div class="form-group">
            <label for="dealer-website">Sitio web</label>
            <input
              id="dealer-website"
              v-model="website"
              type="url"
              placeholder="https://www.empresa.com"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="dealer-address">Direccion</label>
          <input
            id="dealer-address"
            v-model="address"
            type="text"
            placeholder="Calle Ejemplo 123, Madrid, Espana"
          >
        </div>

        <div class="form-group">
          <label for="dealer-phone-mode">Modo de telefono</label>
          <select id="dealer-phone-mode" v-model="phoneMode">
            <option v-for="opt in phoneModeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Horario de atencion</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="workingHours.es" type="text" placeholder="Lun-Vie 9:00-18:00" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="workingHours.en" type="text" placeholder="Mon-Fri 9:00-18:00" >
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Texto del boton de contacto (CTA)</label>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="ctaText.es" type="text" placeholder="Solicitar informacion" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="ctaText.en" type="text" placeholder="Request information" >
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 5: REDES SOCIALES
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Redes sociales</h3>
        <p class="card-subtitle">Enlaces a tus perfiles en redes sociales</p>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="social-linkedin">LinkedIn</label>
            <input
              id="social-linkedin"
              v-model="socialLinkedIn"
              type="url"
              placeholder="https://linkedin.com/company/..."
            >
          </div>
          <div class="form-group">
            <label for="social-instagram">Instagram</label>
            <input
              id="social-instagram"
              v-model="socialInstagram"
              type="url"
              placeholder="https://instagram.com/..."
            >
          </div>
        </div>

        <div class="form-row-2col">
          <div class="form-group">
            <label for="social-facebook">Facebook</label>
            <input
              id="social-facebook"
              v-model="socialFacebook"
              type="url"
              placeholder="https://facebook.com/..."
            >
          </div>
          <div class="form-group">
            <label for="social-youtube">YouTube</label>
            <input
              id="social-youtube"
              v-model="socialYouTube"
              type="url"
              placeholder="https://youtube.com/@..."
            >
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 6: CERTIFICACIONES
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Certificaciones</h3>
        <p class="card-subtitle">
          Anade certificaciones y sellos de confianza para mostrar en tu portal
        </p>

        <div v-if="certifications.length === 0" class="empty-list">
          Sin certificaciones. Pulsa el boton para anadir una.
        </div>

        <div v-for="cert in certifications" :key="cert.id" class="cert-item">
          <div class="cert-header">
            <div class="cert-controls">
              <select v-model="cert.icon" class="cert-icon-select">
                <option v-for="ico in iconOptions" :key="ico.value" :value="ico.value">
                  {{ ico.label }}
                </option>
              </select>
              <label class="cert-verified">
                <input v-model="cert.verified" type="checkbox" >
                Verificada
              </label>
            </div>
            <button
              class="btn-remove"
              title="Eliminar certificacion"
              @click="removeCertification(cert.id)"
            >
              Eliminar
            </button>
          </div>
          <div class="lang-row">
            <div class="lang-field">
              <span class="lang-badge">ES</span>
              <input v-model="cert.label.es" type="text" placeholder="Nombre de la certificacion" >
            </div>
            <div class="lang-field">
              <span class="lang-badge">EN</span>
              <input v-model="cert.label.en" type="text" placeholder="Certification name" >
            </div>
          </div>
        </div>

        <button class="btn-add-item" @click="addCertification">+ Anadir certificacion</button>
      </div>

      <!-- ============================================
           SECTION 7: CATALOGO
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Catalogo</h3>
        <p class="card-subtitle">Configura el orden de tu catalogo y fija vehiculos destacados</p>

        <div class="form-group">
          <label for="catalog-sort">Orden por defecto</label>
          <select id="catalog-sort" v-model="catalogSort">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Vehiculos fijados</label>
          <div v-if="pinnedVehicles.length === 0" class="empty-list">Sin vehiculos fijados.</div>
          <div v-for="uuid in pinnedVehicles" :key="uuid" class="pinned-item">
            <span class="pinned-uuid">{{ uuid }}</span>
            <button
              class="btn-remove-sm"
              title="Quitar vehiculo fijado"
              @click="removePinnedVehicle(uuid)"
            >
              Quitar
            </button>
          </div>
          <div class="pin-input-row">
            <input
              v-model="newPinnedUUID"
              type="text"
              placeholder="UUID del vehiculo a fijar"
              @keyup.enter="addPinnedVehicle"
            >
            <button class="btn-add-inline" @click="addPinnedVehicle">Fijar vehiculo</button>
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 8: RESPUESTA AUTOMATICA
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Respuesta automatica</h3>
        <p class="card-subtitle">
          Mensaje que se envia automaticamente cuando un cliente te contacta
        </p>

        <div class="form-group">
          <div class="lang-col">
            <div class="lang-field-block">
              <span class="lang-badge">ES</span>
              <textarea
                v-model="autoReplyMessage.es"
                rows="3"
                placeholder="Gracias por tu interes. Nos pondremos en contacto contigo lo antes posible."
              />
            </div>
            <div class="lang-field-block">
              <span class="lang-badge">EN</span>
              <textarea
                v-model="autoReplyMessage.en"
                rows="3"
                placeholder="Thank you for your interest. We will get back to you as soon as possible."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================
           SECTION 9: NOTIFICACIONES
           ============================================ -->
      <div class="config-card">
        <h3 class="card-title">Notificaciones</h3>
        <p class="card-subtitle">Elige que notificaciones por email quieres recibir</p>

        <div class="notification-list">
          <label class="notification-item">
            <input v-model="emailOnLead" type="checkbox" >
            <div class="notification-text">
              <strong>Nuevo lead</strong>
              <span>Recibir email cuando un cliente solicita informacion</span>
            </div>
          </label>

          <label class="notification-item">
            <input v-model="emailOnSale" type="checkbox" >
            <div class="notification-text">
              <strong>Nueva venta</strong>
              <span>Recibir email cuando se registra una venta</span>
            </div>
          </label>

          <label class="notification-item">
            <input v-model="emailWeeklyStats" type="checkbox" >
            <div class="notification-text">
              <strong>Resumen semanal</strong>
              <span>Recibir un resumen semanal de estadisticas</span>
            </div>
          </label>

          <label class="notification-item">
            <input v-model="emailAuctionUpdates" type="checkbox" >
            <div class="notification-text">
              <strong>Actualizaciones de subastas</strong>
              <span>Recibir notificaciones sobre pujas y subastas</span>
            </div>
          </label>
        </div>
      </div>

      <!-- ============================================
           BOTTOM BAR: Preview + Save
           ============================================ -->
      <div class="bottom-bar">
        <NuxtLink v-if="dealerSlug" :to="`/${dealerSlug}`" target="_blank" class="btn-preview">
          Ver portal publico
        </NuxtLink>
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ================================================
   Dealer Config — Mobile-first (base = 360px)
   ================================================ */

.dealer-config {
  padding: 0;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 100px;
}

/* --- Page header --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.page-header h2 {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: var(--font-weight-bold);
}

.page-subtitle {
  margin: 0;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--color-gray-300);
}

/* --- Feedback banners --- */
.feedback-banner {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm);
}

.error-banner {
  background: #fef2f2;
  color: var(--color-error);
}

.success-banner {
  background: #f0fdf4;
  color: var(--color-success);
}

/* --- Loading / Empty states --- */
.loading-state {
  text-align: center;
  padding: var(--spacing-12);
  color: var(--text-auxiliary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-6);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--spacing-4);
  background: var(--color-gray-100);
  color: var(--text-auxiliary);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.empty-state p {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2);
}

.empty-state-hint {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* --- Config cards --- */
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* --- Form elements --- */
.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='url'],
.form-group input[type='tel'],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* --- Two column form row (stacks on mobile) --- */
.form-row-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* --- Language rows --- */
.lang-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.lang-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.lang-badge {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-1) 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 44px;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Language column layout for textareas */
.lang-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.lang-field-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.lang-field-block .lang-badge {
  align-self: flex-start;
}

.lang-field-block textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  resize: vertical;
  min-height: 80px;
  font-family: var(--font-family);
}

.lang-field-block textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* --- Image preview --- */
.image-preview {
  margin-top: var(--spacing-2);
  padding: var(--spacing-3);
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
  text-align: center;
}

.image-preview img {
  max-width: 200px;
  max-height: 60px;
  object-fit: contain;
  margin: 0 auto;
}

.image-preview .cover-preview-img {
  max-width: 100%;
  max-height: 120px;
}

/* --- Color section --- */
.color-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.color-field label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-1);
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.color-picker {
  width: 44px;
  height: 44px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--border-radius-sm);
}

.color-hex {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: monospace;
  text-transform: uppercase;
  min-height: 44px;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--bg-primary);
}

/* --- Certifications --- */
.empty-list {
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.cert-item {
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.cert-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.cert-icon-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 44px;
  background: var(--bg-primary);
}

.cert-verified {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 44px;
}

.cert-verified input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-remove {
  background: #fef2f2;
  color: var(--color-error);
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
}

.btn-remove:hover {
  background: #fee2e2;
}

.btn-add-item {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  width: 100%;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-add-item:hover {
  background: var(--color-primary-dark);
}

/* --- Pinned vehicles --- */
.pinned-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-2);
}

.pinned-uuid {
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: var(--spacing-2);
}

.btn-remove-sm {
  background: #fef2f2;
  color: var(--color-error);
  border: none;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  min-height: 44px;
}

.btn-remove-sm:hover {
  background: #fee2e2;
}

.pin-input-row {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.pin-input-row input {
  flex: 1;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-family: monospace;
  min-height: 44px;
}

.pin-input-row input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-add-inline {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-add-inline:hover {
  background: var(--color-primary-dark);
}

/* --- Notifications --- */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  min-height: 44px;
}

.notification-item:hover {
  background: var(--color-gray-50);
  border-color: var(--border-color);
}

.notification-item input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notification-text strong {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.notification-text span {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* --- Bottom bar (sticky on mobile) --- */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color-light);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: var(--z-sticky);
}

.btn-preview {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.btn-preview:hover {
  background: var(--color-primary);
  color: var(--bg-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--bg-primary);
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================
   Responsive: 480px — large mobile / landscape
   ================================================ */
@media (min-width: 480px) {
  .color-row {
    grid-template-columns: 1fr 1fr;
  }

  .page-header h2 {
    font-size: var(--font-size-2xl);
  }
}

/* ================================================
   Responsive: 768px — tablet
   ================================================ */
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

  .config-card {
    padding: var(--spacing-6);
  }

  .bottom-bar {
    position: static;
    background: transparent;
    border-top: none;
    box-shadow: none;
    padding: var(--spacing-6) 0;
  }

  .dealer-config {
    padding-bottom: 0;
  }
}

/* ================================================
   Responsive: 1024px — desktop
   ================================================ */
@media (min-width: 1024px) {
  .config-card {
    padding: var(--spacing-8);
  }
}
</style>
