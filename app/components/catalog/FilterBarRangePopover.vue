<template>
  <Teleport to="body">
    <div v-if="open" class="range-dropdown-mobile" @click="$emit('update:open', false)">
      <div class="range-dropdown-mobile-content" @click.stop>
        <div class="range-dropdown-mobile-header">
          <span>{{ title }}</span>
          <button type="button" class="range-dropdown-close" @click="$emit('update:open', false)">
            &#10005;
          </button>
        </div>
        <UiRangeSlider
          :min="min"
          :max="max"
          :step="step"
          :model-min="modelMin"
          :model-max="modelMax"
          :format-label="formatLabel"
          @update:model-min="$emit('update:model-min', $event)"
          @update:model-max="$emit('update:model-max', $event)"
        />
        <div class="range-dropdown-values">
          <span>{{ displayMin }}</span>
          <span>{{ displayMax }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  min: number
  max: number
  step: number
  modelMin: number | null
  modelMax: number | null
  formatLabel?: (n: number) => string
}>()

defineEmits<{
  'update:open': [value: boolean]
  'update:model-min': [value: number | null]
  'update:model-max': [value: number | null]
}>()

const displayMin = computed(() =>
  props.formatLabel
    ? props.formatLabel(props.modelMin ?? props.min)
    : String(props.modelMin ?? props.min),
)
const displayMax = computed(() =>
  props.formatLabel
    ? props.formatLabel(props.modelMax ?? props.max)
    : String(props.modelMax ?? props.max),
)
</script>

<!-- Non-scoped: teleported to body -->
<style>
.range-dropdown-mobile {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
}

.range-dropdown-mobile-content {
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  width: calc(100% - 2rem);
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.range-dropdown-mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
  font-size: 14px;
}

.range-dropdown-close {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.range-dropdown-values {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 0.25rem 0;
}

.range-dropdown-mobile-content .range-slider {
  padding: 0.5rem 0;
}

.range-dropdown-mobile-content .range-slider__track-container {
  height: 40px;
}

.range-dropdown-mobile-content .range-slider__val {
  font-size: 0;
  width: 0;
  min-width: 0;
  overflow: hidden;
}

@media (min-width: 768px) {
  .range-dropdown-mobile {
    display: none !important;
  }
}
</style>
