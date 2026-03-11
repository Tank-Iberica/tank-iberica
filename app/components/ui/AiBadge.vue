<script setup lang="ts">
/**
 * AiBadge — EU AI Act compliance badge
 * Shows a small indicator when content was AI-generated or auto-translated.
 */
defineProps<{
  type: 'generated' | 'translated'
}>()

const { t } = useI18n()
</script>

<template>
  <span class="ai-badge" :class="type">
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
    {{ type === 'generated' ? t('ai.badgeGenerated') : t('ai.badgeTranslated') }}
  </span>
</template>

<style scoped>
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.4;
}

.ai-badge.generated {
  background: var(--color-purple-bg);
  color: var(--color-purple-text);
  border: 1px solid var(--color-info-border);
}

.ai-badge.translated {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}
</style>
