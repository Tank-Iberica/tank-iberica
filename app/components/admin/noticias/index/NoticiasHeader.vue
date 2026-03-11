<script setup lang="ts">
defineProps<{
  total: number
}>()
</script>

<template>
  <header class="page-header">
    <div class="header-left">
      <h1>Noticias</h1>
      <span class="count-badge">{{ total }}</span>
    </div>
    <NuxtLink to="/admin/noticias/nuevo" class="btn btn-primary"> + Nueva Noticia </NuxtLink>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-near-black);
}

.count-badge {
  background: var(--bg-secondary);
  color: var(--text-auxiliary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.125rem 0.625rem;
  border-radius: var(--border-radius-md);
}

.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}
</style>
