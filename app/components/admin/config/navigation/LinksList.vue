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
          <th class="th-actions">Acciones</th>
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
  <div v-if="links.length > 0" class="links-cards-mobile">
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
  padding: 24px;
  color: #9ca3af;
  font-size: 0.875rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

/* Links table - desktop only */
.links-table-wrapper {
  display: none;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 12px;
}

.links-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.links-table th,
.links-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.links-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
  white-space: nowrap;
}

.links-table tr:last-child td {
  border-bottom: none;
}

.links-table input[type='text'] {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
}

.links-table input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.th-order {
  width: 60px;
}

.th-toggle {
  width: 70px;
  text-align: center;
}

.th-actions {
  width: 60px;
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
  gap: 2px;
  align-items: center;
}

.btn-icon-sm {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s;
  line-height: 1;
}

.btn-icon-sm:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-icon-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
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
  background: #d1d5db;
  border-radius: 11px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary, #23424a);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* Mobile card version for links */
.links-cards-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.link-card-mobile {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
}

.link-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.link-card-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
}

.link-card-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.link-card-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-sm label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 2px;
}

.form-group-sm input[type='text'] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
  box-sizing: border-box;
}

.form-group-sm input[type='text']:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.toggle-label-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.toggle-label-mobile input {
  width: 16px;
  height: 16px;
}

@media (min-width: 768px) {
  .links-table-wrapper {
    display: block;
  }

  .links-cards-mobile {
    display: none;
  }
}
</style>
