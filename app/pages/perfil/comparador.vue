<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'] })

const { t } = useI18n()

const {
  vehicles,
  loading,
  draftNotes,
  draftRatings,
  newCompName,
  showNewForm,
  specKeys,
  comparisons,
  activeComparison,
  setRating,
  saveNote,
  handleRemove,
  handleCreate,
  handleDelete,
  selectComparison,
  printPage,
  updateDraftNote,
  updateNewCompName,
  toggleNewForm,
  init,
} = usePerfilComparador()

useHead({ title: computed(() => t('comparator.title')) })

onMounted(() => init())
</script>

<template>
  <div class="cmp-page">
    <div class="cmp-wrap">
      <ComparadorHeader
        :comparisons="comparisons"
        :active-comparison="activeComparison"
        :show-new-form="showNewForm"
        :new-comp-name="newCompName"
        @print="printPage"
        @toggle-new-form="toggleNewForm"
        @create="handleCreate"
        @select="selectComparison"
        @delete="handleDelete"
        @update-new-comp-name="updateNewCompName"
      />

      <div v-if="loading" class="state-msg">{{ $t('common.loading') }}</div>

      <div v-else-if="!activeComparison || vehicles.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('comparator.noVehicles') }}</p>
        <p class="empty-desc">{{ $t('comparator.empty') }}</p>
        <NuxtLink to="/catalogo" class="btn-fill">
          {{ $t('profile.favorites.browseCatalog') }}
        </NuxtLink>
      </div>

      <ComparadorContent
        v-else
        :vehicles="vehicles"
        :draft-notes="draftNotes"
        :draft-ratings="draftRatings"
        :spec-keys="specKeys"
        @remove="handleRemove"
        @save-note="saveNote"
        @set-rating="setRating"
        @update-note="updateDraftNote"
      />
    </div>
  </div>
</template>

<style scoped>
.cmp-page {
  min-height: 60vh;
  padding: var(--spacing-6) 0 var(--spacing-12);
}

.cmp-wrap {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.state-msg {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12) var(--spacing-6);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-6);
}

.btn-fill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-fill:hover {
  background: var(--color-primary-dark);
}

@media (min-width: 768px) {
  .cmp-wrap {
    padding: 0 var(--spacing-8);
  }
}

@media print {
  .cmp-wrap {
    padding: 0;
  }
}
</style>
