<script setup lang="ts">
const props = defineProps<{
  theme: Record<string, string>
  colorLabels: Record<string, string>
}>()

const emit = defineEmits<{
  'update:theme': [value: Record<string, string>]
}>()

function onColorChange(key: string, value: string) {
  emit('update:theme', { ...props.theme, [key]: value })
}
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Colores</h3>
    <p class="card-subtitle">Personaliza la paleta de colores del tema</p>

    <div class="color-grid">
      <div v-for="(colorValue, colorKey) in theme" :key="colorKey" class="color-field">
        <label :for="`color-${colorKey}`">{{ colorLabels[colorKey] || colorKey }}</label>
        <div class="color-input-wrapper">
          <input
            :id="`color-${colorKey}`"
            type="color"
            class="color-picker"
            :value="colorValue"
            @input="onColorChange(colorKey, ($event.target as HTMLInputElement).value)"
          >
          <input
            type="text"
            class="color-hex"
            maxlength="7"
            placeholder="#000000"
            :value="colorValue"
            @input="onColorChange(colorKey, ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
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

.color-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;
}

.color-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-1);
  text-transform: capitalize;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.color-picker {
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  padding: 0.125rem;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--border-radius-sm);
}

.color-hex {
  flex: 1;
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (min-width: 30em) {
  .color-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 48em) {
  .color-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (min-width: 64em) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
