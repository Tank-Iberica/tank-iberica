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
        <h1>{{ $t('admin.agenda.title') }}</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <button class="btn-primary" @click="openCreateModal">{{ $t('admin.agenda.newContact', '+ Nuevo contacto') }}</button>
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
    <div v-if="loading" class="loading-state" aria-busy="true">
      <UiSkeletonTable :rows="5" :cols="4" />
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
  gap: var(--spacing-4);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: var(--spacing-1) 0.625rem;
  border-radius: var(--border-radius-md);
}

@media (min-width: 30em) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
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

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-state {
  padding: var(--spacing-6);
}
</style>
