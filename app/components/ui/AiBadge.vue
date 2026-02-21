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
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.4;
}

.ai-badge.generated {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.ai-badge.translated {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
</style>
