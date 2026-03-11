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
          <th class="col-type">{{ $t('admin.agenda.colType') }}</th>
          <th>{{ $t('admin.agenda.colCompany') }}</th>
          <th>{{ $t('admin.agenda.colContact') }}</th>
          <th>{{ $t('admin.agenda.colPhone') }}</th>
          <th>{{ $t('admin.agenda.colEmail') }}</th>
          <th>{{ $t('admin.agenda.colLocation') }}</th>
          <th>{{ $t('admin.agenda.colProducts') }}</th>
          <th class="col-actions">{{ $t('common.actions') }}</th>
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
              <button class="action-btn" :title="$t('common.edit')" @click="emit('edit', c)">
                &#x270E;&#xFE0F;
              </button>
              <button class="action-btn delete" :title="$t('common.delete')" @click="emit('delete', c)">
                &#x1F5D1;&#xFE0F;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="contacts.length === 0">
          <td colspan="8" class="empty-cell">
            <div class="empty-state">
              <span class="empty-icon">&#x1F4D2;</span>
              <p>{{ $t('common.noResults') }}</p>
              <button class="btn-primary" @click="emit('create')">{{ $t('admin.agenda.createFirstContact') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 43.75rem;
}

.data-table th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  padding: 0.75rem 0.875rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.data-table tr:hover {
  background: var(--bg-secondary);
}

.col-type {
  width: 6.25rem;
}
.col-actions {
  width: 5.625rem;
}
.col-products {
  max-width: 10rem;
}
.text-small {
  font-size: 0.8rem;
}

.truncate {
  display: block;
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-pill {
  display: inline-block;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.15s;
  min-width: 2.25rem;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-secondary);
}
.action-btn.delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
  border-color: var(--color-error-soft);
}

.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 3.75rem 1.25rem;
  color: var(--text-auxiliary);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  display: block;
  margin-bottom: 0.75rem;
}

.empty-state p {
  margin: 0 0 1rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
