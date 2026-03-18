<template>
  <div class="empty-state">
    <div class="empty-state-icon" aria-hidden="true">
      <slot name="icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </slot>
    </div>
    <h3 v-if="title" class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <div v-if="$slots.actions || ctaLabel" class="empty-state-actions">
      <slot name="actions">
        <NuxtLink v-if="ctaTo" :to="ctaTo" class="empty-state-btn">
          {{ ctaLabel }}
        </NuxtLink>
        <button v-else-if="ctaLabel" class="empty-state-btn" @click="$emit('cta')">
          {{ ctaLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  ctaLabel?: string
  ctaTo?: string
}>()

defineEmits<{
  cta: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-8) var(--spacing-4);
  gap: 0.5rem;
}

.empty-state-icon {
  color: var(--text-disabled);
  margin-bottom: 0.5rem;
}

.empty-state-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-state-description {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin: 0;
  max-width: 24rem;
  line-height: var(--line-height-relaxed);
}

.empty-state-actions {
  margin-top: 0.75rem;
}

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-decoration: none;
  min-height: 2.75rem;
  transition: background var(--transition-fast);
}

.empty-state-btn:hover {
  background: var(--color-primary-dark);
}
</style>
