<script setup lang="ts">
defineProps<{
  logoUrl: string
  logoDarkUrl: string
  faviconUrl: string
  ogImageUrl: string
}>()

const emit = defineEmits<{
  (
    e: 'update:logoUrl' | 'update:logoDarkUrl' | 'update:faviconUrl' | 'update:ogImageUrl',
    value: string,
  ): void
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Logotipos e imagenes</h3>
    <p class="card-subtitle">URLs de los recursos graficos del sitio</p>

    <div class="form-group">
      <label for="logo_url">Logo principal (URL)</label>
      <input
        id="logo_url"
        type="text"
        :value="logoUrl"
        placeholder="https://res.cloudinary.com/..."
        @input="emit('update:logoUrl', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="logoUrl" class="image-preview">
        <img :src="logoUrl" alt="Logo preview" >
      </div>
    </div>

    <div class="form-group">
      <label for="logo_dark_url">Logo oscuro (URL)</label>
      <input
        id="logo_dark_url"
        type="text"
        :value="logoDarkUrl"
        placeholder="https://res.cloudinary.com/..."
        @input="emit('update:logoDarkUrl', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="logoDarkUrl" class="image-preview dark-preview">
        <img :src="logoDarkUrl" alt="Logo dark preview" >
      </div>
    </div>

    <div class="form-row-2col">
      <div class="form-group">
        <label for="favicon_url">Favicon (URL)</label>
        <input
          id="favicon_url"
          type="text"
          :value="faviconUrl"
          placeholder="https://..."
          @input="emit('update:faviconUrl', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label for="og_image_url">Imagen OG (URL)</label>
        <input
          id="og_image_url"
          type="text"
          :value="ogImageUrl"
          placeholder="https://..."
          @input="emit('update:ogImageUrl', ($event.target as HTMLInputElement).value)"
        >
      </div>
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

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.image-preview {
  margin-top: 8px;
  padding: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  text-align: center;
}

.image-preview.dark-preview {
  background: #1f2937;
}

.image-preview img {
  max-width: 200px;
  max-height: 60px;
  object-fit: contain;
}

@media (min-width: 768px) {
  .form-row-2col {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
