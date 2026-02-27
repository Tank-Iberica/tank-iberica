<script setup lang="ts">
const props = defineProps<{
  companyName: Record<string, string>
  logoUrl: string
  coverImageUrl: string
  themePrimary: string
  themeAccent: string
  bio: Record<string, string>
}>()

const emit = defineEmits<{
  'update:companyName': [value: Record<string, string>]
  'update:logoUrl': [value: string]
  'update:coverImageUrl': [value: string]
  'update:themePrimary': [value: string]
  'update:themeAccent': [value: string]
  'update:bio': [value: Record<string, string>]
  resetTheme: []
}>()

function updateCompanyNameLang(lang: string, value: string) {
  emit('update:companyName', { ...props.companyName, [lang]: value })
}

function updateBioLang(lang: string, value: string) {
  emit('update:bio', { ...props.bio, [lang]: value })
}
</script>

<template>
  <!-- SECTION 1: IDENTIDAD -->
  <div class="config-card">
    <h3 class="card-title">Identidad</h3>
    <p class="card-subtitle">Logo, imagen de portada y nombre de la empresa</p>

    <div class="form-group">
      <label>Nombre de la empresa</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="companyName.es"
            type="text"
            placeholder="Nombre en espanol"
            @input="updateCompanyNameLang('es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="companyName.en"
            type="text"
            placeholder="Company name in English"
            @input="updateCompanyNameLang('en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="dealer-logo-url">Logo (URL)</label>
      <input
        id="dealer-logo-url"
        :value="logoUrl"
        type="text"
        placeholder="https://res.cloudinary.com/..."
        @input="emit('update:logoUrl', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="logoUrl" class="image-preview">
        <img :src="logoUrl" alt="Logo preview" >
      </div>
    </div>

    <div class="form-group">
      <label for="dealer-cover-url">Imagen de portada (URL)</label>
      <input
        id="dealer-cover-url"
        :value="coverImageUrl"
        type="text"
        placeholder="https://res.cloudinary.com/..."
        @input="emit('update:coverImageUrl', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="coverImageUrl" class="image-preview">
        <img :src="coverImageUrl" alt="Cover image preview" class="cover-preview-img" >
      </div>
    </div>
  </div>

  <!-- SECTION 2: COLORES DE ACENTO -->
  <div class="config-card">
    <h3 class="card-title">Colores de acento</h3>
    <p class="card-subtitle">
      Personaliza los colores de tu portal. Se aplicaran sobre la base de Tracciona.
    </p>

    <div class="color-row">
      <div class="color-field">
        <label for="theme-primary">Color primario</label>
        <div class="color-input-wrapper">
          <input
            id="theme-primary"
            :value="themePrimary"
            type="color"
            class="color-picker"
            @input="emit('update:themePrimary', ($event.target as HTMLInputElement).value)"
          >
          <input
            :value="themePrimary"
            type="text"
            class="color-hex"
            maxlength="7"
            placeholder="#23424A"
            @input="emit('update:themePrimary', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>

      <div class="color-field">
        <label for="theme-accent">Color acento</label>
        <div class="color-input-wrapper">
          <input
            id="theme-accent"
            :value="themeAccent"
            type="color"
            class="color-picker"
            @input="emit('update:themeAccent', ($event.target as HTMLInputElement).value)"
          >
          <input
            :value="themeAccent"
            type="text"
            class="color-hex"
            maxlength="7"
            placeholder="#7FD1C8"
            @input="emit('update:themeAccent', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <button class="btn-outline" @click="emit('resetTheme')">Restaurar colores de Tracciona</button>
  </div>

  <!-- SECTION 3: SOBRE NOSOTROS -->
  <div class="config-card">
    <h3 class="card-title">Sobre nosotros</h3>
    <p class="card-subtitle">Descripcion de tu empresa que se mostrara en tu portal publico</p>

    <div class="form-group">
      <label>Biografia / Descripcion</label>
      <div class="lang-col">
        <div class="lang-field-block">
          <span class="lang-badge">ES</span>
          <textarea
            :value="bio.es"
            rows="4"
            placeholder="Descripcion de la empresa en espanol..."
            @input="updateBioLang('es', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="lang-field-block">
          <span class="lang-badge">EN</span>
          <textarea
            :value="bio.en"
            rows="4"
            placeholder="Company description in English..."
            @input="updateBioLang('en', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
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

.form-group input[type='text'] {
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

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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

/* Image preview */
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

/* Color section */
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

/* Responsive: 480px */
@media (min-width: 480px) {
  .color-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* Responsive: 768px */
@media (min-width: 768px) {
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
