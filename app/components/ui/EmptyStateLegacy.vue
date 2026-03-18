<template>
  <div class="empty-state" :class="`empty-state--${variant}`">
    <div class="empty-state__icon" aria-hidden="true">
      <slot name="icon">
        <!-- Default: box/package icon -->
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path v-if="icon === 'search'" d="M11 11a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0 0L21 21" />
          <path
            v-else-if="icon === 'inbox'"
            d="M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
          />
          <path
            v-else-if="icon === 'star'"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
          <path v-else-if="icon === 'truck'" d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
          <path
            v-else-if="icon === 'heart'"
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
          <path
            v-else-if="icon === 'bell'"
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
          />
          <path
            v-else-if="icon === 'file'"
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
          />
          <template v-else>
            <!-- Default: package/box -->
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </template>
        </svg>
      </slot>
    </div>

    <h3 class="empty-state__title">{{ title }}</h3>

    <p v-if="description" class="empty-state__desc">{{ description }}</p>

    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: 'box' | 'search' | 'inbox' | 'star' | 'truck' | 'heart' | 'bell' | 'file'
    variant?: 'default' | 'subtle'
  }>(),
  { icon: 'box', variant: 'default' },
)
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-12, 3rem) var(--spacing-4);
  gap: var(--spacing-3);
}

.empty-state--subtle {
  padding: var(--spacing-8, 2rem) var(--spacing-4);
}

.empty-state__icon {
  color: var(--text-auxiliary);
  opacity: 0.6;
}

.empty-state__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-state__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 24rem;
  line-height: 1.6;
  margin: 0;
}
</style>
