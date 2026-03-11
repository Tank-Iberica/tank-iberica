<script setup lang="ts">
const status = defineModel<'published' | 'draft' | 'rented' | 'maintenance'>({ required: true })
</script>

<template>
  <div class="section">
    <div class="section-title">{{ $t('common.status') }}</div>
    <div class="estado-row">
      <label class="estado-opt" :class="{ active: status === 'published' }">
        <input v-model="status" type="radio" value="published" >
        <span class="dot green" />{{ $t('common.published') }}
      </label>
      <label class="estado-opt" :class="{ active: status === 'draft' }">
        <input v-model="status" type="radio" value="draft" >
        <span class="dot gray" />{{ $t('common.hidden') }}
      </label>
      <label class="estado-opt" :class="{ active: status === 'rented' }">
        <input v-model="status" type="radio" value="rented" >
        <span class="dot blue" />{{ $t('common.rented') }}
      </label>
      <label class="estado-opt" :class="{ active: status === 'maintenance' }">
        <input v-model="status" type="radio" value="maintenance" >
        <span class="dot red" />{{ $t('common.maintenance') }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-xs);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.estado-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.estado-opt {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
}
.estado-opt input {
  display: none;
}
.estado-opt.active {
  border-color: var(--color-primary);
  background: var(--color-sky-50);
}
.dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
}
.dot.green {
  background: var(--color-success);
}
.dot.gray {
  background: var(--color-gray-400);
}
.dot.blue {
  background: var(--color-info);
}
.dot.red {
  background: var(--color-error);
}

@media (max-width: 48em) {
  .estado-row {
    flex-direction: column;
  }
}
</style>
