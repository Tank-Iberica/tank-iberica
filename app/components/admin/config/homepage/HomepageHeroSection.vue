<script setup lang="ts">
defineProps<{
  heroTitle: Record<string, string>
  heroSubtitle: Record<string, string>
  heroCtaText: Record<string, string>
  heroCtaUrl: string
  heroImageUrl: string
}>()

const emit = defineEmits<{
  (e: 'update-title' | 'update-subtitle' | 'update-cta-text', lang: string, value: string): void
  (e: 'update-cta-url' | 'update-image-url', value: string): void
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Hero</h3>
    <p class="card-subtitle">Contenido principal de la pagina de inicio</p>

    <div class="form-group">
      <label>Titulo</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="heroTitle.es"
            type="text"
            placeholder="Titulo principal en espanol"
            @input="emit('update-title', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="heroTitle.en"
            type="text"
            placeholder="Main title in English"
            @input="emit('update-title', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Subtitulo</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="heroSubtitle.es"
            type="text"
            placeholder="Subtitulo en espanol"
            @input="emit('update-subtitle', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="heroSubtitle.en"
            type="text"
            placeholder="Subtitle in English"
            @input="emit('update-subtitle', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Texto del boton (CTA)</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            :value="heroCtaText.es"
            type="text"
            placeholder="Ver catalogo"
            @input="emit('update-cta-text', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            :value="heroCtaText.en"
            type="text"
            placeholder="View catalog"
            @input="emit('update-cta-text', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="hero_cta_url">URL del boton</label>
        <input
          id="hero_cta_url"
          :value="heroCtaUrl"
          type="text"
          placeholder="/catalogo"
          @input="emit('update-cta-url', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="hero_image_url">Imagen del hero (URL)</label>
        <input
          id="hero_image_url"
          :value="heroImageUrl"
          type="text"
          placeholder="https://res.cloudinary.com/..."
          @input="emit('update-image-url', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div v-if="heroImageUrl" class="image-preview">
      <img :src="heroImageUrl" alt="Hero preview" >
    </div>
  </div>
</template>

<style scoped>
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
