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
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.photo-placeholder {
  padding: 32px 20px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  text-align: center;
  color: #64748b;
}

.photo-placeholder p {
  margin: 0 0 8px 0;
}

.photo-limit {
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
