<script setup lang="ts">
/**
 * CRM contacts data table with type pills, action buttons, and empty state.
 * Does NOT mutate props — emits events for edit/delete/create.
 */
import type { Contact, ContactType } from '~/composables/dashboard/useDashboardCrm'

defineProps<{
  contacts: readonly Contact[]
  getTypeLabel: (type: ContactType) => string
  getTypeColor: (type: ContactType) => string
}>()

const emit = defineEmits<{
  edit: [contact: Contact]
  delete: [contact: Contact]
  create: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-type">{{ t('dashboard.crm.colType') }}</th>
          <th>{{ t('dashboard.crm.colCompany') }}</th>
          <th>{{ t('dashboard.crm.colContact') }}</th>
          <th>{{ t('dashboard.crm.colPhone') }}</th>
          <th>{{ t('dashboard.crm.colEmail') }}</th>
          <th>{{ t('dashboard.crm.colLocation') }}</th>
          <th>{{ t('dashboard.crm.colVertical') }}</th>
          <th class="col-actions">{{ t('dashboard.crm.colActions') }}</th>
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
          <td class="text-small col-vertical">
            <span class="truncate">{{ c.vertical || '-' }}</span>
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <button
                class="action-btn"
                :title="t('dashboard.crm.editAction')"
                @click="emit('edit', c)"
              >
                &#9998;&#65039;
              </button>
              <button
                class="action-btn delete"
                :title="t('dashboard.crm.deleteAction')"
                @click="emit('delete', c)"
              >
                &#128465;&#65039;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="contacts.length === 0">
          <td colspan="8" class="empty-cell">
            <div class="empty-state">
              <span class="empty-icon">&#128210;</span>
              <p>{{ t('dashboard.crm.emptyTitle') }}</p>
              <button class="btn-primary" @click="emit('create')">
                {{ t('dashboard.crm.emptyAction') }}
              </button>
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
  -webkit-overflow-scrolling: touch;
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
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 0.125rem solid var(--color-gray-200);
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.9rem;
  color: var(--color-slate-700);
}

@media (hover: hover) {
  .data-table tr:hover {
    background: var(--bg-secondary);
  }
}

.col-type {
  width: 6.875rem;
}
.col-actions {
  width: 5.625rem;
}
.col-vertical {
  max-width: 10rem;
}
.text-small {
  font-size: var(--font-size-sm);
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
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

@media (hover: hover) {
  .link:hover {
    text-decoration: underline;
  }
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.15s;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (hover: hover) {
  .action-btn:hover {
    background: var(--bg-secondary);
  }

  .action-btn.delete:hover {
    background: var(--color-error-bg, var(--color-error-bg));
    border-color: var(--color-error-soft);
  }
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
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}
</style>
