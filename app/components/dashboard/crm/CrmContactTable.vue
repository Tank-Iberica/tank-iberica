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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
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

@media (hover: hover) {
  .data-table tr:hover {
    background: #f8fafc;
  }
}

.col-type {
  width: 110px;
}
.col-actions {
  width: 90px;
}
.col-vertical {
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

@media (hover: hover) {
  .link:hover {
    text-decoration: underline;
  }
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
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (hover: hover) {
  .action-btn:hover {
    background: #f8fafc;
  }

  .action-btn.delete:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }
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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
