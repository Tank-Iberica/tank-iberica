<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})
</script>

<template>
  <div class="admin-section">
    <div class="section-header">
      <h2>{{ $t('admin.registro.title') }}</h2>
      <button class="btn-primary">{{ $t('admin.registro.uploadDoc', '+ Subir Documento') }}</button>
    </div>

    <div class="placeholder-content">
      <div class="placeholder-icon">📄</div>
      <h3>{{ $t('admin.registro.docsTitle') }}</h3>
      <p>{{ $t('admin.registro.docsSubtitle') }}</p>
      <div class="placeholder-features">
        <span class="feature-tag">{{ $t('admin.registro.invoices', 'Facturas') }}</span>
        <span class="feature-tag">{{ $t('admin.registro.receipts', 'Recibos') }}</span>
        <span class="feature-tag">{{ $t('admin.registro.contracts', 'Contratos') }}</span>
        <span class="feature-tag">{{ $t('admin.registro.export', 'Exportar') }}</span>
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
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  font-weight: 500;
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
