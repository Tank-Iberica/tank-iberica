<script setup lang="ts">
const props = defineProps<{
  theme: Record<string, string>
  colorLabels: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'update:theme', value: Record<string, string>): void
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
  background: white;
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

.color-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.color-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  text-transform: capitalize;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.color-hex {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: monospace;
  text-transform: uppercase;
}

.color-hex:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (min-width: 480px) {
  .color-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .color-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
