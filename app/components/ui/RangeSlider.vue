<script setup lang="ts">
const props = withDefaults(defineProps<{
  min: number
  max: number
  step?: number
  modelMin: number | null
  modelMax: number | null
  formatLabel?: (n: number) => string
}>(), {
  step: 1,
  formatLabel: undefined,
})

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

const minLabel = computed(() => props.formatLabel ? props.formatLabel(localMin.value) : String(localMin.value))
const maxLabel = computed(() => props.formatLabel ? props.formatLabel(localMax.value) : String(localMax.value))
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
            right: `${100 - rightPercent}%`
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
  gap: 4px;
  width: 100%;
}

.range-slider__val {
  font-size: 9px;
  color: var(--text-primary, #1a1a1a);
  font-weight: 600;
  white-space: nowrap;
  min-width: 20px;
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
  height: 20px;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 60px;
}

.range-slider__track {
  position: absolute;
  width: 100%;
  height: 3px;
  background: var(--bg-secondary, #e5e7eb);
  border-radius: 2px;
  pointer-events: none;
}

.range-slider__track-active {
  position: absolute;
  height: 100%;
  background: var(--color-primary, #23424A);
  border-radius: 2px;
  transition: left 0.1s ease, right 0.1s ease;
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary, #23424A);
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.range-slider__input::-moz-range-thumb {
  pointer-events: all;
  -moz-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary, #23424A);
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
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
  outline: 2px solid var(--color-primary, #23424A);
  outline-offset: 2px;
}

.range-slider__input:focus::-moz-range-thumb {
  outline: 2px solid var(--color-primary, #23424A);
  outline-offset: 2px;
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
    width: 18px;
    height: 18px;
  }

  .range-slider__input::-moz-range-thumb {
    width: 18px;
    height: 18px;
  }

  .range-slider__track-container {
    height: 28px;
  }
}

/* Tablet and up */
@media (min-width: 768px) {
  .range-slider__val {
    font-size: 10px;
  }

  .range-slider__input::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
  }

  .range-slider__input::-moz-range-thumb {
    width: 14px;
    height: 14px;
  }
}
</style>
