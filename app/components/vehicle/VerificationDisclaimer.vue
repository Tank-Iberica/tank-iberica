<template>
  <div class="verification-disclaimer">
    <p class="disclaimer-text">
      {{ t('verification.kmScore.disclaimer') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
.verification-disclaimer {
  background: var(--bg-secondary, #f9fafb);
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius, 6px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  margin-top: var(--spacing-3, 12px);
}

.disclaimer-text {
  font-size: var(--font-size-xs, 12px);
  color: var(--text-secondary, #6b7280);
  line-height: var(--line-height-relaxed, 1.625);
  margin: 0;
}
</style>
