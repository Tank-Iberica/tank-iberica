<template>
  <div class="vehicle-characteristics">
    <h2>{{ $t('vehicle.characteristics') }}</h2>
    <div class="vehicle-char-grid">
      <div v-for="(value, key) in attributesJson" :key="key" class="vehicle-char-item">
        <span class="vehicle-char-label">{{ resolveLabel(String(key)) }}</span>
        <span class="vehicle-char-value">{{ resolveValue(value) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  attributesJson: Record<string, unknown>
  locale: string
}>()

function resolveLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function resolveValue(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, string>
    return props.locale === 'en' && obj.en ? obj.en : obj.es || String(value)
  }
  return String(value)
}
</script>

<style scoped>
.vehicle-characteristics {
  margin-bottom: var(--spacing-6);
}

.vehicle-characteristics h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vehicle-char-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.vehicle-char-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.vehicle-char-label {
  font-size: 0.7rem;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.vehicle-char-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 700;
}

@media (min-width: 480px) {
  .vehicle-char-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .vehicle-char-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .vehicle-characteristics {
    margin-bottom: var(--spacing-4);
  }
}
</style>
