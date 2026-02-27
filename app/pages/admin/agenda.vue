<script setup lang="ts">
import { useAdminAgenda } from '~/composables/admin/useAdminAgenda'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  contacts,
  loading,
  saving,
  error,
  total,
  filters,
  activeModal,
  editingContact,
  formData,
  deleteConfirmText,
  deletingContact,
  openCreateModal,
  openEditModal,
  openDeleteModal,
  closeModal,
  submitForm,
  executeDelete,
  updateFormField,
  getTypeLabel,
  getTypeColor,
  init,
} = useAdminAgenda()

onMounted(() => init())
</script>

<template>
  <div class="agenda-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Agenda</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo contacto</button>
    </header>

    <!-- Filters -->
    <AdminAgendaToolbar
      :search="filters.search || ''"
      :contact-type="filters.contact_type"
      @update:search="filters.search = $event"
      @update:contact-type="filters.contact_type = $event"
    />

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Cargando contactos...</span>
    </div>

    <!-- Table -->
    <AdminAgendaTable
      v-else
      :contacts="contacts"
      :get-type-label="getTypeLabel"
      :get-type-color="getTypeColor"
      @edit="openEditModal"
      @delete="openDeleteModal"
      @create="openCreateModal"
    />

    <!-- Form Modal (Create/Edit) -->
    <AdminAgendaFormModal
      :visible="activeModal === 'form'"
      :is-editing="!!editingContact"
      :form-data="formData"
      :saving="saving"
      @close="closeModal"
      @submit="submitForm"
      @update:field="updateFormField"
    />

    <!-- Delete Modal -->
    <AdminAgendaDeleteModal
      :visible="activeModal === 'delete'"
      :contact="deletingContact"
      :confirm-text="deleteConfirmText"
      :saving="saving"
      @close="closeModal"
      @confirm="executeDelete"
      @update:confirm-text="deleteConfirmText = $event"
    />
  </div>
</template>

<style scoped>
.agenda-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

@media (min-width: 480px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
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

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
