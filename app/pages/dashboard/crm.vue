<script setup lang="ts">
/**
 * Dashboard CRM — Dealer contacts management page.
 * Adapted from admin/agenda.vue but scoped to the dealer's own contacts.
 * Requires Basic plan minimum.
 */
import { useDealerDashboard } from '~/composables/useDealerDashboard'
import { useSubscriptionPlan } from '~/composables/useSubscriptionPlan'
import { useDashboardCrm, CONTACT_TYPES } from '~/composables/dashboard/useDashboardCrm'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { userId } = useAuth()

// ── Dealer profile ──
const { dealerProfile, loadDealer } = useDealerDashboard()
const dealerId = computed<string | null>(() => dealerProfile.value?.id ?? null)

// ── Subscription gate ──
const { currentPlan, fetchSubscription } = useSubscriptionPlan()

// ── CRM composable ──
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
  fetchContacts,
  openCreateModal,
  openEditModal,
  openDeleteModal,
  closeModal,
  submitForm,
  executeDelete,
  updateFormData,
  updateFilters,
  setDeleteConfirmText,
  getTypeLabel,
  getTypeColor,
} = useDashboardCrm()

// ── Lifecycle ──
onMounted(async () => {
  await loadDealer()
  if (userId.value) {
    await fetchSubscription(userId.value)
  }
  if (dealerId.value) {
    await fetchContacts(dealerId.value)
  }
})

watch(
  filters,
  () => {
    if (dealerId.value) {
      fetchContacts(dealerId.value)
    }
  },
  { deep: true },
)

watch(dealerId, (newId) => {
  if (newId) {
    fetchContacts(newId)
  }
})
</script>

<template>
  <div class="crm-page">
    <!-- Upgrade gate: free plan -->
    <CrmUpgradeGate v-if="currentPlan === 'free'" />

    <!-- CRM content (Basic+ plans) -->
    <template v-else>
      <CrmHeader :total="total" @create="openCreateModal" />

      <CrmToolbar
        :filters="filters"
        :contact-types="CONTACT_TYPES"
        @update:filters="updateFilters"
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
      <CrmContactTable
        v-else
        :contacts="contacts"
        :get-type-label="getTypeLabel"
        :get-type-color="getTypeColor"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @create="openCreateModal"
      />

      <!-- Form Modal (Create/Edit) -->
      <CrmFormModal
        :show="activeModal === 'form'"
        :is-editing="!!editingContact"
        :form="formData"
        :contact-types="CONTACT_TYPES"
        :saving="saving"
        @save="submitForm(dealerId)"
        @close="closeModal"
        @update:form="updateFormData"
      />

      <!-- Delete Modal -->
      <CrmDeleteModal
        :show="activeModal === 'delete'"
        :contact="deletingContact"
        :confirm-text="deleteConfirmText"
        :saving="saving"
        @confirm="executeDelete(dealerId)"
        @close="closeModal"
        @update:confirm-text="setDeleteConfirmText"
      />
    </template>
  </div>
</template>

<style scoped>
.crm-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

.alert-error {
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-error-bg, var(--color-error-bg));
  border: 1px solid var(--color-error-border);
  border-radius: var(--border-radius);
  color: var(--color-error);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
