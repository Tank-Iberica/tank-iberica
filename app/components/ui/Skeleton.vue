<script setup lang="ts">
/**
 * Base skeleton loader building block.
 *
 * Usage:
 *   <UiSkeleton />                           — full-width line (1rem tall)
 *   <UiSkeleton width="60%" />               — partial-width line
 *   <UiSkeleton variant="circle" size="3rem" />  — avatar circle
 *   <UiSkeleton variant="rect" height="12rem" /> — image/card placeholder
 *   <UiSkeleton variant="rect" :aspect="4/3" />  — aspect-ratio box
 */

const props = withDefaults(
  defineProps<{
    variant?: 'line' | 'circle' | 'rect'
    width?: string
    height?: string
    size?: string
    /** Aspect ratio for rect variant (e.g. 4/3, 16/9) */
    aspect?: number
    /** Border radius override */
    radius?: string
  }>(),
  {
    variant: 'line',
    width: '',
    height: '',
    size: '',
    aspect: 0,
    radius: '',
  },
)

const style = computed(() => {
  const s: Record<string, string> = {}

  if (props.variant === 'circle') {
    const dim = props.size || '2.5rem'
    s.width = dim
    s.height = dim
    s.borderRadius = '50%'
  }
  else if (props.variant === 'rect') {
    s.width = props.width || '100%'
    if (props.aspect) {
      s.aspectRatio = String(props.aspect)
    }
    else {
      s.height = props.height || '8rem'
    }
    s.borderRadius = props.radius || 'var(--border-radius-md)'
  }
  else {
    // line
    s.width = props.width || '100%'
    s.height = props.height || '1rem'
    s.borderRadius = props.radius || 'var(--border-radius-sm)'
  }

  if (props.radius) s.borderRadius = props.radius

  return s
})
</script>

<template>
  <div class="skeleton" :style="style" aria-hidden="true" />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    opacity: 0.7;
  }
}
</style>
