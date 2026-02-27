<script setup lang="ts">
import type { Contact, ContactType } from '~/composables/admin/useAdminAgenda'

defineProps<{
  contacts: readonly Contact[]
  getTypeLabel: (type: ContactType) => string
  getTypeColor: (type: ContactType) => string
}>()

const emit = defineEmits<{
  (e: 'edit' | 'delete', contact: Contact): void
  (e: 'create'): void
}>()
</script>

<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-type">Tipo</th>
          <th>Empresa</th>
          <th>Contacto</th>
          <th>Telefono</th>
          <th>Email</th>
          <th>Ubicacion</th>
          <th>Productos</th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in contacts" :key="c.id">
          <td class="col-type">
            <span
              class="type-pill"
              :style="{
                background: getTypeColor(c.contact_type) + '20',
                color: getTypeColor(c.contact_type),
              }"
            >
              {{ getTypeLabel(c.contact_type) }}
            </span>
          </td>
          <td>
            <strong>{{ c.company || '-' }}</strong>
          </td>
          <td>{{ c.contact_name }}</td>
          <td>
            <a v-if="c.phone" :href="`tel:${c.phone}`" class="link">{{ c.phone }}</a>
            <span v-else>-</span>
          </td>
          <td>
            <a v-if="c.email" :href="`mailto:${c.email}`" class="link">{{ c.email }}</a>
            <span v-else>-</span>
          </td>
          <td class="text-small">{{ c.location || '-' }}</td>
          <td class="text-small col-products">
            <span class="truncate">{{ c.products || '-' }}</span>
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="action-btn" title="Editar" @click="emit('edit', c)">
                &#x270E;&#xFE0F;
              </button>
              <button class="action-btn delete" title="Eliminar" @click="emit('delete', c)">
                &#x1F5D1;&#xFE0F;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="contacts.length === 0">
          <td colspan="8" class="empty-cell">
            <div class="empty-state">
              <span class="empty-icon">&#x1F4D2;</span>
              <p>No hay contactos</p>
              <button class="btn-primary" @click="emit('create')">Crear primer contacto</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
}

.data-table tr:hover {
  background: #f8fafc;
}

.col-type {
  width: 100px;
}
.col-actions {
  width: 90px;
}
.col-products {
  max-width: 160px;
}
.text-small {
  font-size: 0.8rem;
}

.truncate {
  display: block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f8fafc;
}
.action-btn.delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 16px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
