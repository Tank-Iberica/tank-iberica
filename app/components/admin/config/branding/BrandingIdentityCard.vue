<script setup lang="ts">
const props = defineProps<{
  name: Record<string, string>
  tagline: Record<string, string>
  metaDescription: Record<string, string>
}>()

const emit = defineEmits<{
  'update:name': [value: Record<string, string>]
  'update:tagline': [value: Record<string, string>]
  'update:metaDescription': [value: Record<string, string>]
}>()

function onInput(field: 'name' | 'tagline' | 'metaDescription', lang: string, value: string) {
  const source = props[field]
  const updated = { ...source, [lang]: value }
  if (field === 'name') emit('update:name', updated)
  else if (field === 'tagline') emit('update:tagline', updated)
  else emit('update:metaDescription', updated)
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Identidad</h3>
    <p class="card-subtitle">Nombre, lema y descripcion del sitio en cada idioma</p>

    <div class="form-group">
      <label>Nombre del sitio</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            type="text"
            :value="name.es"
            placeholder="Nombre en espanol"
            @input="onInput('name', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            type="text"
            :value="name.en"
            placeholder="Site name in English"
            @input="onInput('name', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Lema (tagline)</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            type="text"
            :value="tagline.es"
            placeholder="Lema en espanol"
            @input="onInput('tagline', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            type="text"
            :value="tagline.en"
            placeholder="Tagline in English"
            @input="onInput('tagline', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Meta description</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            type="text"
            :value="metaDescription.es"
            placeholder="Descripcion SEO en espanol"
            @input="onInput('metaDescription', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            type="text"
            :value="metaDescription.en"
            placeholder="SEO description in English"
            @input="onInput('metaDescription', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 1.25rem;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.lang-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lang-badge {
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-gray-500);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  padding: 0.25rem 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (min-width: 48em) {
  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
