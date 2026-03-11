<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})
</script>

<template>
  <div class="admin-section">
    <div class="section-header">
      <h2>{{ $t('admin.cartera.title') }}</h2>
    </div>

    <div class="placeholder-content">
      <div class="placeholder-icon">💼</div>
      <h3>{{ $t('admin.cartera.sectionTitle') }}</h3>
      <p>{{ $t('admin.cartera.subtitle') }}</p>
      <div class="placeholder-features">
        <span class="feature-tag">Ojeados</span>
        <span class="feature-tag">Negociando</span>
        <span class="feature-tag">Pipeline</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-section {
  padding: 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}
.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}
.placeholder-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 3.75rem var(--spacing-10);
  text-align: center;
  box-shadow: var(--shadow-card);
}
.placeholder-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-5);
}
.placeholder-content h3 {
  margin: 0 0 var(--spacing-3);
  font-size: 1.25rem;
  color: var(--color-gray-700);
}
.placeholder-content p {
  color: var(--color-gray-500);
  margin: 0 0 var(--spacing-6);
}
.placeholder-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-2);
}
.feature-tag {
  background: var(--bg-secondary);
  color: var(--color-gray-600);
  padding: 0.375rem var(--spacing-3);
  border-radius: var(--border-radius-lg);
  font-size: 0.8rem;
  font-weight: 500;
}
</style>
