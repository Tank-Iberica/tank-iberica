<script setup lang="ts">
const status = defineModel<'published' | 'draft' | 'rented' | 'maintenance'>({ required: true })
</script>

<template>
  <div class="section">
    <div class="section-title">Estado</div>
    <div class="estado-row">
      <label class="estado-opt" :class="{ active: status === 'published' }">
        <input v-model="status" type="radio" value="published" >
        <span class="dot green" />Publicado
      </label>
      <label class="estado-opt" :class="{ active: status === 'draft' }">
        <input v-model="status" type="radio" value="draft" >
        <span class="dot gray" />Oculto
      </label>
      <label class="estado-opt" :class="{ active: status === 'rented' }">
        <input v-model="status" type="radio" value="rented" >
        <span class="dot blue" />Alquilado
      </label>
      <label class="estado-opt" :class="{ active: status === 'maintenance' }">
        <input v-model="status" type="radio" value="maintenance" >
        <span class="dot red" />En Taller
      </label>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.estado-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.estado-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.estado-opt input {
  display: none;
}
.estado-opt.active {
  border-color: var(--color-primary);
  background: #f0f9ff;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.green {
  background: var(--color-success);
}
.dot.gray {
  background: #9ca3af;
}
.dot.blue {
  background: var(--color-info);
}
.dot.red {
  background: var(--color-error);
}

@media (max-width: 768px) {
  .estado-row {
    flex-direction: column;
  }
}
</style>
