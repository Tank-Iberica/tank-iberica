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
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.count-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}

.btn-primary:hover {
  opacity: 0.9;
}
</style>
