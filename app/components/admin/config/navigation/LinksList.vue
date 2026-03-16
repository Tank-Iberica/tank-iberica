<script setup lang="ts">
import type { LinkItem, LinkField } from '~/composables/admin/useAdminNavigation'

defineProps<{
  links: LinkItem[]
  placeholderEs: string
  placeholderEn: string
  placeholderUrl: string
  emptyMessage: string
}>()

const emit = defineEmits<{
  (e: 'move', index: number, direction: -1 | 1): void
  (e: 'remove', index: number): void
  (e: 'update-field', index: number, field: LinkField, value: string | boolean): void
}>()
</script>

<template>
  <div v-if="links.length === 0" class="empty-links">
    {{ emptyMessage }}
  </div>

  <!-- Desktop table -->
  <div v-else class="links-table-wrapper">
    <table class="links-table">
      <thead>
        <tr>
          <th class="th-order">Orden</th>
          <th>Label ES</th>
          <th>Label EN</th>
          <th>URL</th>
          <th class="th-toggle">Visible</th>
          <th class="th-actions">{{ $t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(link, index) in links" :key="index">
          <td class="td-order">
            <div class="order-buttons">
              <button
                class="btn-icon-sm"
                :disabled="index === 0"
                title="Subir"
                @click="emit('move', index, -1)"
              >
                &#x25B2;
              </button>
              <button
                class="btn-icon-sm"
                :disabled="index === links.length - 1"
                title="Bajar"
                @click="emit('move', index, 1)"
              >
                &#x25BC;
              </button>
            </div>
          </td>
          <td>
            <input
              type="text"
              :value="link.label_es"
              :placeholder="placeholderEs"
              @input="
                emit('update-field', index, 'label_es', ($event.target as HTMLInputElement).value)
              "
            >
          </td>
          <td>
            <input
              type="text"
              :value="link.label_en"
              :placeholder="placeholderEn"
              @input="
                emit('update-field', index, 'label_en', ($event.target as HTMLInputElement).value)
              "
            >
          </td>
          <td>
            <input
              type="text"
              :value="link.url"
              :placeholder="placeholderUrl"
              @input="emit('update-field', index, 'url', ($event.target as HTMLInputElement).value)"
            >
          </td>
          <td class="td-toggle">
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="link.visible"
                @change="
                  emit(
                    'update-field',
                    index,
                    'visible',
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              >
              <span class="toggle-slider" />
            </label>
          </td>
          <td class="td-actions">
            <button class="btn-remove" title="Eliminar" @click="emit('remove', index)">
              &times;
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile card version -->
  <div v-if="links.length" class="links-cards-mobile">
    <div v-for="(link, index) in links" :key="index" class="link-card-mobile">
      <div class="link-card-header">
        <span class="link-card-index">#{{ index + 1 }}</span>
        <div class="link-card-actions">
          <button class="btn-icon-sm" :disabled="index === 0" @click="emit('move', index, -1)">
            &#x25B2;
          </button>
          <button
            class="btn-icon-sm"
            :disabled="index === links.length - 1"
            @click="emit('move', index, 1)"
          >
            &#x25BC;
          </button>
          <button class="btn-remove" @click="emit('remove', index)">&times;</button>
        </div>
      </div>
      <div class="link-card-fields">
        <div class="form-group-sm">
          <label>ES</label>
          <input
            type="text"
            :value="link.label_es"
            :placeholder="placeholderEs"
            @input="
              emit('update-field', index, 'label_es', ($event.target as HTMLInputElement).value)
            "
          >
        </div>
        <div class="form-group-sm">
          <label>EN</label>
          <input
            type="text"
            :value="link.label_en"
            :placeholder="placeholderEn"
            @input="
              emit('update-field', index, 'label_en', ($event.target as HTMLInputElement).value)
            "
          >
        </div>
        <div class="form-group-sm">
          <label>URL</label>
          <input
            type="text"
            :value="link.url"
            :placeholder="placeholderUrl"
            @input="emit('update-field', index, 'url', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="form-group-sm">
          <label class="toggle-label-mobile">
            <input
              type="checkbox"
              :checked="link.visible"
              @change="
                emit('update-field', index, 'visible', ($event.target as HTMLInputElement).checked)
              "
            >
            <span>Visible</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-links {
  text-align: center;
  padding: var(--spacing-6);
  color: var(--text-disabled);
  font-size: 0.875rem;
  border: 1px dashed var(--border-color-light);
  border-radius: var(--border-radius);
}

/* Links table - desktop only */
.links-table-wrapper {
  display: none;
  overflow-x: auto;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  margin-top: var(--spacing-3);
}

.links-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.links-table th,
.links-table td {
  padding: 0.625rem var(--spacing-3);
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.links-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.8rem;
  white-space: nowrap;
}

.links-table tr:last-child td {
  border-bottom: none;
}

.links-table input[type='text'] {
  width: 100%;
  padding: 0.375rem var(--spacing-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}

.links-table input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

.th-order {
  width: 3.75rem;
}

.th-toggle {
  width: 4.375rem;
  text-align: center;
}

.th-actions {
  width: 3.75rem;
  text-align: center;
}

.td-order {
  text-align: center;
}

.td-toggle {
  text-align: center;
}

.td-actions {
  text-align: center;
}

.order-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  align-items: center;
}

.btn-icon-sm {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.5625rem;
  transition: all 0.2s;
  line-height: 1;
}

.btn-icon-sm:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-icon-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
  background: var(--color-error-bg, var(--color-error-bg));
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 2.5rem;
  height: 1.375rem;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--color-gray-300);
  border-radius: var(--border-radius-md);
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 1.125rem;
  height: 1.125rem;
  left: 0.125rem;
  bottom: 0.125rem;
  background: var(--bg-primary);
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* Mobile card version for links */
.links-cards-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}

.link-card-mobile {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
}

.link-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
}

.link-card-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-gray-500);
}

.link-card-actions {
  display: flex;
  gap: var(--spacing-1);
  align-items: center;
}

.link-card-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group-sm label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  margin-bottom: 0.125rem;
}

.form-group-sm input[type='text'] {
  width: 100%;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  box-sizing: border-box;
}

.form-group-sm input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

.toggle-label-mobile {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-gray-700);
}

.toggle-label-mobile input {
  width: 1rem;
  height: 1rem;
}

@media (min-width: 48em) {
  .links-table-wrapper {
    display: block;
  }

  .links-cards-mobile {
    display: none;
  }
}
</style>
