<script setup lang="ts">
interface Props {
  status: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:status': [value: string]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Estado</div>
    <div class="estado-row">
      <label class="estado-opt" :class="{ active: status === 'published' }">
        <input
          type="radio"
          :checked="status === 'published'"
          value="published"
          @change="emit('update:status', 'published')"
        >
        <span class="dot green" />Publicado
      </label>
      <label class="estado-opt" :class="{ active: status === 'draft' }">
        <input
          type="radio"
          :checked="status === 'draft'"
          value="draft"
          @change="emit('update:status', 'draft')"
        >
        <span class="dot gray" />Oculto
      </label>
      <label class="estado-opt" :class="{ active: status === 'rented' }">
        <input
          type="radio"
          :checked="status === 'rented'"
          value="rented"
          @change="emit('update:status', 'rented')"
        >
        <span class="dot blue" />Alquilado
      </label>
      <label class="estado-opt" :class="{ active: status === 'maintenance' }">
        <input
          type="radio"
          :checked="status === 'maintenance'"
          value="maintenance"
          @change="emit('update:status', 'maintenance')"
        >
        <span class="dot red" />En Taller
      </label>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: #fff;
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
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.estado-opt input {
  display: none;
}
.estado-opt.active {
  border-color: #23424a;
  background: #f0f9ff;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.green {
  background: #22c55e;
}
.dot.gray {
  background: #9ca3af;
}
.dot.blue {
  background: #3b82f6;
}
.dot.red {
  background: #ef4444;
}

@media (max-width: 768px) {
  .estado-row {
    flex-direction: column;
  }
}
</style>
