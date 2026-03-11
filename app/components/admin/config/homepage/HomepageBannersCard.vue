<script setup lang="ts">
import type { BannerItem, BannerField } from '~/composables/admin/useAdminHomepage'
const { t } = useI18n()

defineProps<{
  banners: BannerItem[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'update-field', index: number, field: BannerField, value: string | boolean): void
}>()
</script>

<template>
  <div class="config-card">
    <div class="card-header-row">
      <div>
        <h3 class="card-title">Banners</h3>
        <p class="card-subtitle">Banners promocionales con programacion de fechas</p>
      </div>
      <button class="btn-add" @click="emit('add')">+ Anadir banner</button>
    </div>

    <div v-if="banners.length === 0" class="empty-state">
      {{ t('admin.configHomepage.noBanners') }}
    </div>

    <div v-else class="banners-list">
      <div v-for="(banner, index) in banners" :key="banner.id" class="banner-item">
        <div class="banner-item-header">
          <span class="banner-index">#{{ index + 1 }}</span>
          <div class="banner-header-actions">
            <label class="toggle-label-inline">
              <input
                :checked="banner.active"
                type="checkbox"
                @change="
                  emit('update-field', index, 'active', ($event.target as HTMLInputElement).checked)
                "
              >
              <span>{{ banner.active ? 'Activo' : 'Inactivo' }}</span>
            </label>
            <button class="btn-remove" title="Eliminar" @click="emit('remove', index)">
              \u00D7
            </button>
          </div>
        </div>

        <div class="banner-fields">
          <div class="form-group">
            <label>Contenido</label>
            <div class="lang-row">
              <div class="lang-field">
                <span class="lang-badge">ES</span>
                <input
                  :value="banner.content_es"
                  type="text"
                  placeholder="Texto del banner en espanol"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'content_es',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
              </div>
              <div class="lang-field">
                <span class="lang-badge">EN</span>
                <input
                  :value="banner.content_en"
                  type="text"
                  placeholder="Banner text in English"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'content_en',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>URL de enlace</label>
            <input
              :value="banner.url"
              type="text"
              placeholder="https://... o /ruta"
              @input="emit('update-field', index, 'url', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <div class="banner-row-colors">
            <div class="form-group">
              <label>Color de fondo</label>
              <div class="color-input-wrapper">
                <input
                  :value="banner.bg_color"
                  type="color"
                  class="color-picker-sm"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'bg_color',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
                <input
                  :value="banner.bg_color"
                  type="text"
                  class="color-hex-sm"
                  maxlength="7"
                  placeholder="var(--color-primary)"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'bg_color',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
              </div>
            </div>
            <div class="form-group">
              <label>Color del texto</label>
              <div class="color-input-wrapper">
                <input
                  :value="banner.text_color"
                  type="color"
                  class="color-picker-sm"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'text_color',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
                <input
                  :value="banner.text_color"
                  type="text"
                  class="color-hex-sm"
                  maxlength="7"
                  placeholder="#FFFFFF"
                  @input="
                    emit(
                      'update-field',
                      index,
                      'text_color',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                >
              </div>
            </div>
          </div>

          <div class="banner-row-dates">
            <div class="form-group">
              <label>Fecha inicio</label>
              <input
                :value="banner.starts_at"
                type="datetime-local"
                @input="
                  emit(
                    'update-field',
                    index,
                    'starts_at',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              >
            </div>
            <div class="form-group">
              <label>Fecha fin</label>
              <input
                :value="banner.ends_at"
                type="datetime-local"
                @input="
                  emit('update-field', index, 'ends_at', ($event.target as HTMLInputElement).value)
                "
              >
            </div>
          </div>

          <!-- Banner preview -->
          <div
            v-if="banner.content_es || banner.content_en"
            class="banner-preview"
            :style="{ backgroundColor: banner.bg_color, color: banner.text_color }"
          >
            {{ banner.content_es || banner.content_en }}
          </div>
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

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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

.btn-add {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--color-primary-dark);
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-disabled);
  font-size: 0.875rem;
  border: 1px dashed var(--border-color-light);
  border-radius: var(--border-radius);
}

.banners-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.banner-item {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  background: var(--color-gray-50);
}

.banner-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--bg-tertiary);
}

.banner-index {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-gray-500);
}

.banner-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label-inline {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-gray-700);
  font-weight: 500;
}

.toggle-label-inline input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.btn-remove {
  background: none;
  border: 1px solid var(--color-error-soft);
  color: var(--color-error);
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--color-error-bg);
}

.banner-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.form-group input[type='text'] {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-group input[type='datetime-local']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
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

.banner-row-colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.banner-row-dates {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-picker-sm {
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  padding: 0.125rem;
  flex-shrink: 0;
}

.color-picker-sm::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-sm::-webkit-color-swatch {
  border: none;
  border-radius: var(--border-radius-sm);
}

.color-hex-sm {
  flex: 1;
  padding: 0.4375rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex-sm:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

.banner-preview {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  margin-top: 0.25rem;
}

@media (min-width: 30em) {
  .banner-row-dates {
    grid-template-columns: 1fr 1fr;
  }
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
