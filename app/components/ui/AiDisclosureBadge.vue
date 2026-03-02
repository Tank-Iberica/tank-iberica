<script setup lang="ts">
/**
 * AiDisclosureBadge — EU AI Act compliance disclosure badge (§19)
 * Shows a subtle inline indicator for auto-translated, AI-generated,
 * or AI-assisted content. Distinct from AiBadge (which is used in card
 * listings); this badge is placed inline near the content it describes.
 */
const props = withDefaults(
  defineProps<{
    type: 'translated' | 'generated' | 'assisted'
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'sm',
  },
)

const { t } = useI18n()

const labelKey = computed((): string => {
  switch (props.type) {
    case 'translated':
      return 'ai.disclosure.translated'
    case 'generated':
      return 'ai.disclosure.generated'
    case 'assisted':
      return 'ai.disclosure.assisted'
    default:
      return 'ai.disclosure.assisted'
  }
})

const tooltipText = computed(() =>
  t('ai.disclosure.tooltip', { type: t(labelKey.value).toLowerCase() }),
)
</script>

<template>
  <span
    class="ai-disclosure-badge"
    :class="[`type--${type}`, `size--${size}`]"
    :title="tooltipText"
    role="note"
    :aria-label="tooltipText"
  >
    <svg
      class="badge-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
    <span class="badge-label">{{ t(labelKey) }}</span>
  </span>
</template>

<style scoped>
/* Base — mobile-first (360px) */
.ai-disclosure-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.4;
  cursor: default;
  vertical-align: middle;
  /* Muted / neutral defaults — overridden per type below */
  background: rgba(100, 116, 139, 0.08);
  color: var(--text-auxiliary);
  border: 1px solid rgba(100, 116, 139, 0.2);
}

/* Size variants */
.size--sm {
  font-size: 0.65rem;
}

.size--sm .badge-icon {
  width: 10px;
  height: 10px;
}

.size--md {
  font-size: 0.75rem;
  padding: 3px 8px;
}

.size--md .badge-icon {
  width: 12px;
  height: 12px;
}

/* Type: translated — blue tint */
.type--translated {
  background: rgba(59, 130, 246, 0.08);
  color: var(--color-info);
  border-color: rgba(59, 130, 246, 0.2);
}

/* Type: generated — violet tint */
.type--generated {
  background: rgba(139, 92, 246, 0.08);
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.2);
}

/* Type: assisted — amber tint */
.type--assisted {
  background: rgba(245, 158, 11, 0.08);
  color: var(--color-warning);
  border-color: rgba(245, 158, 11, 0.2);
}

.badge-icon {
  flex-shrink: 0;
}

.badge-label {
  line-height: 1;
}
</style>
