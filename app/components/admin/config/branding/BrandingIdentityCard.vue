<script setup lang="ts">
const props = defineProps<{
  name: Record<string, string>
  tagline: Record<string, string>
  metaDescription: Record<string, string>
}>()

const emit = defineEmits<{
  (
    e: 'update:name' | 'update:tagline' | 'update:metaDescription',
    value: Record<string, string>,
  ): void
}>()

function onInput(field: 'name' | 'tagline' | 'metaDescription', lang: string, value: string) {
  const source = props[field]
  const key = field === 'metaDescription' ? 'update:metaDescription' : (`update:${field}` as const)
  emit(key, { ...source, [lang]: value })
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
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 4px 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (min-width: 768px) {
  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
