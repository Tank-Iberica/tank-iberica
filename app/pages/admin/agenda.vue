<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})
</script>

<template>
  <div class="admin-section">
    <div class="section-header">
      <h2>Usuarios</h2>
    </div>

    <div class="placeholder-content">
      <div class="placeholder-icon">
        👥
      </div>
      <h3>Gestión de Usuarios</h3>
      <p>Gestión de usuarios registrados</p>
      <div class="placeholder-features">
        <span class="feature-tag">Lista usuarios</span>
        <span class="feature-tag">Roles</span>
        <span class="feature-tag">Actividad</span>
        <span class="feature-tag">Contacto</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-section { padding: 0; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-header h2 { margin: 0; font-size: 1.5rem; }
.placeholder-content { background: white; border-radius: 12px; padding: 60px 40px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.placeholder-icon { font-size: 64px; margin-bottom: 20px; }
.placeholder-content h3 { margin: 0 0 12px; font-size: 1.25rem; color: #374151; }
.placeholder-content p { color: #6b7280; margin: 0 0 24px; }
.placeholder-features { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.feature-tag { background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 500; }
</style>
