<script setup lang="ts">
/**
 * UiSuccessState — Success feedback with suggested next action.
 * Shows an animated checkmark, a success message, and optional CTA buttons.
 *
 * Usage:
 * <UiSuccessState
 *   :show="published"
 *   :message="$t('vehicle.published')"
 *   :actions="[
 *     { label: 'Ver ficha', to: `/vehiculos/${slug}` },
 *     { label: 'Publicar otro', to: '/dashboard/vehiculos/nuevo' },
 *   ]"
 * />
 */
export interface SuccessAction {
  label: string
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

const _props = withDefaults(
  defineProps<{
    show: boolean
    message: string
    actions?: SuccessAction[]
  }>(),
  {
    actions: () => [],
  },
)

defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <Transition name="success-state">
    <div v-if="show" class="success-state" role="status" aria-live="polite">
      <UiSuccessCheckmark :show="show" />
      <p class="success-state__message">{{ message }}</p>
      <div v-if="actions.length" class="success-state__actions">
        <template v-for="(action, i) in actions" :key="i">
          <NuxtLink
            v-if="action.to"
            :to="action.to"
            :class="[
              'success-state__btn',
              action.variant === 'secondary'
                ? 'success-state__btn--secondary'
                : 'success-state__btn--primary',
            ]"
          >
            {{ action.label }}
          </NuxtLink>
          <button
            v-else
            type="button"
            :class="[
              'success-state__btn',
              action.variant === 'secondary'
                ? 'success-state__btn--secondary'
                : 'success-state__btn--primary',
            ]"
            @click="action.onClick?.()"
          >
            {{ action.label }}
          </button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-6) var(--spacing-4);
  text-align: center;
}

.success-state__message {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.success-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  justify-content: center;
}

.success-state__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}

.success-state__btn--primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

@media (hover: hover) {
  .success-state__btn--primary:hover {
    background: var(--color-primary-dark);
  }
}

.success-state__btn--secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-gray-200);
}

@media (hover: hover) {
  .success-state__btn--secondary:hover {
    background: var(--bg-secondary);
  }
}

/* Transition */
.success-state-enter-active {
  transition: all 0.35s ease;
}

.success-state-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
