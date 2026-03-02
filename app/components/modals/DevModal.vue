<script setup lang="ts">
defineProps<{
  modelValue: boolean
  featureName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="dev-backdrop" @click.self="close">
        <div class="dev-container">
          <button class="dev-close" @click="close">&times;</button>
          <div class="dev-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 class="dev-title">{{ $t('dev.title') }}</h2>
          <p class="dev-message">
            {{
              featureName ? $t('dev.featureMessage', { feature: featureName }) : $t('dev.message')
            }}
          </p>
          <button class="dev-btn" @click="close">{{ $t('common.close') }}</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dev-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.dev-container {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 2rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
  position: relative;
}

.dev-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.dev-icon {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.dev-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.dev-message {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.dev-btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
