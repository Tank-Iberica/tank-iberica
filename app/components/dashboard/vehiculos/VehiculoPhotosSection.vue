<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  maxPhotos: number
}>()
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.vehicles.sectionPhotos') }}</h2>
    <div class="photo-placeholder">
      <p>{{ t('dashboard.vehicles.photosComingSoon') }}</p>
      <span class="photo-limit">{{ t('dashboard.vehicles.maxPhotos', { max: maxPhotos }) }}</span>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.photo-placeholder {
  padding: 2rem 1.25rem;
  border: 0.125rem dashed var(--color-gray-200);
  border-radius: var(--border-radius);
  text-align: center;
  color: var(--text-auxiliary);
}

.photo-placeholder p {
  margin: 0 0 0.5rem 0;
}

.photo-limit {
  font-size: var(--font-size-sm);
  color: var(--text-disabled);
}
</style>
