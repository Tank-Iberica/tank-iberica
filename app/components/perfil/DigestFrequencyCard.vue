<script setup lang="ts">
import type { DigestFrequency } from '~/composables/useEmailPreferences'
import { DIGEST_FREQUENCY_OPTIONS } from '~/composables/useEmailPreferences'

const props = defineProps<{
  modelValue: DigestFrequency
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DigestFrequency): void
}>()

function select(freq: DigestFrequency) {
  if (freq !== props.modelValue) {
    emit('update:modelValue', freq)
  }
}
</script>

<template>
  <div class="digest-card" role="group" :aria-label="$t('profile.notifications.digestLabel')">
    <div class="digest-header">
      <div class="digest-title-row">
        <svg
          class="digest-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        <span class="digest-title">{{ $t('profile.notifications.digestTitle') }}</span>
      </div>
      <p class="digest-desc">{{ $t('profile.notifications.digestDesc') }}</p>
    </div>

    <div class="digest-options">
      <button
        v-for="freq in DIGEST_FREQUENCY_OPTIONS"
        :key="freq"
        type="button"
        class="digest-option"
        :class="{ 'digest-option--active': modelValue === freq }"
        :aria-pressed="modelValue === freq"
        :disabled="saving"
        @click="select(freq)"
      >
        <span class="digest-option-label">{{
          $t(`profile.notifications.digestFreq.${freq}`)
        }}</span>
        <span class="digest-option-desc">{{
          $t(`profile.notifications.digestFreqDesc.${freq}`)
        }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.digest-card {
  background: var(--bg-primary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.digest-header {
  margin-bottom: 0.75rem;
}

.digest-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.digest-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.digest-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.digest-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  padding-left: 1.625rem;
}

.digest-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.digest-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.625rem 0.875rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
  min-height: 2.75rem;
}

.digest-option:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.digest-option--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.digest-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.digest-option-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.digest-option-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

@media (min-width: 30em) {
  .digest-options {
    flex-direction: row;
  }

  .digest-option {
    flex: 1;
  }
}
</style>
