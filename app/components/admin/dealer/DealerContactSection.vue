<script setup lang="ts">
import type { SelectOption } from '~/composables/admin/useAdminDealerConfig'

const props = defineProps<{
  phone: string
  email: string
  website: string
  address: string
  whatsapp: string
  phoneMode: string
  workingHours: Record<string, string>
  ctaText: Record<string, string>
  socialLinkedIn: string
  socialInstagram: string
  socialFacebook: string
  socialYouTube: string
  phoneModeOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:phone': [value: string]
  'update:email': [value: string]
  'update:website': [value: string]
  'update:address': [value: string]
  'update:whatsapp': [value: string]
  'update:phoneMode': [value: string]
  'update:workingHours': [value: Record<string, string>]
  'update:ctaText': [value: Record<string, string>]
  'update:socialLinkedIn': [value: string]
  'update:socialInstagram': [value: string]
  'update:socialFacebook': [value: string]
  'update:socialYouTube': [value: string]
}>()

function updateWorkingHoursLang(lang: string, value: string) {
  emit('update:workingHours', { ...props.workingHours, [lang]: value })
}

function updateCtaTextLang(lang: string, value: string) {
  emit('update:ctaText', { ...props.ctaText, [lang]: value })
}
</script>

<template>
  <!-- SECTION 4: CONTACTO -->
  <div class="config-card">
    <h3 class="card-title">Contacto</h3>
    <p class="card-subtitle">Informacion de contacto que veran tus clientes</p>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="dealer-phone">Telefono</label>
        <input
          id="dealer-phone"
          :value="phone"
          type="tel"
          placeholder="+34 600 000 000"
          @input="emit('update:phone', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="dealer-whatsapp">WhatsApp</label>
        <input
          id="dealer-whatsapp"
          :value="whatsapp"
          type="tel"
          placeholder="+34 600 000 000"
          @input="emit('update:whatsapp', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="dealer-email">Email</label>
        <input
          id="dealer-email"
          :value="email"
          type="email"
          placeholder="info@empresa.com"
          @input="emit('update:email', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="dealer-website">Sitio web</label>
        <input
          id="dealer-website"
          :value="website"
          type="url"
          placeholder="https://www.empresa.com"
          @input="emit('update:website', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div class="form-group">
      <label for="dealer-address">Direccion</label>
      <input
        id="dealer-address"
        :value="address"
        type="text"
        placeholder="Calle Ejemplo 123, Madrid, Espana"
        @input="emit('update:address', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <div class="form-group">
      <label for="dealer-phone-mode">Modo de telefono</label>
      <select
        id="dealer-phone-mode"
        :value="phoneMode"
        @change="emit('update:phoneMode', ($event.target as HTMLSelectElement).value)"
      >
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
          <input
            :value="workingHours.es"
            type="text"
            placeholder="Lun-Vie 9:00-18:00"
            @input="updateWorkingHoursLang('es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="workingHours.en"
            type="text"
            placeholder="Mon-Fri 9:00-18:00"
            @input="updateWorkingHoursLang('en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Texto del boton de contacto (CTA)</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="ctaText.es"
            type="text"
            placeholder="Solicitar informacion"
            @input="updateCtaTextLang('es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="ctaText.en"
            type="text"
            placeholder="Request information"
            @input="updateCtaTextLang('en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 5: REDES SOCIALES -->
  <div class="config-card">
    <h3 class="card-title">Redes sociales</h3>
    <p class="card-subtitle">Enlaces a tus perfiles en redes sociales</p>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="social-linkedin">LinkedIn</label>
        <input
          id="social-linkedin"
          :value="socialLinkedIn"
          type="url"
          placeholder="https://linkedin.com/company/..."
          @input="emit('update:socialLinkedIn', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="social-instagram">Instagram</label>
        <input
          id="social-instagram"
          :value="socialInstagram"
          type="url"
          placeholder="https://instagram.com/..."
          @input="emit('update:socialInstagram', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="social-facebook">Facebook</label>
        <input
          id="social-facebook"
          :value="socialFacebook"
          type="url"
          placeholder="https://facebook.com/..."
          @input="emit('update:socialFacebook', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="social-youtube">YouTube</label>
        <input
          id="social-youtube"
          :value="socialYouTube"
          type="url"
          placeholder="https://youtube.com/@..."
          @input="emit('update:socialYouTube', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.form-group select {
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
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Two column form row (stacks on mobile) */
.form-row-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

/* Language rows */
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

/* Responsive: 768px */
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
}

/* Responsive: 1024px */
@media (min-width: 1024px) {
  .config-card {
    padding: var(--spacing-8);
  }
}
</style>
