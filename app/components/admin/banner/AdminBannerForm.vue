<script setup lang="ts">
import type { BannerConfig, BannerLang } from '~/composables/admin/useAdminBanner'

const props = defineProps<{
  formData: BannerConfig
  saving: boolean
  showPreview: boolean
  quickEmojis: string[]
}>()

const emit = defineEmits<{
  (e: 'save' | 'toggle-preview'): void
  (e: 'open-emoji-picker', target: BannerLang): void
  (e: 'insert-emoji', emoji: string, target: BannerLang): void
  (e: 'update-field', key: keyof BannerConfig, value: string | boolean | null): void
}>()

function formatDatetimeLocal(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().slice(0, 16)
}

function parseDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}
</script>

<template>
  <div class="form-card">
    <!-- Spanish Text -->
    <div class="form-group">
      <label for="bannerEs">Texto Espanol</label>
      <div class="input-with-emoji">
        <div class="input-row">
          <input
            id="bannerEs"
            type="text"
            placeholder="Texto del aviso en espanol"
            :value="props.formData.text_es"
            @input="emit('update-field', 'text_es', ($event.target as HTMLInputElement).value)"
          >
          <button
            type="button"
            class="btn-emoji-picker"
            title="Seleccionar emoji"
            @click="emit('open-emoji-picker', 'es')"
          >
            &#x1F600;
          </button>
        </div>
        <div class="quick-emojis">
          <button
            v-for="emoji in props.quickEmojis"
            :key="emoji"
            class="emoji-btn-quick"
            type="button"
            :title="`Insertar ${emoji}`"
            @click="emit('insert-emoji', emoji, 'es')"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- English Text -->
    <div class="form-group">
      <label for="bannerEn">Texto Ingles</label>
      <div class="input-with-emoji">
        <div class="input-row">
          <input
            id="bannerEn"
            type="text"
            placeholder="Banner text in English"
            :value="props.formData.text_en"
            @input="emit('update-field', 'text_en', ($event.target as HTMLInputElement).value)"
          >
          <button
            type="button"
            class="btn-emoji-picker"
            title="Select emoji"
            @click="emit('open-emoji-picker', 'en')"
          >
            &#x1F600;
          </button>
        </div>
        <div class="quick-emojis">
          <button
            v-for="emoji in props.quickEmojis"
            :key="emoji"
            class="emoji-btn-quick"
            type="button"
            :title="`Insert ${emoji}`"
            @click="emit('insert-emoji', emoji, 'en')"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- URL -->
    <div class="form-group">
      <label for="bannerUrl">URL enlace (opcional)</label>
      <input
        id="bannerUrl"
        type="url"
        placeholder="https://..."
        :value="props.formData.url ?? ''"
        @input="emit('update-field', 'url', ($event.target as HTMLInputElement).value || null)"
      >
      <p class="form-hint">
        Si anades URL, aparecera "Mas informacion" / "More info" al final del texto
      </p>
    </div>

    <!-- Date Range -->
    <div class="form-row">
      <div class="form-group">
        <label for="bannerDesde">Publicar desde (opcional)</label>
        <input
          id="bannerDesde"
          type="datetime-local"
          :value="formatDatetimeLocal(props.formData.from_date)"
          @input="
            emit(
              'update-field',
              'from_date',
              parseDatetimeLocal(($event.target as HTMLInputElement).value),
            )
          "
        >
        <p class="form-hint">Vacio = activo inmediatamente</p>
      </div>
      <div class="form-group">
        <label for="bannerHasta">Publicar hasta (opcional)</label>
        <input
          id="bannerHasta"
          type="datetime-local"
          :value="formatDatetimeLocal(props.formData.to_date)"
          @input="
            emit(
              'update-field',
              'to_date',
              parseDatetimeLocal(($event.target as HTMLInputElement).value),
            )
          "
        >
        <p class="form-hint">Vacio = sin fecha de fin</p>
      </div>
    </div>

    <!-- Active Toggle -->
    <div class="form-group">
      <label class="checkbox-label toggle-label">
        <input
          type="checkbox"
          class="toggle-input"
          :checked="props.formData.active"
          @change="emit('update-field', 'active', ($event.target as HTMLInputElement).checked)"
        >
        <span class="toggle-switch" />
        <span class="toggle-text">Banner activo</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button class="btn-primary" :disabled="props.saving" @click="emit('save')">
        {{ props.saving ? $t('common.saving') : $t('common.save') }}
      </button>
      <button class="btn-secondary" type="button" @click="emit('toggle-preview')">
        {{ props.showPreview ? 'Ocultar preview' : 'Ver preview' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  max-width: 43.75rem;
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--spacing-2);
  color: var(--color-gray-700);
}

.form-group input[type='text'],
.form-group input[type='url'],
.form-group input[type='datetime-local'] {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.input-with-emoji {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.input-row {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.input-row input {
  flex: 1;
}

.btn-emoji-picker {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: all 0.15s;
}

.btn-emoji-picker:hover {
  background: var(--bg-tertiary);
  transform: scale(1.05);
}

.quick-emojis {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.emoji-btn-quick {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all 0.15s;
}

.emoji-btn-quick:hover {
  background: var(--bg-tertiary);
  transform: scale(1.1);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: var(--spacing-1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: relative;
  width: 3rem;
  height: 1.625rem;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-md);
  transition: background 0.2s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--bg-primary);
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-switch {
  background: var(--color-success);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.toggle-text {
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

@media (max-width: 48em) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-card {
    padding: var(--spacing-4);
  }

  .quick-emojis {
    max-width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: var(--spacing-2);
  }
}
</style>
