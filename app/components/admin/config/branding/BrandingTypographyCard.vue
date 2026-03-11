<script setup lang="ts">
defineProps<{
  fontPreset: string
  fontPresets: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:fontPreset': [value: string]
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
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.font-presets {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.625rem;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: 0.875rem var(--spacing-4);
  border: 2px solid var(--border-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  border-color: var(--text-disabled);
}

.radio-card.selected {
  border-color: var(--color-primary);
  background: var(--color-teal-50);
}

.radio-card input[type='radio'] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  flex-shrink: 0;
}

.radio-label {
  font-size: 0.95rem;
  color: var(--color-gray-700);
  font-weight: 500;
}

@media (min-width: 30em) {
  .font-presets {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 48em) {
  .font-presets {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
