<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    min: number
    max: number
    step?: number
    modelMin: number | null
    modelMax: number | null
    formatLabel?: (n: number) => string
  }>(),
  {
    step: 1,
    formatLabel: undefined,
  },
)

const emit = defineEmits<{
  'update:modelMin': [value: number | null]
  'update:modelMax': [value: number | null]
}>()

const localMin = computed(() => props.modelMin ?? props.min)
const localMax = computed(() => props.modelMax ?? props.max)

const leftPercent = computed(() => ((localMin.value - props.min) / (props.max - props.min)) * 100)
const rightPercent = computed(() => ((localMax.value - props.min) / (props.max - props.min)) * 100)

function onMinInput(e: Event) {
  let val = Number((e.target as HTMLInputElement).value)
  if (val > localMax.value) val = localMax.value
  emit('update:modelMin', val <= props.min ? null : val)
}

function onMaxInput(e: Event) {
  let val = Number((e.target as HTMLInputElement).value)
  if (val < localMin.value) val = localMin.value
  emit('update:modelMax', val >= props.max ? null : val)
}

const minLabel = computed(() =>
  props.formatLabel ? props.formatLabel(localMin.value) : String(localMin.value),
)
const maxLabel = computed(() =>
  props.formatLabel ? props.formatLabel(localMax.value) : String(localMax.value),
)
</script>

<template>
  <div class="range-slider">
    <span class="range-slider__val range-slider__val--min">{{ minLabel }}</span>

    <div class="range-slider__track-container">
      <div class="range-slider__track">
        <div
          class="range-slider__track-active"
          :style="{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
          }"
        />
      </div>

      <input
        type="range"
        class="range-slider__input range-slider__input--min"
        :min="min"
        :max="max"
        :step="step"
        :value="localMin"
        @input="onMinInput"
      >

      <input
        type="range"
        class="range-slider__input range-slider__input--max"
        :min="min"
        :max="max"
        :step="step"
        :value="localMax"
        @input="onMaxInput"
      >
    </div>

    <span class="range-slider__val range-slider__val--max">{{ maxLabel }}</span>
  </div>
</template>

<style scoped>
.range-slider {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.range-slider__val {
  font-size: 0.5625rem;
  color: var(--text-primary, var(--color-near-black));
  font-weight: 600;
  white-space: nowrap;
  min-width: 1.25rem;
  flex-shrink: 0;
}

.range-slider__val--min {
  text-align: right;
}

.range-slider__val--max {
  text-align: left;
}

.range-slider__track-container {
  position: relative;
  height: 1.25rem;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 3.75rem;
}

.range-slider__track {
  position: absolute;
  width: 100%;
  height: 0.1875rem;
  background: var(--bg-secondary, var(--color-gray-200));
  border-radius: 0.125rem;
  pointer-events: none;
}

.range-slider__track-active {
  position: absolute;
  height: 100%;
  background: var(--color-primary);
  border-radius: 0.125rem;
  transition:
    left 0.1s ease,
    right 0.1s ease;
}

.range-slider__input {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

/* Make only the thumb interactive */
.range-slider__input::-webkit-slider-thumb {
  pointer-events: all;
  -webkit-appearance: none;
  appearance: none;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.range-slider__input::-moz-range-thumb {
  pointer-events: all;
  -moz-appearance: none;
  appearance: none;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

/* Hover and active states */
.range-slider__input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider__input::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider__input::-webkit-slider-thumb:active {
  transform: scale(1.25);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.range-slider__input::-moz-range-thumb:active {
  transform: scale(1.25);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

/* Remove default track styling */
.range-slider__input::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  border: none;
}

.range-slider__input::-moz-range-track {
  -moz-appearance: none;
  appearance: none;
  background: transparent;
  border: none;
}

/* Focus styles for accessibility */
.range-slider__input:focus {
  outline: none;
}

.range-slider__input:focus::-webkit-slider-thumb {
  outline: 2px solid var(--color-primary);
  outline-offset: 0.125rem;
}

.range-slider__input:focus::-moz-range-thumb {
  outline: 2px solid var(--color-primary);
  outline-offset: 0.125rem;
}

/* Ensure max slider is above min slider for proper interaction */
.range-slider__input--max {
  z-index: 2;
}

.range-slider__input--min {
  z-index: 1;
}

/* Increase touch target size for mobile */
@media (pointer: coarse) {
  .range-slider__input::-webkit-slider-thumb {
    width: 1.125rem;
    height: 1.125rem;
  }

  .range-slider__input::-moz-range-thumb {
    width: 1.125rem;
    height: 1.125rem;
  }

  .range-slider__track-container {
    height: 1.75rem;
  }
}

/* Tablet and up */
@media (min-width: 48em) {
  .range-slider__val {
    font-size: 0.625rem;
  }

  .range-slider__input::-webkit-slider-thumb {
    width: 0.875rem;
    height: 0.875rem;
  }

  .range-slider__input::-moz-range-thumb {
    width: 0.875rem;
    height: 0.875rem;
  }
}
</style>
