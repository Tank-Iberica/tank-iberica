<script setup lang="ts">
import type { BannerItem, BannerField } from '~/composables/admin/useAdminHomepage'

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
      No hay banners configurados. Anade el primero.
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
                  placeholder="#23424A"
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
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

.btn-add {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--color-primary-dark, #1a3238);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 0.875rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.banners-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.banner-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  background: #fafafa;
}

.banner-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.banner-index {
  font-weight: 700;
  font-size: 0.9rem;
  color: #6b7280;
}

.banner-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #374151;
  font-weight: 500;
}

.toggle-label-inline input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #23424a);
}

.btn-remove {
  background: none;
  border: 1px solid #fca5a5;
  color: #dc2626;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fef2f2;
}

.banner-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-group input[type='datetime-local']:focus {
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

.banner-row-colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.banner-row-dates {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-sm {
  width: 36px;
  height: 36px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-picker-sm::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-sm::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-hex-sm {
  flex: 1;
  padding: 7px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex-sm:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.banner-preview {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
}

@media (min-width: 480px) {
  .banner-row-dates {
    grid-template-columns: 1fr 1fr;
  }
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
