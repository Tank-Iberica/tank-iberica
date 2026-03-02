<script setup lang="ts">
defineProps<{
  fontPreset: string
  fontPresets: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:fontPreset', value: string): void
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Tipografia</h3>
    <p class="card-subtitle">Selecciona el estilo tipografico del sitio</p>

    <div class="font-presets">
      <label
        v-for="preset in fontPresets"
        :key="preset.value"
        class="radio-card"
        :class="{ selected: fontPreset === preset.value }"
      >
        <input
          type="radio"
          name="font_preset"
          :value="preset.value"
          :checked="fontPreset === preset.value"
          @change="emit('update:fontPreset', preset.value)"
        >
        <span class="radio-label">{{ preset.label }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.font-presets {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  border-color: var(--text-disabled);
}

.radio-card.selected {
  border-color: var(--color-primary);
  background: #f0fdfa;
}

.radio-card input[type='radio'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-label {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 500;
}

@media (min-width: 480px) {
  .font-presets {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .font-presets {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
